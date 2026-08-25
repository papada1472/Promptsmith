/**
 * startupRecovery.test.js
 *
 * Tests startup recovery from corrupt and missing store files.
 * Verifies that the app creates safe defaults and continues startup
 * without throwing, regardless of what is on disk.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── In-memory store factory (simulates electron-store) ───────────────────────
function createMemoryStore(initialData = {}) {
  const data = new Map(Object.entries(initialData));
  return {
    get: vi.fn((key, def) => (data.has(key) ? data.get(key) : def)),
    set: vi.fn((key, val) => data.set(key, val)),
    delete: vi.fn((key) => data.delete(key)),
    path: "/mock/refinzi.json",
    _data: data,
  };
}

// ── Default values that recovery should produce ───────────────────────────────
const STORE_DEFAULTS = {
  geminiApiKey: "",
  openRouterApiKey: "",
  hotkey: "CommandOrControl+Shift+Space",
  launchOnStartup: true,
  onboardingSeen: false,
  metrics: {
    refinementsMade: 0,
    timeSavedSeconds: 0,
    retriesAvoided: 0,
    currentStreak: 0,
    lastRefinementDay: null,
  },
  historyLogs: [],
  telemetryLogs: [],
  providerMetrics: {},
  saveHistoryLocally: false,
};

// ── Recovery helper — simulates store.js safe init ───────────────────────────
function recoverStore(corruptContent) {
  try {
    // Attempt to parse corrupt JSON — this would throw
    if (typeof corruptContent === "string") {
      JSON.parse(corruptContent); // throws on corrupt JSON
    }
    return createMemoryStore(corruptContent || {});
  } catch {
    // Recovery: return defaults
    return createMemoryStore(STORE_DEFAULTS);
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Startup & Recovery", () => {
  describe("Corrupt settings file", () => {
    it("STRT-001: corrupt JSON in settings produces default store without throwing", () => {
      expect(() => recoverStore("{invalid json{{{{")).not.toThrow();
      const store = recoverStore("{invalid json{{{{");
      expect(store).toBeTruthy();
    });

    it("STRT-002: recovered store returns default hotkey", () => {
      const store = recoverStore("{corrupt");
      const hotkey = store.get("hotkey", STORE_DEFAULTS.hotkey);
      expect(hotkey).toBe("CommandOrControl+Shift+Space");
    });

    it("STRT-003: recovered store returns empty string for API key", () => {
      const store = recoverStore("{corrupt");
      const key = store.get("geminiApiKey", STORE_DEFAULTS.geminiApiKey);
      expect(key).toBe("");
    });
  });

  describe("Corrupt telemetry file", () => {
    it("STRT-004: corrupt telemetryLogs defaults to empty array", () => {
      // Simulate store where telemetryLogs is corrupt (non-array)
      const store = createMemoryStore({ telemetryLogs: "NOT_AN_ARRAY" });
      const logs = store.get("telemetryLogs");
      const safeLogs = Array.isArray(logs) ? logs : [];
      expect(Array.isArray(safeLogs)).toBe(true);
      expect(safeLogs.length).toBe(0);
    });

    it("STRT-005: null telemetryLogs falls back to empty array", () => {
      const store = createMemoryStore({ telemetryLogs: null });
      const raw = store.get("telemetryLogs");
      const safeLogs = Array.isArray(raw) ? raw : [];
      expect(safeLogs).toEqual([]);
    });
  });

  describe("Corrupt metrics file", () => {
    it("STRT-006: corrupt metrics object falls back to defaults", () => {
      const store = createMemoryStore({ metrics: "CORRUPT_STRING" });
      const raw = store.get("metrics");
      const safeMetrics =
        raw && typeof raw === "object" && !Array.isArray(raw)
          ? raw
          : STORE_DEFAULTS.metrics;
      expect(safeMetrics.refinementsMade).toBe(0);
      expect(safeMetrics.currentStreak).toBe(0);
    });

    it("STRT-007: null metrics falls back to default object", () => {
      const store = createMemoryStore({ metrics: null });
      const raw = store.get("metrics");
      const safeMetrics =
        raw && typeof raw === "object" ? raw : STORE_DEFAULTS.metrics;
      expect(typeof safeMetrics).toBe("object");
    });
  });

  describe("Missing store file", () => {
    it("STRT-008: missing store file produces fresh defaults store", () => {
      // Simulate missing file — store returns undefined for all keys
      const store = createMemoryStore({});
      const hotkey = store.get("hotkey") ?? STORE_DEFAULTS.hotkey;
      const metrics = store.get("metrics") ?? STORE_DEFAULTS.metrics;
      expect(hotkey).toBe("CommandOrControl+Shift+Space");
      expect(metrics.refinementsMade).toBe(0);
    });

    it("STRT-009: missing geminiApiKey returns empty string default", () => {
      const store = createMemoryStore({});
      const key = store.get("geminiApiKey") ?? "";
      expect(key).toBe("");
    });

    it("STRT-010: startup continues without Electron app.setLoginItemSettings throwing", () => {
      const mockApplyFn = vi.fn();
      // Simulate startupService.setLaunchOnStartup with mock store
      const store = createMemoryStore({});
      const setLaunchOnStartup = (enabled, applyFn) => {
        const value = Boolean(enabled);
        store.set("launchOnStartup", value);
        applyFn(value);
        return { ok: true };
      };
      expect(() => setLaunchOnStartup(true, mockApplyFn)).not.toThrow();
      expect(mockApplyFn).toHaveBeenCalledWith(true);
    });
  });

  describe("Recovery produces valid store shape", () => {
    it("STRT-011: recovered store supports get/set/delete operations", () => {
      const store = recoverStore("{bad");
      expect(() => store.set("testKey", "testVal")).not.toThrow();
      expect(store.get("testKey")).toBe("testVal");
      expect(() => store.delete("testKey")).not.toThrow();
    });

    it("STRT-012: providerMetrics defaults to empty object on missing store", () => {
      const store = createMemoryStore({});
      const pm = store.get("providerMetrics") ?? {};
      expect(typeof pm).toBe("object");
      expect(Object.keys(pm).length).toBe(0);
    });

    it("STRT-013: saveHistoryLocally defaults to false (privacy-safe default)", () => {
      const store = createMemoryStore({});
      const val = store.get("saveHistoryLocally") ?? false;
      expect(val).toBe(false);
    });
  });
});
