import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './faq.controller';

/** Mounted at /faq (public). */
const router = Router();
router.get('/', asyncHandler(controller.listPublic));

export default router;
