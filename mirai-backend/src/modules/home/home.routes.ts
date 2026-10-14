import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './home.controller';

const router = Router();

router.get('/test', asyncHandler(controller.test));
router.get('/user/home', requireAuth, asyncHandler(controller.getHome));

export default router;
