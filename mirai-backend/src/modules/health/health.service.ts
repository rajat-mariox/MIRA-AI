import { cache } from '../../lib/cache';
import { mongoStatus } from '../../lib/db';

export function getHealth() {
  return {
    status: 'ok' as const,
    uptime: Number(process.uptime().toFixed(3)),
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus(),
      redis: cache.status(),
    },
  };
}
