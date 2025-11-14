import type { ExtensionError, ServerConfig } from "./types.js";
import { ErrorType } from "./types.js";

// Default configuration
export const DEFAULT_SERVER_URL = "http://localhost:3000";
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Get server configuration from storage
 */
export async function getServerConfig(): Promise<ServerConfig> {
  const { serverUrl, serverApiKey } = await chrome.storage.local.get([
    "serverUrl",
    "serverApiKey",
  ]);

  return {
    serverUrl: serverUrl || DEFAULT_SERVER_URL,
    serverApiKey: serverApiKey || null,
  };
}

/**
 * Classify error type for better handling
 */
export function classifyError(
  error: Error,
  statusCode?: number,
): ExtensionError {
  const message = error.message;

  // Network errors
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return {
      type: ErrorType.NETWORK,
      message:
        "Cannot connect to server. Please check if the server is running and your network connection.",
      retryable: true,
    };
  }

  // Authentication errors
  if (
    statusCode === 401 ||
    message.includes("Unauthorized") ||
    message.includes("API key")
  ) {
    return {
      type: ErrorType.AUTH,
      message: "Authentication failed. Please check your API key in settings.",
      retryable: false,
    };
  }

  // Configuration errors
  if (message.includes("Missing") || message.includes("Configure")) {
    return {
      type: ErrorType.CONFIG,
      message:
        "Extension not configured. Please set up your server URL and API key in settings.",
      retryable: false,
    };
  }

  // Validation errors
  if (statusCode === 400 || message.includes("Validation")) {
    return {
      type: ErrorType.VALIDATION,
      message: "Invalid request data. Please try again.",
      retryable: false,
    };
  }

  // Rate limiting
  if (statusCode === 429) {
    return {
      type: ErrorType.VALIDATION,
      message: "Rate limit exceeded. Please wait a moment and try again.",
      retryable: true,
    };
  }

  // Server errors
  if (statusCode && statusCode >= 500) {
    return {
      type: ErrorType.NETWORK,
      message: "Server error. Please try again later.",
      retryable: true,
    };
  }

  // Unknown errors
  return {
    type: ErrorType.UNKNOWN,
    message: message || "An unexpected error occurred.",
    retryable: true,
  };
}

/**
 * Fetch with timeout support
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = REQUEST_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout. The server took too long to respond.");
    }
    throw error;
  }
}

/**
 * Show notification to user
 */
export function showNotification(
  title: string,
  message: string,
  type: "success" | "error" = "error",
): void {
  if (chrome.notifications) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon.png"),
      title,
      message,
      priority: type === "error" ? 2 : 1,
    });
  }
}

/**
 * Log error with context
 */
export function logError(context: string, error: unknown): void {
  console.error(`[AI Form Fill - ${context}]`, error);
}
