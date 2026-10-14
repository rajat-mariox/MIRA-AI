import api from './api';
import type { ApiResponse } from './admin.service';

/** App user as returned by GET /admin/users (public user + `id`, `name`, `status`). */
export interface RawUser {
  _id: string;
  id?: string;
  email?: string;
  fullName?: string | null;
  name?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  birthPlace?: string | null;
  isProfileComplete?: boolean;
  walletBalance?: number;
  isActive?: boolean;
  status?: string;
  zodiacSign?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
}

export interface User {
  _id: string;
  name?: string;
  email?: string;
  /** Undefined when the user has not set it. */
  gender?: 'Male' | 'Female' | 'Other';
  isProfileComplete: boolean;
  walletBalance: number;
  status: 'Active' | 'Inactive';
  joined?: string;
  lastLoginAt?: string | null;
}

export type UserUpdate = Partial<Pick<User, 'name' | 'email' | 'gender' | 'status'>>;

const BASE = '/admin/users';

function normalizeGender(raw: unknown): User['gender'] {
  const g = String(raw ?? '').trim().toLowerCase();
  if (g === 'male') return 'Male';
  if (g === 'female') return 'Female';
  if (g === 'other') return 'Other';
  return undefined;
}

export function normalizeUser(u: RawUser): User {
  return {
    _id: u._id ?? u.id ?? '',
    name: u.name ?? u.fullName ?? undefined,
    email: u.email,
    gender: normalizeGender(u.gender),
    isProfileComplete: !!u.isProfileComplete,
    walletBalance: Number(u.walletBalance ?? 0),
    status: u.isActive === false || u.status === 'Inactive' ? 'Inactive' : 'Active',
    joined: u.createdAt ?? undefined,
    lastLoginAt: u.lastLoginAt ?? null,
  };
}

/** Only the fields the panel edits, in the names the backend whitelists. */
function serializeUpdate(update: UserUpdate) {
  const body: Record<string, unknown> = {};
  if (update.name !== undefined) body.fullName = update.name;
  if (update.email !== undefined) body.email = update.email;
  if (update.gender !== undefined) body.gender = update.gender.toLowerCase();
  if (update.status !== undefined) body.isActive = update.status === 'Active';
  return body;
}

export const userService = {
  /** No page/limit -> the backend returns ALL users; the page paginates client-side. */
  listUsers: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<{ users: RawUser[]; total: number }>>(BASE);
    return (response.data.data?.users ?? []).map(normalizeUser);
  },

  getUserDetails: async (userId: string) => {
    const response = await api.get<ApiResponse<{ user: RawUser }>>(`${BASE}/${userId}`);
    return normalizeUser(response.data.data.user);
  },

  updateUser: async (userId: string, update: UserUpdate): Promise<User> => {
    const response = await api.patch<ApiResponse<{ user: RawUser }>>(`${BASE}/${userId}`, serializeUpdate(update));
    return normalizeUser(response.data.data.user);
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete<ApiResponse<{ deleted: Record<string, number> }>>(`${BASE}/${userId}`);
    return response.data;
  },
};
