import { toTimeRanges } from '../../lib/divine';

/** Pure, light normalisers for Divine panchang payloads (vendor field names are kept). */

type Obj = Record<string, unknown>;
export const asObj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});

/** Nivas & Shool values carry trailing spaces ("Crematorium "). */
export function normalizeNivasShool(raw: unknown): Obj {
  const out: Obj = {};
  for (const [k, v] of Object.entries(asObj(raw))) {
    out[k] = typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x.trim() : x)) : v;
  }
  return out;
}

function collectDates(v: unknown, acc: string[] = []): string[] {
  if (Array.isArray(v)) v.forEach((x) => collectDates(x, acc));
  else if (v && typeof v === 'object') {
    const o = v as Obj;
    if (typeof o.date === 'string') acc.push(o.date);
    for (const [k, x] of Object.entries(o)) if (k !== 'date' && x && typeof x === 'object') collectDates(x, acc);
  }
  return acc;
}

/**
 * English-calendar festivals: object keyed by slug; values are `{date,...}`, sect variants
 * `{smartas:{date..}, vaishnavas:{..}}` or arrays. Divine sometimes includes out-of-month
 * items, so drop entries none of whose dates fall in YYYY-MM. Entries without dates are kept.
 */
export function filterFestivalsByMonth(raw: unknown, year: number, month: number): Obj {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const out: Obj = {};
  for (const [slug, v] of Object.entries(asObj(raw))) {
    const dates = collectDates(v);
    if (dates.length === 0 || dates.some((d) => d.startsWith(prefix))) out[slug] = v;
  }
  return out;
}

/** chandramasa `{date, chandramasa, adhik, type}` + samvat `{vikram_name, shaka_name, shaka_year, vikram_year}`. */
export function mergeLunarSamvat(chandramasa: unknown, samvat: unknown): Obj {
  return { ...asObj(chandramasa), ...asObj(samvat) };
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface MuhuratSummary {
  date: string | null;
  sunrise: string | null;
  sunset: string | null;
  abhijitMuhurta: TimeRange | null;
  brahmaMuhurta: TimeRange | null;
  vijayMuhurta: TimeRange | null;
  godhuliMuhurta: TimeRange | null;
  amritKalam: TimeRange | null;
}

const first = (v: unknown): TimeRange | null => {
  const r = toTimeRanges(v)[0];
  return r ? { start: r.start_time, end: r.end_time } : null;
};
const s = (v: unknown) => (typeof v === 'string' && v ? v : null);

/** Compact muhurat summary for the home screen, from auspicious-timings. */
export function summarizeAuspicious(raw: unknown): MuhuratSummary {
  const d = asObj(raw);
  return {
    date: s(d.date),
    sunrise: s(d.sunrise),
    sunset: s(d.sunset),
    abhijitMuhurta: first(d.abhijit_muhurta),
    brahmaMuhurta: first(d.brahma_muhurta),
    vijayMuhurta: first(d.vijay_muhurta),
    godhuliMuhurta: first(d.godhuli_muhurta),
    amritKalam: first(d.amrit_kalam),
  };
}
