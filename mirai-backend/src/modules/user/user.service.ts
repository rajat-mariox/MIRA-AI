import { Session } from '../auth/auth.model';
import { ApiError } from '../../utils/ApiError';
import { geocodePlace } from '../../lib/geocode';
import { deleteUser } from '../admin/admin.users.service';
import { toPublicUser, type PublicUser, type UserDocument } from './user.model';
import type { UpdateMeInput } from './user.validation';

export function getProfile(user: UserDocument): PublicUser {
  return toPublicUser(user);
}

export async function updateProfile(user: UserDocument, input: UpdateMeInput): Promise<PublicUser> {
  const { notificationPrefs, ...rest } = input;
  // A new birth place invalidates the saved coordinates: geocode it now (best effort). On a
  // miss or a Nominatim outage they are cleared and resolved lazily by the kundli module.
  const placeChanged = rest.birthPlace !== undefined && rest.birthPlace !== user.birthPlace;
  if (placeChanged && rest.lat === undefined && rest.long === undefined) {
    const point = await geocodePlace(rest.birthPlace!).catch(() => null);
    user.set('lat', point?.lat ?? undefined);
    user.set('long', point?.lon ?? undefined);
  }
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) user.set(key, value);
  }
  // Partial merge: { notificationPrefs: { daily: false } } leaves the other prefs as they are
  for (const [key, value] of Object.entries(notificationPrefs ?? {})) {
    if (typeof value === 'boolean') user.set(`notificationPrefs.${key}`, value);
  }
  await user.save();
  return toPublicUser(user);
}

export async function listDevices(userId: string, currentSessionId?: string) {
  const sessions = await Session.find({ userId })
    .select('_id deviceId deviceType deviceName lastActiveAt createdAt')
    .sort({ lastActiveAt: -1 })
    .lean();
  return sessions.map((s) => ({
    _id: String(s._id),
    deviceId: s.deviceId,
    deviceType: s.deviceType,
    deviceName: s.deviceName ?? null,
    lastActiveAt: s.lastActiveAt,
    isCurrent: currentSessionId ? String(s._id) === currentSessionId : false,
  }));
}

/**
 * Sets (or clears with null) the FCM push token of the CURRENT session. A token belongs to one
 * physical device, so it is detached from every other session (other users on the same phone).
 */
export async function setFcmToken(userId: string, sessionId: string, fcmToken: string | null): Promise<void> {
  const update = fcmToken ? { $set: { fcmToken } } : { $unset: { fcmToken: 1 } };
  const res = await Session.updateOne({ _id: sessionId, userId }, update);
  if (res.matchedCount === 0) throw ApiError.notFound('user.deviceNotFound');
  if (fcmToken) {
    await Session.updateMany({ fcmToken, _id: { $ne: sessionId } }, { $unset: { fcmToken: 1 } });
  }
}

export async function removeDevice(userId: string, sessionId: string): Promise<void> {
  const res = await Session.deleteOne({ _id: sessionId, userId });
  if (res.deletedCount === 0) throw ApiError.notFound('user.deviceNotFound');
}

/**
 * Self-service account deletion (DELETE /users/me): removes the user, every session (all devices),
 * pending OTPs and other docs with `userId`. Wallet transactions are kept (financial records).
 */
export async function deleteAccount(userId: string): Promise<void> {
  await deleteUser(userId);
}
