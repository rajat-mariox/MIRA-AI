/** Date helpers for astrology APIs that take a fixed UTC offset in hours (`tzone`, e.g. 5.5). */

export interface LocalDateParts {
  day: number;
  month: number; // 1-12
  year: number;
  /** YYYY-MM-DD */
  iso: string;
}

export const pad2 = (n: number | string) => String(n).padStart(2, '0');

/** Calendar date "now" (or at `at`) in the given UTC offset. */
export function localDateParts(tzone: number, at: Date = new Date()): LocalDateParts {
  const d = new Date(at.getTime() + tzone * 3600_000);
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const year = d.getUTCFullYear();
  return { day, month, year, iso: `${year}-${pad2(month)}-${pad2(day)}` };
}

/** Seconds from now until 00:00 (local, in `tzone`) of year-month-day (month 1-12; overflow like day 32 is fine). Min 60. */
export function secondsUntilLocal(tzone: number, year: number, month: number, day: number): number {
  const utcMs = Date.UTC(year, month - 1, day) - tzone * 3600_000;
  return Math.max(60, Math.ceil((utcMs - Date.now()) / 1000));
}
