import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Request } from 'express';
import { env } from '../../config/env';
import { translate, type Lang } from '../../lib/i18n';
import { signAdminToken } from '../../lib/jwt';
import { logger } from '../../lib/logger';
import { isMailerConfigured, sendMail } from '../../lib/mailer';
import { setAdminLoader } from '../../middleware/admin';
import { ApiError } from '../../utils/ApiError';
import { Admin, toPublicAdmin, type AdminDocument, type PublicAdmin } from './admin.model';
import type { AdminLoginInput, AdminResetPasswordInput } from './admin.validation';

const BCRYPT_ROUNDS = 10;
/** Admin reset OTPs are 6 digits (the panel's OTP input has 6 boxes). */
const ADMIN_OTP_LENGTH = 6;

/* ------------------------------------------------------------------ */
/* requireAdmin hook: admin must still exist, be active, and the token  */
/* must not predate the last password change.                           */
/* ------------------------------------------------------------------ */
const adminDocs = new WeakMap<Request, AdminDocument>();

export function registerAdminLoader(): void {
  setAdminLoader(async (payload, req) => {
    const admin = await Admin.findById(payload.sub);
    if (!admin || admin.isActive === false) throw ApiError.unauthorized('admin.notFound');
    const iat = typeof payload.iat === 'number' ? payload.iat : 0;
    if (admin.passwordChangedAt && iat < Math.floor(admin.passwordChangedAt.getTime() / 1000)) {
      throw ApiError.unauthorized('admin.sessionExpired');
    }
    adminDocs.set(req, admin);
  });
}

/** The Admin document loaded by requireAdmin for this request. */
export function getRequestAdmin(req: Request): AdminDocument {
  const admin = adminDocs.get(req);
  if (!admin) throw ApiError.unauthorized('admin.notFound');
  return admin;
}

/* ------------------------------------------------------------------ */
/* Seed                                                                 */
/* ------------------------------------------------------------------ */
export async function seedAdmin(): Promise<void> {
  const count = await Admin.estimatedDocumentCount();
  if (count > 0) return;
  if (!env.ADMIN_SEED_EMAIL || !env.ADMIN_SEED_PASSWORD) {
    logger.warn('[admin] No admin exists and ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD are not set; skipping seed');
    return;
  }
  await Admin.create({
    name: 'Super Admin',
    email: env.ADMIN_SEED_EMAIL.toLowerCase(),
    passwordHash: await bcrypt.hash(env.ADMIN_SEED_PASSWORD, BCRYPT_ROUNDS),
    role: 'superadmin',
    isActive: true,
  });
  logger.info(`[admin] Seeded super admin ${env.ADMIN_SEED_EMAIL}`);
}

/* ------------------------------------------------------------------ */
/* Login                                                                */
/* ------------------------------------------------------------------ */
// Bad credentials are 400 (not 401): the panel treats any 401 as "session expired" and reloads.
export async function login(input: AdminLoginInput): Promise<{ token: string; user: PublicAdmin }> {
  const admin = await Admin.findOne({ email: input.email });
  const ok = admin ? await bcrypt.compare(input.password, admin.passwordHash) : false;
  if (!admin || !ok) throw ApiError.badRequest('admin.invalidCredentials');
  if (admin.isActive === false) throw ApiError.forbidden('admin.deactivated');

  admin.lastLoginAt = new Date();
  await admin.save();
  const token = signAdminToken({ sub: String(admin._id), adminRole: admin.role });
  return { token, user: toPublicAdmin(admin) };
}

/* ------------------------------------------------------------------ */
/* Password reset via email OTP                                         */
/* ------------------------------------------------------------------ */
function hashOtp(email: string, otp: string): string {
  return createHash('sha256').update(`admin:${email}:${otp}`).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Always resolves (even for unknown emails) so the endpoint cannot be used to enumerate admins. */
export async function forgotPassword(email: string, lang: Lang): Promise<void> {
  const admin = await Admin.findOne({ email });
  if (!admin || admin.isActive === false) {
    logger.info({ email }, '[admin] forgot-password for unknown/inactive admin (ignored)');
    return;
  }
  const otp = Array.from({ length: ADMIN_OTP_LENGTH }, () => randomInt(0, 10)).join('');
  admin.resetOtpHash = hashOtp(email, otp);
  admin.resetOtpExpiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);
  admin.resetOtpAttempts = 0;
  await admin.save();

  const params = { otp, minutes: env.OTP_EXPIRY_MINUTES, name: admin.name };
  const subject = translate(lang, 'email.adminReset.subject', params);
  const text = translate(lang, 'email.adminReset.text', params);
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222">
  <p>${translate(lang, 'email.adminReset.intro', params)}</p>
  <p style="font-size:28px;font-weight:bold;letter-spacing:8px;margin:16px 0">${otp}</p>
  <p>${translate(lang, 'email.otp.expiry', params)}</p>
  <p style="color:#888;font-size:12px">${translate(lang, 'email.adminReset.ignore')}</p>
</div>`;

  if (!isMailerConfigured()) {
    logger.info(`[admin] Password reset OTP for ${email}: ${otp} (expires in ${env.OTP_EXPIRY_MINUTES} min)`);
  }
  try {
    await sendMail({ to: email, subject, text, html });
  } catch (err) {
    logger.error({ err, email }, 'Failed to send admin reset OTP email');
    if (env.isProd) throw ApiError.internal('admin.otpSendFailed');
    // Dev/test: don't block the flow on a broken SMTP config; the OTP is in the log.
    logger.warn(`[admin] Password reset OTP for ${email}: ${otp} (email failed; dev fallback)`);
  }
}

/** Validates the reset OTP (400 on any failure, never 401). `consume` clears it (reset-password). */
async function checkResetOtp(email: string, otp: string, consume: boolean): Promise<AdminDocument> {
  const admin = await Admin.findOne({ email });
  if (!admin || admin.isActive === false) throw ApiError.badRequest('admin.otpInvalidOrExpired');

  const isDevOtp = Boolean(env.devFixedOtp && otp === env.devFixedOtp);
  if (!isDevOtp) {
    if (!admin.resetOtpHash || !admin.resetOtpExpiresAt || admin.resetOtpExpiresAt.getTime() <= Date.now()) {
      throw ApiError.badRequest('admin.otpInvalidOrExpired');
    }
    if ((admin.resetOtpAttempts ?? 0) >= env.OTP_MAX_ATTEMPTS) {
      admin.resetOtpHash = undefined;
      admin.resetOtpExpiresAt = undefined;
      await admin.save();
      throw ApiError.badRequest('admin.otpMaxAttempts');
    }
    if (!safeEqualHex(admin.resetOtpHash, hashOtp(email, otp))) {
      admin.resetOtpAttempts = (admin.resetOtpAttempts ?? 0) + 1;
      await admin.save();
      throw ApiError.badRequest('admin.otpInvalid', {
        remaining: Math.max(env.OTP_MAX_ATTEMPTS - admin.resetOtpAttempts, 0),
      });
    }
  }
  if (consume) {
    admin.resetOtpHash = undefined;
    admin.resetOtpExpiresAt = undefined;
    admin.resetOtpAttempts = 0;
  }
  return admin;
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
  await checkResetOtp(email, otp, false);
}

export async function resetPassword(input: AdminResetPasswordInput): Promise<void> {
  const admin = await checkResetOtp(input.email, input.otp, true);
  admin.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  // Tokens issued before this second are rejected by the admin loader.
  admin.passwordChangedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
  await admin.save();
}
