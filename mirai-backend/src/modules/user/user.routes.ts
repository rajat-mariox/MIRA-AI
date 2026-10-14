import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './user.controller';
import { fcmTokenSchema, sessionIdParamSchema, updateMeSchema } from './user.validation';

const router = Router();

router.use(requireAuth);

router.get('/me', asyncHandler(controller.getMe));
router.put('/me', validate({ body: updateMeSchema }), asyncHandler(controller.updateMe));
router.delete('/me', asyncHandler(controller.deleteMe));
router.put('/me/fcm-token', validate({ body: fcmTokenSchema }), asyncHandler(controller.setFcmToken));
router.get('/me/devices', asyncHandler(controller.getDevices));
router.delete('/me/devices/:sessionId', validate({ params: sessionIdParamSchema }), asyncHandler(controller.removeDevice));

export default router;
