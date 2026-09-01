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
      const providerId = targetProvider || store.get("activeProvider") || "deepseek";
      let actualKey = key ? String(key).trim() : "";
      
      if (actualKey.startsWith("••••") || !actualKey) {
        const storeKey = providerId === "deepseek" ? "deepSeekApiKey" : (providerId === "openrouter" ? "openRouterApiKey" : "geminiApiKey");
        const envKey = providerId === "deepseek" ? process.env.DEEPSEEK_API_KEY : (providerId === "gemini" ? (process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || "") : (process.env.OPENROUTER_API_KEY || ""));
        const storedEnc = store.get(storeKey) || "";
        actualKey = ByokVault.decrypt(storedEnc) || envKey || "";
      }

      if (providerId === "gateway") {
        const provider = ProviderManager.createProvider("gateway", {
          model: "gateway-default",
          systemPrompt: "You are a test helper.",
          timeoutMs: 8000
        });
        await provider.refine("Reply with OK");
        return { ok: true };
      }
      
      if (!actualKey) {
        const name = providerId === "deepseek" ? "DeepSeek" : (providerId === "openrouter" ? "OpenRouter" : "Google Gemini");
        return { ok: false, error: `Please enter a valid ${name} API key` };
      }
      
      const rawModel = store.get("activeModel");
      const availableModels = ProviderManager.getAvailableModels(providerId);
      const model = (rawModel && (availableModels.includes(rawModel) || (providerId === "openrouter" && rawModel.includes("/")))) 
        ? rawModel 
        : ProviderManager.getDefaultModel(providerId);
      
      const provider = ProviderManager.createProvider(providerId, {
        apiKey: actualKey,
        model,
        systemPrompt: "You are a test helper. Reply only with OK.",
        timeoutMs: 8000
      });
      
      await provider.refine("OK");
      return { ok: true };
    } catch (err) {
      console.error("[Refinzi][ProviderService] API Key verification failed", err);
      return { ok: false, error: err?.message || "Connection failed. Please check your API key." };
    }
  }

  /**
   * Resolves the default model name for the primary provider.
   * @returns {string}
   */
  getDefaultModel() {
    return store.get("activeModel") || ProviderManager.getDefaultModel("deepseek");
  }
}

export const providerService = new ProviderService();
