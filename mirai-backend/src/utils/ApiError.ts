import type { TParams } from '../lib/i18n';

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Throw this anywhere (services, controllers, middleware). The central errorHandler
 * translates `messageKey` using the request language and sends the standard envelope:
 *   { success:false, statusCode, message, errors?, data? }
 *
 *   throw ApiError.notFound('user.notFound');
 *   throw new ApiError(409, 'common.conflict', { errors: [...] });
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly messageKey: string;
  readonly params?: TParams;
  readonly errors?: FieldError[];
  /** Extra payload sent as the envelope's `data` (e.g. `{ requiresPlan: true, quota }` on a 402). */
  readonly data?: unknown;
  readonly isOperational = true;

  constructor(
    statusCode: number,
    messageKey: string,
    opts: { params?: TParams; errors?: FieldError[]; data?: unknown } = {},
  ) {
    super(messageKey);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.messageKey = messageKey;
    this.params = opts.params;
    this.errors = opts.errors;
    this.data = opts.data;
  }

  static badRequest(key = 'common.badRequest', params?: TParams, errors?: FieldError[]): ApiError {
    return new ApiError(400, key, { params, errors });
  }
  static unauthorized(key = 'common.unauthorized', params?: TParams): ApiError {
    return new ApiError(401, key, { params });
  }
  static forbidden(key = 'common.forbidden', params?: TParams): ApiError {
    return new ApiError(403, key, { params });
  }
  static notFound(key = 'common.notFound', params?: TParams): ApiError {
    return new ApiError(404, key, { params });
  }
  static conflict(key = 'common.conflict', params?: TParams): ApiError {
    return new ApiError(409, key, { params });
  }
  static tooMany(key = 'common.tooManyRequests', params?: TParams): ApiError {
    return new ApiError(429, key, { params });
  }
  static internal(key = 'common.internalError', params?: TParams): ApiError {
    return new ApiError(500, key, { params });
  }
}
