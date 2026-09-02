import { AIProvider } from "./AIProvider.js";
import { createLogger } from "../logger.js";

const log = createLogger("AnthropicProvider");

/**
 * Native Anthropic Claude implementation of AIProvider.
 * Calls official https://api.anthropic.com/v1/messages endpoint.
 */
export class AnthropicProvider extends AIProvider {
  static DEFAULT_MODEL = "claude-sonnet-5";
  static BASE_URL = "https://api.anthropic.com/v1/messages";

  constructor(opts) {
    super(opts);
    this.model = opts?.model || AnthropicProvider.DEFAULT_MODEL;
    // Map friendly shorthand to official Anthropic model IDs
    const MODEL_MAP = {
      "claude-5-sonnet": "claude-sonnet-5",
      "claude-5-opus": "claude-opus-5",
      "claude-3.5-sonnet": "claude-sonnet-5",
      "claude-3-5-sonnet-20241022": "claude-sonnet-5",
      "claude-3.7-sonnet": "claude-sonnet-5",
      "claude-3-7-sonnet-20250219": "claude-sonnet-5",
      "claude-3.5-haiku": "claude-haiku-4-5-20251001",
      "claude-3-5-haiku-20241022": "claude-haiku-4-5-20251001",
      "claude-3-opus": "claude-opus-5",
      "claude-3-opus-20240229": "claude-opus-5"
    };
    this.model = MODEL_MAP[this.model] || this.model;
    this.apiKey = (this.apiKey || "").trim();
    log.debug("Initializing AnthropicProvider with model:", this.model);
  }

  async refine(text, opts = {}) {
    log.debug("refine() called, text length:", text?.length || 0);

    if (!this.apiKey) {
      const err = new Error("Missing Anthropic API key. Add your key in Settings.");
      err.code = "MISSING_API_KEY";
      throw err;
    }

    if (!text || !text.trim()) {
      const err = new Error("No text to refine");
      err.code = "EMPTY_INPUT";
      throw err;
    }

    const controller = new AbortController();
    let timeoutId;

    if (this.timeoutMs) {
      timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    }

    const onAbort = () => controller.abort();
    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      else opts.signal.addEventListener("abort", onAbort, { once: true });
    }

    try {
      const userContent = [];
      if (opts.media) {
        userContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: opts.media.mimeType || "image/png",
            data: opts.media.data
          }
        });
      }
      userContent.push({ type: "text", text });

      const requestBody = {
        model: this.model,
        max_tokens: 4096,
        system: this.systemPrompt || "You are an elite prompt engineer.",
        messages: [{ role: "user", content: userContent }]
      };

      log.debug("Sending POST request to Anthropic API...");
      const response = await fetch(AnthropicProvider.BASE_URL, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      log.debug("Anthropic response received, status:", response.status);

      if (!response.ok) {
        const errorBodyText = await response.text().catch(() => "Unreadable error body");
        log.error("Anthropic returned error response:", {
          status: response.status,
          model: this.model,
          body: errorBodyText
        });

        let errorMsg = `Anthropic API error: ${response.status}`;
        try {
          const jsonError = JSON.parse(errorBodyText);
          if (jsonError?.error?.message) errorMsg = jsonError.error.message;
        } catch (e) {}

        const err = new Error(errorMsg);
        err.code = response.status === 401 ? "INVALID_API_KEY" : (response.status === 429 ? "RATE_LIMIT" : "API_ERROR");
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const responseText = data?.content?.map(c => c.text || "").join("") || "";

      if (!responseText) {
        const err = new Error("Empty response from Anthropic");
        err.code = "EMPTY_OUTPUT";
        throw err;
      }

      return responseText;
    } catch (e) {
      if (e.name === "AbortError") {
        log.error("Anthropic request timed out");
        const err = new Error("Anthropic request timed out");
        err.code = "timeout";
        throw err;
      }
      log.error("Error during refine:", e);
      throw e;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
}
