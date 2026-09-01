import { ProviderManager } from "../ai/ProviderManager.js";
import { ByokVault } from "../ai/ByokVault.js";
import { store } from "../store.js";

export class ProviderService {
  /**
   * Helper to get the store key name for a given provider.
   */
  getStoreKey(providerId) {
    const map = {
      deepseek: "deepSeekApiKey",
      gemini: "geminiApiKey",
      openrouter: "openRouterApiKey",
      openai: "openAiApiKey",
      anthropic: "anthropicApiKey",
      groq: "groqApiKey",
      mistral: "mistralApiKey",
      xai: "xaiApiKey",
      custom: "customApiKey",
      ollama: "ollamaBaseUrl",
      lmstudio: "lmStudioBaseUrl"
    };
    return map[providerId?.toLowerCase()] || "deepSeekApiKey";
  }

  /**
   * Verifies if the provided API key is valid for the current active provider.
   * @param {string} key 
   * @param {string} [targetProvider]
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async verifyApiKey(key, targetProvider) {
    try {
      const providerId = (targetProvider || store.get("activeProvider") || "deepseek").toLowerCase();
      let actualKey = key ? String(key).trim() : "";
      
      if (actualKey.startsWith("••••") || !actualKey) {
        const storeKey = this.getStoreKey(providerId);
        const storedEnc = store.get(storeKey) || "";
        actualKey = ByokVault.decrypt(storedEnc) || "";
        if (!actualKey && providerId === "deepseek") actualKey = process.env.DEEPSEEK_API_KEY || "";
        if (!actualKey && providerId === "gemini") actualKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || "";
        if (!actualKey && providerId === "openrouter") actualKey = process.env.OPENROUTER_API_KEY || "";
        if (!actualKey && providerId === "openai") actualKey = process.env.OPENAI_API_KEY || "";
        if (!actualKey && providerId === "anthropic") actualKey = process.env.ANTHROPIC_API_KEY || "";
        if (!actualKey && providerId === "groq") actualKey = process.env.GROQ_API_KEY || "";
        if (!actualKey && providerId === "mistral") actualKey = process.env.MISTRAL_API_KEY || "";
        if (!actualKey && providerId === "xai") actualKey = process.env.XAI_API_KEY || "";
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

      const noKeyRequired = ["ollama", "lmstudio"].includes(providerId);
      
      if (!actualKey && !noKeyRequired) {
        const names = {
          deepseek: "DeepSeek",
          gemini: "Google Gemini",
          openrouter: "OpenRouter",
          openai: "OpenAI / ChatGPT",
          anthropic: "Anthropic Claude",
          groq: "GroqCloud",
          mistral: "Mistral AI",
          xai: "xAI / Grok",
          custom: "Custom Endpoint",
          ollama: "Ollama (Local)",
          lmstudio: "LM Studio (Local)",
          gateway: "Refinzi Gateway"
        };
        const name = names[providerId] || providerId.toUpperCase();
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
      return { ok: false, error: err?.message || "Connection failed. Please check your configuration." };
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
