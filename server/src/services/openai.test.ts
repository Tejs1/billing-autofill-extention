import { describe, it, expect, beforeAll, mock } from "bun:test";
import { generateFillValues } from "./openai.js";
import type { FormField } from "../types/index.js";

describe("OpenAI Service", () => {
  beforeAll(() => {
    // Ensure env vars are set for testing
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test-key";
    process.env.SERVER_API_KEY = process.env.SERVER_API_KEY || "test-server-key-1234567890123456";
  });

  describe("generateFillValues", () => {
    it("should generate fill values for simple fields", async () => {
      const fields: FormField[] = [
        {
          id: "1",
          name: "email",
          label: "Email Address",
          type: "email",
        },
        {
          id: "2",
          name: "name",
          label: "Full Name",
          type: "text",
        },
      ];

      // Mock fetch to avoid actual API calls in tests
      const originalFetch = global.fetch;
      global.fetch = mock((url: string) => {
        if (url.includes("openai.com")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        "1": {
                          value: "test@example.com",
                          reason: "Valid email format",
                        },
                        "2": {
                          value: "John Doe",
                          reason: "Common full name format",
                        },
                      }),
                    },
                  },
                ],
              }),
              { status: 200 }
            )
          );
        }
        return originalFetch(url);
      }) as any;

      const result = await generateFillValues(fields);

      expect(result).toBeDefined();
      expect(result["1"]).toBeDefined();
      expect(result["1"].value).toBeTruthy();
      expect(result["2"]).toBeDefined();
      expect(result["2"].value).toBeTruthy();

      // Restore original fetch
      global.fetch = originalFetch;
    }, 10000);

    it("should cache identical requests", async () => {
      const fields: FormField[] = [
        {
          id: "test1",
          name: "test",
          label: "Test Field",
          type: "text",
        },
      ];

      // Mock fetch
      let callCount = 0;
      const originalFetch = global.fetch;
      global.fetch = mock(() => {
        callCount++;
        return Promise.resolve(
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      test1: {
                        value: "cached value",
                        reason: "test reason",
                      },
                    }),
                  },
                },
              ],
            }),
            { status: 200 }
          )
        );
      }) as any;

      // First call
      await generateFillValues(fields);
      const firstCallCount = callCount;

      // Second call with same fields should use cache
      await generateFillValues(fields);
      const secondCallCount = callCount;

      expect(secondCallCount).toBe(firstCallCount);

      // Restore
      global.fetch = originalFetch;
    }, 10000);
  });
});
