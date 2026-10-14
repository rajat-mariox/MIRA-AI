import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { getNameRashi, getSunSign, getUserRashi, type ZodiacSign } from '../../utils/zodiac';

export const GENDERS = ['male', 'female', 'other'] as const;
export const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed'] as const;
/** Scheduled notification kinds the user can opt out of (src/jobs/notificationJobs.ts). */
export const NOTIFICATION_PREF_KEYS = ['daily', 'weekly', 'festival', 'muhurat'] as const;
export type NotificationPrefKey = (typeof NOTIFICATION_PREF_KEYS)[number];
export type NotificationPrefs = Record<NotificationPrefKey, boolean>;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, trim: true },
    gender: { type: String, enum: GENDERS },
    dateOfBirth: { type: Date },
    birthPlace: { type: String, trim: true },
    /** "HH:mm" 24h */
    birthTime: { type: String },
    maritalStatus: { type: String, enum: MARITAL_STATUSES },
    profileSetupStep: { type: Number, default: 0, min: 0, max: 6 },
    isProfileComplete: { type: Boolean, default: false },
    lat: { type: Number },
    long: { type: Number },
    /** Timezone offset in hours (IST = 5.5). Used by astrology APIs. */
    tzone: { type: Number, default: 5.5 },
    avatarUrl: { type: String },
    walletBalance: { type: Number, default: 0, min: 0 },
    /** Free AI chat questions already used (limit: env CHAT_FREE_QUESTIONS). */
    chatFreeUsed: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    hasAcceptedTerms: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date },
    lastLoginAt: { type: Date },
    /** Scheduled notification opt-ins (all on by default). */
    notificationPrefs: {
      daily: { type: Boolean, default: true },
      weekly: { type: Boolean, default: true },
      festival: { type: Boolean, default: true },
      muhurat: { type: Boolean, default: true },
    },
  },
  { timestamps: true, versionKey: false },
);

userSchema.index({ createdAt: -1 });
userSchema.index({ fullName: 'text', email: 'text' });

export type UserAttrs = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
export type UserDocument = InstanceType<typeof User>;

export interface PublicUser {
  _id: string;
  email: string;
  fullName: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
  birthPlace: string | null;
  birthTime: string | null;
  maritalStatus: string | null;
  profileSetupStep: number;
  isProfileComplete: boolean;
  lat: number | null;
  long: number | null;
  tzone: number;
  avatarUrl: string | null;
  walletBalance: number;
  isActive: boolean;
  hasAcceptedTerms: boolean;
  termsAcceptedAt: Date | null;
  lastLoginAt: Date | null;
  notificationPrefs: NotificationPrefs;
  /** The user's rashi: naam rashi from the name, else the sun sign from dateOfBirth (null when neither). */
  zodiacSign: ZodiacSign | null;
  /** Naam rashi from the first syllable of the name */
  nameRashi: ZodiacSign | null;
  /** Western sun sign derived from dateOfBirth */
  sunSign: ZodiacSign | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

type UserLike = (UserAttrs & { _id: Types.ObjectId | string; createdAt?: Date; updatedAt?: Date }) | UserDocument;

/** Stored prefs with defaults filled in (missing / older docs = on). */
export function notificationPrefsOf(p: Partial<Record<NotificationPrefKey, boolean | null>> | null | undefined): NotificationPrefs {
  const out = {} as NotificationPrefs;
  for (const k of NOTIFICATION_PREF_KEYS) out[k] = p?.[k] !== false;
  return out;
}

/** Shape returned to the app for `user` objects. Safe to send to clients. */
export function toPublicUser(user: UserLike): PublicUser {
  const u = user as UserAttrs & { _id: Types.ObjectId | string; createdAt?: Date; updatedAt?: Date };
  const dob = u.dateOfBirth ? new Date(u.dateOfBirth) : null;
  return {
    _id: String(u._id),
    email: u.email,
    fullName: u.fullName ?? null,
    gender: u.gender ?? null,
    dateOfBirth: dob,
    birthPlace: u.birthPlace ?? null,
    birthTime: u.birthTime ?? null,
    maritalStatus: u.maritalStatus ?? null,
    profileSetupStep: u.profileSetupStep ?? 0,
    isProfileComplete: u.isProfileComplete ?? false,
    lat: u.lat ?? null,
    long: u.long ?? null,
    tzone: u.tzone ?? 5.5,
    avatarUrl: u.avatarUrl ?? null,
    walletBalance: u.walletBalance ?? 0,
    isActive: u.isActive !== false,
    hasAcceptedTerms: u.hasAcceptedTerms ?? false,
    termsAcceptedAt: u.termsAcceptedAt ?? null,
    lastLoginAt: u.lastLoginAt ?? null,
    notificationPrefs: notificationPrefsOf(u.notificationPrefs),
    zodiacSign: getUserRashi(u.fullName, dob),
    nameRashi: getNameRashi(u.fullName),
    sunSign: dob && !Number.isNaN(dob.getTime()) ? getSunSign(dob) : null,
    createdAt: u.createdAt ?? null,
    updatedAt: u.updatedAt ?? null,
  };
}
