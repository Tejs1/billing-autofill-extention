import { getCorsHeaders } from "../middleware/cors.js";
import { authenticateRequest } from "../middleware/auth.js";
import { validateRequestBody } from "../middleware/validation.js";
import { rateLimiter } from "../services/rate-limiter.js";
import { generateFillValues } from "../services/openai.js";
import { logger } from "../utils/logger.js";
import { GenerateFillRequestSchema } from "../types/index.js";
import type { GenerateFillResponse } from "../types/index.js";

/**
 * Generate fill endpoint handler
 */
export async function handleGenerateFill(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Authenticate request
    const authResult = authenticateRequest(req);
    if (!authResult.isAuthenticated) {
      return new Response(
        JSON.stringify({
          success: false,
          error: authResult.error,
        } as GenerateFillResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Rate limiting
    const isAllowed = await rateLimiter.checkLimit(authResult.apiKey!);
    if (!isAllowed) {
      logger.warn({ apiKey: authResult.apiKey!.slice(0, 8) + "..." }, "Rate limit exceeded");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        } as GenerateFillResponse),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Validate request body
    const validation = await validateRequestBody(req, GenerateFillRequestSchema);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error,
        } as GenerateFillResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const { fields } = validation.data!;

    // Generate fill values
    logger.info({ fieldCount: fields.length }, "Processing generate-fill request");
    const result = await generateFillValues(fields);
    logger.info("Successfully generated fill data");

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      } as GenerateFillResponse),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    logger.error({ err: error }, "Error processing generate-fill request");

    // Sanitize error message for production
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      } as GenerateFillResponse),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
}
