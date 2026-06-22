import { globalShortcut } from "electron";

let registeredAccelerator = null;

export function registerHotkey(accelerator, handler) {
  const normalized = String(accelerator || "").trim();
  if (!normalized) {
    const err = new Error("Hotkey cannot be empty");
    err.code = "INVALID_HOTKEY";
    throw err;
  }

  if (normalized === registeredAccelerator) {
    console.log("[Refinzi][Shortcuts] Hotkey already registered", normalized);
    return;
  }

  const previous = registeredAccelerator;
  if (previous) {
    try {
      globalShortcut.unregister(previous);
      console.log("[Refinzi][Shortcuts] Unregistered previous hotkey", previous);
    } catch {
      // ignore
    }
  }

  const wrappedHandler = () => {
    console.log("[Refinzi][Shortcuts] Shortcut fired:", normalized);
    try {
      handler();
    } catch (e) {
      console.error("[Refinzi][Shortcuts] Shortcut handler error:", e?.message || e);
    }
  };

  const ok = globalShortcut.register(normalized, wrappedHandler);
  if (!ok) {
    console.error("[Refinzi][Shortcuts] Failed to register hotkey:", normalized);
    if (previous) {
      try {
        console.log("[Refinzi][Shortcuts] Attempting to restore previous hotkey", previous);
        globalShortcut.register(previous, handler);
      } catch {
        // ignore
      }
    }
    const err = new Error(`Failed to register hotkey: ${normalized}`);
    err.code = "HOTKEY_REGISTER_FAILED";
    throw err;
  }

  console.log("[Refinzi][Shortcuts] Successfully registered hotkey:", normalized);
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

