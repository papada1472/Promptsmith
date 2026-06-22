import { ipcMain } from "electron";
import { applyLaunchOnStartup } from "./startup.js";
import { store } from "./store.js";
import { notifySuccess, notifyError, notifyWarning } from "./notifications.js";
import { providerService } from "./services/providerService.js";
import { settingsService } from "./services/settingsService.js";
import { hotkeyService } from "./services/hotkeyService.js";
import { startupService } from "./services/startupService.js";
import { metricsService } from "./services/metricsService.js";

export function registerIpcHandlers({ refreshTrayMenu, registerShortcut, openSettings }) {
  ipcMain.handle("settings:verifyApiKey", async (_e, key) => {
    return providerService.verifyApiKey(key);
  });

  ipcMain.handle("app:showToast", async (_e, opts) => {
    if (opts.type === "success") notifySuccess(opts.message);
    else if (opts.type === "error") notifyError(opts.message);
    else if (opts.type === "warning") notifyWarning(opts.message);
    return { ok: true };
  });

  ipcMain.handle("settings:get", async () => {
    console.log("[Refinzi][Main] Main process received message: settings:get");
    return settingsService.getSettings();
  });

  ipcMain.handle("settings:setApiKey", async (_e, apiKey, provider) => {
    console.log("[Refinzi][Main] Main process received message: settings:setApiKey", provider);
    return settingsService.setApiKey(apiKey, provider);
  });

  ipcMain.handle("settings:setLaunchOnStartup", async (_e, enabled) => {
    console.log("[Refinzi][Main] Main process received message: settings:setLaunchOnStartup", Boolean(enabled));
    return startupService.setLaunchOnStartup(enabled, applyLaunchOnStartup);
  });

  ipcMain.handle("settings:setHotkey", async (_e, hotkey) => {
    console.log("[Refinzi][Main] Main process received message: settings:setHotkey", hotkey);
    return hotkeyService.setHotkey(hotkey, registerShortcut, refreshTrayMenu);
  });

  ipcMain.handle("reward:get", async () => {
    return {
      ...metricsService.getStats(),
      hotkey: store.get("hotkey"),
      running: true
    };
  });

  ipcMain.handle("app:openSettings", async () => {
    console.log("[Refinzi][Main] Main process received message: app:openSettings");
    openSettings();
    return { ok: true };
  });

  ipcMain.handle("settings:set", async (_e, settingsObj) => {
    console.log("[Refinzi][Main] Main process received message: settings:set", settingsObj);
    for (const [key, val] of Object.entries(settingsObj)) {
      store.set(key, val);
    }
    return { ok: true };
  });

  ipcMain.handle("settings:dismissQuota", async () => {
    return { ok: true };
  });

  ipcMain.handle("settings:setTheme", async (_e, theme) => {
    store.set("theme", theme);
    return { ok: true };
  });

  ipcMain.handle("reward:dismissShareCard", async () => {
    settingsService.dismissShareCard();
    return { ok: true };
  });

  ipcMain.handle("reward:shareCardSeen", async () => {
    return { ok: true };
  });

  ipcMain.handle("logs:get", async (_e, params) => {
    return metricsService.getLogs(params || {});
  });

  ipcMain.handle("logs:delete", async (_e, index) => {
    metricsService.deleteLog(index);
    return { ok: true };
  });

  ipcMain.handle("logs:clear", async () => {
    metricsService.clearLogs();
    return { ok: true };
  });

  ipcMain.handle("toast:show", async (_e, opts) => {
    if (opts.type === "success") notifySuccess(opts.message);
    else if (opts.type === "error") notifyError(opts.message);
    else if (opts.type === "warning") notifyWarning(opts.message);
    return { ok: true };
  });
}

