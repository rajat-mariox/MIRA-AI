import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { Types } from 'mongoose';
import { env } from '../../config/env';
import { translate, type Lang } from '../../lib/i18n';
import { getTokenExpiry, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { logger } from '../../lib/logger';
import { isMailerConfigured, sendMail } from '../../lib/mailer';
import { ApiError } from '../../utils/ApiError';
import { toPublicUser, User, type PublicUser, type UserDocument } from '../user/user.model';
import { Otp, Session } from './auth.model';
import type { DeviceInfo, VerifyOtpInput } from './auth.validation';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ClientMeta {
  ip?: string;
  userAgent?: string;
  lang: Lang;
}

const sha256 = (v: string): string => createHash('sha256').update(v).digest('hex');

/** OTP hash is bound to the email and peppered with a server secret. */
const hashOtp = (email: string, otp: string): string => sha256(`${email}:${otp}:${env.JWT_REFRESH_SECRET}`);

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function generateOtp(length: number): string {
  return Array.from({ length }, () => randomInt(0, 10)).join('');
}

/* ------------------------------------------------------------------ */
/* Send OTP                                                            */
/* ------------------------------------------------------------------ */
export async function sendOtp(email: string, meta: ClientMeta): Promise<{ isNewUser: boolean }> {
  const existing = await User.findOne({ email }).select('_id isActive').lean();
  if (existing && existing.isActive === false) throw ApiError.forbidden('auth.accountDeactivated');

  const otp = generateOtp(env.OTP_LENGTH);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.findOneAndUpdate(
    { email },
    { $set: { codeHash: hashOtp(email, otp), attempts: 0, expiresAt } },
    { upsert: true, setDefaultsOnInsert: true },
  );

  const params = { otp, minutes: env.OTP_EXPIRY_MINUTES };
  const subject = translate(meta.lang, 'email.otp.subject', params);
  const text = translate(meta.lang, 'email.otp.text', params);
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222">
  <p>${translate(meta.lang, 'email.otp.intro')}</p>
  <p style="font-size:28px;font-weight:bold;letter-spacing:8px;margin:16px 0">${otp}</p>
  <p>${translate(meta.lang, 'email.otp.expiry', params)}</p>
  <p style="color:#888;font-size:12px">${translate(meta.lang, 'email.otp.ignore')}</p>
</div>`;

  if (!isMailerConfigured()) {
    logger.info(`[auth] OTP for ${email}: ${otp} (expires in ${env.OTP_EXPIRY_MINUTES} min)`);
  }
  try {
    await sendMail({ to: email, subject, text, html });
  } catch (err) {
    logger.error({ err, email }, 'Failed to send OTP email');
    throw ApiError.internal('auth.otpSendFailed');
  }

  return { isNewUser: !existing };
}

/* ------------------------------------------------------------------ */
/* Verify OTP                                                          */
/* ------------------------------------------------------------------ */
async function checkOtp(email: string, otp: string): Promise<void> {
  if (env.devFixedOtp && otp === env.devFixedOtp) {
    await Otp.deleteOne({ email });
    return;
  }

  const record = await Otp.findOne({ email });
  if (!record || record.expiresAt.getTime() <= Date.now()) {
    if (record) await record.deleteOne();
    throw ApiError.badRequest('auth.otpExpired');
  }
  if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
    await record.deleteOne();
    throw ApiError.tooMany('auth.otpMaxAttempts');
  }
  if (!safeEqualHex(record.codeHash, hashOtp(email, otp))) {
    record.attempts += 1;
    const remaining = env.OTP_MAX_ATTEMPTS - record.attempts;
    if (remaining <= 0) {
      await record.deleteOne();
      throw ApiError.tooMany('auth.otpMaxAttempts');
    }
    await record.save();
    throw ApiError.badRequest('auth.otpInvalid', { remaining });
  }
  await record.deleteOne();
}

async function findOrCreateUser(
  email: string,
  hasAcceptedTerms: boolean | undefined,
): Promise<{ user: UserDocument; isNewUser: boolean }> {
  let user = await User.findOne({ email });
  if (user) {
    if (hasAcceptedTerms === true && !user.hasAcceptedTerms) {
      user.hasAcceptedTerms = true;
      user.termsAcceptedAt = new Date();
    }
    return { user, isNewUser: false };
  }
  try {
    user = await User.create({
      email,
      hasAcceptedTerms: hasAcceptedTerms === true,
      termsAcceptedAt: hasAcceptedTerms === true ? new Date() : undefined,
    });
    return { user, isNewUser: true };
  } catch (err) {
    // Concurrent verify for the same email: the other request created it.
    if ((err as { code?: number }).code === 11000) {
      const again = await User.findOne({ email });
      if (again) return { user: again, isNewUser: false };
    }
    throw err;
  }
}

/** Creates or refreshes the (user, device) session and returns a fresh token pair. */
async function upsertSession(userId: Types.ObjectId, device: DeviceInfo, meta: ClientMeta): Promise<AuthTokens> {
  const existing = await Session.findOne({ userId, deviceId: device.deviceId }).select('_id').lean();
  const sessionId = existing?._id ?? new Types.ObjectId();
  const sid = String(sessionId);
  const sub = String(userId);

  const accessToken = signAccessToken({ sub, sid });
  const refreshToken = signRefreshToken({ sub, sid, jti: randomBytes(16).toString('hex') });
  const expiresAt = getTokenExpiry(refreshToken) ?? new Date(Date.now() + 30 * 24 * 3600 * 1000);

  await Session.updateOne(
    { _id: sessionId },
    {
      $set: {
        userId,
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        deviceName: device.deviceName,
        ...(device.fcmToken ? { fcmToken: device.fcmToken } : {}),
        refreshTokenHash: sha256(refreshToken),
        ip: meta.ip,
        userAgent: meta.userAgent,
        lastActiveAt: new Date(),
        expiresAt,
      },
    },
    { upsert: true },
  );

  // An FCM token belongs to one physical device: detach it from any other user's session.
  if (device.fcmToken) {
    await Session.updateMany(
      { fcmToken: device.fcmToken, _id: { $ne: sessionId } },
      { $unset: { fcmToken: 1 } },
    );
  }

  return { accessToken, refreshToken };
}

export async function verifyOtp(
  input: VerifyOtpInput,
  meta: ClientMeta,
): Promise<AuthTokens & { isNewUser: boolean; user: PublicUser }> {
  await checkOtp(input.email, input.otp);

  const { user, isNewUser } = await findOrCreateUser(input.email, input.hasAcceptedTerms);
  if (user.isActive === false) throw ApiError.forbidden('auth.accountDeactivated');

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await upsertSession(user._id, input.deviceInfo, meta);
  return { ...tokens, isNewUser, user: toPublicUser(user) };
}

/* ------------------------------------------------------------------ */
/* Refresh (rotation)                                                  */
/* ------------------------------------------------------------------ */
export async function refreshTokens(refreshToken: string, meta: ClientMeta): Promise<AuthTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('auth.invalidRefreshToken');
  }

  const session = await Session.findOne({ _id: payload.sid, userId: payload.sub });
  if (!session) throw ApiError.unauthorized('auth.sessionExpired');

  if (!safeEqualHex(session.refreshTokenHash, sha256(refreshToken))) {
    // Old (already rotated) refresh token re-used: possible theft -> revoke this session.
    await session.deleteOne();
    logger.warn({ sessionId: String(session._id) }, 'Refresh token reuse detected; session revoked');
    throw ApiError.unauthorized('auth.invalidRefreshToken');
  }

  const user = await User.findById(payload.sub).select('_id isActive').lean();
  if (!user) throw ApiError.unauthorized('auth.userNotFound');
  if (user.isActive === false) throw ApiError.forbidden('auth.accountDeactivated');

  const sub = String(user._id);
  const sid = String(session._id);
  const accessToken = signAccessToken({ sub, sid });
  const newRefresh = signRefreshToken({ sub, sid, jti: randomBytes(16).toString('hex') });

  session.refreshTokenHash = sha256(newRefresh);
  session.expiresAt = getTokenExpiry(newRefresh) ?? session.expiresAt;
  session.lastActiveAt = new Date();
  if (meta.ip) session.ip = meta.ip;
  if (meta.userAgent) session.userAgent = meta.userAgent;
  await session.save();

  return { accessToken, refreshToken: newRefresh };
}

/* ------------------------------------------------------------------ */
/* Logout                                                              */
/* ------------------------------------------------------------------ */
export async function logout(userId: string, deviceId: string | undefined, currentSessionId?: string): Promise<void> {
  if (deviceId) {
    await Session.deleteOne({ userId, deviceId });
  } else if (currentSessionId) {
    await Session.deleteOne({ _id: currentSessionId, userId });
  }
}

export async function logoutAll(userId: string): Promise<number> {
  const res = await Session.deleteMany({ userId });
  return res.deletedCount ?? 0;
}
