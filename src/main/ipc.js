import { ipcMain } from "electron";
import { applyLaunchOnStartup } from "./startup.js";
import { getRewardStats, getSettingsSnapshot, store } from "./store.js";
import { notifySuccess, notifyError, notifyWarning } from "./notifications.js";
import { GeminiProvider } from "./ai/GeminiProvider.js";
import { SYSTEM_PROMPT, REFINE_TIMEOUT_MS } from "./constants.js";

export function registerIpcHandlers({ refreshTrayMenu, registerShortcut, openSettings }) {
  ipcMain.handle("settings:verifyApiKey", async (_e, key) => {
    try {
      if (!key) return { ok: false, error: "No API key provided" };
      const provider = new GeminiProvider({
        apiKey: key,
        systemPrompt: SYSTEM_PROMPT,
        timeoutMs: REFINE_TIMEOUT_MS
      });
      await provider.refine("Reply only with OK");
      return { ok: true };
    } catch (err) {
      console.error("[Refinezy][IPC] API Key verification failed", err);
      return { ok: false, error: err?.message || "Connection failed" };
    }
  });

  ipcMain.handle("app:showToast", async (_e, opts) => {
    if (opts.type === "success") notifySuccess(opts.message);
    else if (opts.type === "error") notifyError(opts.message);
    else if (opts.type === "warning") notifyWarning(opts.message);
    return { ok: true };
  });

  ipcMain.handle("settings:get", async () => {
    console.log("[Refinezy][Main] Main process received message: settings:get");
    return getSettingsSnapshot();
  });

  ipcMain.handle("settings:setApiKey", async (_e, apiKey) => {
    console.log("[Refinezy][Main] Main process received message: settings:setApiKey");
    store.set("geminiApiKey", String(apiKey || ""));
    console.log("[Refinezy][Main] electron-store updated: geminiApiKey");
    return { ok: true };
  });

  ipcMain.handle("settings:setLaunchOnStartup", async (_e, enabled) => {
    console.log("[Refinezy][Main] Main process received message: settings:setLaunchOnStartup", Boolean(enabled));
    store.set("launchOnStartup", Boolean(enabled));
    console.log("[Refinezy][Main] electron-store updated: launchOnStartup");
    applyLaunchOnStartup(Boolean(enabled));
    return { ok: true };
  });

  ipcMain.handle("settings:setHotkey", async (_e, hotkey) => {
    console.log("[Refinezy][Main] Main process received message: settings:setHotkey", hotkey);
    const accelerator = String(hotkey || "").trim();
    if (!accelerator) {
      return { ok: false, error: "Hotkey cannot be empty" };
    }

    try {
      registerShortcut(accelerator);
      store.set("hotkey", accelerator);
      refreshTrayMenu();
      return { ok: true };
    } catch (err) {
      console.error("[Refinezy][Main] Hotkey registration failed, preserved previous hotkey", err);
      return { ok: false, error: err?.message || "Failed to register hotkey" };
    }
  });

  ipcMain.handle("reward:get", async () => {
    return {
      ...getRewardStats(),
      hotkey: store.get("hotkey"),
      running: true
    };
  });

  ipcMain.handle("app:openSettings", async () => {
    console.log("[Refinezy][Main] Main process received message: app:openSettings");
    openSettings();
    return { ok: true };
  });
}

