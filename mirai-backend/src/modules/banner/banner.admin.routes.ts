import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './banner.controller';
import { bannerIdParam, createBannerSchema, updateBannerSchema } from './banner.validation';

/** Mounted at /admin/banners. */
const router = Router();
router.use(requireAdmin);

router.get('/', asyncHandler(controller.adminList));
router.post('/', validate({ body: createBannerSchema }), asyncHandler(controller.adminCreate));
router.get('/:id', validate({ params: bannerIdParam }), asyncHandler(controller.adminGet));
router.put('/:id', validate({ params: bannerIdParam, body: updateBannerSchema }), asyncHandler(controller.adminUpdate));
router.patch('/:id', validate({ params: bannerIdParam, body: updateBannerSchema }), asyncHandler(controller.adminUpdate));
router.delete('/:id', validate({ params: bannerIdParam }), asyncHandler(controller.adminDelete));

export default router;
