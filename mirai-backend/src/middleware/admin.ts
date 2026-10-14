import type { NextFunction, Request, Response } from 'express';
import { verifyAdminToken } from '../lib/jwt';
import { ApiError } from '../utils/ApiError';
import { extractBearerToken } from './auth';

/**
 * Hook for admin-side checks (e.g. "admin still exists and is active"). The admin module
 * can register one at startup:
 *
 *   import { setAdminLoader } from '../../middleware/admin';
 *   setAdminLoader(async (payload, req) => {
 *     const admin = await Admin.findById(payload.sub);
 *     if (!admin || !admin.isActive) throw ApiError.unauthorized('admin.notFound');
 *     (req as any).adminDoc = admin;
 *   });
 */
type AdminLoader = (payload: NonNullable<Request['admin']>, req: Request) => Promise<void>;
let adminLoader: AdminLoader | null = null;

export function setAdminLoader(loader: AdminLoader): void {
  adminLoader = loader;
}

/**
 * Requires an admin JWT signed with JWT_ADMIN_SECRET and carrying `role: 'admin'`
 * (see `signAdminToken` in lib/jwt.ts). Sets `req.admin` = token payload.
 */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) return next(ApiError.unauthorized('auth.tokenMissing'));
  try {
    const payload = verifyAdminToken(token);
    req.admin = payload;
    if (adminLoader) await adminLoader(payload, req);
    next();
  } catch (err) {
    next(err);
  }
}
