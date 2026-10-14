import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as bannerService from './banner.service';
import type { CreateBannerInput, UpdateBannerInput } from './banner.validation';

/** GET /banners (public) -> `{ banners }` (active, by order). */
export async function listPublic(_req: Request, res: Response) {
  const banners = await bannerService.listActive();
  return sendSuccess(res, 200, 'banner.listFetched', { banners });
}

/** GET /admin/banners -> `{ banners, total }` (the panel reads `data.banners`). */
export async function adminList(_req: Request, res: Response) {
  const banners = await bannerService.listAll();
  return sendSuccess(res, 200, 'banner.listFetched', { banners, total: banners.length });
}

export async function adminGet(req: Request, res: Response) {
  const banner = await bannerService.getById(String(req.params.id));
  return sendSuccess(res, 200, 'banner.fetched', { banner });
}

export async function adminCreate(req: Request, res: Response) {
  const banner = await bannerService.create(req.body as CreateBannerInput);
  return sendSuccess(res, 201, 'banner.created', { banner });
}

export async function adminUpdate(req: Request, res: Response) {
  const banner = await bannerService.update(String(req.params.id), req.body as UpdateBannerInput);
  return sendSuccess(res, 200, 'banner.updated', { banner });
}

export async function adminDelete(req: Request, res: Response) {
  await bannerService.remove(String(req.params.id));
  return sendSuccess(res, 200, 'banner.deleted');
}
