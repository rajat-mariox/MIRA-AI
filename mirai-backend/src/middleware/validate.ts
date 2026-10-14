import type { NextFunction, Request, Response } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { ApiError, type FieldError } from '../utils/ApiError';

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function zodIssuesToFieldErrors(error: z.ZodError, prefix?: string): FieldError[] {
  return error.issues.map((i) => ({
    field: [prefix, ...i.path].filter((p) => p !== undefined && p !== '').join('.') || prefix || 'body',
    message: i.message,
  }));
}

/**
 * Validates and REPLACES req.body / req.query / req.params with the parsed (coerced, defaulted,
 * stripped) values. On failure responds 400 `common.validationFailed` with
 * `errors: [{ field, message }]`.
 *
 *   router.post('/send-otp', validate({ body: sendOtpSchema }), controller.sendOtp);
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: FieldError[] = [];

    if (schemas.params) {
      const r = schemas.params.safeParse(req.params);
      if (r.success) req.params = r.data;
      else errors.push(...zodIssuesToFieldErrors(r.error, 'params'));
    }
    if (schemas.query) {
      const r = schemas.query.safeParse(req.query);
      if (r.success) {
        // Express 5: req.query is a getter, so redefine it on the instance.
        Object.defineProperty(req, 'query', { value: r.data, writable: true, configurable: true, enumerable: true });
      } else errors.push(...zodIssuesToFieldErrors(r.error, 'query'));
    }
    if (schemas.body) {
      const r = schemas.body.safeParse(req.body ?? {});
      if (r.success) req.body = r.data;
      else errors.push(...zodIssuesToFieldErrors(r.error));
    }

    if (errors.length) return next(ApiError.badRequest('common.validationFailed', undefined, errors));
    next();
  };
}
