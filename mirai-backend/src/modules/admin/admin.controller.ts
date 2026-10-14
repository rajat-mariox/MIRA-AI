import type { Request, Response } from 'express';
import { cache } from '../../lib/cache';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/response';
import * as dashboardService from './admin.dashboard.service';
import { toPublicAdmin } from './admin.model';
import * as adminService from './admin.service';
import * as usersService from './admin.users.service';
import type { AdminLoginInput, AdminResetPasswordInput } from './admin.validation';
import type {
  BroadcastNotificationInput,
  ListUsersQuery,
  TestNotificationInput,
  UpdateUserInput,
} from './admin.users.validation';

/* ----------------------------- auth ----------------------------- */

export async function login(req: Request, res: Response) {
  const { token, user } = await adminService.login(req.body as AdminLoginInput);
  // `token` is what the panel reads; `accessToken` / `admin` are aliases.
  return sendSuccess(res, 200, 'admin.loginSuccess', { token, accessToken: token, user, admin: user });
}

export async function forgotPassword(req: Request, res: Response) {
  await adminService.forgotPassword((req.body as { email: string }).email, req.lang);
  return sendSuccess(res, 200, 'admin.otpSent');
}

export async function verifyOtp(req: Request, res: Response) {
  const { email, otp } = req.body as { email: string; otp: string };
  await adminService.verifyOtp(email, otp);
  return sendSuccess(res, 200, 'admin.otpVerified', { verified: true });
}

export async function resetPassword(req: Request, res: Response) {
  await adminService.resetPassword(req.body as AdminResetPasswordInput);
  return sendSuccess(res, 200, 'admin.passwordReset');
}

export async function getProfile(req: Request, res: Response) {
  const admin = toPublicAdmin(adminService.getRequestAdmin(req));
  return sendSuccess(res, 200, 'admin.profileFetched', { admin, user: admin });
}

/* --------------------------- dashboard --------------------------- */

export async function getDashboardStats(_req: Request, res: Response) {
  const stats = await dashboardService.getStats();
  return sendSuccess(res, 200, 'admin.statsFetched', stats);
}

/* ----------------------------- cache ----------------------------- */

export async function flushCache(req: Request, res: Response) {
  const { pattern } = req.query as { pattern?: string };
  if (pattern && pattern !== '*') {
    const deleted = await cache.delPattern(pattern);
    return sendSuccess(res, 200, 'admin.cacheFlushedPattern', { pattern, deleted }, { pattern, count: deleted });
  }
  await cache.flushAll();
  return sendSuccess(res, 200, 'admin.cacheFlushed', { pattern: '*', deleted: null });
}

/* ----------------------------- users ----------------------------- */

export async function listUsers(req: Request, res: Response) {
  const result = await usersService.listUsers(req.query as unknown as ListUsersQuery);
  return sendSuccess(res, 200, 'admin.usersFetched', result);
}

export async function getUser(req: Request, res: Response) {
  const user = await usersService.getUser(String(req.params.userId));
  return sendSuccess(res, 200, 'admin.userFetched', { user });
}

export async function updateUser(req: Request, res: Response) {
  const user = await usersService.updateUser(String(req.params.userId), req.body as UpdateUserInput);
  return sendSuccess(res, 200, 'admin.userUpdated', { user });
}

export async function deleteUser(req: Request, res: Response) {
  const result = await usersService.deleteUser(String(req.params.userId));
  return sendSuccess(res, 200, 'admin.userDeleted', result);
}

export async function testNotification(req: Request, res: Response) {
  const body = req.body as TestNotificationInput;
  const userId = (req.params.userId as string | undefined) ?? body.userId;
  if (!userId) {
    throw ApiError.badRequest('common.validationFailed', undefined, [{ field: 'userId', message: 'userId is required' }]);
  }
  const result = await usersService.sendTestNotification(userId, body);
  return sendSuccess(res, 200, 'admin.notificationSent', result);
}

export async function broadcastNotification(req: Request, res: Response) {
  const result = await usersService.sendBroadcastNotification(req.body as BroadcastNotificationInput);
  return sendSuccess(res, 200, 'admin.broadcastSent', result);
}
