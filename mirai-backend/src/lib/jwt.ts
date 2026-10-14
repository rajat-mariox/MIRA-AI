import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string; // userId
  sid: string; // sessionId
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string; // userId
  sid: string; // sessionId
  type: 'refresh';
  /** random nonce so every rotation yields a distinct token */
  jti: string;
}

export interface AdminTokenPayload {
  sub: string; // adminId
  role: 'admin';
  [key: string]: unknown;
}

type Expires = SignOptions['expiresIn'];

export function signAccessToken(payload: { sub: string; sid: string }): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as Expires,
  });
}

export function signRefreshToken(payload: { sub: string; sid: string; jti: string }): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as Expires,
  });
}

/** Signs an admin JWT. Payload must contain `sub` (admin id); `role:'admin'` is added automatically. */
export function signAdminToken(payload: { sub: string } & Record<string, unknown>): string {
  return jwt.sign({ ...payload, role: 'admin' }, env.JWT_ADMIN_SECRET, {
    expiresIn: env.JWT_ADMIN_EXPIRES as Expires,
  });
}

/** Throws jsonwebtoken errors (TokenExpiredError / JsonWebTokenError) — mapped to 401 by errorHandler. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const p = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (p.type !== 'access') throw new jwt.JsonWebTokenError('invalid token type');
  return p;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const p = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (p.type !== 'refresh') throw new jwt.JsonWebTokenError('invalid token type');
  return p;
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  const p = jwt.verify(token, env.JWT_ADMIN_SECRET) as AdminTokenPayload;
  if (p.role !== 'admin') throw new jwt.JsonWebTokenError('invalid token role');
  return p;
}

/** Decodes `exp` of a JWT into a Date (no verification). */
export function getTokenExpiry(token: string): Date | undefined {
  const d = jwt.decode(token) as { exp?: number } | null;
  return d?.exp ? new Date(d.exp * 1000) : undefined;
}
