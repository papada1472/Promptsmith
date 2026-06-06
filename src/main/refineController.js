import { REFINE_TIMEOUT_MS, SYSTEM_PROMPT } from "./constants.js";
import { ProviderManager } from "./ai/ProviderManager.js";
import { autoCopySelectedText, readClipboardText, writeClipboardText, autoPaste } from "./clipboardFlow.js";
import { store } from "./store.js";
import { metricsService } from "./services/metricsService.js";

// Prevent multiple simultaneous refinements
let isRefining = false;

export async function refineSelectedText({ notifySuccess, notifyError, notifyWarning }) {
  if (isRefining) {
    console.log("[Refinezy][RefineController] Refinement already running, ignoring hotkey.");
    return;
  }

  isRefining = true;

  console.log("[Refinezy][RefineController] Refinement handler entered");

  const before = readClipboardText();
  console.log("[Refinezy][RefineController] Previous clipboard content saved (length:", (before || "").length, ")");

  // Show persistent processing toast
  if (notifyWarning) {
    notifyWarning("Improving your workflow", "Your prompts stay on your device.", true);
  }

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
    const quota = metricsService.checkAndTrackQuota();
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

    const provider = ProviderManager.createProvider("gemini", {
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

    if (notifySuccess) {
      notifySuccess("✓ Done", 300);
    }

    metricsService.recordSuccess();
    metricsService.appendLog({
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

    if (notifyError) {
      notifyError("Couldn't refine this selection.", errMsg, 3000);
    }
    return { ok: false, error: errMsg };

  } finally {
    isRefining = false;
    console.log("[Refinezy][RefineController] Refinement lock released.");
  }
}
