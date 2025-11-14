import { config } from "../config/index.js";

/**
 * Get CORS headers based on origin and configuration
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOriginsList = config.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  const isAllowed =
    config.ALLOWED_ORIGINS === "*" ||
    (origin && allowedOriginsList.includes(origin));

  return {
    "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin");
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }
  return null;
}
