import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './plan.controller';
import { planIdParam } from './plan.validation';

/** Mounted at /plans */
const router = Router();

router.get('/', requireAuth, asyncHandler(controller.listActive));
/** Buy a plan from the wallet -> { subscription, balance, quota } (402 plan.insufficientBalance) */
router.post('/:id/purchase', requireAuth, validate({ params: planIdParam }), asyncHandler(controller.purchase));

export default router;
