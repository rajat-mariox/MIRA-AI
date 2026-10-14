import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import { escapeRegex } from '../../utils/idTransform';
import { parsePagination } from '../../utils/pagination';
import { Plan } from './plan.model';
import type { CreatePlanInput, ListPlansAdminQuery, UpdatePlanInput } from './plan.validation';

/**
 * Plans inserted when the collection is empty (first plans request after a fresh deploy).
 * Matches the "Choose Your Plan" design; existing databases were moved to these values by
 * scripts/migrate-chat-plans.ts. Admins manage plans afterwards via /admin/plans.
 */
export const DEFAULT_PLANS = [
  {
    title: '2 Questions',
    price: 199,
    originalPrice: 199,
    validityText: 'Valid for 24 hrs',
    featureHighlight: 'Text only',
    badge: '',
    icon: 'chat',
    actionText: 'Select',
    planType: 'question_based',
    questionCount: 2,
    validityValue: 24,
    validityUnit: 'hours',
    sortOrder: 1,
  },
  {
    title: '5 Questions',
    price: 399,
    originalPrice: 499,
    validityText: 'Valid for 48 hrs',
    featureHighlight: 'Text + Voice',
    badge: 'MOST POPULAR',
    icon: 'call',
    actionText: 'Select',
    planType: 'question_based',
    questionCount: 5,
    validityValue: 48,
    validityUnit: 'hours',
    sortOrder: 2,
  },
  {
    title: 'Unlimited Chat',
    price: 999,
    originalPrice: 999,
    validityText: 'Valid for 7 days',
    featureHighlight: 'All features',
    badge: '',
    icon: 'call',
    actionText: 'Select',
    planType: 'chat_based',
    questionCount: 0,
    validityValue: 7,
    validityUnit: 'days',
    sortOrder: 3,
  },
] as const;

let seedPromise: Promise<void> | null = null;

/** Seeds DEFAULT_PLANS once per process if the collection is empty. Cheap to call on every request. */
export function ensureDefaultPlans(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await Plan.estimatedDocumentCount();
      if (count > 0) return;
      await Plan.insertMany(DEFAULT_PLANS.map((p) => ({ ...p, isActive: true })));
      logger.info(`Seeded ${DEFAULT_PLANS.length} default plans`);
    })().catch((err: unknown) => {
      seedPromise = null; // retry on the next call
      logger.warn({ err }, 'Default plan seeding failed');
    });
  }
  return seedPromise;
}

/** Active plans for the app, ordered by sortOrder. */
export async function listActivePlans() {
  await ensureDefaultPlans();
  const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });
  return plans.map((p) => p.toJSON());
}

/** For other modules (e.g. purchase flows): an active plan or 404 'plan.notFound'. */
export async function getActivePlanById(id: string) {
  const plan = await Plan.findOne({ _id: id, isActive: true });
  if (!plan) throw ApiError.notFound('plan.notFound');
  return plan;
}

// ---------- admin ----------

export async function adminList(query: ListPlansAdminQuery) {
  await ensureDefaultPlans();
  // The panel calls GET /admin/plans without page/limit and shows everything, so default to a big page.
  const p = parsePagination(query, 100);
  const filter: Record<string, unknown> = {};
  if (query.isActive) filter.isActive = query.isActive === 'true';
  if (query.planType) filter.planType = query.planType;
  if (query.search) filter.title = { $regex: escapeRegex(query.search), $options: 'i' };

  const [docs, total] = await Promise.all([
    Plan.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(p.skip).limit(p.limit),
    Plan.countDocuments(filter),
  ]);
  const totalPages = Math.ceil(total / p.limit);
  return {
    plans: docs.map((d) => d.toJSON()),
    total,
    page: p.page,
    limit: p.limit,
    totalPages,
    pagination: { page: p.page, limit: p.limit, total, totalPages },
  };
}

export async function adminGet(id: string) {
  const plan = await Plan.findById(id);
  if (!plan) throw ApiError.notFound('plan.notFound');
  return plan.toJSON();
}

export async function adminCreate(input: CreatePlanInput) {
  const plan = await Plan.create({ ...input, originalPrice: input.originalPrice ?? input.price });
  return plan.toJSON();
}

export async function adminUpdate(id: string, input: UpdatePlanInput) {
  const plan = await Plan.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true });
  if (!plan) throw ApiError.notFound('plan.notFound');
  return plan.toJSON();
}

export async function adminDelete(id: string) {
  const res = await Plan.deleteOne({ _id: id });
  if (res.deletedCount === 0) throw ApiError.notFound('plan.notFound');
}
