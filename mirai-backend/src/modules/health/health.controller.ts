import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { getHealth } from './health.service';

export function health(_req: Request, res: Response) {
  return sendSuccess(res, 200, 'health.ok', getHealth());
}
