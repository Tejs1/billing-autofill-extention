import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { handleCorsPreFlight, getCorsHeaders } from "./middleware/cors.js";
import { handleHealthCheck } from "./routes/health.js";
import { handleGenerateFill } from "./routes/generate-fill.js";

/**
 * Main request router
 */
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  const corsResponse = handleCorsPreFlight(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Route requests
  // Health check endpoint (v1)
  if (url.pathname === "/health" && req.method === "GET") {
    return handleHealthCheck(req);
  }

  // API v1 routes
  if (url.pathname === "/api/v1/generate-fill" && req.method === "POST") {
    return handleGenerateFill(req);
  }

  // Backwards compatibility: support old endpoint without version
  if (url.pathname === "/api/generate-fill" && req.method === "POST") {
    logger.warn("Using deprecated endpoint /api/generate-fill, please use /api/v1/generate-fill");
    return handleGenerateFill(req);
  }

  // 404 for unknown routes
  logger.warn({ path: url.pathname, method: req.method }, "Route not found");
  return new Response(
    JSON.stringify({
      success: false,
      error: "Not found",
    }),
    {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

/**
 * Start the server
 */
const server = Bun.serve({
  port: config.PORT,
  fetch: handleRequest,
  error(error) {
    logger.error({ err: error }, "Server error");
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  },
});

// Log startup information
logger.info({
  port: config.PORT,
  nodeEnv: config.NODE_ENV,
  openaiModel: config.OPENAI_MODEL,
  rateLimitWindow: config.RATE_LIMIT_WINDOW,
  rateLimitMaxRequests: config.RATE_LIMIT_MAX_REQUESTS,
  redisEnabled: config.REDIS_ENABLED,
  allowedOrigins: config.ALLOWED_ORIGINS,
}, "Server started successfully");

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully...");
  server.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down gracefully...");
  server.stop();
  process.exit(0);
});
