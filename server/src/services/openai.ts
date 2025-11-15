import pRetry from "p-retry";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import type {
  FormField,
  FillValue,
  OpenAIRequest,
  OpenAIResponse,
  OpenAIMessage,
} from "../types/index.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Personas for variation
const PERSONAS = [
  "professional",
  "casual",
  "formal",
  "creative",
  "modern",
  "traditional",
];

/**
 * Simple in-memory cache for OpenAI responses
 */
class ResponseCache {
  private cache = new Map<string, { data: Record<string, FillValue>; timestamp: number }>();
  private readonly TTL = 300000; // 5 minutes

  generateKey(fields: FormField[]): string {
    return JSON.stringify(
      fields.map((f) => ({
        name: f.name,
        type: f.type,
        label: f.label,
      }))
    );
  }

  get(key: string): Record<string, FillValue> | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: Record<string, FillValue>): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Cleanup old entries
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new ResponseCache();

/**
 * Builds the prompt for OpenAI
 */
function buildPrompt(fields: FormField[]): OpenAIMessage[] {
  const persona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 1000000);
  const variationSeed = `${timestamp}-${randomSeed}`;

  return [
    {
      role: "system",
      content:
        `You help with auto-filling web forms with realistic, contextually appropriate data. Respond with JSON only. ` +
        `For each field id, return realistic, specific, and detailed values that would be used in real-world scenarios. ` +
        `Generate authentic-looking data that matches the field type and context. Use proper formatting for dates (ISO format), realistic phone numbers, valid email formats, and complete addresses. ` +
        `Ensure values are diverse, unique, and avoid generic patterns like "example.com", "test@test.com", "123 Main St", or "John Doe". ` +
        `Use real-sounding names from various cultural backgrounds, actual city names, legitimate-looking company names, and realistic product descriptions. ` +
        `Current persona/style: ${persona}. ` +
        `Variation seed: ${variationSeed}`,
    },
    {
      role: "user",
      content: `Fields to fill (array of objects with id, name, label, placeholder, type):
${JSON.stringify(fields, null, 2)}

Generate realistic, specific, and contextually appropriate values for each field. DO NOT use generic or placeholder-like values such as:
- Generic names like "John Doe", "Jane Smith", "Test User"
- Generic emails like "test@example.com", "user@test.com"
- Generic addresses like "123 Main Street", "456 Oak Avenue"
- Generic phone numbers like "555-1234"
- Generic companies like "ACME Corp", "Example Inc"

Instead, generate authentic-looking data:
- Use diverse, real-sounding names (e.g., "Marcus Chen", "Priya Patel", "Alessandro Rossi")
- Use realistic email addresses with actual domain patterns (e.g., "marcus.chen@techsolutions.io", "priya.patel@innovate.co")
- Use complete, specific addresses with real city names (e.g., "2847 Riverside Drive, Austin, TX 78704")
- Use properly formatted phone numbers (e.g., "+1 (512) 847-2039", "+44 20 7946 0958")
- Use realistic company names (e.g., "TechSolutions Inc.", "Innovate Digital Agency")
- For dates, use reasonable values in ISO format
- Match the context and field type appropriately

Return JSON in the format {"<fieldId>": {"value": "<realistic filling value>", "reason": "<why this value fits>"}}.`,
    },
  ];
}

/**
 * Fetches completion from OpenAI with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Calls OpenAI API with retry logic
 */
async function callOpenAIWithRetry(fields: FormField[]): Promise<Record<string, FillValue>> {
  const requestBody: OpenAIRequest = {
    model: config.OPENAI_MODEL,
    temperature: 0.75,
    response_format: { type: "json_object" },
    messages: buildPrompt(fields),
  };

  return pRetry(
    async () => {
      const startTime = Date.now();

      try {
        const response = await fetchWithTimeout(
          OPENAI_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.OPENAI_API_KEY}`,
            },
            body: JSON.stringify(requestBody),
          },
          config.OPENAI_TIMEOUT
        );

        const duration = Date.now() - startTime;

        if (!response.ok) {
          let errorDetail = "";
          try {
            const errorBody = await response.text();
            errorDetail = errorBody.slice(0, 400);
          } catch {
            errorDetail = `status ${response.status}`;
          }

          logger.error(
            {
              status: response.status,
              detail: errorDetail,
              duration,
            },
            "OpenAI API request failed"
          );

          // Throw error for retry
          if (response.status >= 500 || response.status === 429) {
            throw new Error(`OpenAI API error: ${response.status}`);
          }

          // Don't retry on client errors
          throw new pRetry.AbortError(`OpenAI API error: ${errorDetail}`);
        }

        const data = (await response.json()) as OpenAIResponse;

        logger.info({ duration, fieldCount: fields.length }, "OpenAI request successful");

        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new pRetry.AbortError("OpenAI response missing content");
        }

        let parsed: Record<string, FillValue>;
        try {
          parsed = JSON.parse(content);
        } catch (error) {
          logger.error({ err: error, content }, "Failed to parse OpenAI response");
          throw new pRetry.AbortError("Failed to parse OpenAI response");
        }

        return parsed;
      } catch (error) {
        if (error instanceof pRetry.AbortError) {
          throw error;
        }

        // Handle timeout
        if (error instanceof Error && error.name === "AbortError") {
          logger.error({ timeout: config.OPENAI_TIMEOUT }, "OpenAI request timeout");
          throw new Error("OpenAI request timeout");
        }

        throw error;
      }
    },
    {
      retries: config.OPENAI_MAX_RETRIES,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000,
      onFailedAttempt: (error) => {
        logger.warn(
          {
            attempt: error.attemptNumber,
            retriesLeft: error.retriesLeft,
            err: error.message,
          },
          "OpenAI request failed, retrying..."
        );
      },
    }
  );
}

/**
 * Main function to generate fill values with caching
 */
export async function generateFillValues(
  fields: FormField[]
): Promise<Record<string, FillValue>> {
  const cacheKey = cache.generateKey(fields);
  const cached = cache.get(cacheKey);

  if (cached) {
    logger.info("Cache hit for form fields");
    return cached;
  }

  logger.info({ fieldCount: fields.length }, "Generating fill values from OpenAI");

  const result = await callOpenAIWithRetry(fields);
  cache.set(cacheKey, result);

  return result;
}

/**
 * Health check for OpenAI API connectivity
 */
export async function checkOpenAIHealth(): Promise<{ status: "ok" | "error"; message?: string }> {
  try {
    const response = await fetchWithTimeout(
      "https://api.openai.com/v1/models",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        },
      },
      5000 // 5 second timeout for health check
    );

    if (response.ok) {
      return { status: "ok" };
    }

    return {
      status: "error",
      message: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
