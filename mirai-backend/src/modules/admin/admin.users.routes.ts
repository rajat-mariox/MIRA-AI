import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './admin.controller';
import {
  broadcastNotificationSchema,
  listUsersQuery,
  testNotificationParams,
  testNotificationSchema,
  updateUserSchema,
  userIdParam,
} from './admin.users.validation';

/**
 * Mounted at /admin/users (and the panel's fallback paths /admin/user-management/users|user).
 */
const router = Router();
router.use(requireAdmin);

router.get('/', validate({ query: listUsersQuery }), asyncHandler(controller.listUsers));
router.post('/test-notification', validate({ body: testNotificationSchema }), asyncHandler(controller.testNotification));
router.post(
  '/broadcast-notification',
  validate({ body: broadcastNotificationSchema }),
  asyncHandler(controller.broadcastNotification),
);
router.get('/:userId', validate({ params: userIdParam }), asyncHandler(controller.getUser));
router.patch('/:userId', validate({ params: userIdParam, body: updateUserSchema }), asyncHandler(controller.updateUser));
router.put('/:userId', validate({ params: userIdParam, body: updateUserSchema }), asyncHandler(controller.updateUser));
router.delete('/:userId', validate({ params: userIdParam }), asyncHandler(controller.deleteUser));
router.post(
  '/:userId/test-notification',
  validate({ params: testNotificationParams, body: testNotificationSchema }),
  asyncHandler(controller.testNotification),
);

export default router;
