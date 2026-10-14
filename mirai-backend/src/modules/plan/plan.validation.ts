import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination';
import { idParam } from '../../utils/validators';
import { PLAN_TYPES, VALIDITY_UNITS } from './plan.model';

const lower = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : v);

const planFields = {
  title: z.string().trim().min(1).max(100),
  price: z.coerce.number().min(0).max(1_000_000),
  originalPrice: z.coerce.number().min(0).max(1_000_000),
  currency: z.string().trim().length(3),
  currencySymbol: z.string().trim().min(1).max(5),
  validityText: z.string().trim().max(100),
  featureHighlight: z.string().trim().max(200),
  badge: z.string().trim().max(50),
  icon: z.string().trim().max(100),
  actionText: z.string().trim().max(50),
  planType: z.preprocess(lower, z.enum(PLAN_TYPES)),
  questionCount: z.coerce.number().int().min(0).max(100_000),
  validityValue: z.coerce.number().int().min(0).max(100_000),
  validityUnit: z.preprocess(lower, z.enum(VALIDITY_UNITS)),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int(),
};

export const createPlanSchema = z.object(planFields).partial().required({ title: true, price: true });

export const updatePlanSchema = z
  .object(planFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' });

export const listPlansAdminQuery = z.object({
  ...paginationQuery,
  search: z.string().trim().max(100).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  planType: z.enum(PLAN_TYPES).optional(),
});

export const planIdParam = idParam();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type ListPlansAdminQuery = z.infer<typeof listPlansAdminQuery>;
