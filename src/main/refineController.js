import { REFINE_TIMEOUT_MS, SYSTEM_PROMPT } from "./constants.js";
import { GeminiProvider } from "./ai/GeminiProvider.js";
import { autoCopySelectedText, readClipboardText, writeClipboardText, autoPaste } from "./clipboardFlow.js";
import { appendRefinementLog, recordSuccessfulRefinement, store } from "./store.js";

export async function refineSelectedText({ notifySuccess, notifyError }) {
  console.log("[Refinezy][RefineController] Refinement handler entered");
  console.log("[Refinezy][RefineController] Refinement started");

  const before = readClipboardText();
  console.log("[Refinezy][RefineController] Previous clipboard content saved (length:", (before || "").length, ")");

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

    // Gemini disabled for Stage 4/6/7 debug test
    console.log("[Refinezy][RefineController] Gemini bypassed for debug test");
    const output = "REFINEZY_SUCCESS";
    console.log("[Refinezy][RefineController] Output set to:", output);
    try {
      writeClipboardText(output);
      console.log("[Refinezy][RefineController] Clipboard write successful");
    } catch (clipErr) {
      console.error("[Refinezy][RefineController] Clipboard write failed:", clipErr?.message || clipErr);
      throw clipErr;
    }

    await autoPaste();
    notifySuccess("Refined text copied to clipboard. Press Ctrl+V to paste.");

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
    return { ok: false, error: errMsg };
  }
}

