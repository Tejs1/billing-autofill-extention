import { describe, it, expect } from "bun:test";
import { loadConfig } from "./index.js";

describe("Configuration", () => {
  it("should load and validate config with required env vars", () => {
    // Set minimum required env vars
    process.env.OPENAI_API_KEY = "sk-test-key-123";
    process.env.SERVER_API_KEY = "test-server-api-key-must-be-32-chars-long";
    delete process.env.PORT; // Ensure we use default

    const config = loadConfig();

    expect(config.OPENAI_API_KEY).toBe("sk-test-key-123");
    expect(config.SERVER_API_KEY).toBe("test-server-api-key-must-be-32-chars-long");
    expect(config.PORT).toBeGreaterThan(0); // Just check it's a valid port
    expect(config.OPENAI_MODEL).toBe("gpt-4o-mini"); // default
  });

  it("should use custom values when provided", () => {
    process.env.OPENAI_API_KEY = "sk-test-key-123";
    process.env.SERVER_API_KEY = "test-server-api-key-must-be-32-chars-long";
    process.env.PORT = "4000";
    process.env.OPENAI_MODEL = "gpt-4";
    process.env.LOG_LEVEL = "debug";

    const config = loadConfig();

    expect(config.PORT).toBe(4000);
    expect(config.OPENAI_MODEL).toBe("gpt-4");
    expect(config.LOG_LEVEL).toBe("debug");
  });

  it("should transform string numbers to numbers", () => {
    process.env.OPENAI_API_KEY = "sk-test-key-123";
    process.env.SERVER_API_KEY = "test-server-api-key-must-be-32-chars-long";
    process.env.RATE_LIMIT_WINDOW = "120000";
    process.env.RATE_LIMIT_MAX_REQUESTS = "50";

    const config = loadConfig();

    expect(typeof config.RATE_LIMIT_WINDOW).toBe("number");
    expect(config.RATE_LIMIT_WINDOW).toBe(120000);
    expect(typeof config.RATE_LIMIT_MAX_REQUESTS).toBe("number");
    expect(config.RATE_LIMIT_MAX_REQUESTS).toBe(50);
  });
});
