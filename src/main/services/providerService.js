import { ProviderManager } from "../ai/ProviderManager.js";
import { GeminiProvider } from "../ai/GeminiProvider.js";
import { OpenRouterProvider } from "../ai/OpenRouterProvider.js";
import { ByokVault } from "../ai/ByokVault.js";
import { SYSTEM_PROMPT, REFINE_TIMEOUT_MS } from "../constants.js";
import { store } from "../store.js";

export class ProviderService {
  /**
   * Verifies if the provided API key is valid for the current active provider.
   * @param {string} key 
   * @param {string} [targetProvider]
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async verifyApiKey(key, targetProvider) {
    try {
      const providerId = targetProvider || store.get("activeProvider") || "gemini";
      let actualKey = key ? String(key).trim() : "";
      
      if (actualKey.startsWith("••••") || !actualKey) {
        const storedEnc = store.get(providerId === "openrouter" ? "openRouterApiKey" : "geminiApiKey") || "";
        actualKey = ByokVault.decrypt(storedEnc) || (providerId === "gemini" ? (process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || "") : (process.env.OPENROUTER_API_KEY || ""));
      }
      
      const isGateway = !actualKey && (providerId === "gemini" || providerId === "gateway");
      if (!actualKey && !isGateway) {
        return { ok: false, error: "No API key provided" };
      }
      
      const targetProviderId = isGateway ? "gateway" : providerId;
      const model = store.get("activeModel") || (targetProviderId === "openrouter" ? OpenRouterProvider.DEFAULT_MODEL : targetProviderId === "gateway" ? "gateway-default" : "gemini-2.5-flash");
      
      const provider = ProviderManager.createProvider(targetProviderId, {
        apiKey: targetProviderId === "gateway" ? undefined : actualKey,
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
