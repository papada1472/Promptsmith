import { Menu, Tray, nativeImage, app } from "electron";
import { APP_NAME } from "./constants.js";
import path from "path";

export function createTray({ onOpenSettings, onQuit, getHotkey, onDebugTriggerRefinement, onDebugPing, onDebugShowNotification, onDebugTestGemini, onDebugShowClipboard }) {
  const iconPath = path.join(app.getAppPath(), "assets", "icons", "tray.png");
  const tray = new Tray(iconPath);
  tray.setToolTip(`${APP_NAME} — Running`);

  function buildMenu() {
      const hotkey = String(getHotkey() || "Not set").trim() || "Not set";
      return Menu.buildFromTemplate([
        { label: APP_NAME, enabled: false },
        { label: "✓ Running", enabled: false },
        { type: "separator" },
        { label: "Open Dashboard", click: onOpenSettings },
        { label: "View Stats", click: onOpenSettings },
        { type: "separator" },
        { label: "Quit", click: onQuit }
      ]);
  }

  const setContext = () => tray.setContextMenu(buildMenu());
  setContext();

  tray.on("click", () => {
    console.log("[DEBUG] TRAY LEFT CLICK - Opening Dashboard");
    onOpenSettings();
  });
  tray.on("right-click", () => {
    console.log("[DEBUG] TRAY RIGHT CLICK - Opening Dashboard");
    onOpenSettings();
  });

  return {
    tray,
    refreshMenu: setContext
  };
}