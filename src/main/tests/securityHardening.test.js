import { describe, it, expect } from "vitest";
import { redactSecrets } from "../logger.js";
import { isPrivateOrReservedIP } from "../artifactAnalyzer.js";

describe("Security Hardening & Privacy Shielding", () => {
  describe("Secret Redaction (redactSecrets)", () => {
    it("redacts standard OpenAI API keys", () => {
      const input = "Connecting to OpenAI with key sk-proj-1234567890abcdefghijklmnop";
      const cleaned = redactSecrets(input);
      expect(cleaned).not.toContain("sk-proj-1234567890abcdefghijklmnop");
      expect(cleaned).toContain("[REDACTED_SECRET]");
    });

    it("redacts Anthropic Claude API keys", () => {
      const input = "Auth header sk-ant-api03-1234567890abcdefghijklmnop in request";
      const cleaned = redactSecrets(input);
      expect(cleaned).not.toContain("sk-ant-api03-1234567890abcdefghijklmnop");
      expect(cleaned).toContain("[REDACTED_SECRET]");
    });

    it("redacts Google Gemini AIza API keys", () => {
      const input = "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyD1234567890abcdefghijklmnopqrstuvw";
      const cleaned = redactSecrets(input);
      expect(cleaned).not.toContain("AIzaSyD1234567890abcdefghijklmnopqrstuvw");
      expect(cleaned).toContain("[REDACTED_SECRET]");
    });

    it("redacts Groq and xAI API keys", () => {
      const inputGroq = "Authorization: gsk_1234567890abcdefghijklmnop";
      const inputXai = "xAI token: xai-1234567890abcdefghijklmnop";
      expect(redactSecrets(inputGroq)).toContain("[REDACTED_SECRET]");
      expect(redactSecrets(inputXai)).toContain("[REDACTED_SECRET]");
    });

    it("redacts Bearer tokens", () => {
      const input = "Headers: { Authorization: 'Bearer secret_token_1234567890' }";
      const cleaned = redactSecrets(input);
      expect(cleaned).not.toContain("secret_token_1234567890");
      expect(cleaned).toContain("Bearer ••••••••[REDACTED]");
    });

    it("recursively redacts secrets in objects and arrays", () => {
      const obj = {
        name: "Refinzi",
        apiKey: "sk-proj-secretkey1234567890",
        nested: {
          token: "ghp_1234567890abcdefghijklmnopqrst",
          notes: "Using key sk-ant-1234567890abcdef"
        },
        providers: ["gemini", "Bearer secrettoken12345"]
      };

      const cleaned = redactSecrets(obj);
      expect(cleaned.apiKey).toBe("••••••••••••[REDACTED]");
      expect(cleaned.nested.token).toBe("••••••••••••[REDACTED]");
      expect(cleaned.nested.notes).not.toContain("sk-ant-1234567890abcdef");
      expect(cleaned.providers[1]).toContain("Bearer ••••••••[REDACTED]");
    });

    it("safely handles circular references without throwing", () => {
      const circular = { name: "test" };
      circular.self = circular;
      expect(() => redactSecrets(circular)).not.toThrow();
      const cleaned = redactSecrets(circular);
      expect(cleaned.name).toBe("test");
      expect(cleaned.self).toBe("[Circular]");
    });

    it("redacts secrets embedded in Error instances and stack traces", () => {
      const err = new Error("Failed to connect with key sk-1234567890abcdefghijklmnop");
      err.stack = "Error: Failed to connect with key sk-1234567890abcdefghijklmnop\n    at Provider.refine (/app/src/main/ai/Provider.js:10:5)";
      
      const cleaned = redactSecrets(err);
      expect(cleaned.message).not.toContain("sk-1234567890abcdefghijklmnop");
      expect(cleaned.stack).not.toContain("sk-1234567890abcdefghijklmnop");
    });
  });

  describe("Network & Protocol Guard Validation", () => {
    it("blocks localhost and private IPv4 ranges", () => {
      expect(isPrivateOrReservedIP("127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("10.0.0.5")).toBe(true);
      expect(isPrivateOrReservedIP("192.168.1.100")).toBe(true);
      expect(isPrivateOrReservedIP("172.16.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("169.254.169.254")).toBe(true);
    });

    it("allows standard public IPs", () => {
      expect(isPrivateOrReservedIP("140.82.121.4")).toBe(false);
      expect(isPrivateOrReservedIP("8.8.8.8")).toBe(false);
    });
  });
});
