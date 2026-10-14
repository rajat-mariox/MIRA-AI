import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './cms.controller';
import { cmsIdParam, updateCmsSchema, upsertCmsSchema } from './cms.validation';

/** Mounted at /admin/cms. */
const router = Router();
router.use(requireAdmin);

router.get('/', asyncHandler(controller.adminList));
router.post('/', validate({ body: upsertCmsSchema }), asyncHandler(controller.adminUpsert));
router.get('/:id', validate({ params: cmsIdParam }), asyncHandler(controller.adminGet));
router.put('/:id', validate({ params: cmsIdParam, body: updateCmsSchema }), asyncHandler(controller.adminUpdate));
router.patch('/:id', validate({ params: cmsIdParam, body: updateCmsSchema }), asyncHandler(controller.adminUpdate));
router.delete('/:id', validate({ params: cmsIdParam }), asyncHandler(controller.adminDelete));

export default router;
