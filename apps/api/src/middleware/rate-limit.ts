import type { Context, Next } from "hono";
import { getRedisConnection } from "../lib/queue.js";
import { RATE_LIMITS, REDIS_KEYS } from "@madecreative/shared";

type RateLimitConfig = {
  requests: number;
  windowMs: number;
};

async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = getRedisConnection();
  const windowSeconds = Math.floor(config.windowMs / 1000);
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const resetAt = windowStart + config.windowMs;

  const redisKey = `${key}:${windowStart}`;

  const pipeline = redis.pipeline();
  pipeline.incr(redisKey);
  pipeline.expire(redisKey, windowSeconds + 1);
  const results = await pipeline.exec();

  const count = (results?.[0]?.[1] as number) ?? 1;
  const remaining = Math.max(0, config.requests - count);
  const allowed = count <= config.requests;

  return { allowed, remaining, resetAt };
}

export function rateLimiter(
  routeName: keyof typeof RATE_LIMITS = "API_GENERAL"
) {
  const config = RATE_LIMITS[routeName];

  return async (c: Context, next: Next): Promise<Response | void> => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown";

    const key = REDIS_KEYS.RATE_LIMIT(ip, routeName);

    try {
      const { allowed, remaining, resetAt } = await checkRateLimit(key, config);

      c.header("X-RateLimit-Limit", config.requests.toString());
      c.header("X-RateLimit-Remaining", remaining.toString());
      c.header("X-RateLimit-Reset", Math.floor(resetAt / 1000).toString());

      if (!allowed) {
        return c.json(
          {
            success: false,
            error: "Too many requests, please try again later",
          },
          429
        );
      }
    } catch (err) {
      // If Redis is unavailable, allow the request
      console.warn("Rate limit check failed (Redis unavailable):", err);
    }

    await next();
  };
}
