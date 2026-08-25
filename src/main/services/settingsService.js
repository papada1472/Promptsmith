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
    return {
      geminiApiKey: maskKey(ByokVault.decrypt(store.get("geminiApiKey"))),
      openRouterApiKey: maskKey(ByokVault.decrypt(store.get("openRouterApiKey"))),
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
    const key = provider?.toLowerCase() === "openrouter" ? "openRouterApiKey" : "geminiApiKey";
    const encryptedKey = ByokVault.encrypt(String(apiKey || "").trim());
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
