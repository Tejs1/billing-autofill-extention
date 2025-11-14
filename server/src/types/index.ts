import { z } from "zod";

// Form field schema
export const FormFieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  label: z.string(),
  placeholder: z.string().optional(),
  type: z.string().min(1),
  existingValue: z.string().optional(),
});

export type FormField = z.infer<typeof FormFieldSchema>;

// Generate fill request schema
export const GenerateFillRequestSchema = z.object({
  fields: z.array(FormFieldSchema).min(1).max(50),
});

export type GenerateFillRequest = z.infer<typeof GenerateFillRequestSchema>;

// Fill value type
export interface FillValue {
  value: string;
  reason: string;
}

// Response types
export interface GenerateFillResponse {
  success: boolean;
  data?: Record<string, FillValue>;
  error?: string;
}

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  checks: {
    redis?: {
      status: "ok" | "error";
      message?: string;
    };
    openai?: {
      status: "ok" | "error";
      message?: string;
    };
  };
}

// OpenAI types
export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIRequest {
  model: string;
  temperature: number;
  response_format: { type: string };
  messages: OpenAIMessage[];
  max_tokens?: number;
}

export interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

// Rate limit types
export interface RateLimitRecord {
  count: number;
  resetTime: number;
}
