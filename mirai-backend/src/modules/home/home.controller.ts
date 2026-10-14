import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as homeService from './home.service';

export async function test(_req: Request, res: Response) {
  return sendSuccess(res, 200, 'home.testOk', { ok: true });
}

export async function getHome(req: Request, res: Response) {
  const data = await homeService.getHome(req.user!, req.lang);
  return sendSuccess(res, 200, 'home.fetched', data);
}
