import type { Context, Next } from "hono";
import { RATE_LIMITS } from "@madecreative/shared";

type RateLimitConfig = {
  requests: number;
  windowMs: number;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const { getRedisConnection } = await import("../lib/queue.js");
  const redis = getRedisConnection();
  const windowSeconds = Math.floor(config.windowMs / 1000);
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const resetAt = windowStart + config.windowMs;

  const redisKey = `rl:${key}:${windowStart}`;

  const pipeline = redis.pipeline();
  pipeline.incr(redisKey);
  pipeline.expire(redisKey, windowSeconds + 1);
  const results = await withTimeout(pipeline.exec(), 3000);

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

    try {
      const { allowed, remaining, resetAt } = await checkRateLimit(
        `${routeName}:${ip}`,
        config
      );

      c.header("X-RateLimit-Limit", config.requests.toString());
      c.header("X-RateLimit-Remaining", remaining.toString());
      c.header("X-RateLimit-Reset", Math.floor(resetAt / 1000).toString());

      if (!allowed) {
        return c.json(
          { success: false, error: "Too many requests, please try again later" },
          429
        );
      }
    } catch {
      // Redis unavailable or timeout — allow request through
    }

    await next();
  };
}
