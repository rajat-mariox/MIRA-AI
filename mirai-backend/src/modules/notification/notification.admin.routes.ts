import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './notification.controller';
import { runJobSchema } from './notification.validation';

/** Mounted at /admin/notifications */
const router = Router();
router.use(requireAdmin);

// { job: daily|weekly|festival|muhurat, userId?, force?, date? } -> { sent, skipped, failed, users, details }
router.post('/run-job', validate({ body: runJobSchema }), asyncHandler(controller.runJob));

export default router;
