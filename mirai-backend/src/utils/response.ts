import type { Response } from 'express';
import { t, type TParams } from '../lib/i18n';
import type { FieldError } from './ApiError';

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: FieldError[];
}

/**
 * Send the standard success envelope. `messageKey` is a locale key (e.g. 'auth.otpSent');
 * it is translated using the request's Accept-Language. Unknown keys are sent verbatim.
 * Pass `data = undefined` to omit the `data` field (e.g. logout).
 *
 *   return sendSuccess(res, 200, 'user.profileFetched', { user });
 */
export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  messageKey: string,
  data?: T,
  params?: TParams,
): Response {
  const body: ApiResponse<T> = {
    success: true,
    statusCode,
    message: t(res.req, messageKey, params),
  };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
}

/** Send the standard error envelope (normally you just `throw ApiError` instead). */
export function sendError(
  res: Response,
  statusCode: number,
  messageKey: string,
  errors?: FieldError[],
  params?: TParams,
  data?: unknown,
): Response {
  const body: ApiResponse = {
    success: false,
    statusCode,
    message: t(res.req, messageKey, params),
  };
  if (errors && errors.length) body.errors = errors;
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
}
