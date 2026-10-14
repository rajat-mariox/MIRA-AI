import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './notification.controller';
import { listNotificationsQuery, notificationIdParam } from './notification.validation';

/** Mounted at /notifications (the signed-in user's in-app inbox) */
const router = Router();
router.use(requireAuth);

router.get('/', validate({ query: listNotificationsQuery }), asyncHandler(controller.list));
router.get('/unread-count', asyncHandler(controller.unreadCount));
router.patch('/read-all', asyncHandler(controller.markAllRead));
router.patch('/:id/read', validate({ params: notificationIdParam }), asyncHandler(controller.markRead));

export default router;
