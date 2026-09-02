import { ipcMain } from "electron";
import { applyLaunchOnStartup } from "./startup.js";
import { store } from "./store.js";
import { notifySuccess, notifyError, notifyWarning } from "./notifications.js";
import { providerService } from "./services/providerService.js";
import { settingsService } from "./services/settingsService.js";
import { hotkeyService } from "./services/hotkeyService.js";
import { startupService } from "./services/startupService.js";
import { metricsService } from "./services/metricsService.js";
import { createLogger, redactSecrets } from "./logger.js";

const log = createLogger("IPC");

const ALLOWED_SETTINGS_KEYS = new Set([
  "theme",
  "activeProvider",
  "activeModel",
  "hotkey",
  "launchOnStartup",
  "saveHistoryLocally",
  "customApiBaseUrl",
  "ollamaBaseUrl",
  "lmStudioBaseUrl",
  "userName",
  "onboardingSeen",
  "premiumWelcomePending",
  "shareCardDismissed"
]);

const ALLOWED_MODES = new Set(["sparkle", "preserve", "click", "expert", "hold", "drop"]);

export function registerIpcHandlers({ refreshTrayMenu, registerShortcut, openSettings }) {
  ipcMain.handle("prompt:rebuildDirect", async (_e, payload = {}) => {
    try {
      const text = typeof payload.text === "string" ? payload.text.trim() : "";
      const rawMode = typeof payload.mode === "string" ? payload.mode.toLowerCase() : "sparkle";
      const mode = ALLOWED_MODES.has(rawMode) ? rawMode : "sparkle";

      if (!text) {
        return { ok: false, error: "Please enter a prompt to rebuild." };
      }
      if (text.length > 50000) {
        return { ok: false, error: "Prompt is too long. Please limit text to 50,000 characters." };
      }

      const { buildEnvelope } = await import("./output/compiler.js");
      const { optimizeEnvelope } = await import("./output/optimizer.js");
      const { buildExecutionPlan } = await import("./output/promptEngineer.js");
      const { ProviderManager } = await import("./ai/ProviderManager.js");
      const { validateOutput } = await import("./outputValidator.js");

      const envelope = buildEnvelope({ input: text, mode });
      const optimized = optimizeEnvelope(envelope);
      const plan = buildExecutionPlan(optimized);
      const start = Date.now();

      const rawResult = await ProviderManager.refineWithFailover(plan.systemPrompt, plan.userPrompt, {
        mode,
        timeoutMs: mode === "expert" || mode === "hold" ? 25000 : 15000
      });

      const validatedText = typeof rawResult === "object" && rawResult?.output ? rawResult.output : rawResult;
      const validated = validateOutput(validatedText, mode);
      const finalOutput = validated.output || validatedText;

      try {
        metricsService.recordSuccess?.({
          input: text,
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
      const userMessage = err?.code === "MISSING_API_KEY" 
        ? "AI provider API key required. Please open Settings to add your key."
        : (err?.code === "RATE_LIMIT" ? "Provider rate limit reached. Please wait a moment." : (err?.message || "Failed to rebuild prompt."));
      return { ok: false, error: userMessage };
    }
  });

  ipcMain.handle("settings:verifyApiKey", async (_e, key, provider) => {
    try {
      const sanitizedKey = typeof key === "string" ? key.trim() : "";
      const sanitizedProvider = typeof provider === "string" ? provider.trim().toLowerCase() : undefined;
      return await providerService.verifyApiKey(sanitizedKey, sanitizedProvider);
    } catch (err) {
      log.error("settings:verifyApiKey error:", err);
      return { ok: false, error: err?.message || "Verification failed." };
    }
  });

  ipcMain.handle("app:showToast", async (_e, opts = {}) => {
    const msg = typeof opts.message === "string" ? opts.message.slice(0, 500) : "";
    if (opts.type === "success") notifySuccess(msg);
    else if (opts.type === "error") notifyError(msg);
    else if (opts.type === "warning") notifyWarning(msg);
    return { ok: true };
  });

  ipcMain.handle("settings:get", async () => {
    log.debug("settings:get");
    return settingsService.getSettings();
  });

  ipcMain.handle("settings:setApiKey", async (_e, apiKey, provider) => {
    const cleanKey = typeof apiKey === "string" ? apiKey.trim() : "";
    const cleanProvider = typeof provider === "string" ? provider.trim().toLowerCase() : "deepseek";
    log.debug("settings:setApiKey", cleanProvider);
    return settingsService.setApiKey(cleanKey, cleanProvider);
  });

  ipcMain.handle("settings:setLaunchOnStartup", async (_e, enabled) => {
    log.debug("settings:setLaunchOnStartup", Boolean(enabled));
    return startupService.setLaunchOnStartup(Boolean(enabled), applyLaunchOnStartup);
  });

  ipcMain.handle("settings:setHotkey", async (_e, hotkey) => {
    const cleanHotkey = typeof hotkey === "string" ? hotkey.trim() : "";
    log.debug("settings:setHotkey", cleanHotkey);
    return hotkeyService.setHotkey(cleanHotkey, registerShortcut, refreshTrayMenu);
  });

  ipcMain.handle("reward:get", async () => {
    return {
      ...metricsService.getStats(),
      hotkey: store.get("hotkey"),
      running: true
    };
  });

  ipcMain.handle("app:openSettings", async (_e, opts = {}) => {
    log.debug("app:openSettings", opts);
    openSettings({ focusApiKey: Boolean(opts?.focusApiKey) });
    return { ok: true };
  });

  ipcMain.handle("settings:set", async (_e, settingsObj) => {
    if (!settingsObj || typeof settingsObj !== "object") {
      return { ok: false, error: "Invalid settings payload" };
    }
    
    log.debug("settings:set", Object.keys(settingsObj).join(", "));
    for (const [key, val] of Object.entries(settingsObj)) {
      if (ALLOWED_SETTINGS_KEYS.has(key)) {
        store.set(key, val);
      }
    }

    try {
      const { ProviderManager } = await import("./ai/ProviderManager.js");
      if (settingsObj.activeProvider) {
        ProviderManager.resetCircuitBreaker(String(settingsObj.activeProvider).toLowerCase());
      } else {
        ProviderManager.resetCircuitBreaker();
      }
    } catch (_) {}
    return { ok: true };
  });

  ipcMain.handle("settings:dismissQuota", async () => {
    return { ok: true };
  });

  ipcMain.handle("settings:setTheme", async (_e, theme) => {
    const safeTheme = typeof theme === "string" && ["dark", "light", "system"].includes(theme) ? theme : "system";
    store.set("theme", safeTheme);
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
    if (typeof index === "number" && index >= 0) {
      metricsService.deleteLog(index);
    }
    return { ok: true };
  });

  ipcMain.handle("logs:clear", async () => {
    metricsService.clearLogs();
    return { ok: true };
  });

  ipcMain.handle("toast:show", async (_e, opts = {}) => {
    const msg = typeof opts.message === "string" ? opts.message.slice(0, 500) : "";
    if (opts.type === "success") notifySuccess(msg);
    else if (opts.type === "error") notifyError(msg);
    else if (opts.type === "warning") notifyWarning(msg);
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
  - DeepSeek: ${circuits.deepseek?.averageLatency ? Math.round(circuits.deepseek.averageLatency) + " ms" : "N/A"}
  - Gemini: ${circuits.gemini?.averageLatency ? Math.round(circuits.gemini.averageLatency) + " ms" : "N/A"}
  - Claude: ${circuits.anthropic?.averageLatency ? Math.round(circuits.anthropic.averageLatency) + " ms" : "N/A"}
  - OpenAI: ${circuits.openai?.averageLatency ? Math.round(circuits.openai.averageLatency) + " ms" : "N/A"}
  - OpenRouter: ${circuits.openrouter?.averageLatency ? Math.round(circuits.openrouter.averageLatency) + " ms" : "N/A"}
- **Circuit Breaker Status**:
  - DeepSeek: ${circuits.deepseek?.state || "CLOSED"}
  - Gemini: ${circuits.gemini?.state || "CLOSED"}
  - Claude: ${circuits.anthropic?.state || "CLOSED"}
  - OpenAI: ${circuits.openai?.state || "CLOSED"}
  - OpenRouter: ${circuits.openrouter?.state || "CLOSED"}
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

      clipboard.writeText(redactSecrets(payload));
      return { ok: true };
    } catch (err) {
      log.error("Failed to copy diagnostics:", err);
      return { ok: false, error: "Failed to generate diagnostics." };
    }
  });

  ipcMain.handle("app:copyText", async (_e, text) => {
    try {
      const { clipboard } = await import("electron");
      clipboard.writeText(String(text || ""));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Failed to copy text." };
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
        description: redactSecrets(description),
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
      if (!targetUrl) {
        return { ok: false, error: "URL cannot be empty." };
      }

      let parsed;
      try {
        parsed = new URL(targetUrl);
      } catch {
        return { ok: false, error: "Malformed URL." };
      }

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        log.warn("[IPC] Blocked untrusted URL protocol in shell.openExternal:", targetUrl);
        return { ok: false, error: "Invalid URL scheme. Only HTTP and HTTPS URLs are permitted." };
      }

      const { shell } = await import("electron");
      await shell.openExternal(targetUrl);
      return { ok: true };
    } catch (err) {
      log.error("Failed to open URL:", err);
      return { ok: false, error: "Failed to open link." };
    }
  });
}
