import { Types } from 'mongoose';
import { logger } from '../../lib/logger';
import { isPushConfigured, sendPushToTokens, type PushPayload, type PushResult } from '../../lib/push';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginationMeta } from '../../utils/pagination';
import { Session } from '../auth/auth.model';
import { User } from '../user/user.model';
import { Notification } from './notification.model';

export interface NotifyInput extends PushPayload {
  /** App route opened on tap (saved + sent as data.screen) */
  screen?: string;
  type?: string;
}

export interface NotifyResult {
  notificationId: string;
  /** false when FCM is not configured (the notification is still saved) */
  pushConfigured: boolean;
  tokens: number;
  successCount: number;
  failureCount: number;
  prunedTokens: number;
  /** set when the push could not be sent at all (the notification is still saved) */
  pushError?: 'notConfigured' | 'noDevices' | 'failed';
}

export interface PublicNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  screen: string | null;
  imageUrl: string | null;
  data: Record<string, string> | null;
  createdAt: Date;
  read: boolean;
}

async function save(userId: Types.ObjectId | null, input: NotifyInput) {
  const doc = await Notification.create({
    userId,
    title: input.title,
    body: input.body,
    type: input.type ?? input.data?.category ?? 'general',
    screen: input.screen ?? input.data?.screen ?? null,
    imageUrl: input.imageUrl ?? null,
    data: input.data,
  });
  return String(doc._id);
}

async function pushToTokens(tokens: string[], input: NotifyInput, notificationId: string): Promise<NotifyResult> {
  const base: NotifyResult = {
    notificationId,
    pushConfigured: true,
    tokens: tokens.length,
    successCount: 0,
    failureCount: 0,
    prunedTokens: 0,
  };
  if (!isPushConfigured()) return { ...base, pushConfigured: false, pushError: 'notConfigured' };
  if (!tokens.length) return { ...base, pushError: 'noDevices' };

  let result: PushResult;
  try {
    result = await sendPushToTokens(tokens, {
      title: input.title,
      body: input.body,
      imageUrl: input.imageUrl,
      data: {
        ...(input.data ?? {}),
        ...(input.screen ? { screen: input.screen } : {}),
        notificationId,
      },
    });
  } catch (err) {
    logger.error({ err }, '[notification] Push send failed');
    return { ...base, pushError: 'failed' };
  }

  let prunedTokens = 0;
  if (result.invalidTokens.length) {
    const r = await Session.updateMany({ fcmToken: { $in: result.invalidTokens } }, { $unset: { fcmToken: 1 } });
    prunedTokens = r.modifiedCount;
  }
  if (result.successCount === 0) {
    logger.warn({ notificationId, errors: result.errors }, '[notification] Push delivered to no device');
  }
  return { ...base, successCount: result.successCount, failureCount: result.failureCount, prunedTokens };
}

/** Saves the notification in the user's inbox, then pushes it to every device of the user (when FCM is configured). */
export async function notifyUser(userId: string, input: NotifyInput): Promise<NotifyResult> {
  const id = await save(new Types.ObjectId(userId), input);
  const sessions = await Session.find({ userId, fcmToken: { $nin: [null, ''] } }).select('fcmToken').lean();
  const tokens = sessions.map((s) => s.fcmToken).filter((t): t is string => Boolean(t));
  return pushToTokens(tokens, input, id);
}

/** Saves one broadcast (userId null, visible to every user) and pushes it to every device of every active user. */
export async function notifyAll(input: NotifyInput): Promise<NotifyResult> {
  const id = await save(null, input);
  const inactive = await User.find({ isActive: false }).distinct('_id');
  const sessions = await Session.find({ fcmToken: { $nin: [null, ''] }, userId: { $nin: inactive } })
    .select('fcmToken')
    .lean();
  const tokens = sessions.map((s) => s.fcmToken).filter((t): t is string => Boolean(t));
  return pushToTokens(tokens, input, id);
}

/* ------------------------------ app inbox ------------------------------ */

/** The user's own notifications + broadcasts sent since they signed up. */
function visibleFilter(userId: Types.ObjectId, since: Date | null | undefined) {
  return {
    $or: [{ userId }, { userId: null, ...(since ? { createdAt: { $gte: since } } : {}) }],
  };
}

export async function listForUser(
  userId: string,
  userCreatedAt: Date | null | undefined,
  query: Record<string, unknown>,
): Promise<{ notifications: PublicNotification[]; unreadCount: number; pagination: PaginationMeta }> {
  const uid = new Types.ObjectId(userId);
  const filter = visibleFilter(uid, userCreatedAt);
  const p = parsePagination(query, 20);
  const [docs, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1, _id: -1 }).skip(p.skip).limit(p.limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, readBy: { $ne: uid } }),
  ]);
  const notifications = docs.map((d) => ({
    id: String(d._id),
    title: d.title,
    body: d.body,
    type: d.type ?? 'general',
    screen: d.screen ?? null,
    imageUrl: d.imageUrl ?? null,
    data: (d.data as Record<string, string> | undefined) ?? null,
    createdAt: d.createdAt,
    read: (d.readBy ?? []).some((r) => r.equals(uid)),
  }));
  return {
    notifications,
    unreadCount,
    pagination: { page: p.page, limit: p.limit, total, totalPages: Math.ceil(total / p.limit) },
  };
}

export async function unreadCountForUser(userId: string, userCreatedAt: Date | null | undefined): Promise<number> {
  const uid = new Types.ObjectId(userId);
  return Notification.countDocuments({ ...visibleFilter(uid, userCreatedAt), readBy: { $ne: uid } });
}

export async function markRead(userId: string, userCreatedAt: Date | null | undefined, id: string): Promise<void> {
  const uid = new Types.ObjectId(userId);
  const res = await Notification.updateOne(
    { _id: new Types.ObjectId(id), ...visibleFilter(uid, userCreatedAt) },
    { $addToSet: { readBy: uid } },
  );
  if (res.matchedCount === 0) throw ApiError.notFound('notification.notFound');
}

export async function markAllRead(userId: string, userCreatedAt: Date | null | undefined): Promise<number> {
  const uid = new Types.ObjectId(userId);
  const res = await Notification.updateMany(
    { ...visibleFilter(uid, userCreatedAt), readBy: { $ne: uid } },
    { $addToSet: { readBy: uid } },
  );
  return res.modifiedCount;
}

/** Account deletion: personal notifications go with the userId sweep; this drops read receipts on broadcasts. */
export async function forgetUser(userId: string): Promise<void> {
  const uid = new Types.ObjectId(userId);
  await Notification.updateMany({ readBy: uid }, { $pull: { readBy: uid } });
}
