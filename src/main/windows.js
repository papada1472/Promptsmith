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
    width: 520,
    height: 420,
    resizable: false,
    maximizable: false,
    minimizable: true,
    show: false,
    title: "Refinezy Settings",
    webPreferences: {
      preload: preloadPath("settingsPreload.js"),
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
    height: 380,
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
      preload: preloadPath("rewardPreload.js"),
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

