import { z } from 'zod';
import { objectId, time24h } from '../../utils/validators';
import { birthOverridesShape } from './birthDetails';
import { KUNDLI_GENDERS } from './kundliProfile.model';

/** Chart ids accepted by Divine's horoscope-chart endpoint (case-sensitive). */
export const CHART_IDS = [
  'D1', 'D2', 'D3', 'D4', 'D5', 'D7', 'D9', 'D10', 'D12', 'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60',
  'chalit', 'SUN', 'MOON', 'cuspal',
] as const;
export type ChartId = (typeof CHART_IDS)[number];

export const CHART_TYPES = ['north', 'south', 'east'] as const;

export const DASHA_TYPES = [
  'maha-dasha',
  'antar-dasha',
  'pratyantar-dasha',
  'sookshma-dasha',
  'prana-dasha',
  'deha-dasha',
] as const;
export const DASHA_PLANETS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const;

/**
 * Query for every /kundli endpoint: optional birth-data overrides (default = the user's profile),
 * or `profileId` = one of the user's saved kundli profiles (its birth data wins over overrides).
 */
export const kundliQuery = z.object({ ...birthOverridesShape, profileId: objectId.optional() });

/** "YYYY-MM-DD", a real calendar date, not in the future. */
const birthDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && d.getTime() <= Date.now();
  }, 'Must be a valid past date')
  .refine((v) => Number(v.slice(0, 4)) >= 1800, 'Year must be 1800 or later');

export const createKundliProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    gender: z.enum(KUNDLI_GENDERS),
    dateOfBirth: birthDate,
    birthTime: time24h,
    birthPlace: z.string().trim().min(2).max(200),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lon: z.coerce.number().min(-180).max(180).optional(),
    tzone: z.coerce.number().min(-12).max(14).default(5.5),
    isSelf: z.boolean().default(false),
  })
  .refine((v) => (v.lat === undefined) === (v.lon === undefined), {
    path: ['lat'],
    message: 'lat and lon must be sent together',
  });
export type CreateKundliProfileInput = z.infer<typeof createKundliProfileSchema>;

export const chartParams = z.object({
  chartId: z
    .string()
    .trim()
    // accept d9 / Sun / Chalit etc. and map to Divine's canonical casing
    .transform((v) => CHART_IDS.find((c) => c.toLowerCase() === v.toLowerCase()) ?? v)
    .pipe(z.enum(CHART_IDS, { errorMap: () => ({ message: `chartId must be one of ${CHART_IDS.join(', ')}` }) })),
});

export const chartQuery = kundliQuery.extend({
  chart_type: z.enum(CHART_TYPES).default('north'),
});

export const dashaQuery = kundliQuery
  .extend({
    dasha_type: z.enum(DASHA_TYPES).default('antar-dasha'),
    maha_dasha: z.enum(DASHA_PLANETS).optional(),
    antar_dasha: z.enum(DASHA_PLANETS).optional(),
  })
  .superRefine((v, ctx) => {
    if ((v.dasha_type === 'prana-dasha' || v.dasha_type === 'deha-dasha') && !v.maha_dasha)
      ctx.addIssue({ code: 'custom', path: ['maha_dasha'], message: `maha_dasha is required for ${v.dasha_type}` });
    if (v.dasha_type === 'deha-dasha' && !v.antar_dasha)
      ctx.addIssue({ code: 'custom', path: ['antar_dasha'], message: 'antar_dasha is required for deha-dasha' });
  });

export type KundliQuery = z.infer<typeof kundliQuery>;
export type ChartQuery = z.infer<typeof chartQuery>;
export type DashaQuery = z.infer<typeof dashaQuery>;
