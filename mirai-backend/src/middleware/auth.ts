import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { logger } from '../lib/logger';
import { Session } from '../modules/auth/auth.model';
import { User } from '../modules/user/user.model';
import { ApiError } from '../utils/ApiError';

/** lastActiveAt on the session is refreshed at most once per this interval. */
const LAST_ACTIVE_THROTTLE_MS = 60_000;

export function extractBearerToken(req: Request): string | null {
  const header = req.header('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

async function authenticate(req: Request, token: string): Promise<void> {
  // Throws TokenExpiredError / JsonWebTokenError -> mapped to 401 by errorHandler
  const payload = verifyAccessToken(token);

  // Both lookups at once: one database round trip instead of two on every request
  const [session, user] = await Promise.all([
    Session.findOne({ _id: payload.sid, userId: payload.sub }).select('_id lastActiveAt').lean(),
    User.findById(payload.sub),
  ]);
  if (!session) throw ApiError.unauthorized('auth.sessionExpired');
  if (!user) throw ApiError.unauthorized('auth.userNotFound');
  if (user.isActive === false) throw ApiError.forbidden('auth.accountDeactivated');

  req.user = user;
  req.sessionId = String(session._id);

  const last = session.lastActiveAt ? new Date(session.lastActiveAt).getTime() : 0;
  if (Date.now() - last > LAST_ACTIVE_THROTTLE_MS) {
    Session.updateOne({ _id: session._id }, { $set: { lastActiveAt: new Date() } })
      .exec()
      .catch((err: unknown) => logger.warn({ err }, 'Failed to update session lastActiveAt'));
  }
}

/**
 * Requires a valid user access token: `Authorization: Bearer <accessToken>`.
 * Verifies the JWT, checks the device session still exists (so logout revokes tokens)
 * and the user is active. Sets `req.user` (Mongoose doc) and `req.sessionId`.
 * 401 = missing/invalid/expired token or revoked session; 403 = account deactivated.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) return next(ApiError.unauthorized('auth.tokenMissing'));
  try {
    await authenticate(req, token);
    next();
  } catch (err) {
    next(err);
  }
}

/** Like requireAuth, but anonymous requests pass through (req.user stays undefined). Invalid tokens still 401. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) return next();
  try {
    await authenticate(req, token);
    next();
  } catch (err) {
    next(err);
  }
}
