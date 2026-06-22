import { REFINE_TIMEOUT_MS, SYSTEM_PROMPT } from "./constants.js";
import { ProviderManager } from "./ai/ProviderManager.js";
import { checkActiveElementIsEditable, captureActivePrompt, replaceActivePrompt, writeClipboardText } from "./clipboardFlow.js";
import { store } from "./store.js";
import { metricsService } from "./services/metricsService.js";
import { refreshRewardDashboard } from "./windows.js";

// Prevent multiple simultaneous refinements
let isRefining = false;

export async function refineSelectedText({ notifySuccess, notifyError, notifyWarning }) {
  if (isRefining) {
    console.log("[Refinzi][RefineController] Refinement already running, ignoring hotkey.");
    return { ok: false, error: "already_running" };
  }

  isRefining = true;
  const startTime = Date.now();

  console.log("[Refinzi][RefineController] Refinement handler entered (Sparkle Mode from Hotkey)");

  try {
    // Step 1: Detect active element
    const isEditable = await checkActiveElementIsEditable();
    if (!isEditable) {
      console.log("[Refinzi][RefineController] Active element not editable.");
      if (notifyError) {
        notifyError("Focus a textbox", "Please click into a text field to improve your prompt.", 2500);
      }
      return { ok: false, error: "not_editable" };
    }

    // Step 2: Capture active prompt
    const captureResult = await captureActivePrompt();
    const input = captureResult.text;

    if (!input || !input.trim()) {
      console.error("[Refinzi][RefineController] Capture empty / no selection");
      if (notifyError) {
        notifyError("Empty Prompt", "Please type a prompt in the text box first.", 2500);
      }
      return { ok: false, error: "empty_prompt" };
    }

    // Check quota first
    const quota = metricsService.checkAndTrackQuota();
    if (quota.exceeded) {
      const err = new Error("Daily refinement quota reached (50/50).");
      err.code = "QUOTA_EXCEEDED";
      console.error("[Refinzi][RefineController] ERROR - QUOTA_EXCEEDED");
      throw err;
    }

    // Actually call Gemini
    console.log("[Refinzi][RefineController] Calling Gemini AI provider...");
    const apiKey = store.get("geminiApiKey");
    if (!apiKey) {
      const err = new Error("No Gemini API key configured. Open Settings to add one.");
      err.code = "MISSING_API_KEY";
      console.error("[Refinzi][RefineController] ERROR - MISSING_API_KEY");
      throw err;
    }

    const activeModel = store.get("activeModel") || "gemini-2.5-flash";
    const provider = ProviderManager.createProvider("gemini", {
      apiKey,
      model: activeModel,
      systemPrompt: SYSTEM_PROMPT,
      timeoutMs: REFINE_TIMEOUT_MS
    });

    const output = await provider.refine(input);
    const latency = Date.now() - startTime;
    console.log("[Refinzi][RefineController] Gemini response received, length:", output.length);

    // Save to lastRefinement store for Undo
    store.set("lastRefinement", {
      before: input,
      after: output,
      timestamp: new Date().toISOString()
    });

    // Replace in-place
    try {
      await replaceActivePrompt(output);
      if (notifySuccess) {
        notifySuccess("✨ Prompt Improved", 2000);
      }
    } catch (pasteErr) {
      writeClipboardText(output);
      if (notifySuccess) {
        notifySuccess("⚠️ Couldn't replace automatically. Result copied to clipboard.", 2500);
      }
    }

    metricsService.recordSuccess();
    
    // Save telemetry log according to simplified schema
    const logs = store.get("telemetryLogs") || [];
    logs.push({
      mode: "sparkle",
      success: true,
      prompt_length_before: input.length,
      prompt_length_after: output.length,
      duration_ms: latency,
      timestamp: new Date().toISOString()
    });
    store.set("telemetryLogs", logs.slice(logs.length - 500));

    try {
      refreshRewardDashboard();
    } catch (err) {
      console.warn("[Refinzi][RefineController] Failed to refresh reward dashboard:", err.message);
    }

    return { ok: true, input, output };
  } catch (e) {
    const errMsg = e?.message || "Refinement failed";
    console.error("[Refinzi][RefineController] Refinement failed:", e?.code, "-", errMsg);

    const logs = store.get("telemetryLogs") || [];
    logs.push({
      mode: "sparkle",
      success: false,
      prompt_length_before: 0,
      prompt_length_after: 0,
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    store.set("telemetryLogs", logs.slice(logs.length - 500));

    if (notifyError) {
      notifyError("Couldn't refine this selection.", errMsg, 3000);
    }
    return { ok: false, error: errMsg };

  } finally {
    isRefining = false;
    console.log("[Refinzi][RefineController] Refinement lock released.");
  }
}
