import { BrowserWindow, app, ipcMain, screen, clipboard, Menu } from "electron";
import path from "path";
import { buildEnvelope } from "./output/compiler.js";
import { optimizeEnvelope } from "./output/optimizer.js";
import { buildExecutionPlan } from "./output/promptEngineer.js";
import { store } from "./store.js";
import { captureIntent } from "./output/intentCapture.js";
import { classifyClipboardContent } from "./artifactDetector.js";
import { ProviderManager } from "./ai/ProviderManager.js";
import { REFINE_TIMEOUT_MS } from "./constants.js";
import { notifySuccess, notifyError } from "./notifications.js";
import { checkActiveElementIsEditable, captureActivePrompt, captureActiveSelection, replaceActivePrompt, restoreClipboard, getActiveProcessId, isValidAIResponse } from "./clipboardFlow.js";
import { metricsService } from "./services/metricsService.js";
import { refreshRewardDashboard, createOutputModalWindow } from "./windows.js";
import { upgradeToExpertPrompt } from "./artifactAnalyzer.js";
import { loggers } from "./logger.js";

const log = loggers.orbWindow;

let orbWindow = null;
let outputModalWindow = null;
let pipelineRegistered = false;
let isOrbRunning = false;

/**
 * Determine if an error represents a 503 Service Unavailable response.
 */
function is503Error(e) {
  const status = e?.status || e?.statusCode || e?.code || e?.response?.status;
  if (status === 503) return true;
  if (typeof e?.message === "string" && /503|service.?unavailable|temporarily.?unavailable/i.test(e.message)) return true;
  return false;
}

/**
 * Determine if an error represents a 429 Too Many Requests / rate-limit response.
 */
function is429Error(e) {
  const status = e?.status || e?.statusCode || e?.code || e?.response?.status;
  if (status === 429) return true;
  if (typeof e?.message === "string" && /429|resource.?exhausted|rate.?limit|quota/i.test(e.message)) return true;
  return false;
}

/**
 * Extract a retry delay (in ms) from an error, defaulting to 2000ms if none found.
 */
function getRetryDelay(e) {
  const raw = e?.retryDelay || e?.retryAfter || e?.response?.headers?.["retry-after"];
  if (raw) {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) return parsed * 1000;
  }
  return 2000;
}

function sendStatus(msg) {
  log.debug("[MAIN] status sent:", msg);
  if (orbWindow) {
    orbWindow.webContents.send("orb:status", msg);
  }
}

function sendResponse(msg) {
  log.debug("[MAIN] response sent:", msg);
  if (orbWindow) {
    orbWindow.webContents.send("orb:response", msg);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkDailyQuota() {
  const activeProvider = store.get("activeProvider") || "gemini";
  const geminiApiKey = store.get("geminiApiKey") || process.env.GEMINI_API_KEY;
  const openRouterApiKey = store.get("openRouterApiKey") || process.env.OPENROUTER_API_KEY;
  const hasByok = (activeProvider === "gemini" && geminiApiKey) || 
                  (activeProvider === "openrouter" && openRouterApiKey);

  if (hasByok) {
    return false; // BYOK users have infinite quota
  }
  return metricsService.getStats().quotaExceeded;
}

/**
 * Tracks quota usage for the Orb path.
 * Delegates directly to metricsService.
 */
function trackQuotaUsage() {
  metricsService.checkAndTrackQuota();
}

/**
 * Log a single analytics event to the telemetryLogs store.
 * Every Orb interaction generates exactly one event.
 * NEVER stores: clipboard contents, user prompts, user documents.
 */
function logAnalyticsEvent({ mode, success, prompt_length_before, prompt_length_after, duration_ms }) {
  const logs = store.get("telemetryLogs") || [];
  const normalizedMode = mode === "expert" ? "gold" : "sparkle";
  logs.push({
    mode: normalizedMode,
    success: !!success,
    prompt_length_before: prompt_length_before || 0,
    prompt_length_after: prompt_length_after || 0,
    duration_ms: duration_ms || 0,
    timestamp: new Date().toISOString()
  });
  const capped = logs.length > 500 ? logs.slice(logs.length - 500) : logs;
  store.set("telemetryLogs", capped);

  log.debug(`[Usage] Mode: ${normalizedMode}, Success: ${success}, Before: ${prompt_length_before}, After: ${prompt_length_after}, Duration: ${duration_ms}ms`);
}

// ── Deferred persistence ──
// All store.set() calls are deferred until AFTER the interaction completes
// (after sendResponse), ensuring zero disk I/O during paste/clipboard/window ops.
let pendingFlush = null;

function deferClipboardPersist(previousClipboard) {
  pendingFlush = {
    ...(pendingFlush || {}),
    clipboard: previousClipboard,
    clipboardTimestamp: Date.now(),
  };
}

function deferQuotaTracking() {
  pendingFlush = {
    ...(pendingFlush || {}),
    quota: true,
  };
}

function deferAnalyticsEvent(event) {
  pendingFlush = {
    ...(pendingFlush || {}),
    analytics: event,
  };
}

function flushPendingState() {
  if (!pendingFlush) return;
  const state = pendingFlush;
  pendingFlush = null;

  // Defer persistence to avoid any potential sync I/O during the next event loop tick
  setTimeout(() => {
    if (state.clipboard !== undefined) {
      store.set("orbPreviousClipboard", state.clipboard);
      store.set("orbPreviousClipboardTimestamp", state.clipboardTimestamp);
    }
    if (state.quota) {
      trackQuotaUsage();
    }
    if (state.analytics) {
      logAnalyticsEvent(state.analytics);
      if (state.analytics.success) {
        metricsService.recordSuccess("prompt-improve");
        metricsService.appendLog({
          input: state.analytics.input,
          output: state.analytics.output,
          timestamp: new Date().toISOString()
        });
      }
    }
  }, 0);

  // Notify dashboard to refresh after any Orb event (success or failure)
  refreshRewardDashboard();
}

async function runPipeline(mode, input, artifactType, { selectionCaptured, geminiCalls }, initialProcessId) {
  const startTime = Date.now();
  log.debug(`[Orb] Running pipeline in ${mode} mode`);

  sendStatus(mode === "expert" ? "🧠 Thinking deeper..." : "⚡ Rebuilding...");

  const { envelope } = buildEnvelope({ input, mode });
  const optimized = optimizeEnvelope(envelope);
  const { systemPrompt, userPrompt } = buildExecutionPlan(optimized, mode);

  const activeProvider = store.get("activeProvider") || "gemini";
  captureIntent({
    surface: input,
    mode,
    artifactType: artifactType || "text",
    destinationAI: activeProvider
  });

  let modelResponse;
  let usedProviderId;
  try {
    const res = await ProviderManager.refineWithFailover(userPrompt, {
      mode,
      systemPrompt,
      timeoutMs: REFINE_TIMEOUT_MS
    });
    modelResponse = res.output;
    usedProviderId = res.providerId;
    sendStatus("✅ Done");
  } catch (err) {
    log.error("[Orb] Centralized failover refinement failed:", err.message || err);
    deferAnalyticsEvent({
      mode,
      success: false,
      prompt_length_before: input.length,
      prompt_length_after: 0,
      duration_ms: Date.now() - startTime
    });
    sendResponse("Unable to process right now. Please try again.");
    flushPendingState();
    return;
  }

  const latency = Date.now() - startTime;
  log.debug(`[Orb] AI response received from ${usedProviderId} in ${latency}ms`);

  // Save to lastRefinement store for Undo (REF-015)
  store.set("lastRefinement", {
    before: input,
    after: modelResponse,
    timestamp: new Date().toISOString()
  });

  // Save the previous clipboard content before writing the AI response
  const previousClipboard = clipboard.readText();

  const wasVisible = orbWindow && orbWindow.isVisible();
  if (wasVisible) {
    orbWindow.hide();
    await sleep(80);
  }

  let clipboardResult = false;
  const currentRefinements = (store.get("metrics.refinementsMade") || 0) + 1;
  let successMsg = mode === "expert" ? "🧠 Expert Blueprint Created" : "⚡ Prompt Rebuilt";
  if (currentRefinements === 1) successMsg = "🎉 First prompt rebuilt";
  else if (currentRefinements === 5) successMsg = "⚡ You're getting faster";
  else if (currentRefinements === 20) successMsg = "🚀 Refinzi has saved you time on 20 rebuilds";

  let pasted = false;
  if (initialProcessId) {
    const currentPid = await getActiveProcessId().catch(() => 0);
    if (currentPid && currentPid !== initialProcessId) {
      clipboard.writeText(modelResponse);
      notifySuccess("⚠️ Focus changed. Prompt copied to clipboard.", 3000);
      pasted = true;
    }
  }

  if (!pasted) {
    try {
      await replaceActivePrompt(modelResponse);
      notifySuccess(successMsg, 2000);
    } catch (pasteErr) {
      clipboard.writeText(modelResponse);
      notifySuccess("⚠️ Couldn't replace automatically. Result copied to clipboard.", 2500);
      clipboardResult = true;
    }
  }

  if (wasVisible && orbWindow) {
    orbWindow.showInactive();
  }

  // Detailed Success Telemetry
  deferQuotaTracking();
  deferAnalyticsEvent({
    mode,
    success: true,
    prompt_length_before: input.length,
    prompt_length_after: modelResponse.length,
    duration_ms: latency,
    input,
    output: modelResponse
  });

  sendResponse(modelResponse);
  flushPendingState();
}

function registerPipelineHandler() {
  if (pipelineRegistered) return;
  pipelineRegistered = true;

  ipcMain.handle("orb:clicked", async (_e, { mode }) => {
    log.debug("MODE RECEIVED", mode);

    let normalizedMode = mode;
    if (mode === "sparkle" || mode === "click") {
      normalizedMode = "preserve";
    }

    if (normalizedMode !== "expert" && normalizedMode !== "preserve") {
      log.error(`[Orb] Invalid mode received: ${mode}`);
      notifyError("Invalid Mode", "An unsupported interaction mode was requested.", 2500);
      return { ok: false, reason: "invalid_mode" };
    }

    // P0: Guard — prevent parallel Gemini calls
    if (isOrbRunning) {
      log.debug("[Orb] Pipeline already running, ignoring click.");
      notifyError("Refinzi Busy", "A refinement is already in progress.", 2000);
      metricsService.logEvent("refine_failed", {
        mode: mode,
        artifactType: "text",
        failure: "already_running",
        retryCount: 0,
        inputLength: 0,
      });
      deferAnalyticsEvent({
        mode,
        success: false,
        prompt_length_before: 0,
        prompt_length_after: 0,
        duration_ms: 0
      });
      flushPendingState();
      return { ok: false, reason: "already_running" };
    }
    isOrbRunning = true;

    try {
      // P0: Check daily quota before proceeding
      if (checkDailyQuota()) {
        log.error("[Orb] Daily quota exceeded. Aborting.");
        metricsService.logEvent("refine_failed", {
          mode: mode,
          artifactType: "text",
          failure: "quota_exceeded",
          retryCount: 0,
          inputLength: 0,
        });
        deferAnalyticsEvent({
          mode,
          success: false,
          prompt_length_before: 0,
          prompt_length_after: 0,
          duration_ms: 0
        });
        sendResponse("Daily refinement quota reached (50/50).");
        flushPendingState();
        return { ok: false, reason: "quota_exceeded" };
      }

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
          log.info("[Orb] UIA returned isEditable=false, trying captureActivePrompt fallback for elevated windows");
          const fallbackCapture = await captureActivePrompt().catch(() => null);
          if (fallbackCapture?.text && fallbackCapture.text.trim()) {
            input = fallbackCapture.text;
            isEditable = true;
            log.info("[Orb] UIPI Fallback successful: captured prompt text despite UIA restriction");
          }
        }
      } else {
        isEditable = true;
      }

      log.debug(`[Orb] Captured text length:`, input?.length || 0);

      // If not editable and capture returned nothing, show "Focus a textbox" warning
      if (!isEditable && (!input || !input.trim())) {
        log.debug("[Orb] Active element is not editable and no selection captured.");
        notifyError("Focus a textbox", "Could not detect selected text or editable field. Please highlight text or click into a text field.", 2500);
        deferAnalyticsEvent({
          mode,
          success: false,
          prompt_length_before: 0,
          prompt_length_after: 0,
          duration_ms: 0
        });
        flushPendingState();
        return { ok: false, reason: "not_editable" };
      }

      // If editable but capture returned nothing, show "Empty Prompt" warning
      if (!input || !input.trim()) {
        log.error("[Orb] ERROR - NO_SELECTION / EMPTY_PROMPT");
        notifyError("Empty Prompt", "Please type a prompt or select some text first.", 2500);
        deferAnalyticsEvent({
          mode,
          success: false,
          prompt_length_before: 0,
          prompt_length_after: 0,
          duration_ms: 0
        });
        flushPendingState();
        return { ok: false, reason: "no_selection" };
      }

      // Step 3: Run the pipeline
      const telemetry = {
        selectionCaptured: true,
        geminiCalls: 0
      };

      const detection = classifyClipboardContent(input);
      await runPipeline(mode, input, detection.type, telemetry, initialProcessId);
      return { ok: true };
    } catch (e) {
      log.error("[Orb] orb:clicked handler error:", e?.message || e);
      metricsService.logEvent("refine_failed", {
        mode: mode || "preserve",
        artifactType: "text",
        failure: "handler_error",
        retryCount: 0,
        inputLength: 0,
      });
      deferAnalyticsEvent({
        mode,
        success: false,
        prompt_length_before: 0,
        prompt_length_after: 0,
        duration_ms: 0
      });
      sendResponse("An unexpected error occurred. Please try again.");
      flushPendingState();
      return { ok: false, reason: "error" };
    } finally {
      isOrbRunning = false;
    }
  });

  ipcMain.handle("orb:generatePrompt", async (event, { data }) => {
    log.debug("[Orb] orb:generatePrompt received", data.name || data.type || "text");

    // Check daily quota (unless BYOK is configured)
    const activeProvider = store.get("activeProvider") || "gemini";
    const geminiApiKey = store.get("geminiApiKey");
    const openRouterApiKey = store.get("openRouterApiKey");
    const hasByok = (activeProvider === "gemini" && geminiApiKey) || 
                    (activeProvider === "openrouter" && openRouterApiKey);

    if (!hasByok) {
      const stats = metricsService.getStats();
      if (stats.quotaExceeded) {
        log.error("[Orb] Daily quota exceeded during drop. Aborting.");
        return { ok: false, reason: "quota_exceeded" };
      }
    }

    const { generatePromptAngles } = await import("./artifactAnalyzer.js");
    const result = await generatePromptAngles(data);
    if (result && result.prompt) {
      // artifactType lives on result._artifactContext.type (from generatePromptAngles)
      // or falls back to result.artifactType (ruleBasedFallback path)
      const artifactType = result._artifactContext?.type || result.artifactType || "unknown";
      metricsService.recordSuccess(artifactType);
      metricsService.appendLog({
        input: data.text || data.name || "File Drop",
        output: result.prompt,
        timestamp: new Date().toISOString()
      });
      refreshRewardDashboard();
    }
    return result;
  });

  ipcMain.handle("orb:showPromptWindow", async (event, data) => {
    log.debug("[TRACE_DROP][HOP 9: PASS] orb:showPromptWindow — output window opened, sending prompt to output window");
    log.debug("[Orb] orb:showPromptWindow received, sending prompt to output window.");
    if (!outputModalWindow || outputModalWindow.isDestroyed()) {
      outputModalWindow = createOutputModalWindow();
    }

    // Increment artifactCount
    let count = store.get("artifactCount") || 0;
    count += 1;
    store.set("artifactCount", count);

    const personalizationSeen = store.get("personalizationSeen") || false;
    let triggerPersonalization = false;
    if (count >= 5 && !personalizationSeen) {
      store.set("personalizationSeen", true);
      triggerPersonalization = true;
    }

    // data shape: { prompt, title, id, badge, _artifactContext }
    const payload = {
      prompt: data.prompt || "",
      title: data.title || "Artifact",
      // Prefer _artifactContext.type as the authoritative source; fall back to top-level artifactType
      artifactType: data._artifactContext?.type || data.artifactType || "unknown",
      _artifactContext: data._artifactContext || null
    };

    // Send payload to the output window renderer.
    // If the window is still loading (newly created or navigating), wait for
    // did-finish-load to avoid the message arriving before the page is ready.
    // If already loaded, send immediately — no double-send.
    if (outputModalWindow.webContents.isLoading()) {
      outputModalWindow.webContents.once("did-finish-load", () => {
        outputModalWindow.webContents.send("output:setData", payload);
      });
    } else {
      outputModalWindow.webContents.send("output:setData", payload);
    }

    outputModalWindow.show();
    outputModalWindow.focus();

    return { ok: true, triggerPersonalization };
  });

  // 1-Click Interactive Sample Execution Pipeline
  ipcMain.handle("orb:runSample", async (_event, sampleType = "landing-page") => {
    log.debug("[Orb] orb:runSample requested, type:", sampleType);
    const samplePayloads = {
      "landing-page": {
        type: "landing-page",
        name: "SaaS Hero Page",
        text: "Landing Page: Minimalist layout with dark mode void theme, large typography hero heading 'Ship software at the speed of thought', dual action buttons 'Start Free Trial' and 'Book Demo', floating 3D browser showcase illustration below, followed by three horizontal customer logo vectors and kinetic scroll physics.",
        isSample: true
      },
      "reel": {
        type: "reel",
        name: "Viral Product Breakdown",
        text: "Video Reel: Fast-paced 30-second technical breakdown showing a side-by-side comparison of manual prompt engineering vs instant Rebuild execution, ending with a high-contrast CTA.",
        isSample: true
      },
      "idea": {
        type: "text",
        name: "Feature Implementation Spec",
        text: "Turn this requirement into a production-grade TypeScript React component: an ambient floating widget with responsive drag boundaries, glassmorphism backdrop filter, and smooth spring physics.",
        isSample: true
      }
    };

    const sampleArtifact = samplePayloads[sampleType] || samplePayloads["landing-page"];
    const { generatePromptAngles } = await import("./artifactAnalyzer.js");
    const result = await generatePromptAngles(sampleArtifact);

    if (result && result.prompt) {
      if (!outputModalWindow || outputModalWindow.isDestroyed()) {
        outputModalWindow = createOutputModalWindow();
      }

      const payload = {
        prompt: result.prompt,
        title: result.title || "Sample Rebuild Blueprint",
        artifactType: sampleArtifact.type,
        _artifactContext: result._artifactContext || sampleArtifact
      };

      if (outputModalWindow.webContents.isLoading()) {
        outputModalWindow.webContents.once("did-finish-load", () => {
          outputModalWindow.webContents.send("output:setData", payload);
        });
      } else {
        outputModalWindow.webContents.send("output:setData", payload);
      }

      outputModalWindow.show();
      outputModalWindow.focus();
      return { ok: true, prompt: result.prompt };
    }
    return { ok: false, error: "Failed to generate sample blueprint" };
  });

  // Expert upgrade: post-generation expansion into production-ready prompt
  ipcMain.handle("orb:upgradeToExpert", async (event, { prompt, artifactContext }) => {
    log.debug("[Orb] orb:upgradeToExpert requested");
    try {
      const result = await upgradeToExpertPrompt(prompt, artifactContext);
      return result;
    } catch (err) {
      log.error("[Orb] Expert upgrade error:", err);
      return { prompt, ok: false, error: err.message };
    }
  });

  // Output analytics: track copy / regenerate / expert upgrade events
  ipcMain.on("orb:outputAnalytics", (_event, analyticsEvent) => {
    const logs = store.get("telemetryLogs") || [];
    logs.push({
      event: "output_interaction",
      artifact_type: analyticsEvent.artifact_type || "unknown",
      copy_clicked: !!analyticsEvent.copy_clicked,
      expert_upgrade_clicked: !!analyticsEvent.expert_upgrade_clicked,
      regenerated: !!analyticsEvent.regenerated,
      duration_ms: analyticsEvent.duration_ms || 0,
      timestamp: new Date().toISOString()
    });
    const capped = logs.length > 500 ? logs.slice(logs.length - 500) : logs;
    store.set("telemetryLogs", capped);
    log.debug(`[Usage] Output: type=${analyticsEvent.artifact_type} copy=${analyticsEvent.copy_clicked} expert=${analyticsEvent.expert_upgrade_clicked} regen=${analyticsEvent.regenerated} ${analyticsEvent.duration_ms}ms`);
  });

  // ── ORB-UX-002 Interaction Telemetry ──────────────────────────────────────

  // Store raw interaction events (fire-and-forget from renderer)
  ipcMain.on("orb:telemetry", (_event, evt) => {
    const orbLogs = store.get("orbInteractionLogs") || [];
    orbLogs.push({
      ...evt,
      day: new Date().toISOString().slice(0, 10) // YYYY-MM-DD for grouping
    });
    // Cap at 2000 events — about 10–20 days of heavy usage
    const capped = orbLogs.length > 2000 ? orbLogs.slice(orbLogs.length - 2000) : orbLogs;
    store.set("orbInteractionLogs", capped);
  });

  // Compute all 7 ORB-UX-002 metrics from stored events on demand
  ipcMain.handle("orb:getTelemetryStats", () => {
    const logs = store.get("orbInteractionLogs") || [];
    if (!logs.length) return { total: 0, message: "No telemetry data yet." };

    const by = (type) => logs.filter(e => e.type === type);

    const hovers = by("hover_end");
    const clicks = by("click");
    const dragStarts = by("drag_start");
    const dragEnds = by("drag_end");
    const dragAborted = by("drag_aborted");
    const holdAttempts = by("hold_attempt");
    const holdSuccess = by("hold_success");
    const holdAborted = by("hold_aborted");
    const refSuccess = by("refinement_success");
    const refFailed = by("refinement_failed");
    const pointerDowns = by("pointer_down");

    // Avg hover duration
    const avgHoverMs = hovers.length
      ? Math.round(hovers.reduce((s, e) => s + (e.duration_ms || 0), 0) / hovers.length)
      : 0;

    // Hover-to-click conversion
    const hoverToClickPct = hovers.length
      ? Math.round((clicks.length / hovers.length) * 100)
      : 0;

    // Hover-to-drag conversion
    const hoverToDragPct = hovers.length
      ? Math.round((dragStarts.length / hovers.length) * 100)
      : 0;

    // Drag success rate
    const totalDragAttempts = dragStarts.length + dragAborted.length;
    const dragSuccessPct = totalDragAttempts
      ? Math.round((dragStarts.length / totalDragAttempts) * 100)
      : 0;

    // Hold success rate (of all hold attempts)
    const totalHoldAttempts = holdAttempts.length;
    const holdSuccessPct = totalHoldAttempts
      ? Math.round((holdSuccess.length / totalHoldAttempts) * 100)
      : 0;

    // Average drag distance
    const avgDragDistPx = dragEnds.length
      ? Math.round(dragEnds.reduce((s, e) => s + (e.distance_px || 0), 0) / dragEnds.length)
      : 0;

    // Refinement success rate
    const totalRef = refSuccess.length + refFailed.length;
    const refSuccessPct = totalRef
      ? Math.round((refSuccess.length / totalRef) * 100)
      : 0;

    // Heatmap: bucket the 60×60 hit area into a 6×6 grid (10px cells)
    // Returns a 2D array of hit counts
    const heatmap = Array.from({ length: 6 }, () => Array(6).fill(0));
    pointerDowns.forEach(e => {
      const col = Math.min(5, Math.floor((e.hitX || 0) / 10));
      const row = Math.min(5, Math.floor((e.hitY || 0) / 10));
      heatmap[row][col]++;
    });

    return {
      total_events: logs.length,
      period_days: [...new Set(logs.map(e => e.day))].length,

      hover: {
        count: hovers.length,
        avg_duration_ms: avgHoverMs,
        to_click_pct: hoverToClickPct,
        to_drag_pct: hoverToDragPct
      },

      click: {
        count: clicks.length,
        success_pct: refSuccessPct
      },

      drag: {
        attempts: totalDragAttempts,
        success: dragStarts.length,
        aborted: dragAborted.length,
        success_pct: dragSuccessPct,
        avg_distance_px: avgDragDistPx
      },

      hold: {
        attempts: totalHoldAttempts,
        success: holdSuccess.length,
        aborted: holdAborted.length,
        success_pct: holdSuccessPct
      },

      refinement: {
        success: refSuccess.length,
        failed: refFailed.length,
        success_pct: refSuccessPct
      },

      heatmap_6x6: heatmap
    };
  });

  // Clear orb telemetry (dev/debug tool)
  ipcMain.handle("orb:clearTelemetry", () => {
    store.set("orbInteractionLogs", []);
    return { ok: true };
  });
  // ─────────────────────────────────────────────────────────────────────────

  ipcMain.on("output:close", () => {
    if (outputModalWindow && !outputModalWindow.isDestroyed()) {
      outputModalWindow.hide();
    }
  });

  ipcMain.on("output:copy", (event, text) => {
    clipboard.writeText(text);
  });

  ipcMain.handle("orb:copyToClipboard", (event, text) => {
    clipboard.writeText(text);
    return { ok: true };
  });

  ipcMain.handle("orb:resize", (event, { width, height }) => {
    if (orbWindow) {
      orbWindow.setSize(width, height);
    }
    return { ok: true };
  });

  ipcMain.handle("orb:setFocusable", (event, focusable) => {
    if (orbWindow) {
      orbWindow.setFocusable(focusable);
      if (focusable) {
        orbWindow.focus();
      }
    }
    return { ok: true };
  });

  ipcMain.on("orb:set-ignore-mouse", (event, ignore) => {
    if (orbWindow && !orbWindow.isDestroyed()) {
      if (ignore) {
        // Idle: pass mouse events through to windows below, but still forward
        // synthetic mouse-move events to the renderer so hover tracking works.
        orbWindow.setIgnoreMouseEvents(true, { forward: true });
      } else {
        // Drag / interactive: remove the forward flag entirely so the OS DnD
        // subsystem assigns full drop-target ownership to this HWND.
        // Without this, Windows never delivers the native "drop" event even
        // though dragenter/dragleave fire via the forwarded synthetic path.
        orbWindow.setIgnoreMouseEvents(false);
      }
    }
  });

  // Cache display list — refresh when display configuration changes
  let cachedDisplays = screen.getAllDisplays();
  screen.on("display-added", () => { cachedDisplays = screen.getAllDisplays(); });
  screen.on("display-removed", () => { cachedDisplays = screen.getAllDisplays(); });
  screen.on("display-metrics-changed", () => { cachedDisplays = screen.getAllDisplays(); });

  // Handle moving the orb window (fire-and-forget, no response needed)
  ipcMain.on("orb:move", (_e, { x, y }) => {
    if (!orbWindow) return;
    const { width, height } = orbWindow.getBounds();
    // Determine which display the coordinates belong to; fall back to primary
    const targetDisplay = cachedDisplays.find(d =>
      x >= d.bounds.x - width && x <= d.bounds.x + d.bounds.width &&
      y >= d.bounds.y - height && y <= d.bounds.y + d.bounds.height
    ) || screen.getPrimaryDisplay();
    const { bounds } = targetDisplay;

    // Clamp the window top-left so the entire 220×120 px window stays within display bounds.
    const ORB_W = 220;
    const ORB_H = 120;
    const newX = Math.round(Math.max(bounds.x, Math.min(x, bounds.x + bounds.width - ORB_W)));
    const newY = Math.round(Math.max(bounds.y, Math.min(y, bounds.y + bounds.height - ORB_H)));

    orbWindow.setPosition(newX, newY);
  });

  // Persist position only on drag end
  ipcMain.on("orb:dragEnd", () => {
    if (!orbWindow) return;
    const [x, y] = orbWindow.getPosition();
    store.set("orbPosition", { x, y });
  });
  // Provide current orb position to renderer (used for relative drags)
  ipcMain.handle("orb:getPosition", async () => {
    if (!orbWindow) return null;
    const [x, y] = orbWindow.getPosition();
    return { x, y };
  });

  // Reset orb position to defaults (clears stored position and moves orb to right-side middle)
  ipcMain.handle("orb:resetPosition", async () => {
    log.debug("[Orb] Resetting position to default");
    // Clear stored position
    store.set("orbPosition", { x: null, y: null });
    // If orb window exists, reposition it to right-side middle of primary display
    if (orbWindow) {
      const { workArea } = screen.getPrimaryDisplay();
      const { width: orbW, height: orbH } = orbWindow.getBounds();
      // Right edge of work area (leaves a small 4px margin)
      const defaultX = Math.round(workArea.x + workArea.width - orbW - 4);
      // Vertically centered in the work area
      const defaultY = Math.round(workArea.y + (workArea.height - orbH) / 2);
      orbWindow.setPosition(defaultX, defaultY);
    }
    return { ok: true };
  });

  // Handle right-click context menu (Undo, Dashboard, Quit)
  ipcMain.on("orb:contextmenu", (event) => {
    const lastRef = store.get("lastRefinement");
    const hasUndo = lastRef && lastRef.before;
    const menu = Menu.buildFromTemplate([
      {
        label: "Undo Last Refinement",
        accelerator: "Ctrl+Alt+Z",
        enabled: !!hasUndo,
        click: () => {
          undoLastRefinement();
        }
      },
      { type: "separator" },
      {
        label: "Open Dashboard",
        click: () => {
          const wins = BrowserWindow.getAllWindows();
          const settingsWin = wins.find(w => w.getTitle() === "Refinzi — Dashboard" || (w.webContents?.getURL() && w.webContents.getURL().includes("settings/index.html")));
          if (settingsWin) {
            settingsWin.show();
            settingsWin.focus();
          } else {
            createSettingsWindow().show();
          }
        }
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          app.quit();
        }
      }
    ]);
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
  });
}

export function getOrbWindow() {
  return orbWindow;
}

export function createOrbWindow() {
  if (orbWindow) return orbWindow;

  orbWindow = new BrowserWindow({
    width: 220,
    height: 120,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    resizable: false,
    movable: true,
    hasShadow: false,
    focusable: false,     // ← CRITICAL: prevents focus stealing on click
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(app.getAppPath(), "src", "preload", "sharedPreload.js")
    }
  });

  const indexPath = path.join(app.getAppPath(), "src", "renderer", "orb", "index.html");
  orbWindow.loadFile(indexPath);

  orbWindow.webContents.on("console-message", (_event, level, message) => {
    log.debug(`[Refinzi][Orb][console][${level}] ${message}`);
  });

  orbWindow.webContents.on("did-finish-load", () => {
    log.debug("[Refinzi][Orb] Page loaded successfully");
  });

  orbWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    log.error("[Refinzi][Orb] Page failed to load:", errorCode, errorDescription);
  });

  orbWindow.on("closed", () => {
    orbWindow = null;
    isOrbRunning = false;
  });

  // ── CLICK-THROUGH FIX ──
  // By default, the window ignores mouse events for the OS (clicks pass through)
  // but forwards them to the renderer (so mouseenter/mousemove still work).
  orbWindow.setIgnoreMouseEvents(true, { forward: true });

  return orbWindow;
}

function isVisibleOnAnyDisplay(x, y, w = 220, h = 120) {
  const displays = screen.getAllDisplays();
  return displays.some(d => {
    const b = d.bounds;
    return x >= b.x - w + 20 && x <= b.x + b.width - 20 &&
           y >= b.y - h + 20 && y <= b.y + b.height - 20;
  });
}

export function showOrb(x, y) {
  if (!orbWindow) {
    registerPipelineHandler();
    createOrbWindow();
  }
  const saved = store.get("orbPosition");
  const { workArea } = screen.getPrimaryDisplay();
  const { width: orbW, height: orbH } = orbWindow.getBounds();

  if (saved && saved.x != null && saved.y != null && isVisibleOnAnyDisplay(saved.x, saved.y, orbW, orbH)) {
    orbWindow.setPosition(Math.round(saved.x), Math.round(saved.y));
  } else if (x != null && y != null && isVisibleOnAnyDisplay(x, y, orbW, orbH)) {
    orbWindow.setPosition(Math.round(x), Math.round(y));
  } else {
    // Right edge of work area with a small 4px margin from the edge
    const defaultX = Math.round(workArea.x + workArea.width - orbW - 4);
    // Vertically centered in the work area
    const defaultY = Math.round(workArea.y + (workArea.height - orbH) / 2);
    orbWindow.setPosition(defaultX, defaultY);
  }
  orbWindow.showInactive();
}

export function hideOrb() {
  if (orbWindow) {
    orbWindow.hide();
  }
}

export async function undoLastRefinement() {
  const lastRef = store.get("lastRefinement");
  if (!lastRef || !lastRef.before) {
    log.debug("[Undo] No last refinement available.");
    notifyError("Cannot Undo", "No previous refinement found to revert.", 2500);
    return;
  }

  const isEditable = await checkActiveElementIsEditable();
  if (!isEditable) {
    log.debug("[Undo] Active element is not editable.");
    notifyError("Cannot Undo", "Please click into a text field to undo your refinement.", 2500);
    return;
  }

  try {
    await replaceActivePrompt(lastRef.before);
    store.set("lastRefinement", {});
    notifySuccess("↩ Refinement Undone", 2000);
  } catch (err) {
    log.error("[Undo] Reversion failed:", err);
    notifyError("Undo Failed", "Could not restore the previous prompt.", 2500);
  }
}