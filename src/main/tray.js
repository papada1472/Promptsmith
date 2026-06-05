import { Menu, Tray, nativeImage } from "electron";
import { APP_NAME } from "./constants.js";

function svgToDataUrl(svg) {
  const encoded = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

export function createTray({ onOpenSettings, onToggleReward, onQuit, getHotkey, onDebugTriggerRefinement, onDebugPing, onDebugShowNotification, onDebugTestGemini, onDebugShowClipboard }) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6D5EF9"/>
        <stop offset="1" stop-color="#00D4FF"/>
      </linearGradient>
    </defs>
    <rect x="10" y="10" width="44" height="44" rx="12" fill="url(#g)"/>
    <path d="M24 41V23h12c4 0 7 2.7 7 6.3 0 3.7-3 6.3-7 6.3h-8v5.4H24zm4-9h7.8c2.1 0 3.6-1.3 3.6-2.7 0-1.4-1.4-2.7-3.6-2.7H28V32z"
      fill="white" opacity="0.95"/>
  </svg>`;

  const image = nativeImage.createFromDataURL(svgToDataUrl(svg));
  const tray = new Tray(image);
  tray.setToolTip(`${APP_NAME} — Running`);

  function buildMenu() {
      const hotkey = String(getHotkey() || "Not set").trim() || "Not set";
      return Menu.buildFromTemplate([
        { label: APP_NAME, enabled: false },
        { label: "✓ Running", enabled: false },
        { type: "separator" },
        { label: "Open Dashboard", click: onToggleReward },
        { type: "separator" },
        { label: "Quit", click: onQuit }
      ]);
  }

  const setContext = () => tray.setContextMenu(buildMenu());
  setContext();

  tray.on("click", () => {
    console.log("[DEBUG] TRAY LEFT CLICK");
    onToggleReward();
  });
  tray.on("right-click", () => {
    console.log("[DEBUG] TRAY RIGHT CLICK");
    setContext();
  });

  return {
    tray,
    refreshMenu: setContext
  };
}