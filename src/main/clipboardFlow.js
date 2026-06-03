import { clipboard } from "electron";
import { keyboard, Key } from "@nut-tree-fork/nut-js";

/**
 * Simulates Ctrl+C keyboard shortcut to copy selected text.
 * Sequence: Ctrl down -> C down -> C up -> Ctrl up
 */
async function performCopy() {
  console.log("[Refinezy][ClipboardFlow] performCopy: Executing Ctrl+C sequence");
  await keyboard.pressKey(Key.LeftControl);
  await keyboard.pressKey(Key.C);
  await keyboard.releaseKey(Key.C);
  await keyboard.releaseKey(Key.LeftControl);
  console.log("[Refinezy][ClipboardFlow] performCopy: Ctrl+C sequence completed");
}

/**
 * Simulates Ctrl+V keyboard shortcut to paste text.
 * Sequence: Ctrl down -> V down -> V up -> Ctrl up
 */
export async function autoPaste() {
  console.log("[Refinezy][ClipboardFlow] AUTO_PASTE_STARTED");
  try {
    await keyboard.pressKey(Key.LeftControl);
    await keyboard.pressKey(Key.V);
    await keyboard.releaseKey(Key.V);
    await keyboard.releaseKey(Key.LeftControl);
    console.log("[Refinezy][ClipboardFlow] AUTO_PASTE_SUCCESS");
  } catch (e) {
    console.error("[Refinezy][ClipboardFlow] AUTO_PASTE_FAILED:", e?.message || e);
    throw e;
  }
}

/**
 * Captures selected text by simulating Ctrl+C and reading the clipboard.
 * Retries up to 3 times if clipboard doesn't change.
 * 
 * Flow:
 * 1. Save current clipboard content
 * 2. Execute Ctrl+C via performCopy()
 * 3. Wait for clipboard update
 * 4. Read updated clipboard
 * 5. Return the selected text
 */
export async function autoCopySelectedText() {
  const maxRetries = 3;
  const delayMs = 300;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Refinezy][ClipboardFlow] CAPTURE_ATTEMPT_${attempt}`);

    // Save current clipboard content
    const before = clipboard.readText() || "";
    console.log(`[Refinezy][ClipboardFlow] Clipboard before length: ${before.length}`);

    try {
      // Execute Ctrl+C to copy selected text
      await performCopy();

      // Wait for clipboard to update
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Read updated clipboard
      const after = clipboard.readText() || "";
      console.log(`[Refinezy][ClipboardFlow] Clipboard after length: ${after.length}`);

      // Check if clipboard changed (new content was copied)
      if (after !== before) {
        console.log("[Refinezy][ClipboardFlow] SELECTION_CAPTURE_SUCCESS");
        return after;
      }

      console.log(`[Refinezy][ClipboardFlow] Attempt ${attempt}: Clipboard unchanged, will retry...`);
    } catch (e) {
      console.error(`[Refinezy][ClipboardFlow] Attempt ${attempt} failed:`, e?.message || e);
    }
  }

  // All retries exhausted
  const err = new Error("Failed to capture selected text after 3 attempts");
  err.code = "SELECTION_CAPTURE_FAILED";
  console.error("[Refinezy][ClipboardFlow] SELECTION_CAPTURE_FAILED");
  throw err;
}

export function readClipboardText() {
  try {
    const text = clipboard.readText() || "";
    console.log("[Refinezy][ClipboardFlow] Read clipboard, length:", text.length);
    return text;
  } catch (e) {
    console.error("[Refinezy][ClipboardFlow] ERROR reading clipboard:", e?.message || e);
    return "";
  }
}

export function writeClipboardText(text) {
  try {
    const textStr = String(text ?? "");
    console.log("[Refinezy][ClipboardFlow] Writing to clipboard (length:", textStr.length, ")");
    clipboard.writeText(textStr);
    console.log("[Refinezy][ClipboardFlow] Clipboard write completed");

    // Verify write
    const verify = clipboard.readText();
    if (verify === textStr) {
      console.log("[Refinezy][ClipboardFlow] Clipboard write verified - content matches");
    } else {
      console.warn("[Refinezy][ClipboardFlow] Clipboard write verification failed - content mismatch");
      console.warn("[Refinezy][ClipboardFlow] Expected length:", textStr.length, "Actual length:", verify?.length || 0);
    }
  } catch (e) {
    console.error("[Refinezy][ClipboardFlow] ERROR writing to clipboard:", e?.message || e);
    throw e;
  }
}