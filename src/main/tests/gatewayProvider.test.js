import { describe, expect, it, vi, afterEach } from "vitest";
import { GatewayProvider } from "../ai/GatewayProvider.js";

describe("GatewayProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns the gateway's refinedText response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ refinedText: "Refined prompt" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new GatewayProvider({ systemPrompt: "System", timeoutMs: 100 });
    await expect(provider.refine("Original prompt")).resolves.toBe("Refined prompt");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("normalizes an aborted request to the TIMEOUT error contract", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url, options) => new Promise((_, reject) => {
      options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));

    const provider = new GatewayProvider({ systemPrompt: "System", timeoutMs: 25 });
    const timeoutExpectation = expect(provider.refine("Original prompt")).rejects.toMatchObject({
      code: "TIMEOUT",
      message: "Gateway request timed out",
    });
    await vi.advanceTimersByTimeAsync(25);

    await timeoutExpectation;
  });
});
