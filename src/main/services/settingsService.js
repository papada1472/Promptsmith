import { store } from "../store.js";
import { providerService } from "./providerService.js";
import { ByokVault } from "../ai/ByokVault.js";
import { ProviderManager } from "../ai/ProviderManager.js";

function maskKey(key) {
  if (!key) return "";
  const keyStr = String(key).trim();
  if (keyStr.length <= 8) return "••••••••";
  return "••••••••••••" + keyStr.slice(-4);
}

export class SettingsService {
  /**
   * Returns an aggregated snapshot of application settings for the UI.
   * @returns {Object}
   */
  getSettings() {
    const geminiKey = ByokVault.decrypt(store.get("geminiApiKey")) || (typeof process !== "undefined" ? (process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || "") : "");
    const openRouterKey = ByokVault.decrypt(store.get("openRouterApiKey")) || (typeof process !== "undefined" ? (process.env.OPENROUTER_API_KEY || "") : "");
    const deepSeekKey = ByokVault.decrypt(store.get("deepSeekApiKey")) || (typeof process !== "undefined" ? (process.env.DEEPSEEK_API_KEY || "") : "");
    const openAiKey = ByokVault.decrypt(store.get("openAiApiKey")) || (typeof process !== "undefined" ? (process.env.OPENAI_API_KEY || "") : "");
    const anthropicKey = ByokVault.decrypt(store.get("anthropicApiKey")) || (typeof process !== "undefined" ? (process.env.ANTHROPIC_API_KEY || "") : "");
    const groqKey = ByokVault.decrypt(store.get("groqApiKey")) || (typeof process !== "undefined" ? (process.env.GROQ_API_KEY || "") : "");
    const mistralKey = ByokVault.decrypt(store.get("mistralApiKey")) || (typeof process !== "undefined" ? (process.env.MISTRAL_API_KEY || "") : "");
    const xaiKey = ByokVault.decrypt(store.get("xaiApiKey")) || (typeof process !== "undefined" ? (process.env.XAI_API_KEY || "") : "");
    const customKey = ByokVault.decrypt(store.get("customApiKey")) || "";

    return {
      geminiApiKey: maskKey(geminiKey),
      openRouterApiKey: maskKey(openRouterKey),
      deepSeekApiKey: maskKey(deepSeekKey),
      openAiApiKey: maskKey(openAiKey),
      anthropicApiKey: maskKey(anthropicKey),
      groqApiKey: maskKey(groqKey),
      mistralApiKey: maskKey(mistralKey),
      xaiApiKey: maskKey(xaiKey),
      customApiKey: maskKey(customKey),
      customApiBaseUrl: store.get("customApiBaseUrl") || "",
      hotkey: store.get("hotkey"),
      launchOnStartup: store.get("launchOnStartup"),
      activeProvider: store.get("activeProvider") || "deepseek",
      activeModel: store.get("activeModel") || providerService.getDefaultModel(),
      userName: store.get("userName"),
      theme: store.get("theme"),
      saveHistoryLocally: store.get("saveHistoryLocally"),
      onboardingSeen: store.get("onboardingSeen"),
      premiumWelcomePending: store.get("premiumWelcomePending")
    };
  }

  /**
   * Persists an API key for a specific provider.
   * @param {string} apiKey 
   * @param {string} provider 
   * @returns {Object}
   */
  setApiKey(apiKey, provider = "deepseek") {
    if (apiKey && apiKey.startsWith("••••")) {
      // Ignore saving if the user did not modify the masked key
      return { ok: true };
    }
    const prov = provider?.toLowerCase();
    const key = providerService.getStoreKey(prov);
    const trimmed = String(apiKey || "").trim();
    const encryptedKey = trimmed ? ByokVault.encrypt(trimmed) : "";
    store.set(key, encryptedKey);
    try {
      ProviderManager.resetCircuitBreaker(prov);
    } catch (_) {}
    return { ok: true };
  }

  /**
   * Dismisses the share card in the UI.
   */
  dismissShareCard() {
    store.set("shareCardDismissed", true);
  }
}

export const settingsService = new SettingsService();
