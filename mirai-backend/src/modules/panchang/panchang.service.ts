import { cache } from '../../lib/cache';
import { divineLan, divineRequest, type DivineEndpointName, type DivineFields } from '../../lib/divine';
import { geocodePlace } from '../../lib/geocode';
import { fetchGoogleFestivals, isGoogleHolidaysConfigured } from '../../lib/googleHolidays';
import type { Lang } from '../../lib/i18n';
import { ApiError } from '../../utils/ApiError';
import { localDateParts, pad2 } from '../../utils/astroTime';
import type { UserDocument } from '../user/user.model';
import { computeChandrabalamTarabalam, computePanchakaRahita, computeUdayLagna } from './panchang.compute';
import {
  asObj,
  filterFestivalsByMonth,
  mergeLunarSamvat,
  normalizeNivasShool,
  summarizeAuspicious,
  type MuhuratSummary,
} from './panchang.normalize';
import type { FestivalsQuery, LunarSamvatQuery, PanchangDayQuery } from './panchang.validation';

const PANCHANG_TTL = 24 * 3600;

export const DEFAULT_LOCATION = { place: 'New Delhi, India', lat: 28.6139, lon: 77.209, tzone: 5.5 } as const;

export interface PanchangLocation {
  place: string;
  lat: number;
  lon: number;
  tzone: number;
}

export interface PanchangContext extends PanchangLocation {
  day: number;
  month: number;
  year: number;
}

type LocQuery = { place?: string; lat?: number; lon?: number; tzone?: number };

/**
 * Location priority: query lat/lon -> query place (geocoded) -> user's saved lat/long -> New Delhi.
 * tzone: query -> user's tzone (when using the user's location) -> 5.5.
 */
export async function resolveLocation(user: UserDocument | undefined, q: LocQuery): Promise<PanchangLocation> {
  if (q.lat !== undefined && q.lon !== undefined) {
    return { place: q.place ?? `${q.lat}, ${q.lon}`, lat: q.lat, lon: q.lon, tzone: q.tzone ?? DEFAULT_LOCATION.tzone };
  }
  if (q.place) {
    const p = await geocodePlace(q.place);
    if (!p) throw new ApiError(422, 'geo.placeNotFound', { params: { place: q.place } });
    return { place: q.place, lat: p.lat, lon: p.lon, tzone: q.tzone ?? DEFAULT_LOCATION.tzone };
  }
  if (user && typeof user.lat === 'number' && typeof user.long === 'number') {
    return {
      place: user.birthPlace ?? `${user.lat}, ${user.long}`,
      lat: user.lat,
      lon: user.long,
      tzone: q.tzone ?? user.tzone ?? DEFAULT_LOCATION.tzone,
    };
  }
  return { ...DEFAULT_LOCATION, tzone: q.tzone ?? DEFAULT_LOCATION.tzone };
}

export async function resolveContext(user: UserDocument | undefined, q: PanchangDayQuery): Promise<PanchangContext> {
  const loc = await resolveLocation(user, q);
  const today = localDateParts(loc.tzone);
  return { ...loc, day: q.day ?? today.day, month: q.month ?? today.month, year: q.year ?? today.year };
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

function ctxFields(c: PanchangContext): DivineFields {
  return {
    day: pad2(c.day),
    month: pad2(c.month),
    year: String(c.year),
    place: c.place,
    lat: String(round4(c.lat)),
    lon: String(round4(c.lon)),
    tzone: String(c.tzone),
  };
}

/** Cache key: panchang:<thing>:<YYYY-MM-DD>:<lat>:<lon>:<tzone>:<lan>[:extra] */
function keyFor(thing: string, c: { year: number; month: number; day?: number; lat: number; lon: number; tzone: number }, lang: Lang, extra?: string) {
  const date = c.day !== undefined ? `${c.year}-${pad2(c.month)}-${pad2(c.day)}` : `${c.year}-${pad2(c.month)}`;
  return ['panchang', thing, date, round4(c.lat), round4(c.lon), c.tzone, divineLan(lang), extra].filter((x) => x !== undefined).join(':');
}

async function dayCall<T = Record<string, unknown>>(
  thing: string,
  endpoint: DivineEndpointName,
  c: PanchangContext,
  lang: Lang,
  normalize: (raw: unknown) => T = asObj as (raw: unknown) => T,
): Promise<T> {
  return cache.wrap(keyFor(thing, c, lang), PANCHANG_TTL, async () => normalize(await divineRequest(endpoint, ctxFields(c), lang)));
}

type Q = PanchangDayQuery;
type U = UserDocument | undefined;

export const panchang = async (u: U, q: Q, lang: Lang) => dayCall('full', 'findPanchang', await resolveContext(u, q), lang);
export const auspiciousTimings = async (u: U, q: Q, lang: Lang) =>
  dayCall('auspicious', 'auspiciousTimings', await resolveContext(u, q), lang);
export const sunAndMoon = async (u: U, q: Q, lang: Lang) => dayCall('sunmoon', 'findSunAndMoon', await resolveContext(u, q), lang);
export const rashiNakshatra = async (u: U, q: Q, lang: Lang) =>
  dayCall('nakshatra', 'findNakshatra', await resolveContext(u, q), lang);
export const rituAyana = async (u: U, q: Q, lang: Lang) => dayCall('ritu', 'findRituAndAyana', await resolveContext(u, q), lang);
export const inauspiciousTimings = async (u: U, q: Q, lang: Lang) =>
  dayCall('inauspicious', 'inauspiciousTimings', await resolveContext(u, q), lang);
export const nivasShool = async (u: U, q: Q, lang: Lang) =>
  dayCall('nivas', 'findNivasAndShool', await resolveContext(u, q), lang, normalizeNivasShool);
export const otherCalendars = async (u: U, q: Q, lang: Lang) =>
  dayCall('calendars', 'findOtherCalendars', await resolveContext(u, q), lang);

/** Chandramasa (astroapi-3) + Samvat (astroapi-2) merged into one object. */
export async function lunarSamvat(u: U, q: LunarSamvatQuery, lang: Lang) {
  const c = await resolveContext(u, q);
  return cache.wrap(keyFor('lunarsamvat', c, lang, q.month_type), PANCHANG_TTL, async () => {
    const fields = ctxFields(c);
    const [chandramasa, samvat] = await Promise.all([
      divineRequest('chandramasa', { ...fields, month_type: q.month_type }, lang),
      divineRequest('findSamvat', fields, lang),
    ]);
    return mergeLunarSamvat(chandramasa, samvat);
  });
}

/** Festivals for a Gregorian month (no `day`). Defaults to the current month. */
export async function festivals(u: U, q: FestivalsQuery, lang: Lang) {
  const loc = await resolveLocation(u, q);
  const today = localDateParts(loc.tzone);
  const year = q.year ?? today.year;
  const month = q.month ?? today.month;
  // Google Calendar's Indian holidays when configured (country-wide, so not keyed by location)
  if (isGoogleHolidaysConfigured()) {
    return cache.wrap(`panchang:festivals:google:${year}-${pad2(month)}`, PANCHANG_TTL, () => fetchGoogleFestivals(year, month));
  }
  return cache.wrap(keyFor('festivals', { ...loc, year, month }, lang), PANCHANG_TTL, async () => {
    const raw = await divineRequest(
      'englishCalendarFestivals',
      {
        year: String(year),
        month: pad2(month),
        place: loc.place,
        lat: String(round4(loc.lat)),
        lon: String(round4(loc.lon)),
        tzone: String(loc.tzone),
      },
      lang,
    );
    return filterFestivalsByMonth(raw, year, month);
  });
}

/** Today's muhurat summary (home screen) for the user's location or New Delhi. */
export async function todayMuhurat(user: U, lang: Lang): Promise<MuhuratSummary & { place: string }> {
  const c = await resolveContext(user, {});
  const raw = await dayCall('auspicious', 'auspiciousTimings', c, lang);
  return { ...summarizeAuspicious(raw), place: c.place };
}

// ─── Computed sections (not in the Divine plan) ───────────────────────────────
// Built from find-panchang (always fetched in English: names are mapped to numbers) plus our
// own Lahiri ascendant (utils/ascendant.ts). Output mirrors Divine's vendor shapes.

function nextDay(c: PanchangContext): PanchangContext {
  const d = new Date(Date.UTC(c.year, c.month - 1, c.day + 1));
  return { ...c, year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

const panchangEn = (c: PanchangContext) => dayCall('full', 'findPanchang', c, 'en');

function ensure<T>(v: T | null): T {
  if (!v) throw new ApiError(502, 'divine.requestFailed');
  return v;
}

export async function chandrabalamTarabalam(u: U, q: Q, _lang: Lang) {
  const c = await resolveContext(u, q);
  return cache.wrap(keyFor('chandrabalam', c, 'en'), PANCHANG_TTL, async () =>
    computeChandrabalamTarabalam(await panchangEn(c), c, c.tzone),
  );
}

async function dayInput(c: PanchangContext) {
  const [panchang, nextPanchang] = await Promise.all([panchangEn(c), panchangEn(nextDay(c))]);
  return { panchang, nextPanchang, date: c, lat: c.lat, lon: c.lon, tzone: c.tzone };
}

export async function udayaLagna(u: U, q: Q, _lang: Lang) {
  const c = await resolveContext(u, q);
  return cache.wrap(keyFor('udayalagna', c, 'en'), PANCHANG_TTL, async () => ensure(computeUdayLagna(await dayInput(c))));
}

export async function panchakaRahita(u: U, q: Q, _lang: Lang) {
  const c = await resolveContext(u, q);
  return cache.wrap(keyFor('panchak', c, 'en'), PANCHANG_TTL, async () => ensure(computePanchakaRahita(await dayInput(c))));
}
