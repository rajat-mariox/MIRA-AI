import { z } from 'zod';
import { email } from '../../utils/validators';
import { DEVICE_TYPES } from './auth.model';

export const sendOtpSchema = z.object({
  email,
});

export const deviceInfoSchema = z.object({
  deviceId: z.string().trim().min(1).max(200),
  deviceType: z.enum(DEVICE_TYPES),
  deviceName: z.string().trim().max(200).optional(),
  fcmToken: z.string().trim().max(4096).optional(),
});

export const verifyOtpSchema = z.object({
  email,
  otp: z.string().trim().regex(/^\d{4,6}$/, 'OTP must be 4-6 digits'),
  hasAcceptedTerms: z.boolean().optional(),
  deviceInfo: deviceInfoSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(10),
});

export const logoutSchema = z.object({
  /** Optional: defaults to the device of the access token used for this request. */
  deviceId: z.string().trim().min(1).max(200).optional(),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type DeviceInfo = z.infer<typeof deviceInfoSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
