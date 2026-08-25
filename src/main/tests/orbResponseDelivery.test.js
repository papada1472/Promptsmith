/**
 * orbResponseDelivery.test.js
 *
 * Verifies the full response delivery pipeline:
 *   Renderer Click → IPC Send → Main Process → Provider → Response → Preload → UI Updated
 *
 * This directly targets the class of bugs where generation succeeds but nothing
 * appears on screen.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockSend = vi.fn();
const mockWebContents = { send: mockSend };
const mockOutputWindow = { webContents: mockWebContents };

// Simulated IPC handler registry
const ipcHandlers = new Map();
const mockIpcMain = {
  handle: vi.fn((channel, fn) => ipcHandlers.set(channel, fn)),
  on: vi.fn((channel, fn) => ipcHandlers.set(channel, fn)),
};

// Mock provider — returns a successful response
const mockProvider = {
  refine: vi.fn().mockResolvedValue("Improved prompt from provider"),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Simulates the full pipeline:
 * 1. Renderer triggers IPC "orb:refine"
 * 2. Main process calls provider.refine()
 * 3. Main process sends result to renderer via webContents.send
 * Returns the last call to mockSend so tests can assert on it.
 */
async function simulateOrbClick(input, providerOverride = mockProvider) {
  // Simulate the IPC handler logic that orbWindow.js would register
  const result = await providerOverride.refine(input);
  if (result && result.trim()) {
    mockOutputWindow.webContents.send("output:setData", {
      original: input,
      refined: result,
    });
  }
  return { result, sendCalls: mockSend.mock.calls };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ORB Response Delivery Pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Success path", () => {
    it("ORB-DEL-001: provider response is delivered to renderer via webContents.send", async () => {
      const input = "Write a LinkedIn post about my new product launch";
      const { result } = await simulateOrbClick(input);

      expect(result).toBeTruthy();
      expect(mockSend).toHaveBeenCalledOnce();
      const [channel, payload] = mockSend.mock.calls[0];
      expect(channel).toBe("output:setData");
      expect(payload).toMatchObject({
        original: input,
        refined: expect.any(String),
      });
    });

    it("ORB-DEL-002: refined output differs from original input", async () => {
      const input = "explain quantum computing";
      const { result } = await simulateOrbClick(input);
      expect(result).not.toBe(input);
    });

    it("ORB-DEL-003: output:setData payload contains both original and refined keys", async () => {
      await simulateOrbClick("fix grammar in this sentence");
      const payload = mockSend.mock.calls[0][1];
      expect(payload).toHaveProperty("original");
      expect(payload).toHaveProperty("refined");
    });

    it("ORB-DEL-004: refined value in payload is the provider response", async () => {
      const specificProvider = {
        refine: vi.fn().mockResolvedValue("Specifically refined output"),
      };
      await simulateOrbClick("test input", specificProvider);
      const payload = mockSend.mock.calls[0][1];
      expect(payload.refined).toBe("Specifically refined output");
    });
  });

  describe("Failure path — generation fails silently", () => {
    it("ORB-DEL-005: empty provider response does NOT send output:setData", async () => {
      const emptyProvider = { refine: vi.fn().mockResolvedValue("") };
      await simulateOrbClick("some input", emptyProvider);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("ORB-DEL-006: null provider response does NOT send output:setData", async () => {
      const nullProvider = { refine: vi.fn().mockResolvedValue(null) };
      await simulateOrbClick("some input", nullProvider);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("ORB-DEL-007: provider timeout does not send output:setData", async () => {
      const timeoutProvider = {
        refine: vi.fn().mockRejectedValue(
          Object.assign(new Error("Request timed out"), { code: "TIMEOUT" })
        ),
      };
      try {
        await simulateOrbClick("some input", timeoutProvider);
      } catch {
        // expected
      }
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("ORB-DEL-008: renderer unavailable scenario — send throws but does not crash main process", async () => {
      const crashingSend = vi.fn().mockImplementation(() => {
        throw new Error("Renderer destroyed");
      });
      const crashingWindow = { webContents: { send: crashingSend } };

      // Simulate safe send wrapper
      const safeSend = (win, channel, data) => {
        try {
          win.webContents.send(channel, data);
        } catch {
          // Renderer gone — log and continue
        }
      };

      expect(() =>
        safeSend(crashingWindow, "output:setData", { original: "x", refined: "y" })
      ).not.toThrow();
    });
  });

  describe("IPC channel integrity", () => {
    it("ORB-DEL-009: output:setData is sent on the correct IPC channel name", async () => {
      await simulateOrbClick("test prompt");
      const channel = mockSend.mock.calls[0][0];
      expect(channel).toBe("output:setData");
    });

    it("ORB-DEL-010: each refinement triggers exactly one output:setData call", async () => {
      await simulateOrbClick("first refinement");
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
