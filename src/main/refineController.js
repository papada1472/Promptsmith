import { REFINE_TIMEOUT_MS, SYSTEM_PROMPT } from "./constants.js";
import { GeminiProvider } from "./ai/GeminiProvider.js";
import { autoCopySelectedText, readClipboardText, writeClipboardText, autoPaste } from "./clipboardFlow.js";
import { appendRefinementLog, recordSuccessfulRefinement, checkAndTrackQuota, store } from "./store.js";

// Cache for the toast window reference (set from main.js)
let toastWindowRef = null;

export function setToastWindow(win) {
  toastWindowRef = win;
}

function showInAppToast(type, title, message) {
  try {
    if (toastWindowRef && !toastWindowRef.isDestroyed()) {
      const { showToast } = require("./windows.js");
      showToast(toastWindowRef, { type, title, message, duration: 4000 });
    }
  } catch {
    // fallback silently
  }
}

export async function refineSelectedText({ notifySuccess, notifyError }) {
  console.log("[Refinezy][RefineController] Refinement handler entered");

  const before = readClipboardText();
  console.log("[Refinezy][RefineController] Previous clipboard content saved (length:", (before || "").length, ")");

  // Show processing toast immediately
  showInAppToast("processing", "Improving your selection", "This usually takes a second.");

  try {
    console.log("[Refinezy][RefineController] Starting clipboard capture");
    const copiedText = await autoCopySelectedText();
    const input = copiedText || readClipboardText();
    console.log("[Refinezy][RefineController] Clipboard captured, text length:", (input || "").length);
    if (!input || !input.trim()) {
      const err = new Error("No selected text found. Select text and try again.");
      err.code = "NO_SELECTION";
      console.error("[Refinezy][RefineController] ERROR - NO_SELECTION");
      throw err;
    }

    // Check quota first
    const quota = checkAndTrackQuota();
    if (quota.exceeded) {
      const err = new Error("Daily refinement quota reached (50/50).");
      err.code = "QUOTA_EXCEEDED";
      console.error("[Refinezy][RefineController] ERROR - QUOTA_EXCEEDED");
      throw err;
    }

    // Actually call Gemini
    console.log("[Refinezy][RefineController] Calling Gemini AI provider...");
    const apiKey = store.get("geminiApiKey");
    if (!apiKey) {
      const err = new Error("No Gemini API key configured. Open Settings to add one.");
      err.code = "MISSING_API_KEY";
      console.error("[Refinezy][RefineController] ERROR - MISSING_API_KEY");
      throw err;
    }

    const provider = new GeminiProvider({
      apiKey,
      systemPrompt: SYSTEM_PROMPT,
      timeoutMs: REFINE_TIMEOUT_MS
    });

    const output = await provider.refine(input);
    console.log("[Refinezy][RefineController] Gemini response received, length:", output.length);

    try {
      writeClipboardText(output);
      console.log("[Refinezy][RefineController] Clipboard write successful");
    } catch (clipErr) {
      console.error("[Refinezy][RefineController] Clipboard write failed:", clipErr?.message || clipErr);
      throw clipErr;
    }

    await autoPaste();
    notifySuccess("Refined instruction copied and pasted.");
    showInAppToast("success", "Saved 2 retries", "Copied to clipboard.");

    recordSuccessfulRefinement();
    appendRefinementLog({
      input,
      output,
      timestamp: new Date().toISOString()
    });

    return { ok: true, input, output };
  } catch (e) {
    const errMsg = e?.message || "Refinement failed";
    console.error("[Refinezy][RefineController] Refinement failed:", e?.code, "-", errMsg);
    console.log("[Refinezy][RefineController] Restoring previous clipboard content...");
    try {
      writeClipboardText(before);
      console.log("[Refinezy][RefineController] Clipboard restored");
    } catch (restoreErr) {
      console.error("[Refinezy][RefineController] Failed to restore clipboard:", restoreErr?.message);
    }

    notifyError(errMsg);
    showInAppToast("error", "Couldn't improve this selection.", "Click the tray icon to review settings.");
    return { ok: false, error: errMsg };
  }
}

