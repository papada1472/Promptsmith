import { REFINE_TIMEOUT_MS, SYSTEM_PROMPT } from "./constants.js";
import { ProviderManager } from "./ai/ProviderManager.js";
import { checkActiveElementIsEditable, captureActivePrompt, captureActiveSelection, replaceActivePrompt, writeClipboardText, getActiveProcessId, isValidAIResponse } from "./clipboardFlow.js";
import { store } from "./store.js";
import { metricsService } from "./services/metricsService.js";
import { refreshRewardDashboard } from "./windows.js";
import { loggers } from "./logger.js";

const log = loggers.refineController;

// Prevent multiple simultaneous refinements
let isRefining = false;

export async function refineSelectedText({ notifySuccess, notifyError, notifyWarning }) {
  if (isRefining) {
    log.info("Refinement already running, ignoring hotkey.");
    if (notifyWarning) {
      notifyWarning("Refinzi Busy", "A refinement is already in progress.", 2000);
    } else if (notifySuccess) {
      notifySuccess("Refinzi Busy: refinement already running", 2000);
    }
    return { ok: false, error: "already_running" };
  }

  isRefining = true;
  const startTime = Date.now();

  log.info("Refinement handler entered (Sparkle Mode from Hotkey)");

  try {
    let captureResult = await captureActiveSelection().catch(() => null);
    let input = captureResult?.text || "";
    let isEditable = false;
    let initialProcessId = 0;

    if (!input || !input.trim()) {
      const isEditableRaw = await checkActiveElementIsEditable().catch(() => ({ isEditable: false, processId: 0 }));
      isEditable = isEditableRaw?.isEditable;
      initialProcessId = isEditableRaw?.processId || 0;

      if (isEditable) {
        const capturePromptResult = await captureActivePrompt().catch(() => null);
        input = capturePromptResult?.text || "";
      } else {
        // Fallback for elevated Admin windows (UIPI restriction): attempt captureActivePrompt even if UIA returned false
        log.info("UIA returned isEditable=false, trying captureActivePrompt fallback for elevated windows");
        const fallbackCapture = await captureActivePrompt().catch(() => null);
        if (fallbackCapture?.text && fallbackCapture.text.trim()) {
          input = fallbackCapture.text;
          isEditable = true;
          log.info("UIPI Fallback successful: captured active prompt text despite UIA restriction");
        }
      }
    } else {
      isEditable = true;
    }

    // If not editable and capture returned nothing, show "Focus a textbox" warning
    if (!isEditable && (!input || !input.trim())) {
      log.info("Active element not editable and no selection captured.");
      const errorMsg = "Could not detect selected text or editable field. Please highlight text or click into a text field.";
      if (notifyWarning) {
        notifyWarning("Focus a textbox", errorMsg, 2500);
      } else if (notifyError) {
        notifyError("Focus a textbox", errorMsg, 2500);
      }
      return { ok: false, error: "not_editable" };
    }

    // If editable but capture returned nothing, show "Empty Prompt" warning
    if (!input || !input.trim()) {
      log.error("Capture empty / no selection");
      if (notifyError) {
        notifyError("Empty Prompt", "Please type a prompt or select some text first.", 2500);
      }
      return { ok: false, error: "empty_prompt" };
    }

    // Check quota (BYOK users bypass this limit)
    const activeProvider = store.get("activeProvider") || "gemini";
    const geminiApiKey = store.get("geminiApiKey") || process.env.GEMINI_API_KEY;
    const openRouterApiKey = store.get("openRouterApiKey") || process.env.OPENROUTER_API_KEY;
    const hasByok = (activeProvider === "gemini" && geminiApiKey) || 
                    (activeProvider === "openrouter" && openRouterApiKey);

    if (!hasByok) {
      const quota = metricsService.checkAndTrackQuota();
      if (quota.exceeded) {
        const err = new Error("Daily refinement quota reached (50/50).");
        err.code = "QUOTA_EXCEEDED";
        log.error("ERROR - QUOTA_EXCEEDED");
        throw err;
      }
    }

    // Actually call AI provider using the centralized failover refinement engine
    log.info("Calling AI provider via failover engine...");
    const { output, providerId } = await ProviderManager.refineWithFailover(input, {
      mode: "sparkle",
      systemPrompt: SYSTEM_PROMPT,
      timeoutMs: REFINE_TIMEOUT_MS
    });

    const latency = Date.now() - startTime;
    log.info(`AI response received from ${providerId}, length:`, output ? output.length : 0);

    // Persist refinement data with minimal disk writes:
    // recordRefinement writes metrics + historyLogs in ONE store.set.
    // lastRefinement + telemetryLogs are batched into a SECOND store.set.
    // Total: 2 writes (was 4).
    const refineTimestamp = new Date().toISOString();
    const refinements = metricsService.recordRefinement("prompt-improve", {
      input,
      output,
      timestamp: refineTimestamp,
    });

    // Replace in-place
    let pasted = false;
    if (initialProcessId) {
      const currentPid = await getActiveProcessId().catch(() => 0);
      if (currentPid && currentPid !== initialProcessId) {
        writeClipboardText(output);
        if (notifyWarning) {
          notifyWarning("Focus Changed", "⚠️ Focus changed. Prompt copied to clipboard.", 3000);
        } else if (notifySuccess) {
          notifySuccess("⚠️ Focus changed. Prompt copied to clipboard.", 3000);
        }
        pasted = true;
      }
    }

    if (!pasted) {
      try {
        await replaceActivePrompt(output);
        if (notifySuccess) {
          let successMsg = "✨ Prompt Improved";
          if (refinements === 1) successMsg = "🎉 First prompt improved";
          else if (refinements === 5) successMsg = "⚡ You're getting faster";
          else if (refinements === 20) successMsg = "🚀 Refinzi has saved you time on 20 prompts";
          notifySuccess(successMsg, 2000);
        }
      } catch (pasteErr) {
        writeClipboardText(output);
        if (notifySuccess) {
          notifySuccess("⚠️ Couldn't replace automatically. Result copied to clipboard.", 2500);
        }
      }
    }

    // Batch lastRefinement + telemetryLogs into a single write (was 2 separate writes)
    const existingLogs = store.get("telemetryLogs") || [];
    existingLogs.push({
      mode: "sparkle",
      success: true,
      prompt_length_before: input.length,
      prompt_length_after: output.length,
      duration_ms: latency,
      timestamp: refineTimestamp,
    });
    store.set({
      lastRefinement: { before: input, after: output, timestamp: refineTimestamp },
      telemetryLogs: existingLogs.length > 500 ? existingLogs.slice(-500) : existingLogs,
    });

    try {
      refreshRewardDashboard();
    } catch (err) {
      log.warn("Failed to refresh reward dashboard:", err.message);
    }

    return { ok: true, input, output };
  } catch (e) {
    const errMsg = e?.message || "Refinement failed";
    log.error("Refinement failed:", e?.code, "-", errMsg);

    // Record provider call failure + telemetry in a single batched write
    // (was 2 separate full-store disk writes)
    try {
      const failedProvider = store.get("activeProvider") || "deepseek";
      const failLabel = failedProvider.charAt(0).toUpperCase() + failedProvider.slice(1);
      const errorDuration = Date.now() - startTime;
      const providerDelta = metricsService._computeProviderCallDelta(
        failLabel, false, errorDuration, e?.code || "UNKNOWN_ERROR"
      );
      const errorLogs = store.get("telemetryLogs") || [];
      errorLogs.push({
        mode: "sparkle",
        success: false,
        prompt_length_before: 0,
        prompt_length_after: 0,
        duration_ms: errorDuration,
        timestamp: new Date().toISOString(),
      });
      store.set({
        ...providerDelta,
        telemetryLogs: errorLogs.length > 500 ? errorLogs.slice(-500) : errorLogs,
      });
    } catch (_) { /* never let metrics recording break the error path */ }

    if (notifyError) {
      if (e?.code === "MISSING_API_KEY" || errMsg.toLowerCase().includes("api key required")) {
        notifyError("API Key Required", "DeepSeek API key is required. Right-click Refinzi Tray > Settings to add your key.", 5000);
      } else if (e?.code === "RATE_LIMITED" || errMsg.toLowerCase().includes("rate limit") || errMsg.includes("429")) {
        notifyError("Rate Limit Reached", "AI provider is currently busy. Try again in 10s or switch model in Settings.", 4500);
      } else {
        notifyError("Couldn't Refine Selection", errMsg, 4500);
      }
    }
    return { ok: false, error: errMsg };

  } finally {
    isRefining = false;
    log.debug("Refinement lock released.");
  }
}
