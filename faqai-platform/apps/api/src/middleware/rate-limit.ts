import { rateLimiter } from 'hono-rate-limiter';
import { getRedis } from '../lib/redis.js';
import { TooManyRequestsError } from '../lib/errors.js';
import type { Context, MiddlewareHandler } from 'hono';

// 開発環境ではレートリミットをスキップ
const isDev = process.env['NODE_ENV'] === 'development';
function devPassthrough(): MiddlewareHandler {
  return async (_c, next) => next();
}

/**
 * Redisを使ったレートリミットストアファクトリ
 */
function createRedisStore(prefix: string) {
  const store = {
    async get(key: string) {
      const redis = getRedis();
      const raw = await redis.get(`${prefix}:${key}`);
      if (!raw) return undefined;
      return JSON.parse(raw) as { totalHits: number; resetTime: Date | undefined };
    },
    async set(
      key: string,
      value: { totalHits: number; resetTime: Date | undefined },
      ttlMs: number,
    ) {
      const redis = getRedis();
      const ttlSecs = Math.ceil(ttlMs / 1000);
      await redis.setex(`${prefix}:${key}`, ttlSecs, JSON.stringify(value));
    },
    async delete(key: string) {
      const redis = getRedis();
      await redis.del(`${prefix}:${key}`);
    },
    async resetAll() {
      // 本番環境では使用しない
    },
    async increment(key: string) {
      const redis = getRedis();
      const raw = await redis.get(`${prefix}:${key}`);
      const current = raw
        ? (JSON.parse(raw) as { totalHits: number; resetTime: string })
        : null;
      const totalHits = (current?.totalHits ?? 0) + 1;
      const resetTime = current?.resetTime
        ? new Date(current.resetTime)
        : new Date(Date.now() + 60_000);
      const ttlSecs = Math.max(
        1,
        Math.ceil((resetTime.getTime() - Date.now()) / 1000),
      );
      await redis.setex(
        `${prefix}:${key}`,
        ttlSecs,
        JSON.stringify({ totalHits, resetTime: resetTime.toISOString() }),
      );
      return { totalHits, resetTime };
    },
  };
  return store;
}

/** 認証エンドポイント: 5回/分（IP単位） */
export const authRateLimiter = isDev ? devPassthrough() : rateLimiter({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: 'draft-6',
  keyGenerator: (c: Context) =>
    c.req.header('x-forwarded-for') ??
    c.req.header('x-real-ip') ??
    'unknown',
  handler: () => {
    throw new TooManyRequestsError(
      'Too many authentication attempts. Please try again later.',
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: createRedisStore('rl:auth') as any,
});

/** 一般API: 100回/分（ユーザー単位） */
export const apiRateLimiter = isDev ? devPassthrough() : rateLimiter({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: 'draft-6',
  keyGenerator: (c: Context) => {
    const user = c.get('user') as { id: string } | undefined;
    return (
      user?.id ??
      c.req.header('x-forwarded-for') ??
      'unknown'
    );
  },
  handler: () => {
    throw new TooManyRequestsError(
      'Rate limit exceeded. Please slow down your requests.',
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: createRedisStore('rl:api') as any,
});

/** 公開API（埋め込みウィジェット等）: 60回/分（IP単位） */
export const publicRateLimiter = isDev ? devPassthrough() : rateLimiter({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-6',
  keyGenerator: (c: Context) =>
    c.req.header('x-forwarded-for') ??
    c.req.header('x-real-ip') ??
    'unknown',
  handler: () => {
    throw new TooManyRequestsError('Rate limit exceeded for public API.');
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: createRedisStore('rl:public') as any,
});
