import Redis from "ioredis";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import type { RateLimitRecord } from "../types/index.js";

/**
 * Abstract rate limiter interface
 */
interface RateLimiter {
  checkLimit(identifier: string): Promise<boolean>;
  cleanup?(): Promise<void>;
}

/**
 * In-memory rate limiter implementation
 */
class MemoryRateLimiter implements RateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private cleanupInterval: Timer;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || now > record.resetTime) {
      this.store.set(identifier, {
        count: 1,
        resetTime: now + config.RATE_LIMIT_WINDOW,
      });
      return true;
    }

    if (record.count >= config.RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }

    record.count++;
    return true;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async cleanup(): Promise<void> {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

/**
 * Redis-based rate limiter implementation
 */
class RedisRateLimiter implements RateLimiter {
  private client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on("error", (err) => {
      logger.error({ err }, "Redis connection error");
    });

    this.client.on("connect", () => {
      logger.info("Redis connected successfully");
    });
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();

    try {
      // Use Redis transaction to ensure atomicity
      const pipeline = this.client.pipeline();

      // Get current count
      pipeline.get(key);
      pipeline.pttl(key);

      const results = await pipeline.exec();

      if (!results) {
        throw new Error("Pipeline execution failed");
      }

      const [countResult, ttlResult] = results;
      const count = countResult[1] ? parseInt(countResult[1] as string) : 0;
      const ttl = ttlResult[1] as number;

      // If key doesn't exist or expired, create new
      if (count === 0 || ttl === -2) {
        await this.client.set(
          key,
          "1",
          "PX",
          config.RATE_LIMIT_WINDOW
        );
        return true;
      }

      // Check if limit exceeded
      if (count >= config.RATE_LIMIT_MAX_REQUESTS) {
        return false;
      }

      // Increment counter
      await this.client.incr(key);
      return true;
    } catch (error) {
      logger.error({ err: error }, "Rate limiter error, allowing request");
      // Fail open - allow request if Redis is down
      return true;
    }
  }

  async cleanup(): Promise<void> {
    await this.client.quit();
  }
}

/**
 * Factory function to create appropriate rate limiter
 */
export function createRateLimiter(): RateLimiter {
  if (config.REDIS_ENABLED && config.REDIS_URL) {
    logger.info("Using Redis-based rate limiter");
    return new RedisRateLimiter(config.REDIS_URL);
  }

  logger.warn("Using in-memory rate limiter (not suitable for production with multiple instances)");
  return new MemoryRateLimiter();
}

// Export singleton instance
export const rateLimiter = createRateLimiter();
