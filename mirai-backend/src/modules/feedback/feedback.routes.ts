import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './feedback.controller';
import { createFeedbackSchema } from './feedback.validation';

/** Mounted at /feedback */
const router = Router();

router.post('/', requireAuth, validate({ body: createFeedbackSchema }), asyncHandler(controller.create));

export default router;
