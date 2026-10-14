import { Redis } from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Cache abstraction. Uses Redis (ioredis) when REDIS_URL is set, otherwise an
 * in-process Map with TTL. Values are JSON-serialised.
 *
 *   await cache.set('horoscope:daily:aries:2026-10-14', data, 3600);
 *   const v = await cache.get<MyType>('horoscope:daily:aries:2026-10-14');
 *   await cache.delPattern('horoscope:*');
 *   const v2 = await cache.wrap('key', 600, () => fetchSomething());
 */
export type CacheStatus = 'connected' | 'disabled' | 'error';

export interface Cache {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Delete keys matching a glob pattern (supports `*` and `?`), e.g. `horoscope:*`. Returns count deleted. */
  delPattern(pattern: string): Promise<number>;
  flushAll(): Promise<void>;
  /** 'connected' = Redis up, 'disabled' = in-memory fallback, 'error' = Redis configured but unreachable. */
  status(): CacheStatus;
  /** Return cached value, or compute it with `fn`, store for ttlSeconds and return it. */
  wrap<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

abstract class BaseCache implements Cache {
  abstract get<T>(key: string): Promise<T | null>;
  abstract set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  abstract del(key: string): Promise<void>;
  abstract delPattern(pattern: string): Promise<number>;
  abstract flushAll(): Promise<void>;
  abstract status(): CacheStatus;
  abstract close(): Promise<void>;

  async wrap<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const hit = await this.get<T>(key);
    if (hit !== null) return hit;
    const value = await fn();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}

class MemoryCache extends BaseCache {
  private store = new Map<string, { value: string; expiresAt: number | null }>();
  private timer: NodeJS.Timeout;

  constructor() {
    super();
    this.timer = setInterval(() => this.sweep(), 60_000);
    this.timer.unref();
  }

  private sweep(): void {
    const now = Date.now();
    for (const [k, v] of this.store) if (v.expiresAt !== null && v.expiresAt <= now) this.store.delete(k);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value: JSON.stringify(value ?? null),
      expiresAt: ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPattern(pattern: string): Promise<number> {
    const re = globToRegExp(pattern);
    let n = 0;
    for (const k of [...this.store.keys()]) {
      if (re.test(k)) {
        this.store.delete(k);
        n++;
      }
    }
    return n;
  }

  async flushAll(): Promise<void> {
    this.store.clear();
  }

  status(): CacheStatus {
    return 'disabled';
  }

  async close(): Promise<void> {
    clearInterval(this.timer);
  }
}

class RedisCache extends BaseCache {
  private client: Redis;

  constructor(url: string) {
    super();
    this.client = new Redis(url, { maxRetriesPerRequest: 2, enableOfflineQueue: false });
    this.client.on('error', (err: Error) => logger.warn({ err: err.message }, 'Redis error'));
    this.client.on('ready', () => logger.info('Redis connected'));
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const v = await this.client.get(key);
      return v === null ? null : (JSON.parse(v) as T);
    } catch (err) {
      logger.warn({ err, key }, 'cache.get failed');
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const v = JSON.stringify(value ?? null);
      if (ttlSeconds && ttlSeconds > 0) await this.client.set(key, v, 'EX', ttlSeconds);
      else await this.client.set(key, v);
    } catch (err) {
      logger.warn({ err, key }, 'cache.set failed');
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      logger.warn({ err, key }, 'cache.del failed');
    }
  }

  async delPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let n = 0;
    try {
      do {
        const [next, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 500);
        cursor = next;
        if (keys.length) n += await this.client.del(...keys);
      } while (cursor !== '0');
    } catch (err) {
      logger.warn({ err, pattern }, 'cache.delPattern failed');
    }
    return n;
  }

  async flushAll(): Promise<void> {
    await this.client.flushdb();
  }

  status(): CacheStatus {
    return this.client.status === 'ready' ? 'connected' : 'error';
  }

  async close(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }
}

export const cache: Cache = env.REDIS_URL ? new RedisCache(env.REDIS_URL) : new MemoryCache();
