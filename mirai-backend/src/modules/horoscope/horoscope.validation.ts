import { z } from 'zod';
import { ZODIAC_SIGNS } from '../../utils/zodiac';

export const HOROSCOPE_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export const HOROSCOPE_DAYS = ['today', 'tomorrow', 'yesterday'] as const;

export const horoscopeQuery = z.object({
  period: z.enum(HOROSCOPE_PERIODS).default('daily'),
  /** Only used for period=daily. */
  day: z.enum(HOROSCOPE_DAYS).default('today'),
  /** Optional override; default = sun sign from the user's dateOfBirth. */
  sign: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.enum(ZODIAC_SIGNS, { errorMap: () => ({ message: `sign must be one of ${ZODIAC_SIGNS.join(', ')}` }) }))
    .optional(),
});

export type HoroscopeQuery = z.infer<typeof horoscopeQuery>;
export type HoroscopePeriod = (typeof HOROSCOPE_PERIODS)[number];
export type HoroscopeDay = (typeof HOROSCOPE_DAYS)[number];

export const INSIGHT_TOPICS = ['career', 'finance', 'marriage', 'health'] as const;
export type InsightTopic = (typeof INSIGHT_TOPICS)[number];

export const insightParams = z.object({ topic: z.enum(INSIGHT_TOPICS) });
export const insightQuery = horoscopeQuery.pick({ sign: true });
export type InsightQuery = z.infer<typeof insightQuery>;
