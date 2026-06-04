import path from "path";
import { app, BrowserWindow, screen } from "electron";

function rendererPath(...segments) {
  return path.join(app.getAppPath(), "src", "renderer", ...segments);
}

function preloadPath(...segments) {
  return path.join(app.getAppPath(), "src", "preload", ...segments);
}

export function createSettingsWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 640,
    resizable: false,
    maximizable: false,
    minimizable: true,
    show: false,
    title: "Refinezy",
    webPreferences: {
      preload: preloadPath("sharedPreload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.webContents.on("console-message", (_event, level, message) => {
    console.log(`[Refinezy][SettingsWindow][console][${level}] ${message}`);
  });

  win.loadFile(rendererPath("settings", "index.html"));
  win.on("close", (e) => {
    // minimize-to-tray behavior
    e.preventDefault();
    win.hide();
  });

  return win;
}

export function createRewardWindow() {
  const win = new BrowserWindow({
    width: 320,
    height: 400,
    resizable: false,
    maximizable: false,
    minimizable: false,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: true,
    webPreferences: {
      preload: preloadPath("sharedPreload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(rendererPath("reward", "index.html"));

  win.on("blur", () => {
    if (win.isVisible()) win.hide();
  });

  return win;
}

export function createToastWindow() {
  const win = new BrowserWindow({
    width: 360,
    height: 74,
    resizable: false,
    maximizable: false,
    minimizable: false,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: true,
    focusable: false,
    webPreferences: {
      preload: preloadPath("sharedPreload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setIgnoreMouseEvents(true, { forward: true });

  win.loadFile(rendererPath("toast", "index.html"));

  return win;
}

export function showToast(window, opts) {
  const { screen } = require("electron");
  const display = screen.getPrimaryDisplay();
  const { width: screenW } = display.workAreaSize;
  const [winW] = window.getSize();
  const x = Math.round(display.workArea.x + (screenW - winW) / 2);
  const y = Math.round(display.workArea.y + 36);
  window.setPosition(x, y, false);
  window.webContents.send("toast:trigger", opts);
  window.showInactive();
  // Auto-hide after duration
  const duration = opts.duration || 2500;
  setTimeout(() => {
    if (window && !window.isDestroyed()) {
      window.hide();
    }
  }, duration);
}

export function positionRewardWindowNearTray(rewardWindow, trayBounds) {
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
  const { width: screenW, height: screenH } = display.workAreaSize;
  const [winW, winH] = rewardWindow.getSize();

  // Default: bottom-right on the current display.
  let x = display.workArea.x + screenW - winW - 10;
  let y = display.workArea.y + screenH - winH - 10;

  // If we have tray bounds, try to anchor above it.
  if (trayBounds && Number.isFinite(trayBounds.x)) {
    x = Math.max(display.workArea.x + 10, Math.min(trayBounds.x - winW + trayBounds.width, display.workArea.x + screenW - winW - 10));
    y = Math.max(display.workArea.y + 10, trayBounds.y - winH - 10);
  }

  rewardWindow.setPosition(Math.round(x), Math.round(y), false);
}

