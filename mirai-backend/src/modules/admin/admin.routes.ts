import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin';
import { clientIp, createRateLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './admin.controller';
import {
  adminForgotPasswordSchema,
  adminLoginSchema,
  adminResetPasswordSchema,
  adminVerifyOtpSchema,
  cacheFlushQuery,
} from './admin.validation';

/**
 * Mounted at /admin. NOTE: this router is shared with other /admin/* routers, so it must NOT use
 * `router.use(requireAdmin)` globally (that would block /admin/<other> routes); guard per route.
 */
const router = Router();

const emailKey = (req: { body?: { email?: unknown } }) =>
  typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => `admin-login:${clientIp(req)}:${emailKey(req)}`,
});
const otpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  messageKey: 'admin.otpRateLimited',
  keyGenerator: (req) => `admin-otp:${clientIp(req)}:${emailKey(req)}`,
});
const resetLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 30 });

// Auth (public)
router.post('/login', loginLimiter, validate({ body: adminLoginSchema }), asyncHandler(controller.login));
router.post('/forgot-password', otpLimiter, validate({ body: adminForgotPasswordSchema }), asyncHandler(controller.forgotPassword));
router.post('/verify-otp', resetLimiter, validate({ body: adminVerifyOtpSchema }), asyncHandler(controller.verifyOtp));
router.post('/reset-password', resetLimiter, validate({ body: adminResetPasswordSchema }), asyncHandler(controller.resetPassword));

// Admin-only
router.get('/profile', requireAdmin, asyncHandler(controller.getProfile));
router.get('/dashboard/stats', requireAdmin, asyncHandler(controller.getDashboardStats));
router.delete('/cache/flush', requireAdmin, validate({ query: cacheFlushQuery }), asyncHandler(controller.flushCache));

export default router;
