import mongoose, { Types } from 'mongoose';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import { buildPaginated, type PaginationMeta } from '../../utils/pagination';
import { Otp, Session } from '../auth/auth.model';
import { forgetUser, notifyAll, notifyUser, type NotifyResult } from '../notification/notification.service';
import { toPublicUser, User, type PublicUser } from '../user/user.model';
import type {
  BroadcastNotificationInput,
  ListUsersQuery,
  TestNotificationInput,
  UpdateUserInput,
} from './admin.users.validation';

/** User as returned to the admin panel: the app's public user + `id`, `name`, `status`, `activeDevices`. */
export type AdminUserView = PublicUser & { id: string; name: string | null; status: 'Active' | 'Inactive'; activeDevices?: number };

function toAdminUser(u: Parameters<typeof toPublicUser>[0], activeDevices?: number): AdminUserView {
  const p = toPublicUser(u);
  const view: AdminUserView = { ...p, id: p._id, name: p.fullName, status: p.isActive ? 'Active' : 'Inactive' };
  if (activeDevices !== undefined) view.activeDevices = activeDevices;
  return view;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Without `page`/`limit` returns EVERY matching user (newest first): the admin panel paginates and
 * filters client-side. With them, returns that page. Both shapes carry `users`, `total`, `pagination`.
 */
export async function listUsers(q: ListUsersQuery): Promise<{ users: AdminUserView[]; total: number; pagination: PaginationMeta }> {
  const filter: Record<string, unknown> = {};
  if (q.search) {
    const re = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ fullName: re }, { email: re }];
  }
  if (q.isActive) filter.isActive = q.isActive === 'true' ? { $ne: false } : false;
  if (q.isProfileComplete) filter.isProfileComplete = q.isProfileComplete === 'true';

  const paginated = q.page !== undefined || q.limit !== undefined;
  const page = q.page ?? 1;
  const limit = q.limit ?? 10;

  let query = User.find(filter).sort({ createdAt: -1 });
  if (paginated) query = query.skip((page - 1) * limit).limit(limit);
  const [docs, total] = await Promise.all([query.lean(), User.countDocuments(filter)]);

  const users = docs.map((d) => toAdminUser(d));
  const meta = paginated
    ? buildPaginated(users, total, { page, limit }).pagination
    : { page: 1, limit: total, total, totalPages: total > 0 ? 1 : 0 };
  return { users, total, pagination: meta };
}

export async function getUser(userId: string): Promise<AdminUserView> {
  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound('user.notFound');
  const activeDevices = await Session.countDocuments({ userId });
  return toAdminUser(user, activeDevices);
}

/** Whitelisted update. Deactivating a user also deletes all their sessions (forces logout everywhere). */
export async function updateUser(userId: string, input: UpdateUserInput): Promise<AdminUserView> {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('user.notFound');

  const wasActive = user.isActive !== false;
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) user.set(key, value);
  }
  await user.save();

  if (wasActive && user.isActive === false) {
    const { deletedCount } = await Session.deleteMany({ userId: user._id });
    logger.info({ userId, sessions: deletedCount }, '[admin] User deactivated; sessions revoked');
  }
  return toAdminUser(user);
}

/** Collections kept when a user is deleted (financial/audit records). */
const KEEP_ON_USER_DELETE = new Set(['User', 'Transaction']);

/** Deletes the user, their sessions, pending OTP and (best-effort) every doc in other models with `userId`. */
export async function deleteUser(userId: string): Promise<{ deleted: Record<string, number> }> {
  const user = await User.findById(userId).select('_id email').lean();
  if (!user) throw ApiError.notFound('user.notFound');

  const uid = new Types.ObjectId(userId);
  const deleted: Record<string, number> = {};
  deleted.sessions = (await Session.deleteMany({ userId: uid })).deletedCount;
  await Otp.deleteMany({ email: user.email });

  for (const name of mongoose.modelNames()) {
    if (KEEP_ON_USER_DELETE.has(name) || name === 'Session') continue;
    const model = mongoose.model(name);
    if (!model.schema.path('userId')) continue;
    try {
      const r = await model.deleteMany({ userId: uid });
      if (r.deletedCount) deleted[name] = r.deletedCount;
    } catch (err) {
      logger.warn({ err, model: name, userId }, '[admin] Failed to delete related docs');
    }
  }

  try {
    await forgetUser(userId);
  } catch (err) {
    logger.warn({ err, userId }, '[admin] Failed to drop notification read receipts');
  }

  await User.deleteOne({ _id: uid });
  logger.info({ userId, deleted }, '[admin] User deleted');
  return { deleted };
}

type SendResult = Omit<NotifyResult, 'pushError'>;

/** Notification is already saved; turn a push failure into the matching error (the panel shows its message). */
function throwPushError(r: NotifyResult): SendResult {
  const data = { saved: true, notificationId: r.notificationId };
  if (r.pushError === 'notConfigured') throw new ApiError(503, 'admin.pushNotConfigured', { data });
  if (r.pushError === 'noDevices') throw new ApiError(400, 'admin.userNoDevices', { data });
  if (r.pushError === 'failed') throw new ApiError(502, 'admin.pushFailed', { data });
  const { pushError: _ignored, ...rest } = r;
  return rest;
}

/**
 * Saves the notification in the user's in-app inbox (always), then pushes it to every device
 * (Session.fcmToken) of the user; prunes tokens FCM reports as invalid.
 * 503 when FCM is not configured / 400 without devices -- the notification is saved either way.
 */
export async function sendTestNotification(userId: string, input: TestNotificationInput): Promise<SendResult> {
  const user = await User.findById(userId).select('_id').lean();
  if (!user) throw ApiError.notFound('user.notFound');
  const r = await notifyUser(userId, {
    title: input.title,
    body: input.body,
    imageUrl: input.imageUrl,
    screen: input.screen,
    data: input.data,
  });
  return throwPushError(r);
}

/** Saves one broadcast (shown to every user in the app) and pushes it to every active user's devices. */
export async function sendBroadcastNotification(input: BroadcastNotificationInput): Promise<SendResult> {
  const r = await notifyAll({
    title: input.title,
    body: input.body,
    imageUrl: input.imageUrl,
    screen: input.screen,
    data: input.data,
  });
  if (r.pushError === 'noDevices') {
    // nobody has a device yet: the broadcast is still in every inbox
    const { pushError: _ignored, ...rest } = r;
    return rest;
  }
  return throwPushError(r);
}
