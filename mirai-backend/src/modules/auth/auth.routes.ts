import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { authLimiter, otpSendLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './auth.controller';
import { logoutSchema, refreshTokenSchema, sendOtpSchema, verifyOtpSchema } from './auth.validation';

const router = Router();

router.post('/send-otp', otpSendLimiter, validate({ body: sendOtpSchema }), asyncHandler(controller.sendOtp));
router.post('/verify-otp', authLimiter, validate({ body: verifyOtpSchema }), asyncHandler(controller.verifyOtp));
router.post('/refresh-token', authLimiter, validate({ body: refreshTokenSchema }), asyncHandler(controller.refreshToken));
router.post('/logout', requireAuth, validate({ body: logoutSchema }), asyncHandler(controller.logout));
router.post('/logout-all', requireAuth, asyncHandler(controller.logoutAll));

export default router;
