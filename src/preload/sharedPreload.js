// Preload scripts are executed as CommonJS by Electron on Windows in dev.
const { contextBridge, ipcRenderer } = require("electron");

function invoke(channel, payload) {
  return ipcRenderer
    .invoke(channel, payload)
    .then((res) => res)
    .catch((err) => {
      console.error(`[Refinzi][Preload] invoke failed: ${channel}`, err);
      throw err;
    });
}

contextBridge.exposeInMainWorld("refinzi", {
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

  // ── Logs ──
  logs: {
    get: (params) => invoke("logs:get", params),
    delete: (index) => invoke("logs:delete", index),
    clear: () => invoke("logs:clear")
  },

  // ── Settings ──
  settings: {
    get: () => invoke("settings:get"),
    set: (settingsObj) => invoke("settings:set", settingsObj),
    setApiKey: (key, provider) => invoke("settings:setApiKey", key, provider),
    verifyApiKey: (key) => invoke("settings:verifyApiKey", key),
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


  // ── App ──
  app: {
    openSettings: () => invoke("app:openSettings"),
    showToast: (opts) => invoke("app:showToast", opts)
  },

  // ── Orb ──
  orb: {
    clicked: (mode) => invoke("orb:clicked", { mode }),
    showContextMenu: () => ipcRenderer.send("orb:contextmenu"),
    move: (pos) => ipcRenderer.send("orb:move", pos),
    dragEnd: () => ipcRenderer.send("orb:dragEnd"),
    getPosition: () => invoke("orb:getPosition"),
    resetPosition: () => invoke("orb:resetPosition"),
    setIgnoreMouse: (ignore) => ipcRenderer.send("orb:set-ignore-mouse", ignore),
    generatePrompt: (data) => invoke("orb:generatePrompt", { data }),
    copyToClipboard: (text) => invoke("orb:copyToClipboard", text),
    setFocusable: (focusable) => invoke("orb:setFocusable", focusable),
    resize: (bounds) => invoke("orb:resize", bounds),
    showPromptWindow: (data) => invoke("orb:showPromptWindow", data),
    onStatus: (cb) => {
      ipcRenderer.removeAllListeners("orb:status");
      ipcRenderer.on("orb:status", (_e, msg) => cb(msg));
    },
    onResponse: (cb) => {
      ipcRenderer.removeAllListeners("orb:response");
      ipcRenderer.on("orb:response", (_e, msg) => cb(msg));
    }
  },

  // ── Output Modal ──
  outputModal: {
    onSetContent: (cb) => {
      ipcRenderer.removeAllListeners("output:setContent");
      ipcRenderer.on("output:setContent", (_e, content) => cb(content));
    },
    onSetData: (cb) => {
      ipcRenderer.removeAllListeners("output:setData");
      ipcRenderer.on("output:setData", (_e, data) => cb(data));
    },
    copy: (text) => ipcRenderer.send("output:copy", text),
    close: () => ipcRenderer.send("output:close"),
    // Post-generation expert upgrade — called AFTER user sees initial prompt
    upgradeToExpert: (prompt, artifactContext) => invoke("orb:upgradeToExpert", { prompt, artifactContext }),
    // Analytics: track copy / regenerate / expert upgrade interactions
    logAnalytics: (event) => ipcRenderer.send("orb:outputAnalytics", event)
  }
});