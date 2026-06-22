import { ProviderManager } from "../ai/ProviderManager.js";
import { GeminiProvider } from "../ai/GeminiProvider.js";
import { SYSTEM_PROMPT, REFINE_TIMEOUT_MS } from "../constants.js";
import { store } from "../store.js";

export class ProviderService {
  /**
   * Verifies if the provided API key is valid for the current active provider.
   * @param {string} key 
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async verifyApiKey(key) {
    try {
      if (!key) return { ok: false, error: "No API key provided" };
      
      const providerId = store.get("activeProvider") || "gemini";
      const model = store.get("activeModel") || (providerId === "openrouter" ? "openai/gpt-4o-mini" : "gemini-2.5-flash");
      
      const provider = ProviderManager.createProvider(providerId, {
        apiKey: key,
        model,
        systemPrompt: SYSTEM_PROMPT,
        timeoutMs: REFINE_TIMEOUT_MS
      });
      
      await provider.refine("Reply only with 'OK'");
      return { ok: true };
    } catch (err) {
      console.error("[Refinzi][ProviderService] API Key verification failed", err);
      return { ok: false, error: err?.message || "Connection failed" };
    }
  }

  /**
   * Resolves the default model name for the primary provider.
   * @returns {string}
   */
  getDefaultModel() {
    return store.get("activeModel") || ProviderManager.getDefaultModel("gemini");
  }
}

export const providerService = new ProviderService();
