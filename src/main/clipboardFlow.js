import { clipboard } from "electron";
import { keyboard, Key } from "@nut-tree-fork/nut-js";
import { exec } from "child_process";
import { loggers } from "./logger.js";
import { isValidAIResponse } from "./outputValidator.js";

const log = loggers.clipboardFlow;


keyboard.config.autoDelayMs = 10;

/**
 * Simulates Ctrl+C keyboard shortcut to copy selected text.
 * Sequence: Ctrl down -> C down -> C up -> Ctrl up
 */
async function performCopy() {
  log.debug("performCopy: Executing Ctrl+C sequence");
  try {
    const copyPromise = (async () => {
      await keyboard.pressKey(Key.LeftControl);
      await keyboard.pressKey(Key.C);
      await keyboard.releaseKey(Key.C);
      await keyboard.releaseKey(Key.LeftControl);
    })();

    await Promise.race([
      copyPromise,
      new Promise(resolve => setTimeout(resolve, 300))
    ]);
    log.debug("performCopy: Ctrl+C sequence completed");
  } catch (e) {
    log.error("performCopy error:", e?.message || e);
  }
}

/**
 * Simulates Ctrl+V keyboard shortcut to paste text.
 * Sequence: Ctrl down -> V down -> V up -> Ctrl up
 */
export async function autoPaste() {
  log.debug("AUTO_PASTE_STARTED");
  try {
    const pastePromise = (async () => {
      await keyboard.pressKey(Key.LeftControl);
      await keyboard.pressKey(Key.V);
      await keyboard.releaseKey(Key.V);
      await keyboard.releaseKey(Key.LeftControl);
    })();

    await Promise.race([
      pastePromise,
      new Promise(resolve => setTimeout(resolve, 300))
    ]);
    log.debug("AUTO_PASTE_SUCCESS");
  } catch (e) {
    log.error("AUTO_PASTE_FAILED:", e?.message || e);
    throw e;
  }
}

/**
 * Captures the active selection by simulating Ctrl+C.
 * Returns empty string if capture fails so caller can check active textbox or show prompt.
 * @returns {{ text: string, fromClipboard: boolean }}
 */
export async function captureActiveSelection() {
  const originalClipboard = clipboard.readText() || "";
  try {
    const text = await autoCopySelectedText(originalClipboard);
    return { text, fromClipboard: false };
  } catch (_e) {
    log.info("Selection capture failed, restoring original clipboard");
    restoreClipboard(originalClipboard);
    return { text: "", fromClipboard: true };
  }
}

/**
 * Restores the clipboard to its previous content.
 * @param {string} previousText
 */
export function restoreClipboard(previousText) {
  try {
    clipboard.writeText(previousText || "");
    log.debug("Clipboard restored");
  } catch (e) {
    log.error("Failed to restore clipboard:", e?.message || e);
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
    log.debug(`CAPTURE_ATTEMPT_${attempt}`);

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
          log.debug("SELECTION_CAPTURE_SUCCESS");
          return capturedText;
        }
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }

      log.info(`Attempt ${attempt}: Selection capture timed out (sentinel still present)`);
    } catch (e) {
      log.error(`Attempt ${attempt} exception:`, e?.message || e);
    } finally {
      // CRITICAL: Always ensure the sentinel is removed from the clipboard before proceeding or retrying
      try {
        if (clipboard.readText() === sentinel) {
          clipboard.writeText(originalClipboard);
        }
      } catch (restoreErr) {
        log.error("Failed to restore clipboard in finally block:", restoreErr);
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
  log.error("SELECTION_CAPTURE_FAILED");
  throw err;
}

export function readClipboardText() {
  try {
    const text = clipboard.readText() || "";
    log.debug("Read clipboard, length:", text.length);
    return text;
  } catch (e) {
    log.error("ERROR reading clipboard:", e?.message || e);
    return "";
  }
}

export function writeClipboardText(text) {
  try {
    const textStr = String(text ?? "");
    log.debug("Writing to clipboard (length:", textStr.length, ")");
    clipboard.writeText(textStr);
    log.debug("Clipboard write completed");

    // Verify write
    const verify = clipboard.readText();
    if (verify === textStr) {
      log.debug("Clipboard write verified - content matches");
    } else {
      log.warn("Clipboard write verification failed - content mismatch");
      log.warn("Expected length:", textStr.length, "Actual length:", verify?.length || 0);
    }
  } catch (e) {
    log.error("ERROR writing to clipboard:", e?.message || e);
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
        if ($el -eq $null) { Write-Host 'false|0|'; exit; }
        $type = $el.Current.ControlType.ProgrammaticName;
        $class = $el.Current.ClassName;
        $name = $el.Current.Name;
        $aid  = $el.Current.AutomationId;
        $pid  = $el.Current.ProcessId;

        Write-Host \\"[UIA] type=\$type class=\$class name=\$name aid=\$aid pid=\$pid\\";

        # Relaxed validation — accept any common editable control type
        $isEdit = ($type -eq 'ControlType.Edit') -or 
                  ($type -eq 'ControlType.Document') -or 
                  ($type -eq 'ControlType.ComboBox') -or 
                  ($type -eq 'ControlType.Custom');

        if (-not $isEdit) {
          # Fallback 1: check ValuePattern (covers contenteditables that expose writable value)
          $valPattern = $null;
          if ($el.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$valPattern)) {
            if (-not $valPattern.Current.IsReadOnly) {
              $isEdit = $true;
            }
          }
        }

        if (-not $isEdit) {
          # Fallback 2: check IsContentEditable property (covers HTML contenteditable elements)
          try {
            $isContentEditable = $el.GetCurrentPropertyValue([System.Windows.Automation.AutomationElement]::IsContentEditableProperty);
            if ($isContentEditable -eq $true) { $isEdit = $true; }
          } catch {}
        }

        if ($isEdit) {
          Write-Host \\"true|\$pid|\$class\\";
        } else {
          Write-Host \\"false|\$pid|\$class\\";
        }
      } catch {
        Write-Host 'false|0|';
      }
    "`;

    exec(psCommand, { timeout: 1500 }, (error, stdout) => {
      if (error) {
        log.error("Focused element check error:", error);
        resolve({ isEditable: false, processId: 0, className: "" });
        return;
      }
      const lines = stdout.trim().split('\n').map(l => l.trim());
      const diagLine = lines.find(l => l.startsWith('[UIA]'));
      if (diagLine) log.debug(diagLine);

      const resultLine = lines.filter(l => !l.startsWith('[UIA]') && l.includes('|')).length > 0
        ? lines.filter(l => !l.startsWith('[UIA]') && l.includes('|'))[0]
        : lines[lines.length - 1] || "false|0|";

      const parts = resultLine.split('|');
      const isEditable = parts[0]?.trim().toLowerCase() === 'true';
      const processId = parseInt(parts[1] || '0', 10);
      const className = parts[2] || '';

      resolve({ isEditable, processId, className });
    });
  });
}

/**
 * Fast helper to retrieve the foreground active window's process ID.
 * Uses standard Win32 GetForegroundWindow call inside PowerShell.
 * Runs in ~200ms without loading heavy UIA assemblies.
 * @returns {Promise<number>}
 */
export function getActiveProcessId() {
  return new Promise((resolve) => {
    const psCommand = `powershell -NoProfile -NonInteractive -WindowStyle Hidden -Command "
      Add-Type -TypeDefinition '
        using System;
        using System.Runtime.InteropServices;
        public class Win32 {
          [DllImport(\\"user32.dll\\")]
          public static extern IntPtr GetForegroundWindow();
          [DllImport(\\"user32.dll\\")]
          public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
        }
      ';
      $hwnd = [Win32]::GetForegroundWindow();
      $pid = 0;
      [Win32]::GetWindowThreadProcessId($hwnd, [ref]$pid);
      $pid;
    "`;
    exec(psCommand, { timeout: 1500 }, (error, stdout) => {
      if (error) {
        resolve(0);
        return;
      }
      const pid = parseInt(stdout.trim(), 10);
      resolve(isNaN(pid) ? 0 : pid);
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
        log.debug("ACTIVE_PROMPT_CAPTURE_SUCCESS");
        return { text: capturedText, fromClipboard: false };
      }
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    log.info("Selection capture timed out (sentinel still present), field might be empty");
    return { text: "", fromClipboard: true };
  } catch (e) {
    log.error("captureActivePrompt exception:", e?.message || e);
    return { text: originalClipboard, fromClipboard: true };
  } finally {
    try {
      const currentText = clipboard.readText();
      if (currentText && currentText.startsWith("refinzi-capturing-")) {
        clipboard.writeText(originalClipboard);
      }
    } catch (err) {
      log.error("Failed to restore clipboard in finally block:", err);
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
  let clipboardChanged = false;
  try {
    clipboard.writeText(newText);
    clipboardChanged = true;

    // Perform paste (Ctrl+A then Ctrl+V)
    await keyboard.pressKey(Key.LeftControl);
    await keyboard.pressKey(Key.A);
    await keyboard.releaseKey(Key.A);

    await keyboard.pressKey(Key.V);
    await keyboard.releaseKey(Key.V);
    await keyboard.releaseKey(Key.LeftControl);

    // Bounded 200ms wait for target app paste consumption
    await new Promise(resolve => setTimeout(resolve, 200));
    log.debug("replaceActivePrompt success");
  } catch (e) {
    log.error("replaceActivePrompt failed:", e?.message || e);
    throw e;
  } finally {
    if (clipboardChanged) {
      try {
        const current = clipboard.readText();
        // Race-Aware Restoration: Only restore if clipboard content STILL matches newText.
        // If user copied new text or target app modified clipboard, DO NOT overwrite!
        if (current === newText) {
          restoreClipboard(originalClipboard);
          log.debug("Clipboard safely restored to original state.");
        } else {
          log.warn("Clipboard was modified by user/app during paste window. Skipping restoration to protect user data.");
        }
      } catch (err) {
        log.error("Failed to restore clipboard in replaceActivePrompt finally:", err);
      }
    }
  }
}

/**
 * Delegates to outputValidator.js — re-exported for backward compatibility.
 * @param {string} input - The original prompt text.
 * @param {string} output - The AI generated prompt text.
 * @returns {{ valid: boolean, reason?: string }}
 */
export { isValidAIResponse };
