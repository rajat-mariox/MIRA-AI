/**
 * Scheduled notifications (Asia/Kolkata, IST = UTC+5:30):
 *   muhurat   06:30 daily   today's main muhurat (Abhijit / Vijay / Brahma) for the user's location -> Panchang
 *   daily     07:00 daily   today's horoscope for the user's rashi                                   -> Horoscope
 *   weekly    08:00 Monday  this week's horoscope for the user's rashi                               -> Horoscope
 *   festival  08:00 daily   festivals tomorrow (Google holidays / Divine via panchang festivals)     -> Panchang
 *
 * Every send goes through notifyUser (inbox + push when Firebase is configured) and only to active
 * users whose `notificationPrefs.<job>` is not false. Each send is claimed in NotificationJobLog
 * ({ userId, job, dedupeKey } unique), so a job never notifies a user twice for the same day/week,
 * also after a restart or on several instances. Horoscope / muhurat / festival data comes from the
 * service caches and is memoised per run (per sign / location), so Divine is called once per key.
 *
 * Scheduler: a light 1-minute ticker (no cron dependency). A job runs at its time, or later the
 * same day within CATCH_UP_MINUTES (e.g. the server was down at 07:00), once per IST day per process.
 * Admin trigger: POST /admin/notifications/run-job -> runNotificationJob().
 */
import { Types } from 'mongoose';
import { env } from '../config/env';
import { translate, type Lang } from '../lib/i18n';
import { logger } from '../lib/logger';
import { localDateParts, pad2 } from '../utils/astroTime';
import { getUserRashi, type ZodiacSign } from '../utils/zodiac';
import { fetchHoroscope, type HoroscopeData } from '../modules/horoscope/horoscope.service';
import { notifyUser, type NotifyInput } from '../modules/notification/notification.service';
import { NotificationJobLog } from '../modules/notification/notificationJob.model';
import { festivals, todayMuhurat } from '../modules/panchang/panchang.service';
import type { FestivalsQuery } from '../modules/panchang/panchang.validation';
import { User, type NotificationPrefKey, type UserDocument } from '../modules/user/user.model';

export const NOTIFICATION_JOBS = ['daily', 'weekly', 'festival', 'muhurat'] as const satisfies readonly NotificationPrefKey[];
export type NotificationJob = (typeof NOTIFICATION_JOBS)[number];

const IST = 5.5;
const CATCH_UP_MINUTES = 3 * 60;
const TICK_MS = 60_000;
/** The app has no per-user language yet: scheduled texts are English. */
const LANG: Lang = 'en';
const MAX_DETAILS = 200;

const SCHEDULE: Array<{ job: NotificationJob; hour: number; minute: number; weekday?: number }> = [
  { job: 'muhurat', hour: 6, minute: 30 },
  { job: 'daily', hour: 7, minute: 0 },
  { job: 'weekly', hour: 8, minute: 0, weekday: 1 }, // Monday
  { job: 'festival', hour: 8, minute: 0 },
];

export interface RunJobOptions {
  /** Only this user (still subject to their prefs). */
  userId?: string;
  /** Bypass the per-user dedupe (send again). */
  force?: boolean;
  /** IST calendar date the job runs "as of" (YYYY-MM-DD, default today): dedupe key + festival lookup. */
  date?: string;
}

type SkipReason = 'optedOut' | 'alreadySent' | 'noSign' | 'noData';
export interface JobUserResult {
  userId: string;
  status: 'sent' | 'skipped' | 'failed';
  reason?: SkipReason;
  notificationId?: string;
}

export interface RunJobResult {
  job: NotificationJob;
  date: string;
  dedupeKey: string;
  /** users considered */
  users: number;
  sent: number;
  skipped: number;
  failed: number;
  details: JobUserResult[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────────

const signName = (sign: ZodiacSign) => translate(LANG, `horoscope.sign.${sign}`);

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad2(t.getUTCMonth() + 1)}-${pad2(t.getUTCDate())}`;
}

/** Monday of the ISO week containing `iso`. */
function mondayOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((weekday + 6) % 7));
}

/** First 1-2 whole sentences, at most ~max chars. */
function summary(text: string, max = 220): string {
  const t = text.replace(/\s+/g, ' ').trim();
  const sentences = t.match(/[^.!?।]+[.!?।]+/g) ?? [t];
  let out = '';
  for (const s of sentences.slice(0, 2)) {
    const next = (out + ' ' + s.trim()).trim();
    if (out && next.length > max) break;
    out = next;
  }
  if (out.length > max) out = `${out.slice(0, out.lastIndexOf(' ', max - 1))}…`;
  return out;
}

/** "2026-10-14 13:54:32" / "13:54" -> "1:54 PM" (other formats as they came). */
function clockTime(v: string): string {
  const m = /(?:^|\s|T)(\d{1,2}):(\d{2})(?::\d{2})?\s*$/.exec(v.trim());
  if (!m) return v.trim();
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}

function horoscopeText(h: HoroscopeData): string {
  const p = h.prediction;
  return p.personal || p.profession || p.emotions || p.health || '';
}

/** Per-run memo so every sign / location / month is fetched once (the services also cache). */
function memo() {
  const map = new Map<string, Promise<unknown>>();
  return <T>(key: string, fn: () => Promise<T>): Promise<T> => {
    let p = map.get(key) as Promise<T> | undefined;
    if (!p) {
      p = fn();
      map.set(key, p);
    }
    return p;
  };
}
type Memo = ReturnType<typeof memo>;

interface JobContext {
  date: string;
  memo: Memo;
}

interface JobDef {
  dedupeKey: (date: string) => string;
  /** Payload for this user, or a skip reason. */
  build: (user: UserDocument, ctx: JobContext) => Promise<NotifyInput | SkipReason>;
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────────

function horoscopeJob(period: 'daily' | 'weekly'): JobDef['build'] {
  return async (user, ctx) => {
    const sign = getUserRashi(user.fullName, user.dateOfBirth);
    if (!sign) return 'noSign';
    const tzone = user.tzone ?? IST;
    const h = await ctx.memo(`${period}:${sign}:${tzone}`, () => fetchHoroscope(sign, period, 'today', tzone, LANG));
    const body = summary(horoscopeText(h));
    if (!body) return 'noData';
    return {
      title: translate(LANG, period === 'daily' ? 'notificationJob.dailyTitle' : 'notificationJob.weeklyTitle', {
        sign: signName(sign),
      }),
      body,
      type: 'horoscope',
      screen: 'Horoscope',
      data: { category: 'horoscope', job: period, sign },
    };
  };
}

const JOBS: Record<NotificationJob, JobDef> = {
  daily: { dedupeKey: (date) => date, build: horoscopeJob('daily') },
  weekly: { dedupeKey: (date) => `week-${mondayOf(date)}`, build: horoscopeJob('weekly') },

  festival: {
    dedupeKey: (date) => `for-${addDays(date, 1)}`,
    build: async (_user, ctx) => {
      const tomorrow = addDays(ctx.date, 1);
      const [y, m] = tomorrow.split('-').map(Number) as [number, number];
      // Country-wide list (Google) / New Delhi (Divine): one fetch per month, not per user
      const list = await ctx.memo(`festivals:${y}-${m}`, () =>
        festivals(undefined, { year: y, month: m } as FestivalsQuery, LANG),
      );
      const names = Object.values(list as Record<string, { date?: string; name?: string }>)
        .filter((f) => f?.date === tomorrow && f.name)
        .map((f) => f.name!.trim());
      const unique = [...new Set(names)];
      if (!unique.length) return 'noData';
      return {
        title: translate(LANG, 'notificationJob.festivalTitle', { festival: unique.slice(0, 3).join(', ') }),
        body: translate(LANG, 'notificationJob.festivalBody'),
        type: 'festival',
        screen: 'Panchang',
        data: { category: 'festival', job: 'festival', date: tomorrow },
      };
    },
  },

  muhurat: {
    dedupeKey: (date) => date,
    build: async (user, ctx) => {
      const loc =
        typeof user.lat === 'number' && typeof user.long === 'number'
          ? `${user.lat.toFixed(2)}:${user.long.toFixed(2)}:${user.tzone ?? IST}`
          : 'default';
      const m = await ctx.memo(`muhurat:${loc}`, () => todayMuhurat(user, LANG));
      const parts: string[] = [];
      const add = (key: string, r: { start: string; end: string } | null) => {
        if (r?.start && r.end) parts.push(translate(LANG, key, { start: clockTime(r.start), end: clockTime(r.end) }));
      };
      add('notificationJob.muhuratAbhijit', m.abhijitMuhurta);
      add('notificationJob.muhuratVijay', m.vijayMuhurta);
      add('notificationJob.muhuratBrahma', m.brahmaMuhurta);
      if (!parts.length) return 'noData';
      return {
        title: translate(LANG, 'notificationJob.muhuratTitle'),
        body: `${parts.join(' · ')} (${m.place})`.slice(0, 1000),
        type: 'muhurat',
        screen: 'Panchang',
        data: { category: 'muhurat', job: 'muhurat' },
      };
    },
  },
};

// ─── Runner ───────────────────────────────────────────────────────────────────────

const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === 11000;

async function runForUser(job: NotificationJob, user: UserDocument, ctx: JobContext, dedupeKey: string, force: boolean): Promise<JobUserResult> {
  const userId = String(user._id);
  if (user.notificationPrefs?.[job] === false) return { userId, status: 'skipped', reason: 'optedOut' };

  if (!force && (await NotificationJobLog.exists({ userId: user._id, job, dedupeKey }))) {
    return { userId, status: 'skipped', reason: 'alreadySent' };
  }

  let payload: NotifyInput | SkipReason;
  try {
    payload = await JOBS[job].build(user, ctx);
  } catch (err) {
    logger.warn({ err, job, userId }, '[jobs] notification data unavailable');
    return { userId, status: 'failed' };
  }
  if (typeof payload === 'string') return { userId, status: 'skipped', reason: payload };

  // Claim the send (the unique index wins any race), then notify; release the claim on failure
  let logId: Types.ObjectId | null = null;
  if (force) {
    await NotificationJobLog.updateOne({ userId: user._id, job, dedupeKey }, { $set: { notificationId: null } }, { upsert: true });
  } else {
    try {
      logId = (await NotificationJobLog.create({ userId: user._id, job, dedupeKey }))._id;
    } catch (err) {
      if (isDuplicateKey(err)) return { userId, status: 'skipped', reason: 'alreadySent' };
      throw err;
    }
  }
  try {
    const r = await notifyUser(userId, payload);
    await NotificationJobLog.updateOne({ userId: user._id, job, dedupeKey }, { $set: { notificationId: r.notificationId } });
    return { userId, status: 'sent', notificationId: r.notificationId };
  } catch (err) {
    logger.error({ err, job, userId }, '[jobs] notifyUser failed');
    if (logId) await NotificationJobLog.deleteOne({ _id: logId }).catch(() => undefined);
    return { userId, status: 'failed' };
  }
}

/** Runs one job now for every active user (or one user). Never sends to users who opted out. */
export async function runNotificationJob(job: NotificationJob, opts: RunJobOptions = {}): Promise<RunJobResult> {
  const date = opts.date ?? localDateParts(IST).iso;
  const dedupeKey = JOBS[job].dedupeKey(date);
  const ctx: JobContext = { date, memo: memo() };
  const result: RunJobResult = { job, date, dedupeKey, users: 0, sent: 0, skipped: 0, failed: 0, details: [] };

  const filter: Record<string, unknown> = { isActive: { $ne: false } };
  if (opts.userId) filter._id = new Types.ObjectId(opts.userId);
  const started = Date.now();

  for await (const user of User.find(filter).sort({ _id: 1 }).cursor()) {
    result.users++;
    let r: JobUserResult;
    try {
      r = await runForUser(job, user as UserDocument, ctx, dedupeKey, !!opts.force);
    } catch (err) {
      logger.error({ err, job, userId: String(user._id) }, '[jobs] user failed');
      r = { userId: String(user._id), status: 'failed' };
    }
    result[r.status === 'sent' ? 'sent' : r.status === 'skipped' ? 'skipped' : 'failed']++;
    if (result.details.length < MAX_DETAILS) result.details.push(r);
  }

  logger.info(
    { job, date, dedupeKey, users: result.users, sent: result.sent, skipped: result.skipped, failed: result.failed, ms: Date.now() - started },
    '[jobs] notification job finished',
  );
  return result;
}

// ─── Scheduler ────────────────────────────────────────────────────────────────────

let timer: NodeJS.Timeout | undefined;
const lastRun = new Map<NotificationJob, string>();
const running = new Set<NotificationJob>();

function tick(): void {
  const now = new Date(Date.now() + IST * 3600_000);
  const today = localDateParts(IST).iso;
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  for (const s of SCHEDULE) {
    if (s.weekday !== undefined && now.getUTCDay() !== s.weekday) continue;
    const at = s.hour * 60 + s.minute;
    if (minutes < at || minutes >= at + CATCH_UP_MINUTES) continue;
    if (lastRun.get(s.job) === today || running.has(s.job)) continue;
    running.add(s.job);
    lastRun.set(s.job, today);
    runNotificationJob(s.job)
      .catch((err: unknown) => {
        logger.error({ err, job: s.job }, '[jobs] notification job crashed');
        lastRun.delete(s.job); // retried on the next tick
      })
      .finally(() => running.delete(s.job));
  }
}

export function startNotificationJobs(): void {
  if (timer) return;
  if (env.NOTIFICATION_JOBS_DISABLED) {
    logger.info('[jobs] scheduled notifications disabled (NOTIFICATION_JOBS_DISABLED=true)');
    return;
  }
  timer = setInterval(tick, TICK_MS);
  timer.unref();
  setTimeout(tick, 10_000).unref(); // catch up shortly after boot
  logger.info('[jobs] scheduled notifications on (IST): muhurat 06:30, daily 07:00, weekly Mon 08:00, festival 08:00');
}

export function stopNotificationJobs(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
}
