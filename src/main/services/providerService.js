import { ProviderManager } from "../ai/ProviderManager.js";
import { GeminiProvider } from "../ai/GeminiProvider.js";
import { SYSTEM_PROMPT, REFINE_TIMEOUT_MS } from "../constants.js";

export class ProviderService {
  /**
   * Verifies if the provided API key is valid by performing a minimal request.
   * @param {string} key 
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async verifyApiKey(key) {
    try {
      if (!key) return { ok: false, error: "No API key provided" };
      const provider = new GeminiProvider({
        apiKey: key,
        systemPrompt: SYSTEM_PROMPT,
        timeoutMs: REFINE_TIMEOUT_MS
      });
      await provider.refine("Reply only with OK");
      return { ok: true };
    } catch (err) {
      console.error("[Refinezy][ProviderService] API Key verification failed", err);
      return { ok: false, error: err?.message || "Connection failed" };
    }
  }

  /**
   * Resolves the default model name for the primary provider.
   * @returns {string}
   */
  getDefaultModel() {
    return ProviderManager.getDefaultModel("gemini");
  }
}

export const providerService = new ProviderService();
