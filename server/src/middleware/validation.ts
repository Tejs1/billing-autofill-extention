import { z } from "zod";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates request body size
 */
export function validateRequestSize(req: Request): ValidationResult<void> {
  const contentLength = req.headers.get("content-length");

  if (contentLength) {
    const size = parseInt(contentLength);
    if (size > config.MAX_REQUEST_SIZE) {
      logger.warn({ size, limit: config.MAX_REQUEST_SIZE }, "Request size exceeds limit");
      return {
        success: false,
        error: `Request body too large. Maximum size: ${config.MAX_REQUEST_SIZE} bytes`,
      };
    }
  }

  return { success: true };
}

/**
 * Validates and parses request body against a Zod schema
 */
export async function validateRequestBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    // First check size
    const sizeValidation = validateRequestSize(req);
    if (!sizeValidation.success) {
      return sizeValidation;
    }

    // Parse JSON
    const body = await req.json();

    // Validate with schema
    const result = schema.safeParse(body);

    if (!result.success) {
      const errorMessages = result.error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );

      logger.warn({ errors: errorMessages }, "Request validation failed");

      return {
        success: false,
        error: `Validation error: ${errorMessages.join(", ")}`,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    logger.error({ err: error }, "Failed to parse request body");
    return {
      success: false,
      error: "Invalid JSON in request body",
    };
  }
}
