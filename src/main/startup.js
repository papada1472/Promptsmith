import { app } from "electron";

export function applyLaunchOnStartup(enabled) {
  try {
    app.setLoginItemSettings({
      openAtLogin: Boolean(enabled),
      openAsHidden: true
    });
  } catch {
    // ignore
  }
}

export function getLaunchOnStartupState() {
  try {
    const s = app.getLoginItemSettings();
    return Boolean(s.openAtLogin);
  } catch {
    return false;
  }
}

