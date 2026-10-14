import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './lead.controller';
import { adminListLeadsQuery, adminUpdateLeadSchema, leadIdParam } from './lead.validation';

/** Mounted at /admin/leads */
const router = Router();

router.use(requireAdmin);

router.get('/', validate({ query: adminListLeadsQuery }), asyncHandler(controller.adminList));
router.get('/:id', validate({ params: leadIdParam }), asyncHandler(controller.adminGet));
router.patch('/:id', validate({ params: leadIdParam, body: adminUpdateLeadSchema }), asyncHandler(controller.adminUpdate));
// PUT alias with the same semantics
router.put('/:id', validate({ params: leadIdParam, body: adminUpdateLeadSchema }), asyncHandler(controller.adminUpdate));
router.delete('/:id', validate({ params: leadIdParam }), asyncHandler(controller.adminDelete));

export default router;
