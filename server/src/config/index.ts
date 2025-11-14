import { z } from "zod";

// Environment variable schema
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  SERVER_API_KEY: z.string().min(32, "SERVER_API_KEY must be at least 32 characters"),
  PORT: z.string().default("3000").transform(Number),
  ALLOWED_ORIGINS: z.string().default("*"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_TIMEOUT: z.string().default("30000").transform(Number),
  OPENAI_MAX_RETRIES: z.string().default("3").transform(Number),
  RATE_LIMIT_WINDOW: z.string().default("60000").transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("20").transform(Number),
  REDIS_URL: z.string().optional(),
  REDIS_ENABLED: z.string().default("false").transform(val => val === "true"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MAX_REQUEST_SIZE: z.string().default("1048576").transform(Number), // 1MB default
});

export type Config = z.infer<typeof envSchema>;

/**
 * Validates and returns the application configuration
 */
export function loadConfig(): Config {
  try {
    const config = envSchema.parse({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      SERVER_API_KEY: process.env.SERVER_API_KEY,
      PORT: process.env.PORT,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      OPENAI_TIMEOUT: process.env.OPENAI_TIMEOUT,
      OPENAI_MAX_RETRIES: process.env.OPENAI_MAX_RETRIES,
      RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
      RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
      REDIS_URL: process.env.REDIS_URL,
      REDIS_ENABLED: process.env.REDIS_ENABLED,
      LOG_LEVEL: process.env.LOG_LEVEL,
      NODE_ENV: process.env.NODE_ENV,
      MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE,
    });

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Configuration validation failed:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Export singleton config instance
export const config = loadConfig();
