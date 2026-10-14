import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { ApiError, type FieldError } from '../utils/ApiError';
import { sendError } from '../utils/response';
import { zodIssuesToFieldErrors } from './validate';

function normalize(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    return ApiError.badRequest('common.validationFailed', undefined, zodIssuesToFieldErrors(err));
  }

  if (err instanceof jwt.TokenExpiredError) return ApiError.unauthorized('auth.tokenExpired');
  if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.NotBeforeError) {
    return ApiError.unauthorized('auth.invalidToken');
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest('common.invalidId', { field: err.path });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const errors: FieldError[] = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('common.validationFailed', undefined, errors);
  }

  const anyErr = err as { code?: number; keyValue?: Record<string, unknown>; type?: string; status?: number };
  if (anyErr?.code === 11000) {
    const field = Object.keys(anyErr.keyValue ?? {})[0] ?? 'field';
    return new ApiError(409, 'common.duplicate', {
      params: { field },
      errors: [{ field, message: `${field} already exists` }],
    });
  }

  // body-parser errors
  if (anyErr?.type === 'entity.parse.failed') return ApiError.badRequest('common.invalidJson');
  if (anyErr?.type === 'entity.too.large') return new ApiError(413, 'common.payloadTooLarge');
  if (typeof anyErr?.status === 'number' && anyErr.status >= 400 && anyErr.status < 500) {
    return new ApiError(anyErr.status, 'common.badRequest');
  }

  return ApiError.internal();
}

/** Central error handler — must be registered last. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const apiErr = normalize(err);

  if (apiErr.statusCode >= 500) {
    logger.error({ err, requestId: req.requestId, path: req.originalUrl }, 'Unhandled error');
  } else if (env.isDev) {
    logger.debug({ requestId: req.requestId, key: apiErr.messageKey, status: apiErr.statusCode }, 'Request failed');
  }

  if (res.headersSent) return;
  sendError(res, apiErr.statusCode, apiErr.messageKey, apiErr.errors, apiErr.params, apiErr.data);
}
