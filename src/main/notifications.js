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

export function notifySuccess(message, duration = 2500) {
  displayToast({
    type: "success",
    title: "Success",
    message: String(message || "Refined instruction copied"),
    duration
  });
}

export function notifyError(title, message, duration = 3000) {
  displayToast({
    type: "error",
    title: String(title || "Error"),
    message: String(message || "Unknown error"),
    duration
  });
}

export function notifyWarning(title, message, persistent = false) {
  displayToast({
    type: "processing",
    title: String(title || "Warning"),
    message: String(message || "Attention required"),
    persistent
  });
}
