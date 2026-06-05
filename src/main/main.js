import { app, globalShortcut } from "electron";
import { createTray } from "./tray.js";
import { ensureAppUserModelId, notifyError, notifySuccess, notifyWarning } from "./notifications.js";
import { store } from "./store.js";
import { applyLaunchOnStartup } from "./startup.js";
import { createRewardWindow, createSettingsWindow, positionRewardWindowNearTray } from "./windows.js";
import { registerIpcHandlers } from "./ipc.js";
import { registerHotkey, unregisterAllHotkeys } from "./shortcuts.js";
import { refineSelectedText } from "./refineController.js";
import { GeminiProvider } from "./ai/GeminiProvider.js";
import { clipboard } from "electron";
import path from "path";
import { SYSTEM_PROMPT, REFINE_TIMEOUT_MS } from "./constants.js";

let settingsWindow = null;
let rewardWindow = null;
let trayApi = null;
let isRefining = false;

function openSettings() {
  if (!settingsWindow) settingsWindow = createSettingsWindow();
  settingsWindow.show();
  settingsWindow.focus();
}

function toggleReward() {
  if (!rewardWindow) rewardWindow = createRewardWindow();
  if (!trayApi?.tray) {
    rewardWindow.show();
    return;
  }

  if (rewardWindow.isVisible()) {
    rewardWindow.hide();
  } else {
    const trayBounds = trayApi.tray.getBounds();
    positionRewardWindowNearTray(rewardWindow, trayBounds);
    rewardWindow.show();
    rewardWindow.focus();
    rewardWindow.webContents.send("reward:refresh");
  }
}

async function onHotkey() {
  if (isRefining) return;
  isRefining = true;
  try {
    await refineSelectedText({ notifySuccess, notifyError, notifyWarning });
  } finally {
    isRefining = false;
    if (rewardWindow && rewardWindow.isVisible()) {
      rewardWindow.webContents.send("reward:refresh");
    }
  }
}

function registerShortcutFromStore() {
  const accelerator = store.get("hotkey");
  console.log("[Refinezy][Main] Loaded hotkey from store", accelerator);
  try {
    console.log("[Refinezy][Main] Registering hotkey:", accelerator);
    registerHotkey(accelerator, onHotkey);
    let isReg = false;
    try {
      isReg = Boolean(globalShortcut.isRegistered && globalShortcut.isRegistered(accelerator));
    } catch (e) {
      console.warn("[Refinezy][Main] globalShortcut.isRegistered check failed", e?.message || e);
    }
    console.log("[Refinezy][Main] Registration result:", isReg ? "registered" : "not registered", accelerator);
  } catch (e) {
    console.error("[Refinezy][Main] Hotkey registration failed:", e?.message || e);
    throw e;
  }
}

// Debug menu handlers
function onDebugPing() {
  console.log("PING WORKS");
}

function onDebugShowNotification() {
  notifySuccess("Refinezy Debug OK");
}

async function onDebugTestGemini() {
  try {
    const apiKey = store.get("geminiApiKey");
    if (!apiKey) {
      notifyError("No API key configured");
      return;
    }
    
    const provider = new GeminiProvider({
      apiKey,
      systemPrompt: SYSTEM_PROMPT,
      timeoutMs: REFINE_TIMEOUT_MS
    });
    
    const response = await provider.refine("Reply only with OK");
    notifySuccess(`Gemini: ${response.substring(0, 100)}`);
  } catch (e) {
    notifyError(`Gemini failed: ${e?.message || e}`);
  }
}

function onDebugShowClipboard() {
  try {
    const text = clipboard.readText();
    const preview = (text || "").substring(0, 100) || "(empty)";
    notifySuccess(`Clipboard: ${preview}`);
  } catch (e) {
    notifyError(`Clipboard error: ${e?.message || e}`);
  }
}

app.on("window-all-closed", () => {
  // Background tray utility — do not quit when windows close.
});

app.on("before-quit", () => {
  console.log("[Refinezy][Main] before-quit event triggered");
  unregisterAllHotkeys();
});

app.on("will-quit", () => {
  console.log("[Refinezy][Main] will-quit event triggered, app is exiting");
});

async function initializeApp() {
  try {
    console.log("[Refinezy][Main] Electron app ready, initializing...");
    // Ensure Electron cache is in a writable location (userData folder)
    const cachePath = path.join(app.getPath("userData"), "cache");
    app.setPath("cache", cachePath);
    console.log("[Refinezy][Main] Cache directory set to", cachePath);
    ensureAppUserModelId();

    applyLaunchOnStartup(store.get("launchOnStartup"));

    settingsWindow = createSettingsWindow();
    rewardWindow = createRewardWindow();

    const onQuitHandler = () => {
      console.log("[Refinezy][Main] Quit requested from tray");
      settingsWindow?.destroy();
      rewardWindow?.destroy();
      console.log("[Refinezy][Main] Windows destroyed, calling app.quit()");
      app.quit();
    };

    trayApi = createTray({
      onOpenSettings: openSettings,
      onToggleReward: toggleReward,
      onQuit: onQuitHandler,
      getHotkey: () => store.get("hotkey"),
      onDebugTriggerRefinement: onHotkey,
      onDebugPing,
      onDebugShowNotification,
      onDebugTestGemini,
      onDebugShowClipboard
    });

    registerIpcHandlers({
      refreshTrayMenu: trayApi.refreshMenu,
      registerShortcut: (hk) => registerHotkey(hk, onHotkey),
      openSettings
    });

    try {
      registerShortcutFromStore();
    } catch (e) {
      notifyError(e?.message || "Failed to register hotkey");
    }

    // Start hidden (tray-first).
    settingsWindow.hide();
    rewardWindow.hide();
  } catch (err) {
    console.error("[Refinezy][Main] Initialization failed", err);
    notifyError("Application failed to start");
    app.quit();
  }
}

app.whenReady().then(initializeApp).catch((err) => {
  console.error("[Refinezy][Main] whenReady failed", err);
  notifyError("Application failed to start");
  app.quit();
});

app.on("quit", () => {
  console.log("[Refinezy][Main] quit event fired, app is terminating");
});

ing");
});

