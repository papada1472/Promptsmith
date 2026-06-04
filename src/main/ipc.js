import { ipcMain } from "electron";
import { applyLaunchOnStartup } from "./startup.js";
import { getRewardStats, getSettingsSnapshot, dismissShareCard, checkAndTrackQuota, store } from "./store.js";

export function registerIpcHandlers({ refreshTrayMenu, registerShortcut, openSettings, toastWindow }) {
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

  // ── Toast ──
  ipcMain.handle("toast:show", async (_e, opts) => {
    console.log("[Refinezy][Main] Main process received message: toast:show", opts);
    const { showToast } = await import("./windows.js");
    if (toastWindow && !toastWindow.isDestroyed()) {
      showToast(toastWindow, opts);
    }
    return { ok: true };
  });

  // ── Reward: Share Card ──
  ipcMain.handle("reward:dismissShareCard", async () => {
    dismissShareCard();
    return { ok: true };
  });

  ipcMain.handle("reward:shareCardSeen", async () => {
    // Used to track quota modal dismissal — no-op for now
    return { ok: true };
  });

  // ── Settings: Quota ──
  ipcMain.handle("settings:dismissQuota", async () => {
    return { ok: true };
  });

  ipcMain.handle("settings:setTheme", async (_e, theme) => {
    console.log("[Refinezy][Main] Main process received message: settings:setTheme", theme);
    store.set("theme", String(theme || "light"));
    return { ok: true };
  });
}

