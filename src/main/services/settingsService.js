import { store } from "../store.js";
import { providerService } from "./providerService.js";

export class SettingsService {
  /**
   * Returns an aggregated snapshot of application settings for the UI.
   * @returns {Object}
   */
  getSettings() {
    return {
      geminiApiKey: store.get("geminiApiKey"),
      openRouterApiKey: store.get("openRouterApiKey"),
      hotkey: store.get("hotkey"),
      launchOnStartup: store.get("launchOnStartup"),
      activeProvider: store.get("activeProvider") || "gemini",
      activeModel: store.get("activeModel") || providerService.getDefaultModel(),
      userName: store.get("userName"),
      theme: store.get("theme"),
      saveHistoryLocally: store.get("saveHistoryLocally"),
      onboardingSeen: store.get("onboardingSeen")
    };
  }

  /**
   * Persists an API key for a specific provider.
   * @param {string} apiKey 
   * @param {string} provider 
   * @returns {Object}
   */
  setApiKey(apiKey, provider = "gemini") {
    const key = provider?.toLowerCase() === "openrouter" ? "openRouterApiKey" : "geminiApiKey";
    store.set(key, String(apiKey || ""));
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
