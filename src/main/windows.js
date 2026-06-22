import path from "path";
import { app, BrowserWindow, screen } from "electron";

function rendererPath(...segments) {
  return path.join(app.getAppPath(), "src", "renderer", ...segments);
}

function preloadPath(...segments) {
  return path.join(app.getAppPath(), "src", "preload", ...segments);
}

function getIconPath() {
  return path.join(app.getAppPath(), "assets", "icons", "icon-256.png");
}

export function createSettingsWindow() {
  console.log("[DEBUG] createSettingsWindow()");
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
      nodeIntegration: false
    }
  });

  win.removeMenu();

  win.webContents.on("console-message", (_event, level, message) => {
    console.log(`[Refinzi][SettingsWindow][console][${level}] ${message}`);
  });

  console.log("[DEBUG] SETTINGS HTML:", rendererPath("settings", "index.html"));
  win.loadFile(rendererPath("settings", "index.html"));
  win.on("close", (e) => {
    // minimize-to-tray behavior
    e.preventDefault();
    win.hide();
  });

  return win;
}

export function createOutputModalWindow() {
  console.log("[DEBUG] createOutputModalWindow()");
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
      nodeIntegration: false
    }
  });

  win.removeMenu();

  win.on("close", (e) => {
    e.preventDefault();
    win.hide();
  });

  console.log("[DEBUG] OUTPUT MODAL HTML:", rendererPath("output", "index.html"));
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
    console.warn("[Refinzi][Windows] Failed to show toast:", err.message);
  }
}

/**
 * Toast window factory
 * Creates a minimal frameless BrowserWindow that will host toast UI.
 * The window is hidden initially; callers (notifications.js) will
 * position it via `showToast` before making it visible.
 */
export function createToastWindow() {
  console.log("[DEBUG] createToastWindow()");
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
    },
  });

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