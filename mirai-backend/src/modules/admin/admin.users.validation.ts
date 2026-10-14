import { z } from 'zod';
import { MAX_LIMIT } from '../../utils/pagination';
import { email, idParam, isoDate, objectId, time24h } from '../../utils/validators';
import { GENDERS, MARITAL_STATUSES } from '../user/user.model';

/** null / '' -> undefined, so the panel's "send the whole object" edits don't fail on empty fields. */
const blankToUndef = (v: unknown) => (v === null || (typeof v === 'string' && v.trim() === '') ? undefined : v);
const opt = <T extends z.ZodTypeAny>(s: T) => z.preprocess(blankToUndef, s.optional());
const lowerEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v), z.enum(values));
const boolish = z.preprocess(
  (v) => (v === 'true' ? true : v === 'false' ? false : v),
  z.boolean(),
);

/** GET /admin/users: no params -> ALL users (the panel paginates client-side). */
export const listUsersQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
  search: z.string().trim().max(100).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  isProfileComplete: z.enum(['true', 'false']).optional(),
});

/**
 * PATCH /admin/users/:userId. Whitelisted fields; unknown keys (e.g. `_id`, `createdAt`, `role`,
 * `phone`, `joined`) are silently stripped. Accepts the panel's aliases:
 *   name | fullName | full_name, email | emailId | email_id, capitalised gender,
 *   status 'Active'|'Inactive'|'Suspended' and boolean isActive | active | disabled.
 */
export const updateUserSchema = z
  .object({
    name: opt(z.string().trim().min(1).max(100)),
    fullName: opt(z.string().trim().min(1).max(100)),
    full_name: opt(z.string().trim().min(1).max(100)),
    email: opt(email),
    emailId: opt(email),
    email_id: opt(email),
    gender: opt(lowerEnum(GENDERS)),
    dateOfBirth: opt(isoDate),
    birthPlace: opt(z.string().trim().max(200)),
    birthTime: opt(time24h),
    maritalStatus: opt(lowerEnum(MARITAL_STATUSES)),
    isProfileComplete: opt(boolish),
    avatarUrl: opt(z.string().trim().max(2000)),
    isActive: opt(boolish),
    active: opt(boolish),
    disabled: opt(boolish),
    status: opt(z.string().trim().max(30)),
  })
  .transform((v) => {
    let isActive: boolean | undefined = v.isActive ?? v.active ?? (v.disabled !== undefined ? !v.disabled : undefined);
    if (isActive === undefined && v.status) {
      const s = v.status.toLowerCase();
      if (s === 'active') isActive = true;
      else if (['inactive', 'disabled', 'deactivated', 'suspended', 'blocked', 'banned'].includes(s)) isActive = false;
    }
    const out = {
      fullName: v.name ?? v.fullName ?? v.full_name,
      email: v.email ?? v.emailId ?? v.email_id,
      gender: v.gender,
      dateOfBirth: v.dateOfBirth,
      birthPlace: v.birthPlace,
      birthTime: v.birthTime,
      maritalStatus: v.maritalStatus,
      isProfileComplete: v.isProfileComplete,
      avatarUrl: v.avatarUrl,
      isActive,
    };
    return Object.fromEntries(Object.entries(out).filter(([, val]) => val !== undefined)) as Partial<typeof out>;
  });

export const userIdParam = idParam('userId');

export const testNotificationSchema = z.object({
  userId: objectId.optional(),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(1000),
  imageUrl: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().url().optional(),
  ),
  /** App route to open when the notification is tapped (sent as data.screen), e.g. Horoscope, Wallet. */
  screen: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z
      .string()
      .trim()
      .max(50)
      .regex(/^[A-Za-z]+$/)
      .optional(),
  ),
  /** FCM data values must be strings; non-strings are JSON-stringified. */
  data: z
    .record(z.unknown())
    .optional()
    .transform((d) =>
      d
        ? Object.fromEntries(Object.entries(d).map(([k, val]) => [k, typeof val === 'string' ? val : JSON.stringify(val)]))
        : undefined,
    ),
});

/** POST /admin/users/broadcast-notification: same fields without userId. */
export const broadcastNotificationSchema = testNotificationSchema.omit({ userId: true });

export const testNotificationParams = z.object({ userId: objectId.optional() });

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type TestNotificationInput = z.infer<typeof testNotificationSchema>;
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
