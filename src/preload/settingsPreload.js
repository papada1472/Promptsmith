// Preload scripts are executed as CommonJS by Electron on Windows in dev.
// Using ESM `import` here breaks preload loading (and breaks Settings persistence).
const { contextBridge, ipcRenderer } = require("electron");

function invoke(channel, payload) {
  console.log(`[Refinezy][Preload] IPC message sent: ${channel}`, payload ?? "");
  return ipcRenderer
    .invoke(channel, payload)
    .then((res) => {
      console.log(`[Refinezy][Preload] Success response returned: ${channel}`, res ?? "");
      return res;
    })
    .catch((err) => {
      console.error(`[Refinezy][Preload] IPC invoke failed: ${channel}`, err);
      throw err;
    });
}

contextBridge.exposeInMainWorld("refinezy", {
  settings: {
    get: () => invoke("settings:get"),
    setApiKey: (key) => invoke("settings:setApiKey", key),
    setLaunchOnStartup: (enabled) => invoke("settings:setLaunchOnStartup", enabled),
    setHotkey: (hotkey) => invoke("settings:setHotkey", hotkey)
  },
  openSettings: () => invoke("app:openSettings")
});

