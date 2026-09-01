import { store } from "../store.js";
import { providerService } from "./providerService.js";
import { ByokVault } from "../ai/ByokVault.js";

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

    return {
      geminiApiKey: maskKey(geminiKey),
      openRouterApiKey: maskKey(openRouterKey),
      deepSeekApiKey: maskKey(deepSeekKey),
      hotkey: store.get("hotkey"),
      launchOnStartup: store.get("launchOnStartup"),
      activeProvider: store.get("activeProvider") || "gemini",
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
  setApiKey(apiKey, provider = "gemini") {
    if (apiKey && apiKey.startsWith("••••")) {
      // Ignore saving if the user did not modify the masked key
      return { ok: true };
    }
    const prov = provider?.toLowerCase();
    const key = prov === "deepseek" ? "deepSeekApiKey" : (prov === "openrouter" ? "openRouterApiKey" : "geminiApiKey");
    const trimmed = String(apiKey || "").trim();
    const encryptedKey = trimmed ? ByokVault.encrypt(trimmed) : "";
    store.set(key, encryptedKey);
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
