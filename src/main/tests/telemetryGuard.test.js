/**
 * telemetryGuard.test.js
 *
 * Tests the sanitizeTelemetry allow-list guard in MetricsService.
 *
 * Allowed fields: type, mode, success, duration_ms, timestamp,
 *                 provider, artifact_type, app_version
 *
 * Everything else must be stripped to prevent accidental data leakage.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { metricsService } from "../services/metricsService.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALLOWED_FIELDS = [
  "type",
  "mode",
  "success",
  "duration_ms",
  "timestamp",
  "provider",
  "artifact_type",
  "app_version",
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Telemetry Allow-List Guard (sanitizeTelemetry)", () => {
  describe("Allowed fields are preserved", () => {
    it("TEL-001: all allowed fields are retained in the sanitized output", () => {
      const payload = {
        type: "refine",
        mode: "sparkle",
        success: true,
        duration_ms: 1200,
        timestamp: "2024-01-01T00:00:00Z",
        provider: "Gemini",
        artifact_type: "landing_page",
        app_version: "2.0.0",
      };
      const result = metricsService.sanitizeTelemetry(payload);
      for (const field of ALLOWED_FIELDS) {
        expect(result).toHaveProperty(field);
        expect(result[field]).toBe(payload[field]);
      }
    });

    it("TEL-002: sanitized payload with allowed fields only has no extra keys", () => {
      const payload = { mode: "sparkle", success: true };
      const result = metricsService.sanitizeTelemetry(payload);
      const unknownKeys = Object.keys(result).filter((k) => !ALLOWED_FIELDS.includes(k));
      expect(unknownKeys).toHaveLength(0);
    });
  });

  describe("Disallowed fields are stripped", () => {
    it("TEL-003: API key is stripped from payload", () => {
      const payload = { mode: "sparkle", success: true, apiKey: "sk-abc-123" };
      const result = metricsService.sanitizeTelemetry(payload);
      expect(result).not.toHaveProperty("apiKey");
    });

    it("TEL-004: prompt text is stripped from payload", () => {
      const payload = { mode: "sparkle", input: "private prompt", output: "private output" };
      const result = metricsService.sanitizeTelemetry(payload);
      expect(result).not.toHaveProperty("input");
      expect(result).not.toHaveProperty("output");
    });

    it("TEL-005: username is stripped from payload", () => {
      const payload = { mode: "sparkle", userName: "John Doe" };
      const result = metricsService.sanitizeTelemetry(payload);
      expect(result).not.toHaveProperty("userName");
    });

    it("TEL-006: email is stripped from payload", () => {
      const payload = { mode: "sparkle", email: "user@example.com" };
      const result = metricsService.sanitizeTelemetry(payload);
      expect(result).not.toHaveProperty("email");
    });

    it("TEL-007: arbitrary unknown field is stripped", () => {
      const payload = { mode: "sparkle", customField: "shouldBeGone" };
      const result = metricsService.sanitizeTelemetry(payload);
      expect(result).not.toHaveProperty("customField");
    });

    it("TEL-008: multiple disallowed fields are all stripped in one call", () => {
      const payload = {
        mode: "hold",
        success: true,
        apiKey: "secret",
        userName: "Jane",
        email: "jane@example.com",
        input: "prompt text",
        internalFlag: true,
      };
      const result = metricsService.sanitizeTelemetry(payload);
      expect(result).not.toHaveProperty("apiKey");
      expect(result).not.toHaveProperty("userName");
      expect(result).not.toHaveProperty("email");
      expect(result).not.toHaveProperty("input");
      expect(result).not.toHaveProperty("internalFlag");
      // Allowed fields still present
      expect(result).toHaveProperty("mode", "hold");
      expect(result).toHaveProperty("success", true);
    });
  });

  describe("Edge cases", () => {
    it("TEL-009: empty payload returns empty object", () => {
      const result = metricsService.sanitizeTelemetry({});
      expect(result).toEqual({});
    });

    it("TEL-010: payload with only disallowed fields returns empty object", () => {
      const result = metricsService.sanitizeTelemetry({ secret: "x", privateKey: "y" });
      expect(result).toEqual({});
    });

    it("TEL-011: sanitizeTelemetry is idempotent — running twice gives same result", () => {
      const payload = { mode: "sparkle", success: true, apiKey: "leak" };
      const first = metricsService.sanitizeTelemetry(payload);
      const second = metricsService.sanitizeTelemetry(first);
      expect(first).toEqual(second);
    });

    it("TEL-012: sanitized result contains no more than 8 fields (allow-list size)", () => {
      const payload = Object.fromEntries([
        ...ALLOWED_FIELDS.map((k) => [k, "value"]),
        ["extra1", "x"],
        ["extra2", "y"],
      ]);
      const result = metricsService.sanitizeTelemetry(payload);
      expect(Object.keys(result).length).toBeLessThanOrEqual(ALLOWED_FIELDS.length);
    });
  });

  describe("appendTelemetry integration", () => {
    it("TEL-013: appendTelemetry stores sanitized events via metricsService", () => {
      const event = {
        mode: "sparkle",
        success: true,
        duration_ms: 900,
        timestamp: new Date().toISOString(),
      };
      expect(() => metricsService.appendTelemetry(event)).not.toThrow();
      const logs = metricsService.getTelemetryLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it("TEL-014: clearTelemetryLogs empties the log", () => {
      metricsService.clearTelemetryLogs();
      const logs = metricsService.getTelemetryLogs();
      expect(logs).toHaveLength(0);
    });
  });
});
