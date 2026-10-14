import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as feedbackService from './feedback.service';
import type { AdminListFeedbackQuery, CreateFeedbackInput } from './feedback.validation';

export async function create(req: Request, res: Response) {
  const data = await feedbackService.createFeedback(String(req.user!._id), req.body as CreateFeedbackInput);
  return sendSuccess(res, 201, 'feedback.submitted', data);
}

export async function adminList(req: Request, res: Response) {
  const data = await feedbackService.adminListFeedback(req.query as unknown as AdminListFeedbackQuery);
  return sendSuccess(res, 200, 'feedback.listFetched', data);
}
