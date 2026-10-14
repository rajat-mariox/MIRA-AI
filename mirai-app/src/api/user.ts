import { request, requestWithMessage } from './client';

export type Gender = 'male' | 'female' | 'other';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type ZodiacSignKey =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

/** Scheduled notification opt-ins (Profile -> Notifications). */
export type NotificationPrefKey = 'daily' | 'weekly' | 'festival' | 'muhurat';
export type NotificationPrefs = Record<NotificationPrefKey, boolean>;

/** `toPublicUser()` on the backend. Dates are ISO strings. */
export type User = {
  _id: string;
  email: string;
  fullName: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  birthPlace: string | null;
  /** "HH:mm" 24h */
  birthTime: string | null;
  maritalStatus: MaritalStatus | null;
  /** 0..6: number of onboarding steps completed */
  profileSetupStep: number;
  isProfileComplete: boolean;
  lat: number | null;
  long: number | null;
  tzone: number;
  avatarUrl: string | null;
  walletBalance: number;
  isActive: boolean;
  hasAcceptedTerms: boolean;
  termsAcceptedAt: string | null;
  lastLoginAt: string | null;
  notificationPrefs: NotificationPrefs;
  zodiacSign: ZodiacSignKey | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type UpdateMeInput = Partial<{
  fullName: string;
  gender: Gender;
  /** "YYYY-MM-DD" */
  dateOfBirth: string;
  birthPlace: string;
  /** "HH:mm" 24h */
  birthTime: string;
  maritalStatus: MaritalStatus;
  profileSetupStep: number;
  isProfileComplete: boolean;
  lat: number;
  long: number;
  /** partial merge on the backend */
  notificationPrefs: Partial<NotificationPrefs>;
}>;

export type Device = {
  _id: string;
  deviceId: string;
  deviceType: string;
  deviceName: string | null;
  lastActiveAt: string;
  isCurrent: boolean;
};

/** GET /users/me */
export async function getMe() {
  return (await request<{ user: User }>('/users/me')).user;
}

/** PUT /users/me (partial update) */
export async function updateMe(input: UpdateMeInput) {
  return (await request<{ user: User }>('/users/me', { method: 'PUT', body: input })).user;
}

/** DELETE /users/me: deletes the account, every session and pending OTPs */
export function deleteMe() {
  return requestWithMessage<undefined>('/users/me', { method: 'DELETE' });
}

/** GET /users/me/devices */
export async function getDevices() {
  return (await request<{ devices: Device[] }>('/users/me/devices')).devices;
}
