import { store } from "../store.js";

export class StartupService {
  /**
   * Sets whether the app should launch on startup.
   * @param {boolean} enabled 
   * @param {Function} applyFn - The function to apply the startup effect.
   * @returns {Object}
   */
  setLaunchOnStartup(enabled, applyFn) {
    const value = Boolean(enabled);
    store.set("launchOnStartup", value);
    applyFn(value);
    return { ok: true };
  }
}

export const startupService = new StartupService();
