import type { Request, Response } from 'express';
import { ipKeyGenerator, rateLimit, type Options } from 'express-rate-limit';
import { sendError } from '../utils/response';

/**
 * Factory for rate limiters that respond with the standard envelope.
 *
 *   router.post('/x', createRateLimiter({ windowMs: 60_000, limit: 10 }), handler);
 *   createRateLimiter({ windowMs, limit, keyGenerator: (req) => `${clientIp(req)}:${req.body.email}` })
 */
export function createRateLimiter(
  opts: Partial<Pick<Options, 'windowMs' | 'limit' | 'keyGenerator' | 'skip'>> & { messageKey?: string } = {},
) {
  const { messageKey = 'common.tooManyRequests', ...rest } = opts;
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    ...rest,
    handler: (req: Request, res: Response) => {
      sendError(res, 429, messageKey);
    },
  });
}

/** IPv6-safe client IP key (use inside custom keyGenerators). */
export function clientIp(req: Request): string {
  return ipKeyGenerator(req.ip ?? 'unknown');
}

/** Applied to every /api/v1 request: 300 requests / minute / IP. */
export const globalRateLimiter = createRateLimiter({ windowMs: 60 * 1000, limit: 300 });

/** POST /auth/send-otp: 5 requests / 15 min per (email + IP). */
export const otpSendLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  messageKey: 'auth.otpRateLimited',
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return `otp:${clientIp(req)}:${email}`;
  },
});

/** POST /auth/verify-otp & /auth/refresh-token: 20 requests / 15 min / IP. */
export const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 20 });
