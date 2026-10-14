import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as faqService from './faq.service';
import type { CreateFaqInput, UpdateFaqInput } from './faq.validation';

/** GET /faq (public) -> `{ faqs }` (active, by order). */
export async function listPublic(_req: Request, res: Response) {
  const faqs = await faqService.listActive();
  return sendSuccess(res, 200, 'faq.listFetched', { faqs });
}

/** GET /admin/faq -> `data` is a bare array sorted by order (the admin panel reads `body.data`). */
export async function adminList(_req: Request, res: Response) {
  const faqs = await faqService.listAll();
  return sendSuccess(res, 200, 'faq.listFetched', faqs);
}

export async function adminGet(req: Request, res: Response) {
  const faq = await faqService.getById(String(req.params.id));
  return sendSuccess(res, 200, 'faq.fetched', faq);
}

export async function adminCreate(req: Request, res: Response) {
  const faq = await faqService.create(req.body as CreateFaqInput);
  return sendSuccess(res, 201, 'faq.created', faq);
}

export async function adminUpdate(req: Request, res: Response) {
  const faq = await faqService.update(String(req.params.id), req.body as UpdateFaqInput);
  return sendSuccess(res, 200, 'faq.updated', faq);
}

export async function adminDelete(req: Request, res: Response) {
  await faqService.remove(String(req.params.id));
  return sendSuccess(res, 200, 'faq.deleted');
}
