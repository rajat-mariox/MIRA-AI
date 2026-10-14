import compression from 'compression';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { language } from './middleware/language';
import { notFound } from './middleware/notFound';
import { globalRateLimiter } from './middleware/rateLimit';
import { requestId } from './middleware/requestId';
import apiRouter from './routes';
import { LOCAL_UPLOAD_DIR, LOCAL_UPLOAD_ROUTE } from './modules/media/media.storage';

export const API_PREFIX = '/api/v1';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(requestId);
  app.use(language);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as express.Request).requestId,
      customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
      customSuccessMessage: (req, res, ms) => `${req.method} ${req.url} ${res.statusCode} ${Math.round(ms)}ms`,
      customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
      autoLogging: { ignore: (req) => req.url === `${API_PREFIX}/health` },
      serializers: {
        req: (req: { id: string; method: string; url: string }) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
      exposedHeaders: ['X-Request-Id', 'Content-Language', 'RateLimit', 'RateLimit-Policy'],
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Locally stored media uploads (used when S3 is not configured)
  app.use(LOCAL_UPLOAD_ROUTE, express.static(LOCAL_UPLOAD_DIR, { index: false, dotfiles: 'deny', maxAge: '7d', fallthrough: true }));
  app.use(API_PREFIX, globalRateLimiter, apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
