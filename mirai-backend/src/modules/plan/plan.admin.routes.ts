import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './plan.controller';
import { createPlanSchema, listPlansAdminQuery, planIdParam, updatePlanSchema } from './plan.validation';

/** Mounted at /admin/plans */
const router = Router();

router.use(requireAdmin);

router.get('/', validate({ query: listPlansAdminQuery }), asyncHandler(controller.adminList));
router.post('/', validate({ body: createPlanSchema }), asyncHandler(controller.adminCreate));
router.get('/:id', validate({ params: planIdParam }), asyncHandler(controller.adminGet));
router.patch('/:id', validate({ params: planIdParam, body: updatePlanSchema }), asyncHandler(controller.adminUpdate));
// PUT alias with the same partial-update semantics
router.put('/:id', validate({ params: planIdParam, body: updatePlanSchema }), asyncHandler(controller.adminUpdate));
router.delete('/:id', validate({ params: planIdParam }), asyncHandler(controller.adminDelete));

export default router;
