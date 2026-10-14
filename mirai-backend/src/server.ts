import type { Server } from 'node:http';
import { createApp, API_PREFIX } from './app';
import { env } from './config/env';
import { cache } from './lib/cache';
import { connectDB, disconnectDB } from './lib/db';
import { logger } from './lib/logger';
import { bootstrapAdmin } from './modules/admin/admin.bootstrap';
import { startNotificationJobs, stopNotificationJobs } from './jobs/notificationJobs';

let server: Server | undefined;
let shuttingDown = false;

async function start(): Promise<void> {
  await connectDB();
  await bootstrapAdmin(); // admin auth hook + seed admin / CMS / FAQ

  const app = createApp();
  server = app.listen(env.PORT, () => {
    logger.info(`MIRAI API listening on http://localhost:${env.PORT}${API_PREFIX} (${env.NODE_ENV})`);
    if (env.devFixedOtp) logger.warn(`DEV_FIXED_OTP is active: "${env.devFixedOtp}" is accepted for every email`);
    logger.info(`Cache: ${cache.status() === 'disabled' ? 'in-memory (REDIS_URL not set)' : 'redis'}`);
  });
  startNotificationJobs();
}

async function shutdown(signal: string, exitCode = 0): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully...`);

  const force = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
  force.unref();

  try {
    stopNotificationJobs();
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    await cache.close();
    await disconnectDB();
    logger.info('Shutdown complete');
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    exitCode = 1;
  }
  process.exit(exitCode);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  void shutdown('uncaughtException', 1);
});

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
