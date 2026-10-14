import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const VALID_ID = /^[A-Za-z0-9._:-]{1,128}$/;

/** Sets req.requestId (honours a sane incoming X-Request-Id) and echoes it in the X-Request-Id response header. */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  const id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
