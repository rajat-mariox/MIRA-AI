import type { NextFunction, Request, Response } from 'express';
import { resolveLang } from '../lib/i18n';

/** Resolves Accept-Language ('en' default, 'hi') into req.lang and sets Content-Language. */
export function language(req: Request, res: Response, next: NextFunction): void {
  req.lang = resolveLang(req.header('accept-language'));
  res.setHeader('Content-Language', req.lang);
  next();
}
