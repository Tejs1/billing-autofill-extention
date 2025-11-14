import { describe, it, expect, beforeAll } from "bun:test";
import { validateRequestBody } from "./validation.js";
import { GenerateFillRequestSchema } from "../types/index.js";

describe("Validation Middleware", () => {
  beforeAll(() => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.SERVER_API_KEY = "test-server-key-1234567890123456";
  });

  describe("validateRequestBody", () => {
    it("should validate correct request body", async () => {
      const body = {
        fields: [
          {
            id: "1",
            name: "email",
            label: "Email",
            type: "email",
          },
        ],
      };

      const req = new Request("http://localhost:3000/api/generate-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await validateRequestBody(req, GenerateFillRequestSchema);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.fields).toHaveLength(1);
    });

    it("should reject invalid request body", async () => {
      const body = {
        fields: "not-an-array",
      };

      const req = new Request("http://localhost:3000/api/generate-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await validateRequestBody(req, GenerateFillRequestSchema);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject empty fields array", async () => {
      const body = {
        fields: [],
      };

      const req = new Request("http://localhost:3000/api/generate-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await validateRequestBody(req, GenerateFillRequestSchema);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Array must contain at least 1 element");
    });

    it("should reject too many fields", async () => {
      const body = {
        fields: Array.from({ length: 51 }, (_, i) => ({
          id: `${i}`,
          name: `field${i}`,
          label: `Field ${i}`,
          type: "text",
        })),
      };

      const req = new Request("http://localhost:3000/api/generate-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await validateRequestBody(req, GenerateFillRequestSchema);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Array must contain at most 50 element");
    });
  });
});
