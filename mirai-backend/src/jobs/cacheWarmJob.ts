/**
 * Fills the cache with the day's Divine data before users ask for it, so nobody waits on the
 * first (uncached) Divine call of the day:
 *   - today's horoscope for all 12 signs, in every app language
 *   - today's muhurat (the Home panchang card) for every distinct user location
 * Runs shortly after midnight IST, and once shortly after the server starts. Everything goes
 * through the normal cached fetchers, so data already in the cache costs nothing.
 */
import { env } from '../config/env';
import { SUPPORTED_LANGS } from '../lib/i18n';
import { logger } from '../lib/logger';
import { localDateParts } from '../utils/astroTime';
import { ZODIAC_SIGNS } from '../utils/zodiac';
import { fetchHoroscope } from '../modules/horoscope/horoscope.service';
import { todayMuhurat } from '../modules/panchang/panchang.service';
import { User } from '../modules/user/user.model';

const IST = 5.5;
/** 00:05 IST: after the horoscope and panchang day has turned over */
const RUN_AT_MINUTES = 5;
const TICK_MS = 60_000;
/** Divine calls in flight at once */
const CONCURRENCY = 3;
/** Most user locations warmed per run (newest active users first) */
const MAX_LOCATIONS = 300;

let timer: NodeJS.Timeout | undefined;
let lastRunDay = '';
let running = false;

async function inBatches<T>(items: T[], run: (item: T) => Promise<unknown>): Promise<number> {
  let failed = 0;
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const results = await Promise.allSettled(items.slice(i, i + CONCURRENCY).map(run));
    failed += results.filter((r) => r.status === 'rejected').length;
  }
  return failed;
}

export async function warmDailyCache(): Promise<void> {
  const started = Date.now();

  const signJobs = ZODIAC_SIGNS.flatMap((sign) => SUPPORTED_LANGS.map((lang) => ({ sign, lang })));
  const signFailed = await inBatches(signJobs, ({ sign, lang }) => fetchHoroscope(sign, 'daily', 'today', IST, lang));

  // One user per location (panchang is cached per ~1 km, see panchang.service roundLoc)
  const users = await User.find({ isActive: { $ne: false }, lat: { $ne: null }, long: { $ne: null } })
    .sort({ lastLoginAt: -1 })
    .limit(MAX_LOCATIONS * 5);
  const seen = new Set<string>();
  const perLocation = users.filter((u) => {
    const key = `${u.lat!.toFixed(2)}:${u.long!.toFixed(2)}:${u.tzone ?? IST}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_LOCATIONS);
  const placeFailed = await inBatches(perLocation, (u) => todayMuhurat(u, 'en'));

  logger.info(
    {
      horoscopes: signJobs.length - signFailed,
      locations: perLocation.length - placeFailed,
      failed: signFailed + placeFailed,
      ms: Date.now() - started,
    },
    '[jobs] daily cache warmed',
  );
}

function tick(): void {
  const today = localDateParts(IST).iso;
  const now = new Date(Date.now() + IST * 3600_000);
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (running || lastRunDay === today || minutes < RUN_AT_MINUTES) return;
  running = true;
  lastRunDay = today;
  warmDailyCache()
    .catch((err: unknown) => {
      logger.error({ err }, '[jobs] cache warm-up failed');
      lastRunDay = ''; // retried on the next tick
    })
    .finally(() => {
      running = false;
    });
}

export function startCacheWarmJob(): void {
  if (timer || env.NODE_ENV === 'test') return;
  timer = setInterval(tick, TICK_MS);
  timer.unref();
  setTimeout(tick, 15_000).unref(); // warm up shortly after boot
}

export function stopCacheWarmJob(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
}
