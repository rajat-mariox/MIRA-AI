import { request } from './client';

/** Divine payloads are passed through with vendor field names. */
export type PanchangObject = Record<string, unknown>;

export type TimeRange = { start: string; end: string };

/** Home screen summary (built from auspicious-timings). */
export type MuhuratSummary = {
  date: string | null;
  sunrise: string | null;
  sunset: string | null;
  abhijitMuhurta: TimeRange | null;
  brahmaMuhurta: TimeRange | null;
  vijayMuhurta: TimeRange | null;
  godhuliMuhurta: TimeRange | null;
  amritKalam: TimeRange | null;
  place: string;
};

/** month is 1-based */
export type PanchangDate = { day: number; month: number; year: number };

const pad = (n: number) => String(n).padStart(2, '0');
const dateQuery = (d?: PanchangDate) =>
  d ? { day: pad(d.day), month: pad(d.month), year: String(d.year) } : undefined;

export type PanchangSection =
  | ''
  | 'auspicious-timings'
  | 'inauspicious-timings'
  | 'sun-and-moon'
  | 'lunar-samvat'
  | 'rashi-nakshatra'
  | 'ritu-ayana'
  | 'nivas-shool'
  | 'other-calendars-epoch'
  // computed by the backend from find-panchang (not Divine vendor payloads)
  | 'chandrabalam-tarabalam'
  | 'panchaka-rahita';

/** GET /panchang[/<section>]?day&month&year (location: the user's, else New Delhi) */
export function getPanchangSection(section: PanchangSection, date?: PanchangDate) {
  return request<PanchangObject>(section ? `/panchang/${section}` : '/panchang', {
    query: dateQuery(date),
  });
}

export const getPanchang = (date?: PanchangDate) => getPanchangSection('', date);
export const getAuspiciousTimings = (date?: PanchangDate) =>
  getPanchangSection('auspicious-timings', date);

/** GET /panchang/festivals?month&year: object keyed by festival slug */
export function getFestivals(month: number, year: number) {
  return request<PanchangObject>('/panchang/festivals', {
    query: { month: pad(month), year: String(year) },
  });
}

/** Times are "YYYY-MM-DD HH:mm:ss" in the location's timezone. */
export type BalamBlock = {
  current: string[];
  /** "08:27 AM, May 24"; null when it lasts past the next sunrise */
  upto: string | null;
  upto_time: string | null;
  next: string[];
};

/** GET /panchang/chandrabalam-tarabalam */
export type ChandrabalamTarabalam = {
  date: string;
  chandrabalams: BalamBlock | null;
  tarabalams: BalamBlock | null;
};

export type TimedEntry = { start_time: string; end_time: string };

/** GET /panchang/panchaka-rahita (sunrise to next sunrise) */
export type PanchakaRahita = {
  date: string;
  sunrise: string;
  sunset: string | null;
  panchak_rahita: Array<TimedEntry & { panchak: string }>;
  uday_lagna: Array<TimedEntry & { sign: string }>;
};

/** AI reading of a festival for the user's rashi (cached 30 days by the backend; no chat quota). */
export type FestivalInsight = {
  festival: string;
  /** YYYY-MM-DD */
  date: string;
  /** zodiac key, e.g. "libra" */
  rashi: string;
  insight: {
    significance: string;
    forYourRashi: string;
    dos: string[];
    donts: string[];
    luckyColor: string;
    pujaTip: string;
  };
};

/** GET /panchang/festivals/insight?name&date[&sign]; the first call waits on the AI, so a longer timeout */
export function getFestivalInsight(name: string, date: string, sign?: string) {
  return request<FestivalInsight>('/panchang/festivals/insight', {
    query: { name, date, sign },
    timeoutMs: 60_000,
  });
}
