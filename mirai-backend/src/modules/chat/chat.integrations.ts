/**
 * Hooks into other modules (today's horoscope + kundli context for the prompt, wallet billing).
 * Kept here so chat.service stays small and these dependencies are easy to find.
 */
import { createHash } from 'node:crypto';
import { cache } from '../../lib/cache';
import type { Lang } from '../../lib/i18n';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import { localDateParts, secondsUntilLocal } from '../../utils/astroTime';
import { getUserRashi } from '../../utils/zodiac';
import { fetchHoroscope, type HoroscopeData } from '../horoscope/horoscope.service';
import { basicDetails, planetaryPositions, vimshottari } from '../kundli/kundli.service';
import type { DashaQuery } from '../kundli/kundli.validation';
import type { UserDocument } from '../user/user.model';
import { creditWallet, debitWallet } from '../wallet/wallet.service';

// ─── Astro context (today's horoscope + kundli) for the system prompt ─────────────

/** Per-source timeout. The services cache Divine (horoscope until the day ends, kundli 30 days). */
const SOURCE_TIMEOUT_MS = 5000;
/** When a source failed, the partial context is cached only briefly so it is retried soon. */
const PARTIAL_TTL = 5 * 60;
const PREDICTION_CHARS = 230;
/** Lagna + the nine grahas; outer planets are left out to keep the prompt compact. */
const GRAHAS = ['Ascendant', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const BASIC_FIELDS: Array<[string, string]> = [
  ['sunsign', 'Sun sign (Vedic)'],
  ['moonsign', 'Moon sign (Janma rashi)'],
  ['nakshatra', 'Janma nakshatra'],
  ['tithi', 'Birth tithi'],
  ['paksha', 'Paksha'],
  ['yoga', 'Yoga'],
  ['karana', 'Karana'],
  ['vaar', 'Birth weekday'],
  ['gana', 'Gana'],
  ['nadi', 'Nadi'],
  ['varna', 'Varna'],
  ['yoni', 'Yoni'],
  ['tatva', 'Tatva'],
];
const HOROSCOPE_CATEGORIES = [
  ['personal', 'Personal/love'],
  ['profession', 'Career/work'],
  ['health', 'Health'],
  ['emotions', 'Emotions'],
  ['travel', 'Travel'],
] as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());
const cap = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/** The source's result, or null on timeout / error (logged): a missing source never fails the chat. */
async function attempt<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      logger.warn(`[chat] ${label} timed out for the prompt context`);
      resolve(null);
    }, SOURCE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([fn(), timeout]);
  } catch (err) {
    logger.warn({ err }, `[chat] ${label} unavailable for the prompt context`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Whole sentences up to ~max chars. */
function clip(text: string, max = PREDICTION_CHARS): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = cut.lastIndexOf('. ');
  return end > max * 0.5 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

function formatHoroscope(h: HoroscopeData, date: string): string {
  const pct = h.special?.horoscope_percentage ?? {};
  const lines = [`Today's daily horoscope (${date}) for ${cap(h.sign)}:`];
  for (const [key, label] of HOROSCOPE_CATEGORIES) {
    const text = h.prediction[key];
    if (!text) continue;
    const score = typeof pct[key] === 'number' ? ` (${pct[key]}%)` : '';
    lines.push(`- ${label}${score}: ${clip(text)}`);
  }
  if (typeof pct.luck === 'number') lines.push(`- Overall luck today: ${pct.luck}%`);
  for (const l of h.prediction.luck.slice(0, 4)) lines.push(`- ${clip(l, 120)}`);
  return lines.join('\n');
}

function formatPlanets(d: Obj): { text: string | null; ascendant: string | null } {
  const planets = Array.isArray(d.planets) ? d.planets.filter(isObj) : [];
  let ascendant: string | null = null;
  const lines: string[] = [];
  for (const name of GRAHAS) {
    const p = planets.find((x) => str(x.name) === name);
    if (!p) continue;
    const sign = str(p.sign);
    if (name === 'Ascendant') ascendant = sign || null;
    const parts = [
      sign,
      str(p.house) ? `house ${str(p.house)}` : '',
      str(p.nakshatra) ? `${str(p.nakshatra)} nakshatra` : '',
    ].filter(Boolean);
    // Rahu/Ketu are always retrograde: not worth a mention
    if (name !== 'Ascendant' && name !== 'Rahu' && name !== 'Ketu' && str(p.is_retro) === 'true') parts.push('retrograde');
    if (str(p.is_combusted) === 'true') parts.push('combust');
    lines.push(`- ${name}: ${parts.join(', ')}`);
  }
  return { text: lines.length ? lines.join('\n') : null, ascendant };
}

function formatBasics(d: Obj, ascendant: string | null): string | null {
  const lines: string[] = [];
  if (ascendant) lines.push(`- Ascendant (Lagna): ${ascendant}`);
  for (const [key, label] of BASIC_FIELDS) {
    const v = str(d[key]);
    if (v) lines.push(`- ${label}: ${v}`);
  }
  return lines.length ? lines.join('\n') : null;
}

/** Running mahadasha / antardasha from the antar-dasha table (dates "YYYY-MM-DD"; "--" = before birth). */
function formatDasha(d: Obj, today: string): string | null {
  const maha = isObj(d.maha_dasha) ? d.maha_dasha : {};
  for (const [planet, v] of Object.entries(maha)) {
    if (!isObj(v)) continue;
    const start = str(v.start_date);
    const end = str(v.end_date);
    if (!(start <= today && today < end)) continue;
    const lines = [`- Mahadasha: ${planet} (${start} to ${end})`];
    const antar = isObj(v.antar_dasha) ? v.antar_dasha : {};
    for (const [sub, a] of Object.entries(antar)) {
      if (!isObj(a)) continue;
      const s = str(a.start_time);
      const e = str(a.end_time);
      if (/^\d{4}-/.test(s) && s <= today && today < e) {
        lines.push(`- Antardasha: ${sub} (${s} to ${e})`);
        break;
      }
    }
    return lines.join('\n');
  }
  return null;
}

/** Profile fields the context depends on: editing them gives a new cache key. */
function profileHash(user: UserDocument): string {
  const dob = user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : '';
  const parts = [user.fullName, dob, user.birthTime, user.birthPlace, user.lat, user.long, user.gender, user.tzone];
  return createHash('sha256').update(parts.map(str).join('|')).digest('hex').slice(0, 16);
}

/**
 * Compact, prompt-ready astro context: today's daily horoscope for the user's rashi (name rashi,
 * else DOB sun sign), kundli basics, planetary positions and the running Vimshottari dasha.
 * Sources are fetched in parallel, each with a timeout; failed ones are skipped. Cached per user
 * per local day: `chat:astro:<userId>:<date>:<lang>:<profileHash>`. Never throws; null = nothing.
 */
export async function getAstroContext(user: UserDocument, lang: Lang): Promise<string | null> {
  try {
    const tzone = user.tzone ?? 5.5;
    const today = localDateParts(tzone);
    const key = `chat:astro:${String(user._id)}:${today.iso}:${lang}:${profileHash(user)}`;
    const hit = await cache.get<string>(key);
    if (hit !== null) return hit || null;

    const rashi = getUserRashi(user.fullName, user.dateOfBirth);
    const dashaQuery = { dasha_type: 'antar-dasha' } as DashaQuery;
    const [horoscope, basics, planets, dasha] = await Promise.all([
      rashi ? attempt('horoscope', () => fetchHoroscope(rashi, 'daily', 'today', tzone, lang)) : Promise.resolve(null),
      attempt('kundli basics', () => basicDetails(user, {}, lang)),
      attempt('planetary positions', () => planetaryPositions(user, {}, lang)),
      attempt('vimshottari dasha', () => vimshottari(user, dashaQuery, lang)),
    ]);

    const sections: string[] = [];
    let complete = !rashi || !!horoscope;
    if (horoscope) sections.push(formatHoroscope(horoscope, today.iso));

    const setup = [basics, planets, dasha].find((r) => r && !r.ok);
    if (setup && !setup.ok) {
      sections.push(
        `Birth chart: not available - the profile is missing ${setup.setup.missingFields.join(', ')}. ` +
          'Give general guidance and gently suggest completing the birth details in the profile.',
      );
    } else {
      const pl = planets?.ok ? formatPlanets(planets.data) : { text: null, ascendant: null };
      const basic = basics?.ok ? formatBasics(basics.data, pl.ascendant) : null;
      const running = dasha?.ok ? formatDasha(dasha.data, today.iso) : null;
      if (basic) sections.push(`Birth chart (kundli) basics:\n${basic}`);
      if (pl.text) sections.push(`Planetary positions (D1 chart, houses counted from the ascendant):\n${pl.text}`);
      if (running) sections.push(`Current Vimshottari dasha (as of ${today.iso}):\n${running}`);
      if (!basics || !planets || !dasha) complete = false;
    }

    const text = sections.join('\n\n');
    const ttl = complete ? secondsUntilLocal(tzone, today.year, today.month, today.day + 1) : PARTIAL_TTL;
    await cache.set(key, text, ttl);
    return text || null;
  } catch (err) {
    logger.warn({ err }, '[chat] astro context unavailable');
    return null;
  }
}

// ─── Wallet billing ──────────────────────────────────────────────────────────────

/** Chat billing is wired to the wallet module (active when CHAT_PRICE_PER_MESSAGE > 0). */
export const WALLET_BILLING_AVAILABLE = true;

/**
 * Debit the user's wallet for one chat message. Throws ApiError(402, 'chat.insufficientBalance')
 * when the balance is too low. Returns the debit transaction id (used for the refund reference).
 */
export async function chargeForMessage(userId: string, amount: number, sessionId: string): Promise<string | null> {
  try {
    const { transaction } = await debitWallet(userId, {
      amount,
      purpose: 'chat',
      title: 'AI Astrology Chat',
      description: 'MIRAI AI guide message',
      referenceId: sessionId,
    });
    return String(transaction._id);
  } catch (err) {
    if (err instanceof ApiError && err.messageKey === 'wallet.insufficientBalance') {
      throw new ApiError(402, 'chat.insufficientBalance');
    }
    throw err;
  }
}

/** Refund a previous chargeForMessage (AI call failed). Never throws. */
export async function refundMessageCharge(userId: string, amount: number, sessionId: string, ref: string | null): Promise<void> {
  try {
    await creditWallet(userId, {
      amount,
      purpose: 'refund',
      title: 'Refund: AI Astrology Chat',
      description: 'The AI guide could not answer',
      referenceId: ref ?? sessionId,
    });
  } catch (err) {
    logger.error({ err, userId, amount, sessionId, ref }, '[chat] refund failed');
  }
}
