import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './feedback.controller';
import { adminListFeedbackQuery } from './feedback.validation';

/** Mounted at /admin/feedback */
const router = Router();

router.use(requireAdmin);

router.get('/', validate({ query: adminListFeedbackQuery }), asyncHandler(controller.adminList));

export default router;
