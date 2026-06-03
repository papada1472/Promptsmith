import { Notification, app } from "electron";
import { APP_NAME } from "./constants.js";

export function ensureAppUserModelId() {
  try {
    // Required for Windows notifications + taskbar identity.
    app.setAppUserModelId("com.refinezy.app");
  } catch {
    // ignore
  }
}

export function notifySuccess(message) {
  try {
    new Notification({
      title: APP_NAME,
      body: String(message || "Refined instruction copied")
    }).show();
  } catch {
    // ignore
  }
}

export function notifyError(message) {
  try {
    new Notification({
      title: `${APP_NAME} Error`,
      body: String(message || "Unknown error")
    }).show();
  } catch {
    // ignore
  }
}

