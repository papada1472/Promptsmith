import { globalShortcut } from "electron";
import { createLogger } from "./logger.js";

const log = createLogger("Shortcuts");

let registeredAccelerator = null;

export function registerHotkey(accelerator, handler) {
  const normalized = String(accelerator || "").trim();
  if (!normalized) {
    const err = new Error("Hotkey cannot be empty");
    err.code = "INVALID_HOTKEY";
    throw err;
  }

  if (normalized === registeredAccelerator) {
    log.debug("Hotkey already registered", normalized);
    return;
  }

  const previous = registeredAccelerator;
  if (previous) {
    try {
      globalShortcut.unregister(previous);
      log.debug("Unregistered previous hotkey", previous);
    } catch {
      // ignore
    }
  }

  const wrappedHandler = () => {
    log.debug("Shortcut fired:", normalized);
    try {
      handler();
    } catch (e) {
      log.error("Shortcut handler error:", e?.message || e);
    }
  };

  const ok = globalShortcut.register(normalized, wrappedHandler);
  if (!ok) {
    log.error("Failed to register hotkey:", normalized);
    if (previous) {
      try {
        log.debug("Attempting to restore previous hotkey", previous);
        globalShortcut.register(previous, handler);
      } catch {
        // ignore
      }
    }
    const err = new Error(`Failed to register hotkey: ${normalized}`);
    err.code = "HOTKEY_REGISTER_FAILED";
    throw err;
  }

  log.debug("Successfully registered hotkey:", normalized);
  registeredAccelerator = normalized;
}

export function unregisterAllHotkeys() {
  try {
    globalShortcut.unregisterAll();
  } catch {
    // ignore
  }
  registeredAccelerator = null;
}


