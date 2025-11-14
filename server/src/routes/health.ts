import { getCorsHeaders } from "../middleware/cors.js";
import { checkOpenAIHealth } from "../services/openai.js";
import { rateLimiter } from "../services/rate-limiter.js";
import { logger } from "../utils/logger.js";
import type { HealthCheckResponse } from "../types/index.js";

/**
 * Health check endpoint handler
 */
export async function handleHealthCheck(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const checks: HealthCheckResponse["checks"] = {};
    let overallStatus: "ok" | "degraded" | "error" = "ok";

    // Check OpenAI connectivity (optional, don't fail if slow)
    try {
      const openaiHealth = await checkOpenAIHealth();
      checks.openai = openaiHealth;

      if (openaiHealth.status === "error") {
        overallStatus = "degraded";
      }
    } catch (error) {
      logger.error({ err: error }, "Health check - OpenAI check failed");
      checks.openai = {
        status: "error",
        message: "Check failed",
      };
      overallStatus = "degraded";
    }

    // Check Redis connectivity if enabled
    if (rateLimiter && "client" in rateLimiter) {
      try {
        // Simple ping to check Redis
        await (rateLimiter as any).client.ping();
        checks.redis = { status: "ok" };
      } catch (error) {
        logger.error({ err: error }, "Health check - Redis check failed");
        checks.redis = {
          status: "error",
          message: error instanceof Error ? error.message : "Connection failed",
        };
        overallStatus = "degraded";
      }
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    };

    const statusCode = overallStatus === "ok" ? 200 : overallStatus === "degraded" ? 200 : 503;

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Health check failed");

    return new Response(
      JSON.stringify({
        status: "error",
        timestamp: new Date().toISOString(),
        checks: {},
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
}
