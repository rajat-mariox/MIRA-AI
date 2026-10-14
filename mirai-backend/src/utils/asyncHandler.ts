import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async route handler and forwards rejections to next().
 * (Express 5 already does this natively, but the wrapper keeps handler typing explicit
 * and makes intent obvious. Using it is optional but recommended for consistency.)
 */
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown> | unknown,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
}
