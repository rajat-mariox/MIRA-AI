import { z } from 'zod';
import { idParam } from '../../utils/validators';

export const createFaqSchema = z.object({
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(5000),
  isActive: z.boolean().optional().default(true),
  order: z.coerce.number().int().min(0).max(100_000).optional().default(0),
});

export const updateFaqSchema = z
  .object({
    question: z.string().trim().min(1).max(500),
    answer: z.string().trim().min(1).max(5000),
    isActive: z.boolean(),
    order: z.coerce.number().int().min(0).max(100_000),
  })
  .partial()
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: 'Nothing to update' });

export const faqIdParam = idParam('id');

export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
