import { app } from "electron";
import { showToast, createToastWindow } from "./windows.js";

let toastWindow = null;

export function ensureAppUserModelId() {
  try {
    // Required for Windows notifications + taskbar identity.
    app.setAppUserModelId("com.refinzi.app");
  } catch {
    // ignore
  }
}

/**
 * Show a toast notification.
 *
 * The toast window is created lazily. In the original implementation the
 * window was created and `showToast` was called immediately. This caused a
 * race condition: the `toast:trigger` IPC message could be sent before the
 * renderer had executed `window.refinzi.toast.onShow(cb)`, meaning the first
 * processing toast (the "floating orb") was never displayed.
 *
 * To fix the race we wait for the window to emit `ready-to-show` – which
 * occurs after the preload script has run and the renderer has registered its
 * listener – before sending the first toast. Subsequent toasts use the already
 * loaded window and are sent immediately.
 */
function displayToast(opts) {
  // If the toast window does not exist or has been destroyed, create it and
  // wait for it to be ready before sending the first toast.
  if (!toastWindow || toastWindow.isDestroyed()) {
    toastWindow = createToastWindow();
    // `ready-to-show` fires after the renderer has loaded and the preload has
    // exposed the `toast:onShow` registration. This guarantees the IPC
    // listener is in place before we emit the toast event.
    toastWindow.once('ready-to-show', () => {
      showToast(toastWindow, opts);
    });
    return; // The toast will be shown once the window is ready.
  }
  // Window already exists – safe to send the toast immediately.
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

export function notifyWarning(title, message, duration = 3000) {
  displayToast({
    type: "processing",
    title: String(title || "Warning"),
    message: String(message || "Attention required"),
    duration
  });
}
