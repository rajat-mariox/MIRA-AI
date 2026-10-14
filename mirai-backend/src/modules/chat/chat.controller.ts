import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as chatService from './chat.service';
import type { CreateSessionInput, ListMessagesQuery, ListSessionsQuery, SendMessageInput } from './chat.validation';

// All handlers run behind requireAuth, so req.user is always set.

export async function createSession(req: Request, res: Response) {
  const session = await chatService.createSession(String(req.user!._id), req.body as CreateSessionInput);
  return sendSuccess(res, 201, 'chat.sessionCreated', { session });
}

export async function listSessions(req: Request, res: Response) {
  const result = await chatService.listSessions(String(req.user!._id), req.query as ListSessionsQuery);
  return sendSuccess(res, 200, 'chat.sessionsFetched', result);
}

export async function listMessages(req: Request, res: Response) {
  const result = await chatService.listMessages(
    String(req.user!._id),
    String(req.params.id),
    req.query as unknown as ListMessagesQuery,
  );
  return sendSuccess(res, 200, 'chat.messagesFetched', result);
}

export async function getQuota(req: Request, res: Response) {
  const quota = await chatService.getChatQuota(String(req.user!._id));
  return sendSuccess(res, 200, 'chat.quotaFetched', quota);
}

export async function sendMessage(req: Request, res: Response) {
  const result = await chatService.sendMessage(req.user!, String(req.params.id), req.body as SendMessageInput, req.lang);
  return sendSuccess(res, 201, 'chat.messageSent', result);
}
