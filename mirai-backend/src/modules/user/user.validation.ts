import { z } from 'zod';
import { idParam, isoDate, time24h } from '../../utils/validators';
import { GENDERS, MARITAL_STATUSES } from './user.model';

export const updateMeSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    gender: z.enum(GENDERS),
    dateOfBirth: isoDate,
    birthPlace: z.string().trim().min(2).max(200),
    birthTime: time24h,
    maritalStatus: z.enum(MARITAL_STATUSES),
    profileSetupStep: z.number().int().min(0).max(6),
    isProfileComplete: z.boolean(),
    lat: z.number().min(-90).max(90),
    long: z.number().min(-180).max(180),
    /** UTC offset in hours of the birth place (IST = 5.5), from the place suggestion */
    tzone: z.number().min(-12).max(14),
    /** Partial merge: only the sent keys change */
    notificationPrefs: z
      .object({ daily: z.boolean(), weekly: z.boolean(), festival: z.boolean(), muhurat: z.boolean() })
      .partial()
      .strict(),
  })
  .partial()
  .strict();

export type UpdateMeInput = z.infer<typeof updateMeSchema>;

/** PUT /users/me/fcm-token: null (or '') clears the token of the current session. */
export const fcmTokenSchema = z
  .object({
    fcmToken: z
      .string()
      .trim()
      .max(4096)
      .nullable()
      .transform((v) => (v ? v : null)),
  })
  .strict();

export type FcmTokenInput = z.infer<typeof fcmTokenSchema>;

export const sessionIdParamSchema = idParam('sessionId');
