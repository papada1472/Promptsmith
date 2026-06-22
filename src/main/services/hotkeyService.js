import { store } from "../store.js";

export class HotkeyService {
  /**
   * Validates and sets the global hotkey.
   * @param {string} hotkey 
   * @param {Function} registerFn - The function to register the hotkey in Electron.
   * @param {Function} refreshTrayFn - The function to refresh the tray menu.
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async setHotkey(hotkey, registerFn, refreshTrayFn) {
    const accelerator = String(hotkey || "").trim();
    if (!accelerator) {
      return { ok: false, error: "Hotkey cannot be empty" };
    }

    try {
      registerFn(accelerator);
      store.set("hotkey", accelerator);
      refreshTrayFn();
      return { ok: true };
    } catch (err) {
      console.error("[Refinzi][HotkeyService] Hotkey registration failed", err);
      return { ok: false, error: err?.message || "Failed to register hotkey" };
    }
  }
}

export const hotkeyService = new HotkeyService();
