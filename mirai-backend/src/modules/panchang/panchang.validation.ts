import { z } from 'zod';
import { isZodiacSign } from '../../utils/zodiac';

/** "06" / "6" -> 6 (Postman sends 2-digit day/month; both accepted). */
const twoDigit = (name: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,2}$/, `${name} must be a 1-2 digit number (e.g. 06)`)
    .transform(Number)
    .refine((n) => n >= min && n <= max, `${name} must be between ${min} and ${max}`);

const year = z
  .string()
  .trim()
  .regex(/^\d{4}$/, 'year must be a 4-digit year (e.g. 2026)')
  .transform(Number)
  .refine((n) => n >= 1800 && n <= 2200, 'year must be between 1800 and 2200');

const locationShape = {
  place: z.string().trim().min(2).max(200).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  tzone: z.coerce.number().min(-12).max(14).optional(),
};

type Loc = { lat?: number; lon?: number };
const latLonTogether = (v: Loc, ctx: z.RefinementCtx) => {
  if ((v.lat === undefined) !== (v.lon === undefined))
    ctx.addIssue({ code: 'custom', path: [v.lat === undefined ? 'lat' : 'lon'], message: 'lat and lon must be sent together' });
};

/**
 * Query for day-based panchang endpoints. Every field is optional:
 * date defaults to today (in tzone), location to the user's saved coordinates, else New Delhi.
 */
export const panchangDayQuery = z
  .object({
    day: twoDigit('day', 1, 31).optional(),
    month: twoDigit('month', 1, 12).optional(),
    year: year.optional(),
    ...locationShape,
  })
  .superRefine((v, ctx) => {
    latLonTogether(v, ctx);
    const given = [v.day, v.month, v.year].filter((x) => x !== undefined).length;
    if (given !== 0 && given !== 3)
      ctx.addIssue({ code: 'custom', path: ['day'], message: 'day, month and year must be sent together' });
    if (given === 3) {
      const d = new Date(Date.UTC(v.year!, v.month! - 1, v.day!));
      if (d.getUTCDate() !== v.day) ctx.addIssue({ code: 'custom', path: ['day'], message: 'Invalid calendar date' });
    }
  });

export const festivalsQuery = z
  .object({ month: twoDigit('month', 1, 12).optional(), year: year.optional(), ...locationShape })
  .superRefine((v, ctx) => {
    latLonTogether(v, ctx);
    if ((v.month === undefined) !== (v.year === undefined))
      ctx.addIssue({ code: 'custom', path: ['month'], message: 'month and year must be sent together' });
  });

export const lunarSamvatQuery = z
  .object({ month_type: z.enum(['amanta', 'purnimanta']).default('amanta') })
  .and(panchangDayQuery);

export type PanchangDayQuery = z.infer<typeof panchangDayQuery>;
export type FestivalsQuery = z.infer<typeof festivalsQuery>;
export type LunarSamvatQuery = z.infer<typeof lunarSamvatQuery>;

/** GET /panchang/festivals/insight?name&date=YYYY-MM-DD[&sign] */
export const festivalInsightQuery = z.object({
  name: z.string().trim().min(2).max(120),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .refine((s) => {
      const d = new Date(`${s}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
    }, 'Invalid calendar date'),
  sign: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isZodiacSign, 'sign must be a zodiac sign (e.g. libra)')
    .optional(),
});

export type FestivalInsightQuery = z.infer<typeof festivalInsightQuery>;
