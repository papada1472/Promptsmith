import { AIProvider } from "./AIProvider.js";
import { createLogger } from "../logger.js";

const log = createLogger("GatewayProvider");

const GATEWAY_URL =
  process.env.REFINZI_GATEWAY_URL ||
  "https://refinzi-gateway-papada1472-2736s-projects.vercel.app/api/v1/refine";

/**
 * GatewayProvider implementation of the AIProvider.
 * Routes requests through the Refinzi AI Gateway.
 */
export class GatewayProvider extends AIProvider {
  constructor(opts) {
    super(opts);
    this.model = opts?.model || "gateway-default";
    log.debug("Initializing with Gateway URL:", GATEWAY_URL);
  }

  async refine(text, opts = {}) {
    log.debug("refine() called, text length:", text?.length || 0);

    if (!text || !text.trim()) {
      const err = new Error("No text to refine");
      err.code = "EMPTY_INPUT";
      throw err;
    }

    const controller = new AbortController();
    let timeoutId;

    if (this.timeoutMs) {
      timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeoutMs);
    }

    // Handle external signal if provided
    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      opts.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.AI_GATEWAY_API_KEY && {
            "x-api-key": process.env.AI_GATEWAY_API_KEY,
            "Authorization": `Bearer ${process.env.AI_GATEWAY_API_KEY}`
          })
        },
        body: JSON.stringify({
          text: text,
          systemPrompt: this.systemPrompt,
          model: this.model,
          apiKey: this.apiKey || process.env.AI_GATEWAY_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || "",
          ...(opts.responseMimeType && { responseMimeType: opts.responseMimeType })
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const err = new Error(errorBody?.error?.message || `Gateway API error: ${response.status}`);
        err.code = "API_ERROR";
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const responseText = data.refinedText || data.text || "";

      if (!responseText) {
        const err = new Error("Empty response from Gateway");
        err.code = "EMPTY_OUTPUT";
        throw err;
      }

      return responseText;
    } catch (e) {
      if (e.name === 'AbortError') {
        log.error("Gateway request timed out");
        const err = new Error("Gateway request timed out");
        err.code = "TIMEOUT";
        throw err;
      } else {
        log.error("Error during refine:", e);
        throw e;
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}

