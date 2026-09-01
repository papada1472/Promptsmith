import { ipcMain } from "electron";
import { applyLaunchOnStartup } from "./startup.js";
import { store } from "./store.js";
import { notifySuccess, notifyError, notifyWarning } from "./notifications.js";
import { providerService } from "./services/providerService.js";
import { settingsService } from "./services/settingsService.js";
import { hotkeyService } from "./services/hotkeyService.js";
import { startupService } from "./services/startupService.js";
import { metricsService } from "./services/metricsService.js";
import { createLogger } from "./logger.js";

const log = createLogger("IPC");

export function registerIpcHandlers({ refreshTrayMenu, registerShortcut, openSettings }) {
  ipcMain.handle("prompt:rebuildDirect", async (_e, { text, mode = "sparkle" }) => {
    try {
      if (!text || !text.trim()) {
        return { ok: false, error: "Please enter a prompt to rebuild." };
      }
      const { buildEnvelope, optimizeEnvelope } = await import("./promptCompiler.js");
      const { buildExecutionPlan } = await import("./executionPlanner.js");
      const { ProviderManager } = await import("./ai/ProviderManager.js");
      const { validateOutput } = await import("./outputValidator.js");

      const envelope = buildEnvelope({ input: text.trim(), mode });
      const optimized = optimizeEnvelope(envelope);
      const plan = buildExecutionPlan(optimized);
      const start = Date.now();
      const rawResult = await ProviderManager.refineWithFailover(plan.systemPrompt, plan.userPrompt, {
        mode,
        timeoutMs: mode === "expert" ? 25000 : 15000
      });
      const validated = validateOutput(rawResult, mode);
      const finalOutput = validated.output || rawResult;

      try {
        metricsService.recordSuccess?.({
          input: text.trim(),
          output: finalOutput,
          mode,
          durationMs: Date.now() - start
        });
      } catch (_) {}

      return {
        ok: true,
        output: finalOutput,
        durationMs: Date.now() - start,
        provider: ProviderManager.getLastCallDiagnostic()?.provider || "ai"
      };
    } catch (err) {
      log.error("prompt:rebuildDirect failed:", err);
      return { ok: false, error: err?.message || "Failed to rebuild prompt." };
    }
  });

  ipcMain.handle("settings:verifyApiKey", async (_e, key, provider) => {
    return providerService.verifyApiKey(key, provider);
  });

  ipcMain.handle("app:showToast", async (_e, opts) => {
    if (opts.type === "success") notifySuccess(opts.message);
    else if (opts.type === "error") notifyError(opts.message);
    else if (opts.type === "warning") notifyWarning(opts.message);
    return { ok: true };
  });

  ipcMain.handle("settings:get", async () => {
    log.debug("settings:get");
    return settingsService.getSettings();
  });

  ipcMain.handle("settings:setApiKey", async (_e, apiKey, provider) => {
    log.debug("settings:setApiKey", provider);
    return settingsService.setApiKey(apiKey, provider);
  });

  ipcMain.handle("settings:setLaunchOnStartup", async (_e, enabled) => {
    log.debug("settings:setLaunchOnStartup", Boolean(enabled));
    return startupService.setLaunchOnStartup(enabled, applyLaunchOnStartup);
  });

  ipcMain.handle("settings:setHotkey", async (_e, hotkey) => {
    log.debug("settings:setHotkey", hotkey);
    return hotkeyService.setHotkey(hotkey, registerShortcut, refreshTrayMenu);
  });

  ipcMain.handle("reward:get", async () => {
    return {
      ...metricsService.getStats(),
      hotkey: store.get("hotkey"),
      running: true
    };
  });

  ipcMain.handle("app:openSettings", async (_e, opts) => {
    log.debug("app:openSettings", opts);
    openSettings({ focusApiKey: opts?.focusApiKey });
    return { ok: true };
  });

  ipcMain.handle("settings:set", async (_e, settingsObj) => {
    log.debug("settings:set", Object.keys(settingsObj).join(", "));
    for (const [key, val] of Object.entries(settingsObj)) {
      store.set(key, val);
    }
    return { ok: true };
  });

  ipcMain.handle("settings:dismissQuota", async () => {
    return { ok: true };
  });

  ipcMain.handle("settings:setTheme", async (_e, theme) => {
    store.set("theme", theme);
    return { ok: true };
  });

  ipcMain.handle("reward:dismissShareCard", async () => {
    settingsService.dismissShareCard();
    return { ok: true };
  });

  ipcMain.handle("reward:shareCardSeen", async () => {
    return { ok: true };
  });

  ipcMain.handle("logs:get", async (_e, params) => {
    return metricsService.getLogs(params || {});
  });

  ipcMain.handle("logs:delete", async (_e, index) => {
    metricsService.deleteLog(index);
    return { ok: true };
  });

  ipcMain.handle("logs:clear", async () => {
    metricsService.clearLogs();
    return { ok: true };
  });

  ipcMain.handle("toast:show", async (_e, opts) => {
    if (opts.type === "success") notifySuccess(opts.message);
    else if (opts.type === "error") notifyError(opts.message);
    else if (opts.type === "warning") notifyWarning(opts.message);
    return { ok: true };
  });

  ipcMain.handle("app:copyDiagnostics", async () => {
    try {
      const os = await import("os");
      const { clipboard, app } = await import("electron");
      const { ProviderManager } = await import("./ai/ProviderManager.js");

      const circuits = ProviderManager.getCircuitBreakerStatus();
      const lastCall = ProviderManager.getLastCallDiagnostic();
      const gpuStatus = app.getGPUFeatureStatus();
      const gpuCompositing = gpuStatus?.gpu_compositing || "unknown";

      const payload = `### Refinzi Diagnostics Report 🐞
- **Refinzi Version**: ${app.getVersion()}
- **Build**: ${process.env.NODE_ENV || "production"}
- **OS**: ${os.type()}
- **Windows Version**: ${os.release()}
- **Electron Version**: ${process.versions.electron}
- **Node Version**: ${process.versions.node}
- **Provider Used**: ${lastCall.provider}
- **Model Used**: ${lastCall.model}
- **Generation Time**: ${lastCall.generationTimeMs} ms
- **Provider Latency (Avg)**:
  - Gemini: ${circuits.gemini.averageLatency ? Math.round(circuits.gemini.averageLatency) + " ms" : "N/A"}
  - OpenRouter: ${circuits.openrouter.averageLatency ? Math.round(circuits.openrouter.averageLatency) + " ms" : "N/A"}
- **Circuit Breaker Status**:
  - Gemini: ${circuits.gemini.state} (Failures: ${circuits.gemini.failures}/3)
  - OpenRouter: ${circuits.openrouter.state} (Failures: ${circuits.openrouter.failures}/3)
- **GPU Enabled**: ${gpuCompositing === "enabled" ? "Yes" : "No"} (${gpuCompositing})
- **Memory Usage**: ${(process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2)} MB heap used
- **Theme**: ${store.get("theme") || "dark"}
- **Locale**: ${app.getLocale()}
- **Settings Recovery**: ${store.get("metrics.settingsRecovered") ? "Recovered & Healed" : "No Issues"}
- **Timestamp**: ${new Date().toISOString()}

#### Last Request Metrics:
- **Provider**: ${lastCall.provider}
- **Model**: ${lastCall.model}
- **HTTP Status**: ${lastCall.httpStatus || "N/A"}
- **Timeout**: ${lastCall.timeout ? "Yes" : "No"}
- **429 Rate Limit**: ${lastCall.is429 ? "Yes" : "No"}
- **Validation Error**: ${lastCall.validationError || "None"}
- **Repair Applied**: ${lastCall.repairApplied ? "Yes" : "No"}
- **Fallback Used**: ${lastCall.fallbackUsed ? "Yes" : "No"}
- **Retry Count**: ${lastCall.retryCount}
`;

      clipboard.writeText(payload);
      return { ok: true };
    } catch (err) {
      log.error("Failed to copy diagnostics:", err);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle("app:copyText", async (_e, text) => {
    try {
      const { clipboard } = await import("electron");
      clipboard.writeText(String(text || ""));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle("app:submitFeedback", async (_e, report = {}) => {
    const description = String(report.description || "").trim();
    if (description.length < 10) return { ok: false, error: "Please add a little more detail before sending." };
    if (description.length > 5000) return { ok: false, error: "Feedback is limited to 5,000 characters." };

    try {
      const { app } = await import("electron");
      const os = await import("os");
      const path = await import("path");
      const fs = await import("fs/promises");
      const { ProviderManager } = await import("./ai/ProviderManager.js");
      const lastRequest = ProviderManager.getLastCallDiagnostic();
      const payload = {
        category: String(report.category || "general").slice(0, 80),
        description,
        contact: String(report.contact || "").trim().slice(0, 320),
        createdAt: new Date().toISOString(),
        diagnostics: { appVersion: app.getVersion(), platform: os.platform(), osRelease: os.release(), provider: lastRequest.provider, model: lastRequest.model, lastRequest }
      };
      const endpoint = process.env.REFINZI_FEEDBACK_URL;
      if (endpoint && /^https:\/\//i.test(endpoint)) {
        const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`Feedback service returned ${response.status}`);
        return { ok: true, delivery: "sent" };
      }

      const reportDir = path.join(app.getPath("userData"), "feedback-reports");
      await fs.mkdir(reportDir, { recursive: true });
      await fs.writeFile(path.join(reportDir, `report-${Date.now()}.json`), JSON.stringify(payload, null, 2), "utf8");
      return { ok: true, delivery: "saved" };
    } catch (err) {
      log.error("Failed to submit feedback:", err);
      return { ok: false, error: "Could not save your report. Please try again." };
    }
  });

  ipcMain.handle("app:openUrl", async (_e, url) => {
    try {
      const targetUrl = String(url || "").trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        log.warn("[IPC] Rejected non-HTTP(S) shell openExternal request:", targetUrl);
        return { ok: false, error: "Invalid URL scheme. Only HTTP and HTTPS URLs are allowed." };
      }
      const { shell } = await import("electron");
      await shell.openExternal(targetUrl);
      return { ok: true };
    } catch (err) {
      log.error("Failed to open URL:", err);
      return { ok: false, error: err.message };
    }
  });
}
