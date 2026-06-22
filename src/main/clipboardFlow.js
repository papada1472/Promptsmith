import { clipboard } from "electron";
import { keyboard, Key } from "@nut-tree-fork/nut-js";
import { exec } from "child_process";

/**
 * Simulates Ctrl+C keyboard shortcut to copy selected text.
 * Sequence: Ctrl down -> C down -> C up -> Ctrl up
 */
async function performCopy() {
  console.log("[Refinzi][ClipboardFlow] performCopy: Executing Ctrl+C sequence");
  await keyboard.pressKey(Key.LeftControl);
  await keyboard.pressKey(Key.C);
  await keyboard.releaseKey(Key.C);
  await keyboard.releaseKey(Key.LeftControl);
  console.log("[Refinzi][ClipboardFlow] performCopy: Ctrl+C sequence completed");
}

/**
 * Simulates Ctrl+V keyboard shortcut to paste text.
 * Sequence: Ctrl down -> V down -> V up -> Ctrl up
 */
export async function autoPaste() {
  console.log("[Refinzi][ClipboardFlow] AUTO_PASTE_STARTED");
  try {
    await keyboard.pressKey(Key.LeftControl);
    await keyboard.pressKey(Key.V);
    await keyboard.releaseKey(Key.V);
    await keyboard.releaseKey(Key.LeftControl);
    console.log("[Refinzi][ClipboardFlow] AUTO_PASTE_SUCCESS");
  } catch (e) {
    console.error("[Refinzi][ClipboardFlow] AUTO_PASTE_FAILED:", e?.message || e);
    throw e;
  }
}

/**
 * Captures the active selection by simulating Ctrl+C.
 * Falls back to reading the existing clipboard content if capture fails.
 * @returns {{ text: string, fromClipboard: boolean }}
 */
export async function captureActiveSelection() {
  const originalClipboard = clipboard.readText() || "";
  try {
    const text = await autoCopySelectedText(originalClipboard);
    return { text, fromClipboard: false };
  } catch (_e) {
    // Fallback: restore original clipboard (removing the sentinel) and return it
    console.log("[Refinzi][ClipboardFlow] Selection capture failed, restoring and falling back to original clipboard");
    restoreClipboard(originalClipboard);
    return { text: originalClipboard, fromClipboard: true };
  }
}

/**
 * Restores the clipboard to its previous content.
 * @param {string} previousText
 */
export function restoreClipboard(previousText) {
  try {
    clipboard.writeText(previousText || "");
    console.log("[Refinzi][ClipboardFlow] Clipboard restored");
  } catch (e) {
    console.error("[Refinzi][ClipboardFlow] Failed to restore clipboard:", e?.message || e);
  }
}

/**
 * Captures selected text by simulating Ctrl+C and reading the clipboard.
 * Retries up to 3 times if sentinel marker is still present.
 * 
 * Flow:
 * 1. Write a unique sentinel marker to the clipboard
 * 2. Execute Ctrl+C via performCopy()
 * 3. Poll clipboard until it changes from the sentinel or timeout
 * 4. If clipboard does not contain the sentinel, return the text
 * 5. Otherwise, retry
 */
export async function autoCopySelectedText(originalClipboard = "") {
  const maxRetries = 3;
  const pollIntervalMs = 20;
  const maxPollTimeMs = 200;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Refinzi][ClipboardFlow] CAPTURE_ATTEMPT_${attempt}`);

    // Use a more discreet sentinel that won't look like an error if it leaks
    const sentinel = `refinzi-capturing-${Math.random().toString(36).substring(7)}`;

    try {
      // Write sentinel to clipboard
      clipboard.writeText(sentinel);

      // Execute Ctrl+C to copy selected text
      await performCopy();

      // Poll for clipboard change
      const startTime = Date.now();
      let capturedText = sentinel;

      while (Date.now() - startTime < maxPollTimeMs) {
        capturedText = clipboard.readText() || "";
        if (capturedText !== sentinel) {
          console.log("[Refinzi][ClipboardFlow] SELECTION_CAPTURE_SUCCESS");
          return capturedText;
        }
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }

      console.log(`[Refinzi][ClipboardFlow] Attempt ${attempt}: Selection capture timed out (sentinel still present)`);
    } catch (e) {
      console.error(`[Refinzi][ClipboardFlow] Attempt ${attempt} exception:`, e?.message || e);
    } finally {
      // CRITICAL: Always ensure the sentinel is removed from the clipboard before proceeding or retrying
      try {
        if (clipboard.readText() === sentinel) {
          clipboard.writeText(originalClipboard);
        }
      } catch (restoreErr) {
        console.error("[Refinzi][ClipboardFlow] Failed to restore clipboard in finally block:", restoreErr);
      }
    }
  }

  // Final safety check to ensure the sentinel NEVER leaks
  const finalCheck = clipboard.readText();
  if (finalCheck && finalCheck.startsWith("refinzi-capturing-")) {
    clipboard.writeText(originalClipboard);
  }

  const err = new Error("Failed to capture selected text after 3 attempts");
  err.code = "SELECTION_CAPTURE_FAILED";
  console.error("[Refinzi][ClipboardFlow] SELECTION_CAPTURE_FAILED");
  throw err;
}

export function readClipboardText() {
  try {
    const text = clipboard.readText() || "";
    console.log("[Refinzi][ClipboardFlow] Read clipboard, length:", text.length);
    return text;
  } catch (e) {
    console.error("[Refinzi][ClipboardFlow] ERROR reading clipboard:", e?.message || e);
    return "";
  }
}

export function writeClipboardText(text) {
  try {
    const textStr = String(text ?? "");
    console.log("[Refinzi][ClipboardFlow] Writing to clipboard (length:", textStr.length, ")");
    clipboard.writeText(textStr);
    console.log("[Refinzi][ClipboardFlow] Clipboard write completed");

    // Verify write
    const verify = clipboard.readText();
    if (verify === textStr) {
      console.log("[Refinzi][ClipboardFlow] Clipboard write verified - content matches");
    } else {
      console.warn("[Refinzi][ClipboardFlow] Clipboard write verification failed - content mismatch");
      console.warn("[Refinzi][ClipboardFlow] Expected length:", textStr.length, "Actual length:", verify?.length || 0);
    }
  } catch (e) {
    console.error("[Refinzi][ClipboardFlow] ERROR writing to clipboard:", e?.message || e);
    throw e;
  }
}

/**
 * Checks if the active focused foreground window element is editable
 * using Windows UI Automation via PowerShell.
 * Runs in ~250ms asynchronously.
 * @returns {Promise<boolean>}
 */
export function checkActiveElementIsEditable() {
  return new Promise((resolve) => {
    const psCommand = `powershell -NoProfile -NonInteractive -WindowStyle Hidden -Command "
      Add-Type -AssemblyName UIAutomationClient;
      try {
        $el = [System.Windows.Automation.AutomationElement]::FocusedElement;
        if ($el -eq $null) { Write-Host 'false'; exit; }
        $type = $el.Current.ControlType.ProgrammaticName;
        $class = $el.Current.ClassName;
        
        $isEdit = ($type -eq 'ControlType.Edit') -or 
                  ($type -eq 'ControlType.ComboBox') -or 
                  (($type -eq 'ControlType.Document') -and ($class -notlike '*Chrome_RenderWidgetHostHWND*') -and ($class -notlike '*RenderWidgetHostHWND*'));
                  
        if ($isEdit) {
          Write-Host 'true';
        } else {
          $valPattern = $null;
          if ($el.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$valPattern)) {
            if (-not $valPattern.Current.IsReadOnly) {
              Write-Host 'true';
              exit;
            }
          }
          Write-Host 'false';
        }
      } catch {
        Write-Host 'false';
      }
    "`;
    
    exec(psCommand, (error, stdout) => {
      if (error) {
        console.error("[Refinzi][ClipboardFlow] Focused element check error:", error);
        resolve(false);
        return;
      }
      const res = stdout.trim().toLowerCase();
      resolve(res === "true");
    });
  });
}

/**
 * Captures the entire content of the active focused element.
 * Simulates Ctrl+A -> Ctrl+C.
 * @returns {Promise<{ text: string, fromClipboard: boolean }>}
 */
export async function captureActivePrompt() {
  const originalClipboard = clipboard.readText() || "";
  try {
    const sentinel = `refinzi-capturing-${Math.random().toString(36).substring(7)}`;
    clipboard.writeText(sentinel);
    
    // Select all
    await keyboard.pressKey(Key.LeftControl);
    await keyboard.pressKey(Key.A);
    await keyboard.releaseKey(Key.A);
    
    // Copy
    await keyboard.pressKey(Key.C);
    await keyboard.releaseKey(Key.C);
    await keyboard.releaseKey(Key.LeftControl);
    
    // Poll for clipboard change
    const maxPollTimeMs = 300;
    const pollIntervalMs = 20;
    const startTime = Date.now();
    let capturedText = sentinel;

    while (Date.now() - startTime < maxPollTimeMs) {
      capturedText = clipboard.readText() || "";
      if (capturedText !== sentinel) {
        console.log("[Refinzi][ClipboardFlow] ACTIVE_PROMPT_CAPTURE_SUCCESS");
        return { text: capturedText, fromClipboard: false };
      }
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
    
    console.log("[Refinzi][ClipboardFlow] Selection capture timed out (sentinel still present), field might be empty");
    return { text: "", fromClipboard: true };
  } catch (e) {
    console.error("[Refinzi][ClipboardFlow] captureActivePrompt exception:", e?.message || e);
    return { text: originalClipboard, fromClipboard: true };
  } finally {
    try {
      const currentText = clipboard.readText();
      if (currentText && currentText.startsWith("refinzi-capturing-")) {
        clipboard.writeText(originalClipboard);
      }
    } catch (err) {
      console.error("[Refinzi][ClipboardFlow] Failed to restore clipboard in finally block:", err);
    }
  }
}

/**
 * Overwrites the active focused element text in-place with newText.
 * Simulates Ctrl+A -> Ctrl+V.
 * @param {string} newText
 * @returns {Promise<void>}
 */
export async function replaceActivePrompt(newText) {
  const originalClipboard = clipboard.readText() || "";
  try {
    clipboard.writeText(newText);
    
    // Perform paste (Ctrl+A then Ctrl+V)
    await keyboard.pressKey(Key.LeftControl);
    await keyboard.pressKey(Key.A);
    await keyboard.releaseKey(Key.A);
    
    await keyboard.pressKey(Key.V);
    await keyboard.releaseKey(Key.V);
    await keyboard.releaseKey(Key.LeftControl);
    
    console.log("[Refinzi][ClipboardFlow] replaceActivePrompt success");
  } catch (e) {
    console.error("[Refinzi][ClipboardFlow] replaceActivePrompt failed:", e?.message || e);
    throw e;
  }
}