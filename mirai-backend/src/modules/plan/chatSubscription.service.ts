/**
 * AI chat question allowance: CHAT_FREE_QUESTIONS free questions per user (User.chatFreeUsed),
 * then plans bought from the wallet (ChatSubscription). Every update is a single conditional
 * `$inc`, so concurrent requests can never use more questions than the user has.
 */
import { Types } from 'mongoose';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import { User } from '../user/user.model';
import { creditWallet, debitWallet, getBalance } from '../wallet/wallet.service';
import { ChatSubscription } from './chatSubscription.model';
import { getActivePlanById } from './plan.service';
import type { PlanDocument } from './plan.model';

export interface PublicSubscription {
  id: string;
  _id: string;
  planId: string;
  title: string;
  planType: string;
  isUnlimited: boolean;
  questionsTotal: number | null;
  questionsUsed: number;
  /** null = unlimited */
  questionsRemaining: number | null;
  startsAt: Date;
  /** null = never expires */
  expiresAt: Date | null;
  status: string;
  transactionId: string | null;
  createdAt: Date | null;
}

export interface ChatQuota {
  freeLimit: number;
  freeUsed: number;
  freeRemaining: number;
  /** The plan the next question will use once the free questions are gone (newest usable one). */
  subscription: PublicSubscription | null;
  canAsk: boolean;
}

/** Which allowance a reserved question came from (needed to give it back). */
export type QuestionReservation = { source: 'free' } | { source: 'subscription'; subscriptionId: string };

type SubLike = {
  _id: unknown;
  planId: unknown;
  title: string;
  planType?: string | null;
  questionsTotal?: number | null;
  questionsUsed?: number | null;
  startsAt: Date;
  expiresAt?: Date | null;
  status?: string | null;
  transactionId?: unknown;
  createdAt?: Date | null;
};

export function toPublicSubscription(s: SubLike): PublicSubscription {
  const total = typeof s.questionsTotal === 'number' ? s.questionsTotal : null;
  const used = s.questionsUsed ?? 0;
  const id = String(s._id);
  return {
    id,
    _id: id,
    planId: String(s.planId),
    title: s.title,
    planType: s.planType ?? 'question_based',
    isUnlimited: total === null,
    questionsTotal: total,
    questionsUsed: used,
    questionsRemaining: total === null ? null : Math.max(0, total - used),
    startsAt: s.startsAt,
    expiresAt: s.expiresAt ?? null,
    status: s.status ?? 'active',
    transactionId: s.transactionId ? String(s.transactionId) : null,
    createdAt: s.createdAt ?? null,
  };
}

/** Filter: the user's subscriptions that can answer one more question right now. */
function usableFilter(userId: string | Types.ObjectId, now = new Date()) {
  return {
    userId: new Types.ObjectId(String(userId)),
    status: 'active',
    startsAt: { $lte: now },
    $and: [
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      { $or: [{ questionsTotal: null }, { $expr: { $lt: ['$questionsUsed', '$questionsTotal'] } }] },
    ],
  };
}

// ─── Quota ─────────────────────────────────────────────────────────────────────

export async function getQuota(userId: string | Types.ObjectId): Promise<ChatQuota> {
  const [user, sub] = await Promise.all([
    User.findById(userId).select('chatFreeUsed').lean(),
    ChatSubscription.findOne(usableFilter(userId)).sort({ createdAt: -1 }).lean(),
  ]);
  const freeLimit = env.CHAT_FREE_QUESTIONS;
  const freeUsed = Math.min(user?.chatFreeUsed ?? 0, freeLimit);
  const freeRemaining = Math.max(0, freeLimit - freeUsed);
  return {
    freeLimit,
    freeUsed,
    freeRemaining,
    subscription: sub ? toPublicSubscription(sub) : null,
    canAsk: freeRemaining > 0 || !!sub,
  };
}

/**
 * Reserves one question: a free one first, else the newest usable subscription.
 * Throws 402 'chat.limitReached' with data `{ requiresPlan: true, quota }` when none is left.
 */
export async function reserveQuestion(userId: string | Types.ObjectId): Promise<QuestionReservation> {
  const limit = env.CHAT_FREE_QUESTIONS;
  if (limit > 0) {
    const free = await User.updateOne(
      { _id: userId, chatFreeUsed: { $not: { $gte: limit } } },
      { $inc: { chatFreeUsed: 1 } },
    );
    if (free.modifiedCount === 1) return { source: 'free' };
  }

  const sub = await ChatSubscription.findOneAndUpdate(
    usableFilter(userId),
    { $inc: { questionsUsed: 1 } },
    { sort: { createdAt: -1 }, new: true, projection: { _id: 1 } },
  ).lean();
  if (sub) return { source: 'subscription', subscriptionId: String(sub._id) };

  throw new ApiError(402, 'chat.limitReached', { data: { requiresPlan: true, quota: await getQuota(userId) } });
}

/** Gives a reserved question back (the AI could not answer). Never throws. */
export async function releaseQuestion(userId: string | Types.ObjectId, r: QuestionReservation): Promise<void> {
  try {
    if (r.source === 'free') {
      await User.updateOne({ _id: userId, chatFreeUsed: { $gt: 0 } }, { $inc: { chatFreeUsed: -1 } });
    } else {
      await ChatSubscription.updateOne(
        { _id: r.subscriptionId, questionsUsed: { $gt: 0 } },
        { $inc: { questionsUsed: -1 } },
      );
    }
  } catch (err) {
    logger.error({ err, userId: String(userId), reservation: r }, '[chat] failed to give back a question');
  }
}

// ─── Purchase ──────────────────────────────────────────────────────────────────

const UNIT_MS: Record<string, number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  weeks: 7 * 86_400_000,
};

/** startsAt + the plan's validity; null when the plan has no validity (never expires). */
export function planExpiry(plan: Pick<PlanDocument, 'validityValue' | 'validityUnit'>, start: Date): Date | null {
  const value = plan.validityValue ?? 0;
  if (!(value > 0)) return null;
  const unit = plan.validityUnit ?? 'days';
  if (unit === 'months' || unit === 'years') {
    const d = new Date(start);
    if (unit === 'months') d.setUTCMonth(d.getUTCMonth() + value);
    else d.setUTCFullYear(d.getUTCFullYear() + value);
    return d;
  }
  return new Date(start.getTime() + value * (UNIT_MS[unit] ?? UNIT_MS.days!));
}

/** Question-based plans give `questionCount` questions; chat/time-based plans (or count 0) are unlimited. */
function planQuestions(plan: Pick<PlanDocument, 'planType' | 'questionCount'>): number | null {
  if (plan.planType === 'chat_based' || plan.planType === 'time_based') return null;
  return (plan.questionCount ?? 0) > 0 ? plan.questionCount! : null;
}

/**
 * Buys a plan with the wallet. 404 'plan.notFound' (inactive / unknown), 402
 * 'plan.insufficientBalance' with data `{ balance, price }`.
 */
export async function purchasePlan(userId: string, planId: string) {
  const plan = await getActivePlanById(planId);
  const price = plan.price ?? 0;

  let transactionId: string | null = null;
  let balance: number;
  if (price > 0) {
    try {
      const debit = await debitWallet(userId, {
        amount: price,
        purpose: 'plan_purchase',
        title: `${plan.title} plan`,
        description: plan.validityText || plan.featureHighlight || 'AI astrology chat plan',
        planId: String(plan._id),
      });
      transactionId = String(debit.transaction._id);
      balance = debit.balance;
    } catch (err) {
      if (err instanceof ApiError && err.messageKey === 'wallet.insufficientBalance') {
        throw new ApiError(402, 'plan.insufficientBalance', {
          params: { price },
          data: { balance: await getBalance(userId), price },
        });
      }
      throw err;
    }
  } else {
    balance = await getBalance(userId);
  }

  const startsAt = new Date();
  try {
    const sub = await ChatSubscription.create({
      userId,
      planId: plan._id,
      title: plan.title,
      planType: plan.planType,
      questionsTotal: planQuestions(plan),
      questionsUsed: 0,
      price,
      startsAt,
      expiresAt: planExpiry(plan, startsAt),
      status: 'active',
      transactionId,
    });
    return { subscription: toPublicSubscription(sub.toObject()), balance, quota: await getQuota(userId) };
  } catch (err) {
    // Could not record the plan: refund so the user never pays for nothing.
    if (price > 0) {
      await creditWallet(userId, {
        amount: price,
        purpose: 'refund',
        title: `Refund: ${plan.title} plan`,
        description: 'The plan could not be activated',
        referenceId: transactionId ?? undefined,
        planId: String(plan._id),
      }).catch((e: unknown) => logger.error({ err: e, userId, planId }, '[plan] refund after failed purchase failed'));
    }
    throw err;
  }
}
