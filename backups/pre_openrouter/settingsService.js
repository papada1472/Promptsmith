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
      hotkey: store.get("hotkey"),
      launchOnStartup: store.get("launchOnStartup"),
      activeProvider: store.get("activeProvider") || "gemini",
      activeModel: store.get("activeModel") || providerService.getDefaultModel(),
      userName: store.get("userName"),
      theme: store.get("theme")
    };
  }

  /**
   * Persists the Gemini API key.
   * @param {string} apiKey 
   * @returns {Object}
   */
  setApiKey(apiKey) {
    store.set("geminiApiKey", String(apiKey || ""));
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
