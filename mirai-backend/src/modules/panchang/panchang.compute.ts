import {
  SIGNS,
  formatLocal,
  formatUpto,
  goodChandrabalam,
  goodTarabalam,
  lagnaPeriods,
  nakshatraNumber,
  panchakaRahita,
  parseLocal,
  signIndex,
  tithiNumber,
  type LagnaPeriod,
  type Span,
} from '../../utils/ascendant';
import { asObj } from './panchang.normalize';

/**
 * Sections Divine's plan doesn't cover (chandrabalam-tarabalam, uday-lagna, panchak-rahita),
 * computed from find-panchang data + our own ascendant. Output mirrors Divine's shapes.
 */

type Obj = Record<string, unknown>;
const arr = (v: unknown): Obj[] => (Array.isArray(v) ? v.map(asObj) : []);
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export interface BalamBlock {
  current: string[];
  /** Divine format "08:27 AM, May 24"; null when the Moon stays in it past the next sunrise. */
  upto: string | null;
  /** Same instant as `upto`, "YYYY-MM-DD HH:mm:ss" local. */
  upto_time: string | null;
  next: string[];
}

export interface ChandrabalamTarabalam {
  date: string;
  chandrabalams: BalamBlock | null;
  tarabalams: BalamBlock | null;
}

export interface UdayLagnaEntry {
  sign: string;
  start_time: string;
  end_time: string;
}

export interface UdayLagna {
  date: string;
  sunrise: string;
  sunset: string | null;
  uday_lagna: UdayLagnaEntry[];
}

export interface PanchakaRahita extends UdayLagna {
  panchak_rahita: Array<{ panchak: string; start_time: string; end_time: string }>;
}

const isoDate = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function block(current: string[], endTime: string, next: string[], tzone: number): BalamBlock {
  const ms = parseLocal(endTime, tzone);
  return { current, upto: ms === null ? null : formatUpto(ms, tzone), upto_time: ms === null ? null : formatLocal(ms, tzone), next };
}

/** Moon sign / nakshatra at sunrise (first entries of find-panchang's `nakshatras`). */
export function computeChandrabalamTarabalam(panchang: unknown, date: { year: number; month: number; day: number }, tzone: number): ChandrabalamTarabalam {
  const nak = asObj(asObj(panchang).nakshatras);

  const zp = arr(nak.zodiac_point);
  const moonSign = signIndex(str(zp[0]?.sign));
  const chandrabalams =
    moonSign < 0 ? null : block(goodChandrabalam(moonSign), str(zp[0]?.end_time), goodChandrabalam((moonSign + 1) % 12), tzone);

  const list = arr(nak.nakshatra_list);
  const moonNak = nakshatraNumberFrom(str(list[0]?.nak_name), nak);
  const tarabalams =
    moonNak < 1 ? null : block(goodTarabalam(moonNak), str(list[0]?.end_time), goodTarabalam((moonNak % 27) + 1), tzone);

  return { date: isoDate(date.year, date.month, date.day), chandrabalams, tarabalams };
}

/** Prefer the `nak_number` Divine sends in nakshatra_pada; fall back to the name table. */
function nakshatraNumberFrom(name: string, nak: Obj): number {
  const pada = arr(nak.nakshatra_pada).find((p) => str(p.nak_name) === name);
  const n = Number(pada?.nak_number);
  return Number.isInteger(n) && n >= 1 && n <= 27 ? n : nakshatraNumber(name);
}

interface DayInput {
  panchang: unknown;
  nextPanchang: unknown;
  date: { year: number; month: number; day: number };
  lat: number;
  lon: number;
  tzone: number;
}

interface DayWindow {
  fromMs: number;
  toMs: number;
  sunrise: string;
  sunset: string | null;
  lagnas: LagnaPeriod[];
}

function dayWindow(i: DayInput): DayWindow | null {
  const sunrise = str(asObj(i.panchang).sunrise);
  const fromMs = parseLocal(sunrise, i.tzone);
  let toMs = parseLocal(str(asObj(i.nextPanchang).sunrise), i.tzone);
  if (fromMs === null) return null;
  // polar/odd responses: fall back to a 24h window
  if (toMs === null || toMs <= fromMs || toMs - fromMs > 26 * 3600_000) toMs = fromMs + 24 * 3600_000;
  const sunset = str(asObj(i.panchang).sunset) || null;
  return { fromMs, toMs, sunrise: formatLocal(fromMs, i.tzone), sunset, lagnas: lagnaPeriods(fromMs, toMs, i.lat, i.lon) };
}

const lagnaEntries = (w: DayWindow, tzone: number): UdayLagnaEntry[] =>
  w.lagnas.map((l) => ({ sign: SIGNS[l.signIndex], start_time: formatLocal(l.startMs, tzone), end_time: formatLocal(l.endMs, tzone) }));

export function computeUdayLagna(i: DayInput): UdayLagna | null {
  const w = dayWindow(i);
  if (!w) return null;
  return { date: isoDate(i.date.year, i.date.month, i.date.day), sunrise: w.sunrise, sunset: w.sunset, uday_lagna: lagnaEntries(w, i.tzone) };
}

/** Tithi spans (1..30) from find-panchang `tithis` (each with end_time). */
function tithiSpans(panchang: unknown, tzone: number): Span[] {
  return arr(asObj(panchang).tithis)
    .map((t) => ({ value: tithiNumber(t.number, t.paksha, t.tithi), endMs: parseLocal(t.end_time, tzone) }))
    .filter((s) => s.value > 0);
}

/** Nakshatra spans (1..27) from find-panchang `nakshatras.nakshatra_list`. */
function nakshatraSpans(panchang: unknown, tzone: number): Span[] {
  const nak = asObj(asObj(panchang).nakshatras);
  return arr(nak.nakshatra_list)
    .map((x) => ({ value: nakshatraNumberFrom(str(x.nak_name), nak), endMs: parseLocal(x.end_time, tzone) }))
    .filter((s) => s.value > 0);
}

/** Sunday = 1 .. Saturday = 7 for the civil date (the vedic day runs sunrise to sunrise). */
const vaarOf = (d: { year: number; month: number; day: number }) => new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay() + 1;

export function computePanchakaRahita(i: DayInput): PanchakaRahita | null {
  const w = dayWindow(i);
  if (!w) return null;
  const tithis = tithiSpans(i.panchang, i.tzone);
  const naks = nakshatraSpans(i.panchang, i.tzone);
  const periods = tithis.length && naks.length ? panchakaRahita(w.fromMs, w.toMs, vaarOf(i.date), w.lagnas, tithis, naks) : [];
  return {
    date: isoDate(i.date.year, i.date.month, i.date.day),
    sunrise: w.sunrise,
    sunset: w.sunset,
    panchak_rahita: periods.map((p) => ({
      panchak: p.panchak,
      start_time: formatLocal(p.startMs, i.tzone),
      end_time: formatLocal(p.endMs, i.tzone),
    })),
    uday_lagna: lagnaEntries(w, i.tzone),
  };
}
