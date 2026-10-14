import { Router } from 'express';
import { createRateLimiter } from '../../middleware/rateLimit';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './media.controller';
import { parseImages, requireUserOrAdmin } from './media.upload';

/**
 * Mounted at /media. multipart/form-data, field `images` (1-5 files, 5MB each, jpeg/png/webp/gif/heic).
 * Files go to S3 when AWS_S3_BUCKET + AWS_REGION are set, else to ./uploads (served at /uploads).
 */
const router = Router();

const uploadLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 60 });
const publicUploadLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 10 });

router.post('/upload', uploadLimiter, requireUserOrAdmin, parseImages, asyncHandler(controller.upload));
router.post('/public-upload', publicUploadLimiter, parseImages, asyncHandler(controller.publicUpload));

export default router;
