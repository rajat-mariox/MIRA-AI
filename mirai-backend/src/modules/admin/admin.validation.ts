import { z } from 'zod';
import { email } from '../../utils/validators';

export const adminLoginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(200),
});

export const adminForgotPasswordSchema = z.object({ email });

const otp = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^\d{4,8}$/.test(v), { message: 'OTP must be numeric' });

export const adminVerifyOtpSchema = z.object({ email, otp });

/** Accepts the panel's `password` and Postman's `newPassword`. */
export const adminResetPasswordSchema = z
  .object({
    email,
    otp,
    password: z.string().min(6, 'Password must be at least 6 characters').max(200).optional(),
    newPassword: z.string().min(6, 'Password must be at least 6 characters').max(200).optional(),
  })
  .refine((v) => Boolean(v.password ?? v.newPassword), { message: 'Password is required', path: ['password'] })
  .transform((v) => ({ email: v.email, otp: v.otp, password: (v.password ?? v.newPassword) as string }));

export const cacheFlushQuery = z.object({
  pattern: z.string().trim().min(1).max(200).optional(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
