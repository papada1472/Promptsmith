import { BrowserWindow, app, ipcMain, screen, clipboard, Menu } from "electron";
import path from "path";
import { buildEnvelope } from "./output/compiler.js";
import { optimizeEnvelope } from "./output/optimizer.js";
import { buildExecutionPlan } from "./output/promptEngineer.js";
import { store } from "./store.js";
import { compileIntent } from "./output/intentCompiler.js";
import { captureIntent } from "./output/intentCapture.js";
import { classifyClipboardContent } from "./artifactDetector.js";
import { ProviderManager } from "./ai/ProviderManager.js";
import { REFINE_TIMEOUT_MS } from "./constants.js";
import { notifySuccess } from "./notifications.js";
import { checkActiveElementIsEditable, captureActivePrompt, replaceActivePrompt, restoreClipboard } from "./clipboardFlow.js";
import { metricsService } from "./services/metricsService.js";
import { refreshRewardDashboard, createOutputModalWindow } from "./windows.js";
import { upgradeToExpertPrompt } from "./artifactAnalyzer.js";

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
  console.log("[MAIN] status sent:", msg);
  if (orbWindow) {
    orbWindow.webContents.send("orb:status", msg);
  }
}

function sendResponse(msg) {
  console.log("[MAIN] response sent:", msg);
  if (orbWindow) {
    orbWindow.webContents.send("orb:response", msg);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks daily quota. Returns true if exceeded (caller should abort).
 * Mirrors the pattern in refineController.js.
 */
function checkDailyQuota() {
  const quota = store.get("dailyQuota");
  const today = new Date().toISOString().slice(0, 10);
  const used = (quota.usedToday || 0);
  const maxPerDay = quota.maxPerDay || 50;
  if (quota.todayDate !== today) {
    // New day — quota resets
    return false;
  }
  if (used >= maxPerDay) {
    return true;
  }
  return false;
}

/**
 * Tracks quota usage for the Orb path.
 * Mirrors the pattern in refineController.js / metricsService.checkAndTrackQuota.
 */
function trackQuotaUsage() {
  const quota = store.get("dailyQuota");
  const today = new Date().toISOString().slice(0, 10);
  if (quota.todayDate !== today) {
    store.set("dailyQuota", { maxPerDay: 50, usedToday: 1, todayDate: today });
  } else {
    store.set("dailyQuota", { ...quota, usedToday: (quota.usedToday || 0) + 1 });
  }
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

  console.log(`[Usage] Mode: ${normalizedMode}, Success: ${success}, Before: ${prompt_length_before}, After: ${prompt_length_after}, Duration: ${duration_ms}ms`);
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
        metricsService.recordSuccess();
      }
    }
  }, 0);

  // Notify dashboard to refresh after any Orb event (success or failure)
  refreshRewardDashboard();
}

async function runPipeline(mode, input, artifactType, { selectionCaptured, geminiCalls }) {
  const startTime = Date.now();
  console.log("[Orb] Actual input:\n" + input);
  console.log(`[Orb] Running pipeline in ${mode} mode with input: "${input}"`);

  sendStatus(mode === "expert" ? "🧠 Thinking deeper..." : "✨ Improving...");

  captureIntent({
    surface: input,
    mode,
    artifactType,
    destinationAI: "unknown",
  });

  const compiled = compileIntent(input);

  const { envelope } = buildEnvelope({ input });
  const optimized = optimizeEnvelope(envelope);
  const { systemPrompt, userPrompt } = buildExecutionPlan(optimized, mode);

  const activeProvider = store.get("activeProvider") || "gemini";
  const apiKey = store.get(activeProvider === "openrouter" ? "openRouterApiKey" : "geminiApiKey");
  const activeModel = store.get("activeModel") || ProviderManager.getDefaultModel(activeProvider);

  const providerId = ProviderManager.getActiveProviderId({ 
    activeProvider,
    geminiApiKey: store.get("geminiApiKey"),
    openRouterApiKey: store.get("openRouterApiKey")
  });
  
  if (providerId === "gateway") {
    console.log("[Orb] No Gemini API key found. Routing to GatewayProvider.");
  }

  const provider = ProviderManager.createProvider(providerId, {
    apiKey: providerId === "gateway" ? undefined : apiKey,
    model: activeModel,
    systemPrompt,
    timeoutMs: REFINE_TIMEOUT_MS,
  });

  const RETRIES_503 = [2000];
  const RETRIES_429 = 1;

  let lastError = null;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      geminiCalls++;
      const modelResponse = await provider.refine(userPrompt);
      const latency = Date.now() - startTime;
      
      console.log(`[Orb] AI response received in ${latency}ms`);
      sendStatus("✅ Done");

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
      try {
        await replaceActivePrompt(modelResponse);
        notifySuccess(mode === "expert" ? "🧠 Expert Prompt Created" : "✨ Prompt Improved", 2000);
      } catch (pasteErr) {
        clipboard.writeText(modelResponse);
        notifySuccess("⚠️ Couldn't replace automatically. Result copied to clipboard.", 2500);
        clipboardResult = true;
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
        duration_ms: latency
      });

      sendResponse(modelResponse);
      flushPendingState();
      return;
    } catch (e) {
      console.error(`[Orb] Attempt ${attempt} failed:`, e?.message || e);
      lastError = e;

      if (is503Error(e)) {
        const delayIndex = attempt - 1;
        if (delayIndex < RETRIES_503.length) {
          const delay = RETRIES_503[delayIndex];
          await sleep(delay);
          continue;
        }
        
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

      if (is429Error(e)) {
        if (attempt <= RETRIES_429) {
          const delay = getRetryDelay(e);
          await sleep(delay);
          continue;
        }
        
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

      // Unknown failure telemetry
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
  }

  deferAnalyticsEvent({
    mode,
    success: false,
    prompt_length_before: input.length,
    prompt_length_after: 0,
    duration_ms: Date.now() - startTime
  });
  sendResponse("Unable to process right now. Please try again.");
  flushPendingState();
}

function registerPipelineHandler() {
  if (pipelineRegistered) return;
  pipelineRegistered = true;

  ipcMain.handle("orb:clicked", async (_e, { mode }) => {
    console.log(`[Orb] ${mode === "expert" ? "Expert mode armed" : "Preserve triggered"}`);

    const apiKey = store.get("geminiApiKey");
    const providerId = ProviderManager.getActiveProviderId({ geminiApiKey: apiKey });

    // P0: Guard — prevent parallel Gemini calls
    if (isOrbRunning) {
      console.log("[Orb] Pipeline already running, ignoring click.");
      metricsService.logEvent("refine_failed", {
        mode: mode || "preserve",
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
        console.error("[Orb] Daily quota exceeded. Aborting.");
        metricsService.logEvent("refine_failed", {
          mode: mode || "preserve",
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

      // Step 1: Detect active element
      const isEditable = await checkActiveElementIsEditable();
      if (!isEditable) {
        console.log("[Orb] Active element is not editable.");
        notifyError("Focus a textbox", "Please click into a text field to improve your prompt.", 2500);
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

      // Step 2: Capture active prompt
      const captureResult = await captureActivePrompt();
      const input = captureResult.text;

      console.log(`[Orb] Captured text length:`, input?.length || 0);

      if (!input || !input.trim()) {
        console.error("[Orb] ERROR - NO_SELECTION / EMPTY_PROMPT");
        notifyError("Empty Prompt", "Please type a prompt in the text box first.", 2500);
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
      await runPipeline(mode || "preserve", input, detection.type, telemetry);
      return { ok: true };
    } catch (e) {
      console.error("[Orb] orb:clicked handler error:", e?.message || e);
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
    console.log("[Orb] orb:generatePrompt received", data.name || data.type || "text");
    const { generatePromptAngles } = await import("./artifactAnalyzer.js");
    return await generatePromptAngles(data);
  });

  ipcMain.handle("orb:showPromptWindow", async (event, data) => {
    console.log("[Orb] orb:showPromptWindow received, sending prompt to output window.");
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

    // data shape: { prompt, title, artifactType, _artifactContext }
    const payload = {
      prompt: data.prompt || "",
      title: data.title || "Artifact",
      artifactType: data.artifactType || "unknown",
      _artifactContext: data._artifactContext || null
    };

    outputModalWindow.webContents.once("did-finish-load", () => {
      outputModalWindow.webContents.send("output:setData", payload);
    });

    if (!outputModalWindow.webContents.isLoading()) {
      outputModalWindow.webContents.send("output:setData", payload);
    }

    outputModalWindow.show();
    outputModalWindow.focus();

    return { ok: true, triggerPersonalization };
  });

  // Expert upgrade: post-generation expansion into production-ready prompt
  ipcMain.handle("orb:upgradeToExpert", async (event, { prompt, artifactContext }) => {
    console.log("[Orb] orb:upgradeToExpert requested");
    try {
      const result = await upgradeToExpertPrompt(prompt, artifactContext);
      return result;
    } catch (err) {
      console.error("[Orb] Expert upgrade error:", err);
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
    console.log(`[Usage] Output: type=${analyticsEvent.artifact_type} copy=${analyticsEvent.copy_clicked} expert=${analyticsEvent.expert_upgrade_clicked} regen=${analyticsEvent.regenerated} ${analyticsEvent.duration_ms}ms`);
  });

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
      orbWindow.setIgnoreMouseEvents(ignore, { forward: true });
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
    
    // The Orb center is located at offset (110, 50) relative to the window's top-left corner.
    const orbOffsetX = 110;
    const orbOffsetY = 50;
    
    // Clamp the Orb center coordinates to stay within the display bounds.
    const minOrbX = bounds.x;
    const maxOrbX = bounds.x + bounds.width;
    const minOrbY = bounds.y;
    const maxOrbY = bounds.y + bounds.height;
    
    const targetOrbX = Math.max(minOrbX, Math.min(x + orbOffsetX, maxOrbX));
    const targetOrbY = Math.max(minOrbY, Math.min(y + orbOffsetY, maxOrbY));
    
    // Convert target Orb center coordinates back to window top-left corner coordinates.
    const newX = Math.round(targetOrbX - orbOffsetX);
    const newY = Math.round(targetOrbY - orbOffsetY);
    
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
    console.log("[Orb] Resetting position to default");
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
          const settingsWin = wins.find(w => w.getTitle() === "Refinzi — Dashboard" || (w.getURL() && w.getURL().includes("settings/index.html")));
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
    console.log(`[Refinzi][Orb][console][${level}] ${message}`);
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

export function showOrb(x, y) {
  if (!orbWindow) {
    registerPipelineHandler();
    createOrbWindow();
    // NOTE: No orb:set-ignore-mouse IPC needed.
    // The window stays in setIgnoreMouseEvents(true, { forward: true }) permanently.
    // CSS pointer-events: none on body + pointer-events: auto on .orb handles interactivity.
    // Toggling setIgnoreMouseEvents causes Electron to re-evaluate hit regions,
    // which fires synthetic mouseleave events — causing the "chase" loop.
  }
  // Determine position: use saved position if available, otherwise default to
  // the right-side middle of the primary display (parallel to the system tray
  // "show hidden icons" chevron) so the ORB is immediately discoverable.
  const saved = store.get("orbPosition");
  if (saved && saved.x != null && saved.y != null) {
    orbWindow.setPosition(Math.round(saved.x), Math.round(saved.y));
  } else {
    const { workArea } = screen.getPrimaryDisplay();
    const { width: orbW, height: orbH } = orbWindow.getBounds();
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
    console.log("[Undo] No last refinement available.");
    notifyError("Cannot Undo", "No previous refinement found to revert.", 2500);
    return;
  }

  const isEditable = await checkActiveElementIsEditable();
  if (!isEditable) {
    console.log("[Undo] Active element is not editable.");
    notifyError("Cannot Undo", "Please click into a text field to undo your refinement.", 2500);
    return;
  }

  try {
    await replaceActivePrompt(lastRef.before);
    store.set("lastRefinement", {});
    notifySuccess("↩ Refinement Undone", 2000);
  } catch (err) {
    console.error("[Undo] Reversion failed:", err);
    notifyError("Undo Failed", "Could not restore the previous prompt.", 2500);
  }
}