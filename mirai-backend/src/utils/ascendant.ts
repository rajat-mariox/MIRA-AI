/**
 * Pure astronomy + panchang helpers (no I/O): sidereal (Lahiri) ascendant, rising-sign
 * (Udaya Lagna) periods, Chandrabalam / Tarabalam lists and Panchaka Rahita.
 *
 * Accuracy: mean sidereal time / mean obliquity / mean Lahiri ayanamsa (nutation ignored on
 * both sides, so it mostly cancels). Ascendant agrees with Divine's planetary-positions to a
 * few hundredths of a degree (see scripts/test-panchang-compute.ts).
 *
 * Local times are "YYYY-MM-DD HH:mm:ss" strings in a fixed UTC offset `tzone` (hours), the
 * format Divine uses.
 */

export const SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

/** Nakshatra names as Divine's find-panchang spells them. */
export const NAKSHATRAS = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardhra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Moola',
  'Purva Ashada',
  'Uttara Ashada',
  'Shravan',
  'Dhanishta',
  'Satabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const;

const D2R = Math.PI / 180;
const norm360 = (x: number) => ((x % 360) + 360) % 360;

// ─── Time helpers ────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

/** "2023-05-24 05:25:56" (local, UTC+tzone) -> epoch ms. null for empty / invalid. */
export function parseLocal(s: unknown, tzone: number): number | null {
  if (typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(s.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  return Date.UTC(+y, +mo - 1, +d, +h, +mi, se ? +se : 0) - tzone * 3600_000;
}

/** epoch ms -> "2023-05-24 05:25:56" in UTC+tzone. */
export function formatLocal(ms: number, tzone: number): string {
  const d = new Date(Math.round(ms / 1000) * 1000 + tzone * 3600_000);
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** epoch ms -> "08:27 AM, May 24" (rounded to the minute), like Divine's `upto`. */
export function formatUpto(ms: number, tzone: number): string {
  const d = new Date(Math.round(ms / 60_000) * 60_000 + tzone * 3600_000);
  const h = d.getUTCHours();
  return `${pad(h % 12 || 12)}:${pad(d.getUTCMinutes())} ${h < 12 ? 'AM' : 'PM'}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// ─── Ascendant ───────────────────────────────────────────────────────────────

export const julianDay = (utcMs: number) => utcMs / 86_400_000 + 2440587.5;
const centuries = (jd: number) => (jd - 2451545.0) / 36525;

/** Greenwich mean sidereal time in degrees (IAU 1982 / Meeus 12.4). */
export function gmstDeg(jd: number): number {
  const t = centuries(jd);
  return norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38_710_000);
}

/** Mean obliquity of the ecliptic in degrees (Laskar / Meeus 22.3, truncated). */
export function obliquityDeg(jd: number): number {
  const t = centuries(jd);
  return 23.439291111 - 0.0130041667 * t - 1.6389e-7 * t * t + 5.0361e-7 * t * t * t;
}

/**
 * Mean Lahiri (Chitrapaksha) ayanamsa in degrees: Swiss Ephemeris epoch value
 * 23.245524743° at JD 2435553.5 (1956-03-21) carried by general precession in longitude
 * (5029.0966"·T + 1.11113"·T²). Gives 23.8571° at J2000.
 */
export function lahiriAyanamsaDeg(jd: number): number {
  const p = (t: number) => (5029.0966 * t + 1.11113 * t * t) / 3600;
  return 23.245524743 + p(centuries(jd)) - p(centuries(2435553.5));
}

/** Tropical ascendant (degrees) for a UTC instant at latitude/longitude (east +). */
export function tropicalAscendantDeg(utcMs: number, lat: number, lon: number): number {
  const jd = julianDay(utcMs);
  const ramc = norm360(gmstDeg(jd) + lon) * D2R;
  const eps = obliquityDeg(jd) * D2R;
  const phi = lat * D2R;
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
  return norm360(asc / D2R);
}

/** Sidereal (Lahiri) ascendant in degrees 0-360. */
export function siderealAscendantDeg(utcMs: number, lat: number, lon: number): number {
  return norm360(tropicalAscendantDeg(utcMs, lat, lon) - lahiriAyanamsaDeg(julianDay(utcMs)));
}

/** Sign index 0 (Aries) .. 11 (Pisces) of the sidereal ascendant. */
export const ascendantSignIndex = (utcMs: number, lat: number, lon: number) =>
  Math.floor(siderealAscendantDeg(utcMs, lat, lon) / 30) % 12;

export interface LagnaPeriod {
  /** 0 = Aries */
  signIndex: number;
  startMs: number;
  endMs: number;
}

/**
 * Rising-sign periods between two instants: 1-minute scan, each sign change refined to
 * the second by bisection. The first/last period are clipped to [fromMs, toMs].
 */
export function lagnaPeriods(fromMs: number, toMs: number, lat: number, lon: number): LagnaPeriod[] {
  const STEP = 60_000;
  const out: LagnaPeriod[] = [];
  let cur = ascendantSignIndex(fromMs, lat, lon);
  let start = fromMs;
  let prev = fromMs;
  for (let t = fromMs + STEP; ; t += STEP) {
    const at = Math.min(t, toMs);
    const sign = ascendantSignIndex(at, lat, lon);
    if (sign !== cur) {
      let lo = prev;
      let hi = at;
      while (hi - lo > 500) {
        const mid = (lo + hi) / 2;
        if (ascendantSignIndex(mid, lat, lon) === cur) lo = mid;
        else hi = mid;
      }
      const boundary = Math.round(hi / 1000) * 1000;
      out.push({ signIndex: cur, startMs: start, endMs: boundary });
      cur = sign;
      start = boundary;
    }
    prev = at;
    if (at >= toMs) break;
  }
  out.push({ signIndex: cur, startMs: start, endMs: toMs });
  return out.filter((p) => p.endMs > p.startMs);
}

// ─── Name -> number mapping ──────────────────────────────────────────────────

const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

const NAK_ALIASES: Record<string, number> = {};
NAKSHATRAS.forEach((n, i) => (NAK_ALIASES[key(n)] = i + 1));
Object.assign(NAK_ALIASES, {
  aswini: 1,
  ashvini: 1,
  bharni: 2,
  kritika: 3,
  krittka: 3,
  mrigashirsha: 5,
  mrigasira: 5,
  mrigshira: 5,
  ardra: 6,
  arudra: 6,
  pushyami: 8,
  ashlesa: 9,
  aslesha: 9,
  makha: 10,
  purvaphalguni: 11,
  poorvaphalguni: 11,
  uttaraphalguni: 12,
  uttarphalguni: 12,
  hast: 13,
  chitta: 14,
  swathi: 15,
  svati: 15,
  visakha: 16,
  vishaka: 16,
  anuradh: 17,
  jyestha: 18,
  jyeshta: 18,
  mula: 19,
  moolam: 19,
  purvashadha: 20,
  purvashada: 20,
  poorvashadha: 20,
  purvaashadha: 20,
  uttarashadha: 21,
  uttarashada: 21,
  uttaraashadha: 21,
  shravana: 22,
  sravana: 22,
  dhanista: 23,
  shatabhisha: 24,
  shatabhishak: 24,
  satabhishak: 24,
  purvabhadra: 25,
  poorvabhadrapada: 25,
  uttarabhadra: 26,
  uttarbhadrapada: 26,
  revathi: 27,
});

/** Nakshatra name -> 1..27 (Divine spellings + common variants). 0 if unknown. */
export function nakshatraNumber(name: string): number {
  return NAK_ALIASES[key(name)] ?? 0;
}

/** Sign name -> 0..11. -1 if unknown. */
export function signIndex(name: string): number {
  const k = key(name);
  return SIGNS.findIndex((s) => key(s) === k);
}

/**
 * Tithi 1..30 (Shukla 1-15, Krishna 16-30, Amavasya 30). Divine gives `number` 1-15 per
 * paksha; falls back to the name for Purnima/Amavasya.
 */
export function tithiNumber(number: unknown, paksha: unknown, name?: unknown): number {
  const n = Number(number);
  const nm = typeof name === 'string' ? key(name) : '';
  const krishna = typeof paksha === 'string' && /krishna|krsna|vadi|bahula/i.test(paksha);
  if (Number.isFinite(n) && n >= 1 && n <= 30) return n > 15 ? n : krishna ? n + 15 : n;
  if (nm.startsWith('amav')) return 30;
  if (nm.startsWith('purn') || nm.startsWith('poorn')) return 15;
  return 0;
}

// ─── Chandrabalam / Tarabalam ────────────────────────────────────────────────

const GOOD_CHANDRA = new Set([1, 3, 6, 7, 10, 11]);
const GOOD_TARA = new Set([2, 4, 6, 8, 9]);

/** Native rashis with good Chandrabalam while the Moon transits sign `moon` (0..11). */
export function goodChandrabalam(moon: number): string[] {
  return SIGNS.filter((_, r) => GOOD_CHANDRA.has(((moon - r + 12) % 12) + 1));
}

/** Tara 1..9 of birth nakshatra `birth` (1..27) while the Moon transits `transit` (1..27). */
export function tara(transit: number, birth: number): number {
  const count = ((transit - birth + 27) % 27) + 1;
  return ((count - 1) % 9) + 1;
}

/** Birth nakshatras with good Tarabalam (Sampat, Kshema, Sadhaka, Mitra, Parama Mitra). */
export function goodTarabalam(transit: number): string[] {
  return NAKSHATRAS.filter((_, i) => GOOD_TARA.has(tara(transit, i + 1)));
}

// ─── Panchaka Rahita ─────────────────────────────────────────────────────────

export function panchakName(tithi: number, vaar: number, nakshatra: number, lagna: number): string {
  switch ((tithi + vaar + nakshatra + lagna) % 9) {
    case 1:
      return 'Mrityu Panchak';
    case 2:
      return 'Agni Panchak';
    case 4:
      return 'Raja Panchak';
    case 6:
      return 'Chora Panchak';
    case 8:
      return 'Roga Panchak';
    default:
      return 'Good Panchak';
  }
}

/** A value (tithi / nakshatra number) that holds until `endMs` (null = beyond the window). */
export interface Span {
  value: number;
  endMs: number | null;
}

const valueAt = (spans: Span[], t: number) => (spans.find((s) => s.endMs === null || s.endMs > t) ?? spans[spans.length - 1])?.value ?? 0;

export interface PanchakPeriod {
  panchak: string;
  startMs: number;
  endMs: number;
}

/**
 * Splits [fromMs, toMs] at every lagna, tithi and nakshatra change, scores each piece and
 * merges neighbours with the same result. `vaar`: Sunday = 1 .. Saturday = 7 (constant over a
 * sunrise-to-sunrise day). `tithis` / `nakshatras` must be in time order.
 */
export function panchakaRahita(
  fromMs: number,
  toMs: number,
  vaar: number,
  lagnas: LagnaPeriod[],
  tithis: Span[],
  nakshatras: Span[],
): PanchakPeriod[] {
  const cuts = new Set<number>([fromMs, toMs]);
  for (const l of lagnas) cuts.add(l.startMs);
  for (const s of [...tithis, ...nakshatras]) if (s.endMs !== null) cuts.add(s.endMs);
  const pts = [...cuts].filter((t) => t >= fromMs && t <= toMs).sort((a, b) => a - b);

  const out: PanchakPeriod[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (b - a < 1000) continue;
    const mid = (a + b) / 2;
    const lagna = lagnas.find((l) => l.startMs <= mid && mid < l.endMs) ?? lagnas[lagnas.length - 1];
    const name = panchakName(valueAt(tithis, mid), vaar, valueAt(nakshatras, mid), (lagna?.signIndex ?? 0) + 1);
    const last = out[out.length - 1];
    if (last && last.panchak === name) last.endMs = b;
    else out.push({ panchak: name, startMs: a, endMs: b });
  }
  return out;
}
