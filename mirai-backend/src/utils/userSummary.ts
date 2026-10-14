import { Types } from 'mongoose';
import { User } from '../modules/user/user.model';
import { escapeRegex } from './idTransform';

/**
 * Helpers for admin lists that embed a small user object (orders, support tickets, feedback).
 * Users are looked up manually (not populate) so a deleted user still yields a non-null object.
 */
export interface UserBrief {
  _id: string;
  id: string;
  fullName: string;
  name: string;
  email: string;
  phone: string;
  isDeleted: boolean;
}

interface LeanUser {
  _id: unknown;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export function toUserBrief(id: unknown, u?: LeanUser | null): UserBrief {
  const sid = id ? String(id) : '';
  if (!u) {
    return { _id: sid, id: sid, fullName: 'Deleted user', name: 'Deleted user', email: '', phone: '', isDeleted: true };
  }
  const email = u.email ?? '';
  const name = (u.fullName && u.fullName.trim()) || email.split('@')[0] || 'User';
  return { _id: sid, id: sid, fullName: name, name, email, phone: u.phone ?? '', isDeleted: false };
}

/** Map userId -> UserBrief for a set of ids (deleted users get a placeholder). */
export async function loadUserBriefs(ids: unknown[]): Promise<Map<string, UserBrief>> {
  const unique = [...new Set(ids.filter(Boolean).map(String))].filter((s) => Types.ObjectId.isValid(s));
  const users = unique.length
    ? ((await User.find({ _id: { $in: unique } })
        .select('_id fullName email phone')
        .lean()) as unknown as LeanUser[])
    : [];
  const byId = new Map(users.map((u) => [String(u._id), u]));
  const out = new Map<string, UserBrief>();
  for (const id of unique) out.set(id, toUserBrief(id, byId.get(id)));
  return out;
}

/** Ids of users whose name or email matches `search` (case-insensitive substring), capped. */
export async function findUserIdsBySearch(search: string, cap = 1000): Promise<Types.ObjectId[]> {
  const re = { $regex: escapeRegex(search), $options: 'i' };
  const users = await User.find({ $or: [{ fullName: re }, { email: re }] })
    .select('_id')
    .limit(cap)
    .lean();
  return users.map((u) => u._id as Types.ObjectId);
}
