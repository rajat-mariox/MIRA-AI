import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination';

/** `{ rating, message? }`; `thoughts` (RateAppScreen field name) is accepted as an alias of `message`. */
export const createFeedbackSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5),
    message: z.string().trim().max(2000).optional(),
    thoughts: z.string().trim().max(2000).optional(),
    platform: z.preprocess((v) => (typeof v === 'string' ? v.toLowerCase() : v), z.enum(['ios', 'android', 'web'])).optional(),
    appVersion: z.string().trim().max(30).optional(),
  })
  .transform(({ thoughts, message, ...rest }) => ({ ...rest, message: message || thoughts || '' }));

export const adminListFeedbackQuery = z.object({
  ...paginationQuery,
  rating: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().int().min(1).max(5).optional()),
  search: z.string().trim().max(100).optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type AdminListFeedbackQuery = z.infer<typeof adminListFeedbackQuery>;
