import { escapeRegex } from '../../utils/idTransform';
import { parsePagination } from '../../utils/pagination';
import { findUserIdsBySearch, loadUserBriefs, toUserBrief, type UserBrief } from '../../utils/userSummary';
import { Feedback, type FeedbackAttrs } from './feedback.model';
import type { AdminListFeedbackQuery, CreateFeedbackInput } from './feedback.validation';

type FeedbackLike = FeedbackAttrs & { _id: unknown; createdAt?: Date; updatedAt?: Date };

export async function createFeedback(userId: string, input: CreateFeedbackInput) {
  const doc = await Feedback.create({ userId, ...input });
  return {
    feedback: doc.toJSON(),
    /** App hint: happy users (4-5 stars) can be offered the Play Store rating prompt. */
    promptStoreReview: input.rating >= 4,
  };
}

function toAdminFeedback(f: FeedbackLike, user: UserBrief) {
  const id = String(f._id);
  return {
    _id: id,
    id,
    user: { _id: user._id, id: user.id, name: user.name, email: user.email, phone: user.phone },
    userId: user.id,
    rating: f.rating,
    message: f.message ?? '',
    platform: f.platform ?? null,
    appVersion: f.appVersion ?? null,
    createdAt: f.createdAt ?? null,
    updatedAt: f.updatedAt ?? null,
  };
}

async function ratingStats() {
  const rows = await Feedback.aggregate<{ _id: number; count: number }>([{ $group: { _id: '$rating', count: { $sum: 1 } } }]);
  const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let total = 0;
  let sum = 0;
  for (const r of rows) {
    distribution[String(r._id)] = r.count;
    total += r.count;
    sum += r._id * r.count;
  }
  return { totalRatings: total, averageRating: total ? Math.round((sum / total) * 10) / 10 : 0, distribution };
}

export async function adminListFeedback(query: AdminListFeedbackQuery) {
  const p = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.rating) filter.rating = query.rating;
  if (query.search) {
    const userIds = await findUserIdsBySearch(query.search);
    filter.$or = [{ userId: { $in: userIds } }, { message: { $regex: escapeRegex(query.search), $options: 'i' } }];
  }
  const [docs, total, stats] = await Promise.all([
    Feedback.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    Feedback.countDocuments(filter),
    ratingStats(),
  ]);
  const users = await loadUserBriefs(docs.map((d) => d.userId));
  const totalPages = Math.ceil(total / p.limit);
  return {
    feedback: docs.map((d) =>
      toAdminFeedback(d as unknown as FeedbackLike, users.get(String(d.userId)) ?? toUserBrief(d.userId, null)),
    ),
    total,
    page: p.page,
    limit: p.limit,
    totalPages,
    pagination: { page: p.page, limit: p.limit, total, totalPages },
    stats,
  };
}
