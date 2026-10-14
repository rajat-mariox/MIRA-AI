import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './faq.controller';
import { createFaqSchema, faqIdParam, updateFaqSchema } from './faq.validation';

/** Mounted at /admin/faq. */
const router = Router();
router.use(requireAdmin);

router.get('/', asyncHandler(controller.adminList));
router.post('/', validate({ body: createFaqSchema }), asyncHandler(controller.adminCreate));
router.get('/:id', validate({ params: faqIdParam }), asyncHandler(controller.adminGet));
router.put('/:id', validate({ params: faqIdParam, body: updateFaqSchema }), asyncHandler(controller.adminUpdate));
router.patch('/:id', validate({ params: faqIdParam, body: updateFaqSchema }), asyncHandler(controller.adminUpdate));
router.delete('/:id', validate({ params: faqIdParam }), asyncHandler(controller.adminDelete));

export default router;
