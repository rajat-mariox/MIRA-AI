import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { verifyAdminToken } from '../../lib/jwt';
import { requireAdmin } from '../../middleware/admin';
import { extractBearerToken, requireAuth } from '../../middleware/auth';
import { ApiError } from '../../utils/ApiError';
import { IMAGE_EXT } from './media.storage';

export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const FIELD_NAME = 'images';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES, fields: 10 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_EXT[file.mimetype]) cb(null, true);
    else cb(new ApiError(400, 'media.invalidType', { params: { name: file.originalname } }));
  },
}).array(FIELD_NAME, MAX_FILES);

/** Checks the file's magic bytes match its declared image type (blocks e.g. HTML renamed to .png). */
function looksLikeImage(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  switch (mime) {
    case 'image/jpeg':
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case 'image/png':
      return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/gif':
      return buf.subarray(0, 4).toString('ascii') === 'GIF8';
    case 'image/webp':
      return buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
    case 'image/heic':
    case 'image/heif':
      return buf.subarray(4, 8).toString('ascii') === 'ftyp';
    default:
      return false;
  }
}

/** multer `images[]` (max 5 x 5MB, images only) with errors mapped to the standard 400 envelope. */
export function parseImages(req: Request, res: Response, next: NextFunction): void {
  upload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(new ApiError(400, 'media.fileTooLarge', { params: { mb: MAX_FILE_SIZE / 1024 / 1024 } }));
      if (err.code === 'LIMIT_UNEXPECTED_FILE' && err.field !== FIELD_NAME) {
        return next(new ApiError(400, 'media.unexpectedField', { params: { got: err.field ?? '', field: FIELD_NAME } }));
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new ApiError(400, 'media.tooManyFiles', { params: { max: MAX_FILES, field: FIELD_NAME } }));
      }
      return next(ApiError.badRequest('media.uploadFailed'));
    }
    if (err) return next(err);

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) return next(new ApiError(400, 'media.noFiles', { params: { field: FIELD_NAME } }));
    const bad = files.find((f) => !looksLikeImage(f.buffer, f.mimetype));
    if (bad) return next(new ApiError(400, 'media.invalidType', { params: { name: bad.originalname } }));
    next();
  });
}

/** Accepts EITHER an admin token (JWT_ADMIN_SECRET) or an app user access token. */
export function requireUserOrAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) return next(ApiError.unauthorized('auth.tokenMissing'));
  let isAdmin = false;
  try {
    verifyAdminToken(token);
    isAdmin = true;
  } catch {
    isAdmin = false;
  }
  if (isAdmin) void requireAdmin(req, res, next);
  else void requireAuth(req, res, next);
}
