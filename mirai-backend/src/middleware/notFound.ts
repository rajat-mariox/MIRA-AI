import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

/** 404 for any unmatched route. Register after all routers, before errorHandler. */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound('common.routeNotFound', { method: req.method, path: req.originalUrl.split('?')[0] }));
}
