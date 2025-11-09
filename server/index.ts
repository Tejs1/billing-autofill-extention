const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

// Load environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SERVER_API_KEY = process.env.SERVER_API_KEY;
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || "*";

// Validate required environment variables
if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is not set in environment variables");
  process.exit(1);
}

if (!SERVER_API_KEY) {
  console.error("❌ SERVER_API_KEY is not set in environment variables");
  process.exit(1);
}

// Rate limiting: Simple in-memory store (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute

interface FormField {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  type: string;
  existingValue?: string;
}

interface GenerateFillRequest {
  fields: FormField[];
}

interface FillValue {
  value: string;
  reason: string;
}

interface GenerateFillResponse {
  success: boolean;
  data?: Record<string, FillValue>;
  error?: string;
}

// CORS headers helper
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOriginsList = ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  const isAllowed =
    ALLOWED_ORIGINS === "*" ||
    (origin && allowedOriginsList.includes(origin));

  return {
    "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}

// Rate limiting check
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Build prompt for OpenAI
function buildPrompt(fields: FormField[]) {
  return [
    {
      role: "system",
      content:
        "You help with auto completing web forms. Respond with JSON only. " +
        "For each field id, return a short, plausible placeholder value. " +
        "Avoid using real personal data. Use ISO formats for dates and keep numbers realistic.",
    },
    {
      role: "user",
      content: `Fields to fill (array of objects with id, name, label, placeholder, type):
${JSON.stringify(fields, null, 2)}

Return JSON in the format {"<fieldId>": {"value": "<filling value>", "reason": "<why this value fits>"}}.`,
    },
  ];
}

// Call OpenAI API
async function callOpenAI(fields: FormField[]): Promise<Record<string, FillValue>> {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: buildPrompt(fields),
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errorBody = await response.text();
      detail = errorBody.slice(0, 400);
    } catch (err) {
      detail = `status ${response.status}`;
    }
    throw new Error(`OpenAI request failed: ${detail}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI response missing content.");
  }

  let parsed: Record<string, FillValue>;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error("Failed to parse OpenAI response.");
  }

  return parsed;
}

// Main request handler
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Health check endpoint
    if (url.pathname === "/health" && req.method === "GET") {
      return new Response(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Generate fill endpoint
    if (url.pathname === "/api/generate-fill" && req.method === "POST") {
      try {
        // Authenticate request
        const apiKey = req.headers.get("X-API-Key");
        if (!apiKey || apiKey !== SERVER_API_KEY) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Unauthorized: Invalid or missing API key",
            }),
            {
              status: 401,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // Rate limiting (use API key as identifier)
        if (!checkRateLimit(apiKey)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Rate limit exceeded. Please try again later.",
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // Parse and validate request body
        const body: GenerateFillRequest = await req.json();
        
        if (!body.fields || !Array.isArray(body.fields)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Invalid request: 'fields' must be an array",
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        if (body.fields.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "No fields provided",
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // Limit number of fields to prevent abuse
        if (body.fields.length > 50) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Too many fields. Maximum 50 fields per request.",
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // Call OpenAI
        console.log(`📝 Processing ${body.fields.length} fields...`);
        const result = await callOpenAI(body.fields);
        console.log(`✅ Successfully generated fill data`);

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
        console.error("❌ Error processing request:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

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

    // 404 for unknown routes
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
  },
});

console.log(`🚀 Server running at http://localhost:${server.port}`);
console.log(`📊 Rate limit: ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW / 1000} seconds`);
console.log(`🔒 CORS origins: ${ALLOWED_ORIGINS}`);

