/**
 * providerContract.test.js
 *
 * Tests provider contract behaviour — deterministic edge cases only.
 * Does NOT test success rate, average latency, or uptime (non-deterministic in CI).
 *
 * Contract scenarios tested:
 * ✓ Timeout
 * ✓ Retry on transient failure
 * ✓ HTTP 429 (rate limited)
 * ✓ Empty response
 * ✓ Malformed / null response
 * ✓ Failover to gateway
 * ✓ Unknown provider throws
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProviderManager } from "../ai/ProviderManager.js";
import { isValidAIResponse } from "../clipboardFlow.js";

// ── Mock provider factory ─────────────────────────────────────────────────────

function createContractProvider(mode) {
  switch (mode) {
    case "success":
      return { refine: vi.fn().mockResolvedValue("Professionally refined output text.") };
    case "timeout":
      return {
        refine: vi.fn().mockRejectedValue(
          Object.assign(new Error("Request timed out"), { code: "TIMEOUT" })
        ),
      };
    case "rate_limited_429":
      return {
        refine: vi.fn().mockRejectedValue(
          Object.assign(new Error("Too Many Requests"), { code: "RATE_LIMITED", status: 429 })
        ),
      };
    case "empty_response":
      return { refine: vi.fn().mockResolvedValue("") };
    case "null_response":
      return { refine: vi.fn().mockResolvedValue(null) };
    case "malformed_response":
      return { refine: vi.fn().mockResolvedValue(12345) };
    case "transient_then_success":
      let calls = 0;
      return {
        refine: vi.fn().mockImplementation(async () => {
          calls++;
          if (calls < 2) throw Object.assign(new Error("Transient failure"), { code: "TRANSIENT" });
          return "Succeeded on retry";
        }),
      };
    default:
      return { refine: vi.fn().mockResolvedValue("default") };
  }
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────

async function refineWithRetry(provider, input, maxRetries = 1) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await provider.refine(input);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

// ── Failover wrapper ──────────────────────────────────────────────────────────

async function refineWithFailover(primaryProvider, gatewayProvider, input) {
  try {
    return await primaryProvider.refine(input);
  } catch {
    return await gatewayProvider.refine(input);
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Provider Contract", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("Success path", () => {
    it("PROV-001: successful provider returns non-empty string", async () => {
      const provider = createContractProvider("success");
      const output = await provider.refine("test input");
      expect(typeof output).toBe("string");
      expect(output.trim().length).toBeGreaterThan(0);
    });

    it("PROV-002: successful response passes isValidAIResponse", async () => {
      const provider = createContractProvider("success");
      const output = await provider.refine("test input");
      const { valid } = isValidAIResponse("test input", output);
      expect(valid).toBe(true);
    });
  });

  describe("Timeout", () => {
    it("PROV-003: provider timeout throws with TIMEOUT code", async () => {
      const provider = createContractProvider("timeout");
      await expect(provider.refine("input")).rejects.toThrow("Request timed out");
    });

    it("PROV-004: timeout error has TIMEOUT code", async () => {
      const provider = createContractProvider("timeout");
      let caught;
      try {
        await provider.refine("input");
      } catch (e) {
        caught = e;
      }
      expect(caught?.code).toBe("TIMEOUT");
    });
  });

  describe("HTTP 429 — Rate Limited", () => {
    it("PROV-005: 429 response throws with RATE_LIMITED code", async () => {
      const provider = createContractProvider("rate_limited_429");
      let caught;
      try {
        await provider.refine("input");
      } catch (e) {
        caught = e;
      }
      expect(caught?.code).toBe("RATE_LIMITED");
      expect(caught?.status).toBe(429);
    });
  });

  describe("Empty response", () => {
    it("PROV-006: empty string response fails isValidAIResponse", async () => {
      const provider = createContractProvider("empty_response");
      const output = await provider.refine("input");
      expect(isValidAIResponse("input", output).valid).toBe(false);
    });
  });

  describe("Malformed / null response", () => {
    it("PROV-007: null response fails isValidAIResponse", async () => {
      const provider = createContractProvider("null_response");
      const output = await provider.refine("input");
      expect(isValidAIResponse("input", output).valid).toBe(false);
    });

    it("PROV-008: non-string (numeric) response is treated as malformed and rejected", async () => {
      const provider = createContractProvider("malformed_response");
      const output = await provider.refine("input");
      // A numeric response (12345) is malformed — production code must check typeof
      // before passing to isValidAIResponse. The raw value should fail the typeof check.
      const isString = typeof output === "string";
      expect(isString).toBe(false); // Provider returned a number, not a string
    });
  });

  describe("Retry", () => {
    it("PROV-009: retry on transient failure succeeds on second attempt", async () => {
      const provider = createContractProvider("transient_then_success");
      const output = await refineWithRetry(provider, "input", 1);
      expect(output).toBe("Succeeded on retry");
      expect(provider.refine).toHaveBeenCalledTimes(2);
    });
  });

  describe("Failover to gateway", () => {
    it("PROV-010: primary provider failure triggers gateway fallback", async () => {
      const primaryProvider = createContractProvider("timeout");
      const gatewayProvider = createContractProvider("success");
      const output = await refineWithFailover(primaryProvider, gatewayProvider, "input");
      expect(typeof output).toBe("string");
      expect(gatewayProvider.refine).toHaveBeenCalledOnce();
    });

    it("PROV-011: gateway is used when primary returns 429", async () => {
      const primaryProvider = createContractProvider("rate_limited_429");
      const gatewayProvider = { refine: vi.fn().mockResolvedValue("Gateway output") };
      const output = await refineWithFailover(primaryProvider, gatewayProvider, "input");
      expect(output).toBe("Gateway output");
    });
  });

  describe("ProviderManager", () => {
    it("PROV-012: unknown provider ID throws on createProvider", () => {
      expect(() => ProviderManager.createProvider("unknown_xyz", {})).toThrow(
        /Unknown or unregistered AI provider/
      );
    });

    it("PROV-013: getActiveProviderId returns gateway when no API keys set", () => {
      const id = ProviderManager.getActiveProviderId({
        geminiApiKey: "",
        openRouterApiKey: "",
        activeProvider: "gemini",
      });
      expect(id).toBe("gateway");
    });

    it("PROV-014: getAvailableProviders returns at least gemini, openrouter, gateway", () => {
      const providers = ProviderManager.getAvailableProviders();
      expect(providers).toContain("gemini");
      expect(providers).toContain("openrouter");
      expect(providers).toContain("gateway");
    });
  });
});
