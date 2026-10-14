import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './banner.controller';

/** Mounted at /banners (public). */
const router = Router();
router.get('/', asyncHandler(controller.listPublic));

export default router;
