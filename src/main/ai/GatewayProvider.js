import { AIProvider } from "./AIProvider.js";

const GATEWAY_URL =
  process.env.REFINZI_GATEWAY_URL ||
  "https://refinzi-gateway.vercel.app/api/v1/refine";

/**
 * GatewayProvider implementation of the AIProvider.
 * Routes requests through the Refinzi AI Gateway.
 */
export class GatewayProvider extends AIProvider {
  constructor(opts) {
    super(opts);
    this.model = opts?.model || "gateway-default";
    console.log("[Refinzi][GatewayProvider] Initializing with Gateway URL:", GATEWAY_URL);
  }

  async refine(text, opts = {}) {
    console.log("[Refinzi][GatewayProvider] refine() called, text length:", text?.length || 0);

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
          // Note: VERCEL_OIDC_TOKEN usage may be added here if required by the gateway
        },
        body: JSON.stringify({
          text: text,
          systemPrompt: this.systemPrompt,
          model: this.model
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
        console.error("[Refinzi][GatewayProvider] Gateway request timed out");
        const err = new Error("Gateway request timed out");
        err.code = "gateway_timeout";
        throw err;
      } else {
        console.error("[Refinzi][GatewayProvider] Error during refine:", e);
        throw e;
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
