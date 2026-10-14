import { cache } from '../../lib/cache';
import { divineLan, divineRequest, type DivineEndpointName, type DivineFields } from '../../lib/divine';
import type { Lang } from '../../lib/i18n';
import { localDateParts, pad2, secondsUntilLocal } from '../../utils/astroTime';
import { getUserRashi, type ZodiacSign } from '../../utils/zodiac';
import type { UserDocument } from '../user/user.model';
import { normalizeHoroscope, type NormalizedHoroscope } from './horoscope.normalize';
import type { HoroscopeDay, HoroscopePeriod, HoroscopeQuery } from './horoscope.validation';

export interface HoroscopeData extends NormalizedHoroscope {
  sign: ZodiacSign;
  /** 'daily-today' | 'daily-tomorrow' | 'daily-yesterday' | 'weekly' | 'monthly' | 'yearly' */
  period: string;
  cached: boolean;
}

export interface HoroscopeSetupRequired {
  requiresProfileSetup: true;
  profileSetupStep: number;
  isProfileComplete: boolean;
}

export type HoroscopeResult = { ok: true; data: HoroscopeData } | { ok: false; setup: HoroscopeSetupRequired };

/** Max cache lifetime even when the period lasts longer (yearly). */
const MAX_TTL = 30 * 24 * 3600;

const PERIOD_CONFIG: Record<HoroscopePeriod, { endpoint: DivineEndpointName; fields: (day: HoroscopeDay) => DivineFields }> = {
  daily: { endpoint: 'dailyHoroscope', fields: (day) => ({ h_day: day }) },
  weekly: { endpoint: 'weeklyHoroscope', fields: () => ({ week: 'current' }) },
  monthly: { endpoint: 'monthlyHoroscope', fields: () => ({ month: 'current' }) },
  yearly: { endpoint: 'yearlyHoroscope', fields: () => ({ year: 'current' }) },
};

/**
 * Cache anchor (which day/week/month/year "current"/"today" refers to) + TTL until that
 * period ends in the user's timezone. Divine weeks run Sunday-Saturday.
 */
function periodWindow(period: HoroscopePeriod, tzone: number): { anchor: string; ttl: number } {
  const now = localDateParts(tzone);
  let anchor: string;
  let ttl: number;
  switch (period) {
    case 'daily':
      anchor = now.iso;
      ttl = secondsUntilLocal(tzone, now.year, now.month, now.day + 1);
      break;
    case 'weekly': {
      const weekday = new Date(Date.UTC(now.year, now.month - 1, now.day)).getUTCDay(); // 0 = Sunday
      const start = new Date(Date.UTC(now.year, now.month - 1, now.day - weekday));
      anchor = `${start.getUTCFullYear()}-${pad2(start.getUTCMonth() + 1)}-${pad2(start.getUTCDate())}`;
      ttl = secondsUntilLocal(tzone, now.year, now.month, now.day - weekday + 7);
      break;
    }
    case 'monthly':
      anchor = `${now.year}-${pad2(now.month)}`;
      ttl = secondsUntilLocal(tzone, now.year, now.month + 1, 1);
      break;
    case 'yearly':
      anchor = String(now.year);
      ttl = secondsUntilLocal(tzone, now.year + 1, 1, 1);
      break;
  }
  return { anchor, ttl: Math.min(ttl, MAX_TTL) };
}

/** Fetch (cached) horoscope for a sign. Cache key: horoscope:<period>[-<day>]:<sign>:<anchor>:<lan> */
export async function fetchHoroscope(
  sign: ZodiacSign,
  period: HoroscopePeriod,
  day: HoroscopeDay,
  tzone: number,
  lang: Lang,
): Promise<HoroscopeData> {
  const periodLabel = period === 'daily' ? `daily-${day}` : period;
  const lan = divineLan(lang);
  const { anchor, ttl } = periodWindow(period, tzone);
  const key = `horoscope:${periodLabel}:${sign}:${anchor}:${lan}`;

  const hit = await cache.get<NormalizedHoroscope>(key);
  if (hit) return { sign, period: periodLabel, ...hit, cached: true };

  const cfg = PERIOD_CONFIG[period];
  const today = localDateParts(tzone);
  const raw = await divineRequest(
    cfg.endpoint,
    {
      sign,
      tzone: String(tzone),
      ...cfg.fields(day),
      // deprecated but harmless on daily (older deployments still validate them)
      ...(period === 'daily' ? { day: pad2(today.day), month: pad2(today.month), year: String(today.year) } : {}),
    },
    lang,
  );
  const normalized = normalizeHoroscope(raw);
  await cache.set(key, normalized, ttl);
  return { sign, period: periodLabel, ...normalized, cached: false };
}

/** Sign = `query.sign` override, else the user's rashi (name, then DOB). Neither -> setup required. */
export async function getHoroscope(user: UserDocument, query: HoroscopeQuery, lang: Lang): Promise<HoroscopeResult> {
  const sign = query.sign ?? getUserRashi(user.fullName, user.dateOfBirth);
  if (!sign) {
    return {
      ok: false,
      setup: {
        requiresProfileSetup: true,
        profileSetupStep: user.profileSetupStep ?? 0,
        isProfileComplete: user.isProfileComplete ?? false,
      },
    };
  }
  const data = await fetchHoroscope(sign, query.period, query.day, user.tzone ?? 5.5, lang);
  return { ok: true, data };
}
