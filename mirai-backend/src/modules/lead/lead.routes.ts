import { Router } from 'express';
import { env } from '../../config/env';
import { clientIp, createRateLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './lead.controller';
import { createLeadSchema } from './lead.validation';

/** Website contact form: LEADS_RATE_LIMIT_PER_HOUR (default 5) submissions / hour / IP. */
const leadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: env.LEADS_RATE_LIMIT_PER_HOUR,
  messageKey: 'lead.rateLimited',
  keyGenerator: (req) => `lead:${clientIp(req)}`,
});

/** Mounted at /leads (public, no auth) */
const router = Router();

router.post('/', leadLimiter, controller.honeypot, validate({ body: createLeadSchema }), asyncHandler(controller.create));

export default router;
