import path from "path";
import { app, BrowserWindow, screen } from "electron";
import { createLogger } from "./logger.js";

const log = createLogger("Windows");

function rendererPath(...segments) {
  return path.join(app.getAppPath(), "src", "renderer", ...segments);
}

function preloadPath(...segments) {
  return path.join(app.getAppPath(), "src", "preload", ...segments);
}

function getIconPath() {
  return path.join(app.getAppPath(), "assets", "icons", "icon-256.png");
}

function applyWindowSecurityPolicy(win) {
  if (!win || !win.webContents) return;
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e, url) => {
    if (url !== win.webContents.getURL()) {
      e.preventDefault();
      log.warn("Blocked window navigation to external URL:", url);
    }
  });
}

export function createSettingsWindow() {
  log.debug("createSettingsWindow()");
  const win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 1000,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    show: false,
    title: "Refinzi",
    icon: getIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath("sharedPreload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  applyWindowSecurityPolicy(win);
  win.removeMenu();

  win.webContents.on("console-message", (_event, level, message) => {
    log.debug(`[SettingsWindow][console][${level}] ${message}`);
  });

  log.debug("SETTINGS HTML:", rendererPath("settings", "index.html"));
  win.loadFile(rendererPath("settings", "index.html"));
  win.on("close", (e) => {
    if (app.isQuitting) {
      return;
    }
    // minimize-to-tray behavior
    e.preventDefault();
    win.hide();
  });

  return win;
}

export function createOutputModalWindow() {
  log.debug("createOutputModalWindow()");
  const win = new BrowserWindow({
    width: 640,
    height: 700,
    resizable: false,
    maximizable: false,
    minimizable: false,
    show: false,
    frame: false,
    transparent: true,
    icon: getIconPath(),
    alwaysOnTop: false,
    skipTaskbar: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath("sharedPreload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  applyWindowSecurityPolicy(win);
  win.removeMenu();

  win.on("close", (e) => {
    e.preventDefault();
    win.hide();
  });

  log.debug("OUTPUT MODAL HTML:", rendererPath("output", "index.html"));
  win.loadFile(rendererPath("output", "index.html"));

  return win;
}

export function showToast(window, opts) {
  try {
    const display = screen.getPrimaryDisplay();
    const { width: screenW } = display.workAreaSize;
    const [winW] = window.getSize();
    const x = Math.round(display.workArea.x + (screenW - winW) / 2);
    const y = Math.round(display.workArea.y + 36);

    if (window && !window.isDestroyed()) {
      window.setPosition(x, y, false);
      window.webContents.send("toast:trigger", opts);
      window.showInactive();

      // If not persistent, auto-hide after duration
      if (!opts.persistent) {
        const duration = opts.duration || 2500;
        setTimeout(() => {
          if (window && !window.isDestroyed()) {
            window.hide();
          }
        }, duration);
      }
    }
  } catch (err) {
    log.warn("Failed to show toast:", err.message);
  }
}

/**
 * Toast window factory
 * Creates a minimal frameless BrowserWindow that will host toast UI.
 * The window is hidden initially; callers (notifications.js) will
 * position it via `showToast` before making it visible.
 */
export function createToastWindow() {
  log.debug("createToastWindow()");
  const win = new BrowserWindow({
    width: 320,
    height: 80,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    webPreferences: {
      preload: preloadPath("sharedPreload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
  });

  applyWindowSecurityPolicy(win);
  // Load a tiny HTML that forwards toast data via IPC.
  // Expected location: src/renderer/orb/toast/index.html
  win.loadFile(rendererPath("toast", "index.html"));
  win.removeMenu();
  return win;
}

/**
 * Broadcasts a reward:refresh event to all open BrowserWindows.
 * The unified dashboard renderer listens for this to update stats.
 */
export function refreshRewardDashboard() {
  for (const win of BrowserWindow.getAllWindows()) {
    try {
      if (!win.isDestroyed()) {
        win.webContents.send("reward:refresh");
      }
    } catch (_) {
      // Window may have been destroyed between check and send
    }
  }
}