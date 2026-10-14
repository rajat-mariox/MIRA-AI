import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './cms.controller';
import { publicCmsQuery } from './cms.validation';

/** Mounted at /cms (public). */
const router = Router();
router.get('/', validate({ query: publicCmsQuery }), asyncHandler(controller.getPublic));

export default router;
