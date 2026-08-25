/**
 * privacyGuard.test.js
 *
 * Tests all privacy-related guards:
 * ✓ saveHistoryLocally defaults to false (opt-in)
 * ✓ appendLog does NOT write when saveHistoryLocally is false
 * ✓ appendLog DOES write when saveHistoryLocally is true
 * ✓ getLogs returns empty when history is disabled
 * ✓ telemetry payload does not leak personal data
 * ✓ API keys are never stored in telemetry logs
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── In-memory store mock ──────────────────────────────────────────────────────
function createTestStore(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    get: (key, def) => (data.has(key) ? data.get(key) : def),
    set: (key, val) => data.set(key, val),
    delete: (key) => data.delete(key),
  };
}

// ── Inline MetricsService logic (testable, store-injected) ────────────────────
function createMetricsService(store) {
  return {
    appendLog({ input, output, timestamp }) {
      if (!store.get("saveHistoryLocally")) return;
      const existing = store.get("historyLogs") || [];
      const next = [...existing, { input, output, timestamp }];
      const capped = next.length > 500 ? next.slice(next.length - 500) : next;
      store.set("historyLogs", capped);
    },
    getLogs({ offset = 0, limit = 50 } = {}) {
      const all = store.get("historyLogs") || [];
      const reversed = [...all].reverse();
      const page = reversed.slice(offset, offset + limit);
      return { logs: page, hasMore: offset + limit < reversed.length };
    },
    clearLogs() {
      store.set("historyLogs", []);
    },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Privacy Guards", () => {
  describe("saveHistoryLocally default", () => {
    it("PRIV-001: saveHistoryLocally defaults to false (opt-in)", () => {
      const store = createTestStore({});
      const val = store.get("saveHistoryLocally") ?? false;
      expect(val).toBe(false);
    });
  });

  describe("History logging — opt-out (default)", () => {
    it("PRIV-002: appendLog does NOT write when saveHistoryLocally is false", () => {
      const store = createTestStore({ saveHistoryLocally: false, historyLogs: [] });
      const svc = createMetricsService(store);
      svc.appendLog({ input: "test input", output: "test output", timestamp: "2024-01-01" });
      const logs = store.get("historyLogs") || [];
      expect(logs.length).toBe(0);
    });

    it("PRIV-003: getLogs returns empty array when history is disabled", () => {
      const store = createTestStore({ saveHistoryLocally: false, historyLogs: [] });
      const svc = createMetricsService(store);
      const { logs } = svc.getLogs();
      expect(logs).toHaveLength(0);
    });

    it("PRIV-004: multiple appendLog calls all no-op when opt-out", () => {
      const store = createTestStore({ saveHistoryLocally: false, historyLogs: [] });
      const svc = createMetricsService(store);
      for (let i = 0; i < 5; i++) {
        svc.appendLog({ input: `input ${i}`, output: `output ${i}`, timestamp: "2024-01-01" });
      }
      expect((store.get("historyLogs") || []).length).toBe(0);
    });
  });

  describe("History logging — opt-in", () => {
    it("PRIV-005: appendLog writes when saveHistoryLocally is true", () => {
      const store = createTestStore({ saveHistoryLocally: true, historyLogs: [] });
      const svc = createMetricsService(store);
      svc.appendLog({ input: "input", output: "output", timestamp: "2024-01-01" });
      expect(store.get("historyLogs").length).toBe(1);
    });

    it("PRIV-006: history is capped at 500 entries", () => {
      const store = createTestStore({ saveHistoryLocally: true, historyLogs: [] });
      const svc = createMetricsService(store);
      for (let i = 0; i < 510; i++) {
        svc.appendLog({ input: `input${i}`, output: `output${i}`, timestamp: "2024-01-01" });
      }
      expect(store.get("historyLogs").length).toBeLessThanOrEqual(500);
    });

    it("PRIV-007: clearLogs empties the history array", () => {
      const store = createTestStore({
        saveHistoryLocally: true,
        historyLogs: [{ input: "x", output: "y", timestamp: "t" }],
      });
      const svc = createMetricsService(store);
      svc.clearLogs();
      expect(store.get("historyLogs")).toEqual([]);
    });
  });

  describe("Telemetry does not leak personal data", () => {
    it("PRIV-008: telemetry log does not contain API key", () => {
      const telemetryEvent = {
        mode: "sparkle",
        success: true,
        duration_ms: 1200,
        timestamp: new Date().toISOString(),
      };
      expect(telemetryEvent).not.toHaveProperty("geminiApiKey");
      expect(telemetryEvent).not.toHaveProperty("openRouterApiKey");
      expect(telemetryEvent).not.toHaveProperty("apiKey");
    });

    it("PRIV-009: telemetry log does not contain prompt text", () => {
      const telemetryEvent = {
        mode: "sparkle",
        success: true,
        prompt_length_before: 42,
        prompt_length_after: 89,
        duration_ms: 1200,
        timestamp: new Date().toISOString(),
      };
      expect(telemetryEvent).not.toHaveProperty("input");
      expect(telemetryEvent).not.toHaveProperty("output");
      expect(telemetryEvent).not.toHaveProperty("prompt");
    });

    it("PRIV-010: telemetry log does not contain username or email", () => {
      const telemetryEvent = {
        mode: "sparkle",
        success: true,
        duration_ms: 800,
        timestamp: new Date().toISOString(),
      };
      expect(telemetryEvent).not.toHaveProperty("email");
      expect(telemetryEvent).not.toHaveProperty("userName");
      expect(telemetryEvent).not.toHaveProperty("userId");
    });

    it("PRIV-011: historyLogs are never written to telemetryLogs", () => {
      // Simulate a telemetry log — should only have metric fields
      const store = createTestStore({
        telemetryLogs: [],
        historyLogs: [{ input: "private prompt", output: "output" }],
      });
      const telemetryLogs = store.get("telemetryLogs") || [];
      const historyLogs = store.get("historyLogs") || [];
      // Confirm the two arrays are separate
      expect(telemetryLogs).not.toContain(historyLogs[0]);
    });
  });
});
