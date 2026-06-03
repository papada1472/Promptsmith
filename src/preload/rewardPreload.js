const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("refinezy", {
  reward: {
    get: () => ipcRenderer.invoke("reward:get"),
    onRefresh: (cb) => {
      ipcRenderer.removeAllListeners("reward:refresh");
      ipcRenderer.on("reward:refresh", () => cb());
    }
  }
});

