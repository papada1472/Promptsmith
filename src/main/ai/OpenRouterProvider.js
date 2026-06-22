import { AIProvider } from "./AIProvider.js";

/**
 * OpenRouter implementation of the AIProvider.
 * Uses standard fetch to call the OpenRouter API.
 */
export class OpenRouterProvider extends AIProvider {
  static DEFAULT_MODEL = "openai/gpt-4o-mini";
  static BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

  constructor(opts) {
    super(opts);
    this.model = opts?.model || OpenRouterProvider.DEFAULT_MODEL;
    console.log("[Refinzi][OpenRouterProvider] Initializing with model:", this.model);
  }

  async refine(text, opts = {}) {
    console.log("[Refinzi][OpenRouterProvider] refine() called, text length:", text?.length || 0);

    if (!this.apiKey) {
      const err = new Error("Missing OpenRouter API key");
      err.code = "MISSING_API_KEY";
      throw err;
    }

    if (!text || !text.trim()) {
      const err = new Error("No text to refine");
      err.code = "EMPTY_INPUT";
      throw err;
    }

    try {
      const response = await fetch(OpenRouterProvider.BASE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://refinzi.app", // Required for OpenRouter ranking
          "X-Title": "Refinzi Desktop",          // Required for OpenRouter ranking
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: text }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const err = new Error(errorBody?.error?.message || `OpenRouter API error: ${response.status}`);
        err.code = "API_ERROR";
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const responseText = data?.choices?.[0]?.message?.content || "";

      if (!responseText) {
        const err = new Error("Empty response from OpenRouter");
        err.code = "EMPTY_OUTPUT";
        throw err;
      }

      return responseText;
    } catch (e) {
      console.error("[Refinzi][OpenRouterProvider] Error during refine:", e);
      throw e;
    }
  }
}
