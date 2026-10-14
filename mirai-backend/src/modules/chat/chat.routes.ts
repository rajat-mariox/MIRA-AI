import { Router } from 'express';
import { env } from '../../config/env';
import { requireAuth } from '../../middleware/auth';
import { createRateLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './chat.controller';
import {
  createSessionSchema,
  listMessagesQuery,
  listSessionsQuery,
  sendMessageSchema,
  sessionIdParam,
} from './chat.validation';

const router = Router();

router.use(requireAuth);

/** Sending is per-user rate limited (CHAT_RATE_LIMIT_PER_MIN, default 20/min). */
const sendLimiter = createRateLimiter({
  windowMs: 60_000,
  limit: env.CHAT_RATE_LIMIT_PER_MIN,
  messageKey: 'chat.rateLimited',
  keyGenerator: (req) => `chat:${String(req.user?._id ?? 'anon')}`,
});

/** Free questions left + the active plan: { freeLimit, freeUsed, freeRemaining, subscription, canAsk } */
router.get('/quota', asyncHandler(controller.getQuota));
router.post('/sessions', validate({ body: createSessionSchema }), asyncHandler(controller.createSession));
router.get('/sessions', validate({ query: listSessionsQuery }), asyncHandler(controller.listSessions));
router.get(
  '/sessions/:id/messages',
  validate({ params: sessionIdParam, query: listMessagesQuery }),
  asyncHandler(controller.listMessages),
);
router.post(
  '/sessions/:id/messages',
  sendLimiter,
  validate({ params: sessionIdParam, body: sendMessageSchema }),
  asyncHandler(controller.sendMessage),
);

export default router;
