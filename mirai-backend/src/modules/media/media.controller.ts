import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { storeImage } from './media.storage';

async function storeAll(req: Request, folder: string) {
  const files = (req.files as Express.Multer.File[]) ?? [];
  return Promise.all(files.map((f) => storeImage(f, folder)));
}

/** POST /media/upload (user or admin) -> `{ urls, paths, files }`. */
export async function upload(req: Request, res: Response) {
  const folder = req.admin ? 'admin' : `users/${String(req.user?._id ?? 'anonymous')}`;
  const files = await storeAll(req, folder);
  return sendSuccess(res, 201, 'media.uploaded', { urls: files.map((f) => f.url), paths: files.map((f) => f.path), files }, { count: files.length });
}

/** POST /media/public-upload (no auth, strict rate limit) -> `{ urls, paths, files }`. */
export async function publicUpload(req: Request, res: Response) {
  const files = await storeAll(req, 'public');
  return sendSuccess(res, 201, 'media.uploaded', { urls: files.map((f) => f.url), paths: files.map((f) => f.path), files }, { count: files.length });
}
