import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import type { CmsType } from './cms.model';
import * as cmsService from './cms.service';
import type { UpdateCmsInput, UpsertCmsInput } from './cms.validation';

/** GET /cms?type=terms|privacy|about (public, active page only) -> `{ cms }`. */
export async function getPublic(req: Request, res: Response) {
  const cms = await cmsService.getPublicPage((req.query as { type: CmsType }).type);
  return sendSuccess(res, 200, 'cms.fetched', { cms });
}

/** GET /admin/cms -> `data` is a bare array (the admin panel reads `body.data` directly). */
export async function adminList(_req: Request, res: Response) {
  const items = await cmsService.listAll();
  return sendSuccess(res, 200, 'cms.listFetched', items);
}

export async function adminGet(req: Request, res: Response) {
  const doc = await cmsService.getById(String(req.params.id));
  return sendSuccess(res, 200, 'cms.fetched', doc);
}

export async function adminUpsert(req: Request, res: Response) {
  const { doc, created } = await cmsService.upsert(req.body as UpsertCmsInput);
  return sendSuccess(res, created ? 201 : 200, created ? 'cms.created' : 'cms.updated', doc);
}

export async function adminUpdate(req: Request, res: Response) {
  const doc = await cmsService.update(String(req.params.id), req.body as UpdateCmsInput);
  return sendSuccess(res, 200, 'cms.updated', doc);
}

export async function adminDelete(req: Request, res: Response) {
  await cmsService.remove(String(req.params.id));
  return sendSuccess(res, 200, 'cms.deleted');
}
