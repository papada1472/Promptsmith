import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { DeepSeekProvider } from "../ai/DeepSeekProvider.js";
import { ProviderManager } from "../ai/ProviderManager.js";

describe("DeepSeekProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("initializes with default model and maps aliases", () => {
    const p1 = new DeepSeekProvider({ apiKey: "sk-test-key" });
    expect(p1.model).toBe("deepseek-chat");

    const p2 = new DeepSeekProvider({ apiKey: "sk-test-key", model: "deepseek/deepseek-r1" });
    expect(p2.model).toBe("deepseek-reasoner");

    const p3 = new DeepSeekProvider({ apiKey: "sk-test-key", model: "deepseek/deepseek-chat" });
    expect(p3.model).toBe("deepseek-chat");
  });

  it("throws MISSING_API_KEY when no apiKey is supplied", async () => {
    const provider = new DeepSeekProvider({ apiKey: "" });
    await expect(provider.refine("Test text")).rejects.toMatchObject({
      code: "MISSING_API_KEY",
    });
  });

  it("throws EMPTY_INPUT on empty or whitespace-only input", async () => {
    const provider = new DeepSeekProvider({ apiKey: "sk-test-key" });
    await expect(provider.refine("   ")).rejects.toMatchObject({
      code: "EMPTY_INPUT",
    });
  });

  it("throws MEDIA_UNSUPPORTED when multimodal image is provided", async () => {
    const provider = new DeepSeekProvider({ apiKey: "sk-test-key" });
    await expect(provider.refine("Analyze this image", {
      media: { mimeType: "image/png", data: "base64data" }
    })).rejects.toMatchObject({
      code: "MEDIA_UNSUPPORTED",
    });
  });

  it("successfully calls DeepSeek API and parses response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        choices: [
          { message: { content: "Refined prompt output from DeepSeek" } }
        ]
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DeepSeekProvider({
      apiKey: "sk-test-12345",
      model: "deepseek-chat",
      systemPrompt: "You are a prompt engineer."
    });

    const result = await provider.refine("Make a landing page");
    expect(result).toBe("Refined prompt output from DeepSeek");
    expect(fetchMock).toHaveBeenCalledOnce();

    const [calledUrl, calledOptions] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe("https://api.deepseek.com/chat/completions");
    expect(calledOptions.method).toBe("POST");
    expect(calledOptions.headers.Authorization).toBe("Bearer sk-test-12345");

    const sentBody = JSON.parse(calledOptions.body);
    expect(sentBody.model).toBe("deepseek-chat");
    expect(sentBody.messages).toHaveLength(2);
    expect(sentBody.messages[0]).toEqual({ role: "system", content: "You are a prompt engineer." });
    expect(sentBody.messages[1]).toEqual({ role: "user", content: "Make a landing page" });
  });

  it("handles HTTP 429 rate limit errors with RATE_LIMIT code", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({
        error: { message: "Rate limit exceeded" }
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DeepSeekProvider({ apiKey: "sk-test-key" });
    await expect(provider.refine("Test")).rejects.toMatchObject({
      code: "RATE_LIMIT",
      status: 429,
    });
  });

  it("handles HTTP 402 Insufficient Balance per DeepSeek docs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      text: async () => JSON.stringify({
        error: { message: "Insufficient Balance" }
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DeepSeekProvider({ apiKey: "sk-test-key" });
    await expect(provider.refine("Test")).rejects.toMatchObject({
      code: "INSUFFICIENT_BALANCE",
      status: 402,
    });
  });

  it("handles HTTP 401 Invalid API Key per DeepSeek docs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({
        error: { message: "Authentication Fails" }
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DeepSeekProvider({ apiKey: "sk-test-key" });
    await expect(provider.refine("Test")).rejects.toMatchObject({
      code: "INVALID_API_KEY",
      status: 401,
    });
  });

  it("omits temperature parameter for deepseek-reasoner model per DeepSeek docs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        choices: [
          { message: { content: "Reasoned architectural output" } }
        ]
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DeepSeekProvider({
      apiKey: "sk-test-12345",
      model: "deepseek-reasoner"
    });

    const result = await provider.refine("Analyze this system");
    expect(result).toBe("Reasoned architectural output");
    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.model).toBe("deepseek-reasoner");
    expect(sentBody.temperature).toBeUndefined();
  });

  it("falls back to reasoning_content if content field is omitted in deepseek-reasoner", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        choices: [
          { message: { content: "", reasoning_content: "Step by step chain of thought" } }
        ]
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DeepSeekProvider({
      apiKey: "sk-test-12345",
      model: "deepseek-reasoner"
    });

    const result = await provider.refine("Step through logic");
    expect(result).toBe("Step by step chain of thought");
  });

  it("handles request timeouts gracefully", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url, options) => new Promise((_, reject) => {
      options.signal.addEventListener("abort", () => {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        reject(err);
      });
    })));

    const provider = new DeepSeekProvider({ apiKey: "sk-test-key", timeoutMs: 30 });
    const timeoutPromise = expect(provider.refine("Test text")).rejects.toMatchObject({
      code: "timeout",
      message: "DeepSeek request timed out",
    });

    await vi.advanceTimersByTimeAsync(30);
    await timeoutPromise;
  });

  it("supports multimodal vision on deepseek-v4-flash-vision-exp", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        choices: [
          { message: { content: "Visual layout reverse-engineered" } }
        ]
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DeepSeekProvider({
      apiKey: "sk-test-12345",
      model: "deepseek-v4-flash-vision-exp"
    });

    const result = await provider.refine("Analyze UI screenshot", {
      media: { mimeType: "image/png", data: "iVBORw0KGgoAAAANSUhEUgAA..." }
    });
    expect(result).toBe("Visual layout reverse-engineered");

    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.model).toBe("deepseek-v4-flash-vision-exp");
    const userMsg = sentBody.messages.find(m => m.role === "user");
    expect(Array.isArray(userMsg.content)).toBe(true);
    expect(userMsg.content[0]).toEqual({ type: "text", text: "Analyze UI screenshot" });
    expect(userMsg.content[1].type).toBe("image_url");
    expect(userMsg.content[1].image_url.url).toContain("data:image/png;base64,");
  });

  describe("ProviderManager DeepSeek Integration", () => {
    it("creates DeepSeekProvider from ProviderManager registry", () => {
      const provider = ProviderManager.createProvider("deepseek", { apiKey: "sk-test-key" });
      expect(provider).toBeInstanceOf(DeepSeekProvider);
    });

    it("includes deepseek in available providers", () => {
      expect(ProviderManager.getAvailableProviders()).toContain("deepseek");
    });

    it("returns DeepSeek models including V4 series", () => {
      const models = ProviderManager.getAvailableModels("deepseek");
      expect(models).toContain("deepseek-v4-flash");
      expect(models).toContain("deepseek-v4-pro");
      expect(models).toContain("deepseek-v4-flash-vision-exp");
      expect(models).toContain("deepseek-chat");
      expect(models).toContain("deepseek-reasoner");
    });

    it("resolves recommended models for sparkle, expert, and drop modes", () => {
      expect(ProviderManager.getRecommendedModel("deepseek", "sparkle")).toBe("deepseek-v4-flash");
      expect(ProviderManager.getRecommendedModel("deepseek", "expert")).toBe("deepseek-v4-pro");
      expect(ProviderManager.getRecommendedModel("deepseek", "hold")).toBe("deepseek-v4-pro");
      expect(ProviderManager.getRecommendedModel("deepseek", "drop")).toBe("deepseek-v4-flash-vision-exp");
    });

    it("resolves active provider id when deepseek key is present", () => {
      const id = ProviderManager.getActiveProviderId({
        deepSeekApiKey: "sk-valid-key-1234567890",
        activeProvider: "deepseek"
      });
      expect(id).toBe("deepseek");
    });
  });
});
