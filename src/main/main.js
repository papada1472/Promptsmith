import dns from "dns";
try { dns.setDefaultResultOrder("ipv4first"); } catch (_) {}

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import os from "os";

// Load .env and .env.local (like Vite/Next.js) so local overrides are picked up.
// Must happen before any other module reads process.env.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../");
dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(rootDir, ".env.local"), override: true });

import { app, globalShortcut, session, clipboard } from "electron";
import fs from "fs";
import { createTray } from "./tray.js";
import { ensureAppUserModelId, notifyError, notifySuccess, notifyWarning } from "./notifications.js";
import { store } from "./store.js";
import { redactSecrets } from "./logger.js";
import { applyLaunchOnStartup } from "./startup.js";
import { createSettingsWindow } from "./windows.js";
import { registerIpcHandlers } from "./ipc.js";
import { registerHotkey, unregisterAllHotkeys } from "./shortcuts.js";
import { refineSelectedText } from "./refineController.js";
import { GeminiProvider } from "./ai/GeminiProvider.js";
import { SYSTEM_PROMPT, REFINE_TIMEOUT_MS } from "./constants.js";

let settingsWindow = null;
let trayApi = null;
let isRefining = false;

function openSettings(options = {}) {
  if (!settingsWindow) settingsWindow = createSettingsWindow();
  settingsWindow.show();
  settingsWindow.focus();
  if (options.focusApiKey) {
    // Wait slightly for DOM focus transition
    setTimeout(() => {
      if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.webContents.send("settings:focusApiKey");
      }
    }, 150);
  }
}

async function onHotkey() {
  if (isRefining) return;
  isRefining = true;
  try {
    await refineSelectedText({ notifySuccess, notifyError, notifyWarning });
  } finally {
    isRefining = false;
  }
}

function registerShortcutFromStore() {
  const accelerator = store.get("hotkey");
  console.log("[Refinzi][Main] Loaded hotkey from store", accelerator);
  try {
    console.log("[Refinzi][Main] Registering hotkey:", accelerator);
    registerHotkey(accelerator, onHotkey);
    let isReg = false;
    try {
      isReg = Boolean(globalShortcut.isRegistered && globalShortcut.isRegistered(accelerator));
    } catch (e) {
      console.warn("[Refinzi][Main] globalShortcut.isRegistered check failed", e?.message || e);
    }
    console.log("[Refinzi][Main] Registration result:", isReg ? "registered" : "not registered", accelerator);
  } catch (e) {
    console.error("[Refinzi][Main] Hotkey registration failed:", e?.message || e);
    throw e;
  }
}

// Debug menu handlers
function onDebugPing() {
  console.log("PING WORKS");
}

function onDebugShowNotification() {
  notifySuccess("Refinzi Debug OK");
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
  app.isQuitting = true;
  console.log("[Refinzi][Main] before-quit event triggered");
  unregisterAllHotkeys();
});

app.on("will-quit", () => {
  console.log("[Refinzi][Main] will-quit event triggered, app is exiting");
});

async function initializeApp() {
  try {
    console.log("[Refinzi][Main] Electron app ready, initializing...");
    // Ensure Electron cache is in a writable location (userData folder)
    const cachePath = path.join(app.getPath("userData"), "cache");
    app.setPath("cache", cachePath);
    console.log("[Refinzi][Main] Cache directory set to", cachePath);

    // Harden security by denying all permission requests
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(false);
    });

    ensureAppUserModelId();

    applyLaunchOnStartup(store.get("launchOnStartup"));

    settingsWindow = createSettingsWindow();

    const onQuitHandler = () => {
      console.log("[Refinzi][Main] Quit requested from tray");
      settingsWindow?.destroy();
      console.log("[Refinzi][Main] Windows destroyed, calling app.quit()");
      app.quit();
    };

    trayApi = createTray({
      onOpenSettings: openSettings,
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

    // ── ORB STARTUP ──
    try {
      // Dynamically import Orb and Electron screen module
      const { showOrb, getOrbWindow, undoLastRefinement } = await import("./orbWindow.js");
      const { screen } = await import("electron");
      
      // Register global Undo hotkey
      try {
        globalShortcut.register("Ctrl+Alt+Z", () => {
          console.log("[Hotkey] Undo triggered via Ctrl+Alt+Z");
          undoLastRefinement();
        });
        console.log("[Hotkey] Registered Ctrl+Alt+Z for Undo");
      } catch (err) {
        console.warn("[Hotkey] Failed to register Ctrl+Alt+Z for Undo:", err.message);
      }

      const cursor = screen.getCursorScreenPoint();
      console.log(`[Refinzi][Main] Orb: cursor at x=${cursor.x} y=${cursor.y}`);
      // Show Orb near the current mouse position
      showOrb(cursor.x, cursor.y);
      // Diagnostic: verify Orb state after showOrb()
      const orbWin = getOrbWindow();
      if (orbWin) {
        const pos = orbWin.getPosition();
        const size = orbWin.getSize();
        console.log(`[Refinzi][Main] ✅ Orb BrowserWindow created: pos=[${pos}] size=[${size}] visible=${orbWin.isVisible()} focused=${orbWin.isFocused()}`);
      } else {
        console.warn("[Refinzi][Main] ⚠️ Orb: getOrbWindow() returned null after showOrb()");
      }
    } catch (orbErr) {
      console.error("[Refinzi][Main] ❌ Orb startup failed:", orbErr?.message || orbErr);
      console.error("[Refinzi][Main] ❌ Orb stack:", orbErr?.stack || "(no stack)");
      // Continue without Orb – app remains functional
    }

    // Check if it's a fresh install
    let isFreshInstall = false;
    if (!store.get("installedAt")) {
      isFreshInstall = true;
      store.set("installedAt", Date.now());
      // The renderer turns this into a one-time, in-app welcome. Do not use a
      // native notification here: first launch should feel quiet and deliberate.
      store.set("premiumWelcomePending", true);
      console.log("[Refinzi][Main] Fresh installation detected. Setting installedAt timestamp.");
    }

    // Start hidden in tray / ambient Orb mode
    settingsWindow.hide();
    if (isFreshInstall) {
      console.log("[Refinzi][Main] Fresh installation detected: Orb active and ready for first Rebuild.");
    }
  } catch (err) {
    console.error("[Refinzi][Main] Initialization failed", err);
    notifyError("Application failed to start");
    app.quit();
  }
}

// Enforce single instance BEFORE app is ready — second instance gets killed immediately
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log("[Refinzi][Main] Another instance already running. Quitting.");
  app.quit();
} else {
  // Focus existing window when second instance attempts to launch
  app.on("second-instance", () => {
    console.log("[Refinzi][Main] Second instance detected, focusing existing window.");
    if (settingsWindow) {
      if (settingsWindow.isMinimized()) settingsWindow.restore();
      settingsWindow.focus();
    }
  });

  app.whenReady().then(initializeApp).catch((err) => {
    console.error("[Refinzi][Main] whenReady failed", err);
    notifyError("Application failed to start");
    app.quit();
  });

  app.on("quit", () => {
    console.log("[Refinzi][Main] quit event fired, app is terminating");
  });
}

// ── Global Crash Logging Guards ──
process.on("uncaughtException", (err) => {
  logCrash(err, "UncaughtException");
});

process.on("unhandledRejection", (err) => {
  logCrash(err, "UnhandledRejection");
});

function logCrash(err, type) {
  try {
    // app.getPath("userData") throws "App is not ready" if called before app.whenReady.
    // Fall back to os.tmpdir() so early crashes (e.g. during store initialisation)
    // are still captured rather than silently lost.
    let logPath;
    try {
      logPath = path.join(app.getPath("userData"), "crash_reports.log");
    } catch {
      logPath = path.join(os.tmpdir(), "refinzi_crash_reports.log");
    }
    const timestamp = new Date().toISOString();
    const rawMessage = err?.message || String(err);
    const rawStack = err?.stack ? err.stack.split("\n").map(l => l.trim()).filter(l => !l.includes("node_modules")) : [];
    const errorDetails = {
      timestamp,
      type,
      message: redactSecrets(rawMessage),
      stack: rawStack.map(line => redactSecrets(line))
    };
    fs.appendFileSync(logPath, JSON.stringify(errorDetails) + "\n", "utf8");
    console.error(`[Refinzi][Crash] Saved ${type} to ${logPath}`);
  } catch (e) {
    console.error("Failed to write crash report:", e);
  }
}
