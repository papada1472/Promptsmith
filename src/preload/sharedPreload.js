// Preload scripts are executed as CommonJS by Electron on Windows in dev.
const { contextBridge, ipcRenderer } = require("electron");

function invoke(channel, payload) {
  return ipcRenderer
    .invoke(channel, payload)
    .then((res) => res)
    .catch((err) => {
      console.error(`[Refinezy][Preload] invoke failed: ${channel}`, err);
      throw err;
    });
}

contextBridge.exposeInMainWorld("refinezy", {
  // ── Reward / Dashboard ──
  reward: {
    get: () => invoke("reward:get"),
    onRefresh: (cb) => {
      ipcRenderer.removeAllListeners("reward:refresh");
      ipcRenderer.on("reward:refresh", () => cb());
    },
    dismissShareCard: () => invoke("reward:dismissShareCard"),
    shareCardSeen: () => invoke("reward:shareCardSeen")
  },

  // ── Settings ──
  settings: {
    get: () => invoke("settings:get"),
    setApiKey: (key) => invoke("settings:setApiKey", key),
    setLaunchOnStartup: (enabled) => invoke("settings:setLaunchOnStartup", enabled),
    setHotkey: (hotkey) => invoke("settings:setHotkey", hotkey),
    dismissQuota: () => invoke("settings:dismissQuota"),
    setTheme: (theme) => invoke("settings:setTheme", theme)
  },

  // ── Toast ──
  toast: {
    show: (opts) => invoke("toast:show", opts),
    onShow: (cb) => {
      ipcRenderer.removeAllListeners("toast:trigger");
      ipcRenderer.on("toast:trigger", (_e, opts) => cb(opts));
    }
  },

  // ── Command Center ──
  command: {
    onRefresh: (cb) => {
      ipcRenderer.removeAllListeners("command:refresh");
      ipcRenderer.on("command:refresh", () => cb());
    }
  },

  // ── App ──
  app: {
    openSettings: () => invoke("app:openSettings")
  }
});