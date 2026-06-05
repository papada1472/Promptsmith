import { app } from "electron";
import { showToast, createToastWindow } from "./windows.js";

let toastWindow = null;

export function ensureAppUserModelId() {
  try {
    // Required for Windows notifications + taskbar identity.
    app.setAppUserModelId("com.refinezy.app");
  } catch {
    // ignore
  }
}

function displayToast(opts) {
  if (!toastWindow || toastWindow.isDestroyed()) {
    toastWindow = createToastWindow();
  }
  showToast(toastWindow, opts);
}

export function notifySuccess(message) {
  displayToast({
    type: "success",
    title: "Success",
    message: String(message || "Refined instruction copied")
  });
}

export function notifyError(message) {
  displayToast({
    type: "error",
    title: "Error",
    message: String(message || "Unknown error")
  });
}

export function notifyWarning(message) {
  displayToast({
    type: "warning",
    title: "Warning",
    message: String(message || "Attention required")
  });
}
