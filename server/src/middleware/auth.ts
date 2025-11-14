import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

export interface AuthResult {
  isAuthenticated: boolean;
  apiKey?: string;
  error?: string;
}

/**
 * Validates the API key from request headers
 */
export function authenticateRequest(req: Request): AuthResult {
  const apiKey = req.headers.get("X-API-Key");

  if (!apiKey) {
    logger.warn("Authentication failed: missing API key");
    return {
      isAuthenticated: false,
      error: "Unauthorized: Missing API key",
    };
  }

  if (apiKey !== config.SERVER_API_KEY) {
    logger.warn({ providedKey: apiKey.slice(0, 8) + "..." }, "Authentication failed: invalid API key");
    return {
      isAuthenticated: false,
      error: "Unauthorized: Invalid API key",
    };
  }

  return {
    isAuthenticated: true,
    apiKey,
  };
}
