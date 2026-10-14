import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { runNotificationJob } from '../../jobs/notificationJobs';
import * as service from './notification.service';
import type { RunJobInput } from './notification.validation';

// All handlers run behind requireAuth, so req.user is always set.

export async function list(req: Request, res: Response) {
  const result = await service.listForUser(String(req.user!._id), req.user!.createdAt, req.query as Record<string, unknown>);
  return sendSuccess(res, 200, 'notification.listFetched', result);
}

export async function unreadCount(req: Request, res: Response) {
  const count = await service.unreadCountForUser(String(req.user!._id), req.user!.createdAt);
  return sendSuccess(res, 200, 'notification.unreadCountFetched', { unreadCount: count });
}

export async function markRead(req: Request, res: Response) {
  await service.markRead(String(req.user!._id), req.user!.createdAt, String(req.params.id));
  const count = await service.unreadCountForUser(String(req.user!._id), req.user!.createdAt);
  return sendSuccess(res, 200, 'notification.markedRead', { unreadCount: count });
}

export async function markAllRead(req: Request, res: Response) {
  const updated = await service.markAllRead(String(req.user!._id), req.user!.createdAt);
  return sendSuccess(res, 200, 'notification.allMarkedRead', { updated, unreadCount: 0 });
}

/** Admin: run a scheduled notification job now (POST /admin/notifications/run-job). */
export async function runJob(req: Request, res: Response) {
  const { job, userId, force, date } = req.body as RunJobInput;
  const result = await runNotificationJob(job, { userId, force, date });
  return sendSuccess(res, 200, 'notification.jobRun', result, { job, sent: result.sent });
}
