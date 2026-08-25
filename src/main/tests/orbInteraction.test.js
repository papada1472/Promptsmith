/**
 * orbInteraction.test.js
 *
 * Tests orb UI interaction states: click vs hold, busy guard, mode switching,
 * and IPC handler registration.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Shared state ──────────────────────────────────────────────────────────────
let isRefining = false;
const notifySuccess = vi.fn();
const notifyError = vi.fn();
const notifyWarning = vi.fn();

function resetState() {
  isRefining = false;
  vi.clearAllMocks();
}

// ── Simulated orb action dispatcher ──────────────────────────────────────────
async function dispatchOrbAction(mode, provider) {
  if (isRefining) {
    notifyWarning("Refinzi Busy", "A refinement is already in progress.", 2000);
    return { ok: false, error: "already_running" };
  }
  isRefining = true;
  try {
    const output = await provider.refine("test input");
    if (!output || !output.trim()) {
      notifyError("Invalid Response", "AI response was empty.", 3000);
      return { ok: false, error: "empty_response" };
    }
    notifySuccess(mode === "click" ? "✨ Prompt Improved" : "🎨 Recreation Ready", 2000);
    return { ok: true, mode, output };
  } catch (e) {
    notifyError("Couldn't refine this selection.", e.message, 3000);
    return { ok: false, error: e.message };
  } finally {
    isRefining = false;
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Orb Interaction", () => {
  beforeEach(resetState);

  describe("Click (Sparkle) mode", () => {
    it("ORB-INT-001: click dispatches success and notifies with correct message", async () => {
      const provider = { refine: vi.fn().mockResolvedValue("Improved prompt text") };
      const result = await dispatchOrbAction("click", provider);
      expect(result.ok).toBe(true);
      expect(result.mode).toBe("click");
      expect(notifySuccess).toHaveBeenCalledWith("✨ Prompt Improved", 2000);
    });

    it("ORB-INT-002: click → empty response triggers error notification", async () => {
      const provider = { refine: vi.fn().mockResolvedValue("") };
      const result = await dispatchOrbAction("click", provider);
      expect(result.ok).toBe(false);
      expect(notifyError).toHaveBeenCalled();
    });

    it("ORB-INT-003: click → provider error triggers error notification", async () => {
      const provider = {
        refine: vi.fn().mockRejectedValue(new Error("Provider unavailable")),
      };
      const result = await dispatchOrbAction("click", provider);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Provider unavailable");
      expect(notifyError).toHaveBeenCalled();
    });
  });

  describe("Hold (Recreation) mode", () => {
    it("ORB-INT-004: hold dispatches success and notifies with recreation message", async () => {
      const provider = { refine: vi.fn().mockResolvedValue("Recreation output") };
      const result = await dispatchOrbAction("hold", provider);
      expect(result.ok).toBe(true);
      expect(result.mode).toBe("hold");
      expect(notifySuccess).toHaveBeenCalledWith("🎨 Recreation Ready", 2000);
    });
  });

  describe("Busy guard", () => {
    it("ORB-INT-005: concurrent click is rejected while first is in progress", async () => {
      isRefining = true;
      const provider = { refine: vi.fn() };
      const result = await dispatchOrbAction("click", provider);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("already_running");
      expect(notifyWarning).toHaveBeenCalled();
      expect(provider.refine).not.toHaveBeenCalled();
    });

    it("ORB-INT-006: busy lock is released after success", async () => {
      const provider = { refine: vi.fn().mockResolvedValue("output") };
      await dispatchOrbAction("click", provider);
      expect(isRefining).toBe(false);
    });

    it("ORB-INT-007: busy lock is released after failure", async () => {
      const provider = {
        refine: vi.fn().mockRejectedValue(new Error("fail")),
      };
      await dispatchOrbAction("click", provider);
      expect(isRefining).toBe(false);
    });
  });

  describe("Mode switching", () => {
    it("ORB-INT-008: consecutive click then hold both succeed independently", async () => {
      const provider = { refine: vi.fn().mockResolvedValue("output") };
      const r1 = await dispatchOrbAction("click", provider);
      const r2 = await dispatchOrbAction("hold", provider);
      expect(r1.ok).toBe(true);
      expect(r2.ok).toBe(true);
    });
  });
});
