import { GeminiProvider } from "./GeminiProvider.js";
import { OpenRouterProvider } from "./OpenRouterProvider.js";
import { DeepSeekProvider } from "./DeepSeekProvider.js";
import { GatewayProvider } from "./GatewayProvider.js";
import { ByokVault } from "./ByokVault.js";
import { store } from "../store.js";
import { metricsService } from "../services/metricsService.js";
import { SYSTEM_PROMPT, REFINE_TIMEOUT_MS } from "../constants.js";
import { isValidAIResponse, validateRecreationOutput, repairRefineOutput, repairRecreationOutput } from "../outputValidator.js";
import { createLogger } from "../logger.js";

const log = createLogger("ProviderManager");

/**
 * Registry and factory for AI Providers.
 * Encapsulates concrete provider implementations behind a unified interface.
 */
export class ProviderManager {
  /**
   * Internal mapping of registered provider identifiers to their concrete classes.
   * @private
   * @type {Record<string, typeof import("./AIProvider.js").AIProvider>}
   */
  static #registry = {
    "gemini": GeminiProvider,
    "openrouter": OpenRouterProvider,
    "deepseek": DeepSeekProvider,
    "gateway": GatewayProvider
  };

  static lastCallDiagnostic = {
    provider: "unknown",
    model: "unknown",
    httpStatus: null,
    timeout: false,
    is429: false,
    validationError: null,
    repairApplied: false,
    fallbackUsed: false,
    retryCount: 0,
    generationTimeMs: 0
  };

  static getLastCallDiagnostic() {
    return { ...this.lastCallDiagnostic };
  }

  /**
   * Retrieves the provider to use based on available credentials.
   * 
   * @param {Object} opts - Options containing API keys.
   * @returns {string} The provider identifier.
   */
  static getActiveProviderId(opts) {
    if (opts?.deepSeekApiKey && (opts?.activeProvider === "deepseek" || !opts?.activeProvider)) {
      return "deepseek";
    }
    if (opts?.geminiApiKey && opts?.activeProvider === "gemini") {
      return "gemini";
    }
    if (opts?.openRouterApiKey && opts?.activeProvider === "openrouter") {
      return "openrouter";
    }
    // Backward compatibility if activeProvider is not passed
    if (opts?.deepSeekApiKey && !opts?.activeProvider) {
      return "deepseek";
    }
    if (opts?.geminiApiKey && !opts?.activeProvider) {
      return "gemini";
    }
    return "gateway";
  }

  /**
   * Instantiates a registered AI provider.
   * 
   * @param {string} providerId - The unique identifier of the provider (e.g., "deepseek").
   * @param {Object} opts - The initialization options for the provider.
   * @param {string} opts.apiKey - The API credential.
   * @param {string} opts.systemPrompt - The core instruction set.
   * @param {number} opts.timeoutMs - Maximum duration of request before cancellation.
   * @returns {import("./AIProvider.js").AIProvider} An instance of a concrete AIProvider.
   * @throws {Error} Throws if the provider is unknown or unregistered.
   */
  static createProvider(providerId, opts) {
    const ProviderClass = this.#registry[providerId?.toLowerCase()];
    if (!ProviderClass) {
      throw new Error(`Unknown or unregistered AI provider: "${providerId}"`);
    }
    return new ProviderClass(opts);
  }

  /**
   * Retrieves the default model identifier for a specific provider.
   * 
   * @param {string} providerId - The unique identifier of the provider.
   * @returns {string} The default model name.
   */
  static getDefaultModel(providerId) {
    const id = providerId?.toLowerCase();
    if (id === "deepseek") {
      return DeepSeekProvider.DEFAULT_MODEL;
    }
    if (id === "gemini") {
      return GeminiProvider.getModelName();
    }
    if (id === "openrouter") {
      return OpenRouterProvider.DEFAULT_MODEL;
    }
    if (id === "gateway") {
      return "gateway-default";
    }
    return "deepseek-chat";
  }

  /**
   * Returns the optimal model for a given provider and interaction mode.
   *
   * Modes:
   *   "sparkle" — fast single-tap prompt improvement (DeepSeek V4 Flash / Gemini 1.5 Flash)
   *   "expert"  — long-press deep-reasoning reconstruction (DeepSeek V4 Pro / Gemini 1.5 Pro)
   *   "drop"    — artifact drag-and-drop → structured prompt angles
   *
   * @param {string} providerId - The provider identifier (e.g. "deepseek").
   * @param {string} mode - The interaction mode.
   * @returns {string} The recommended model identifier.
   */
  static getRecommendedModel(providerId, mode) {
    const id = providerId?.toLowerCase();
    if (id === "deepseek") {
      if (mode === "expert" || mode === "hold") {
        return "deepseek-v4-pro";
      }
      if (mode === "drop") {
        return "deepseek-v4-flash-vision-exp";
      }
      return "deepseek-v4-flash";
    }
    if (id === "gemini") {
      if (mode === "expert" || mode === "hold") {
        return "gemini-1.5-pro";
      }
      return "gemini-1.5-flash";
    }
    if (id !== "openrouter") {
      return this.getDefaultModel(providerId);
    }
    switch (mode) {
      case "expert":
        return "nvidia/nemotron-3-ultra-550b-a55b:free";
      case "drop":
        return "qwen/qwen3-coder:free";
      case "sparkle":
      default:
        return "nvidia/nemotron-3-super-120b-a12b:free";
    }
  }

  /**
   * Gets a list of all registered provider IDs.
   * 
   * @returns {string[]} An array of registered provider identifiers.
   */
  static getAvailableProviders() {
    return Object.keys(this.#registry);
  }

  /**
   * Retrieves all supported models for a specific provider.
   * 
   * @param {string} providerId - The unique identifier of the provider.
   * @returns {string[]} An array of model names supported by the provider.
   */
  static getAvailableModels(providerId) {
    const id = providerId?.toLowerCase();
    if (id === "gemini") {
      return [
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-1.5-pro",
        "gemini-2.5-pro",
        "gemini-flash-latest"
      ];
    }
    if (id === "deepseek") {
      return [
        "deepseek-v4-flash",
        "deepseek-v4-pro",
        "deepseek-v4-flash-vision-exp",
        "deepseek-chat",
        "deepseek-reasoner"
      ];
    }
    if (id === "openrouter") {
      return [
        // ── Sparkle Mode — Fast Prompt Refinement ──────────────────────────────
        "nvidia/nemotron-3-super-120b-a12b:free",   // ⭐ Primary Sparkle  (coding 37.7, agentic 8.7)
        "qwen/qwen3-next-80b-a3b-instruct:free",    // ⭐ Secondary Sparkle (262K ctx, tool use, Sep-25 cutoff)
        "google/gemma-4-26b-a4b-it:free",           // Sparkle alt         (multimodal, coding 39.3)
        "poolside/laguna-xs.2:free",                 // Sparkle compact     (262K ctx, agentic coder)
        "meta-llama/llama-3.3-70b-instruct:free",   // Sparkle fallback    (proven, tool use)

        // ── Hold / Expert Mode — Deep Reasoning ────────────────────────────────
        "nvidia/nemotron-3-ultra-550b-a55b:free",   // ⭐ Primary Hold   (coding 49.3, agentic 27.4, 1M ctx)
        "openai/gpt-oss-120b:free",                 // ⭐ Secondary Hold (reasoning mandatory, moderated)
        "poolside/laguna-m.1:free",                 // Hold alt          (flagship agentic, 262K ctx)
        "nousresearch/hermes-3-llama-3.1-405b:free",// Hold fallback     (multi-turn, 131K ctx)

        // ── Drop Mode — Artifact Analysis & Prompt Generation ──────────────────
        "qwen/qwen3-coder:free",                    // ⭐ Primary Drop   (1M ctx, tool use, code rank #54)
        "google/gemma-4-31b-it:free",              // ⭐ Secondary Drop (image+video input, coding 43.4)
        "cohere/north-mini-code:free",              // Drop alt          (256K ctx, agentic coding, fast)
        "openrouter/owl-alpha",                     // Drop alt          (1M ctx, agentic, tool use)

        // ── Premium (paid) ─────────────────────────────────────────────────────
        "openai/gpt-4o-mini",
        "anthropic/claude-3.5-sonnet",
        "google/gemini-flash-1.5"
      ];
    }
    if (id === "gateway") {
      return [
        "gateway-default"
      ];
    }
    return [];
  }

  // --- HEALTH & CIRCUIT BREAKER MANAGEMENT ---

  static #healthState = {
    gemini: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 },
    openrouter: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 },
    deepseek: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 },
    gateway: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 }
  };

  /**
   * Resets circuit breaker state for a specific provider or all providers.
   * Called when the user updates an API key or changes active settings.
   */
  static resetCircuitBreaker(providerId) {
    if (!providerId || providerId === "all") {
      for (const key of Object.keys(this.#healthState)) {
        this.#healthState[key] = { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 };
      }
      log.info("[CircuitBreaker] All provider circuit breakers reset to CLOSED.");
    } else {
      const id = providerId.toLowerCase();
      if (this.#healthState[id]) {
        this.#healthState[id] = { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 };
        log.info(`[CircuitBreaker] Provider ${id} circuit breaker reset to CLOSED.`);
      }
    }
  }

  static getCircuitBreakerStatus() {
    return {
      gemini: { ...this.#healthState.gemini },
      openrouter: { ...this.#healthState.openrouter },
      deepseek: { ...this.#healthState.deepseek },
      gateway: { ...this.#healthState.gateway }
    };
  }

  /**
   * Check if a provider is healthy (or if its cooldown has expired).
   */
  static isProviderHealthy(providerId) {
    const id = providerId?.toLowerCase();
    const state = this.#healthState[id];
    if (!state) return true; // default to true if unknown

    if (state.state === "CLOSED") return true;

    if (state.state === "OPEN") {
      // Check if cooldown expired
      if (state.retryAfter && Date.now() > state.retryAfter) {
        log.info(`[CircuitBreaker] Cooldown expired for ${id}. Transitioning to HALF-OPEN.`);
        state.state = "HALF-OPEN";
        return true;
      }
      return false;
    }

    if (state.state === "HALF-OPEN") {
      // Allow the test request
      return true;
    }

    return state.healthy;
  }

  /**
   * Mark a provider as failed, setting a cooldown period (e.g., 5 minutes for 429).
   */
  static markProviderFailed(providerId, error) {
    const id = providerId?.toLowerCase();
    const state = this.#healthState[id];
    if (!state) return;

    state.failures++;
    state.lastFailure = Date.now();

    const is429 = error?.status === 429 || error?.code === "RATE_LIMITED";
    const threshold = 3;

    if (state.state === "HALF-OPEN" || state.failures >= threshold || is429) {
      state.state = "OPEN";
      state.healthy = false;
      // 5 minutes for 429/rate-limit, 30 seconds for other transient errors to prevent deskop starvation
      const cooldownMs = is429 ? 5 * 60 * 1000 : 30 * 1000;
      state.retryAfter = Date.now() + cooldownMs;
      log.warn(`[CircuitBreaker] Provider ${id} tripped to OPEN. Cooldown: ${cooldownMs / 1000}s. Reason: ${error?.message || error}`);
    } else {
      log.info(`[CircuitBreaker] Provider ${id} failure count: ${state.failures}/${threshold}`);
    }
  }

  /**
   * Update average latency for a successful call.
   */
  static recordLatency(providerId, latencyMs) {
    const id = providerId?.toLowerCase();
    const state = this.#healthState[id];
    if (!state) return;

    if (state.state !== "CLOSED") {
      log.info(`[CircuitBreaker] Provider ${id} recovered! Transitioning to CLOSED.`);
    }

    state.state = "CLOSED";
    state.healthy = true;
    state.failures = 0;
    state.retryAfter = 0;

    if (state.averageLatency === 0) {
      state.averageLatency = latencyMs;
    } else {
      // Exponential moving average
      state.averageLatency = (state.averageLatency * 0.8) + (latencyMs * 0.2);
    }
  }

  /**
   * Refines text with automatic provider failover, health tracking, and circuit breaker.
   * Runs validation and deterministic output repair on the final output before returning.
   *
   * @param {string} text
   * @param {Object} opts
   * @param {string} [opts.mode] - "sparkle", "expert", "preserve", "drop"
   * @param {string} [opts.systemPrompt] - System prompt override
   * @param {Object} [opts.media] - Image data and mime type
   * @param {string} [opts.responseMimeType] - Response mime type format
   * @param {number} [opts.timeoutMs] - Request timeout
   * @returns {Promise<{ output: string, providerId: string, model: string }>}
   */
  static async refineWithFailover(text, opts = {}) {
    const mode = opts.mode || "sparkle";
    const activeProvider = store.get("activeProvider") || "deepseek";
    const geminiApiKey = ByokVault.decrypt(store.get("geminiApiKey")) || process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || "";
    const openRouterApiKey = ByokVault.decrypt(store.get("openRouterApiKey")) || process.env.OPENROUTER_API_KEY || "";
    const deepSeekApiKey = ByokVault.decrypt(store.get("deepSeekApiKey")) || process.env.DEEPSEEK_API_KEY || "";

    // Initialize diagnostic report for the request
    this.lastCallDiagnostic = {
      provider: activeProvider,
      model: "unknown",
      httpStatus: null,
      timeout: false,
      is429: false,
      validationError: null,
      repairApplied: false,
      fallbackUsed: false,
      retryCount: 0,
      generationTimeMs: 0
    };

    // 1. Resolve fallback chain
    const providersToTry = [];
    const hasValidGeminiKey = Boolean(geminiApiKey && (geminiApiKey.startsWith("AIza") || geminiApiKey.startsWith("AQ.") || geminiApiKey.length >= 10));
    const hasValidOpenRouterKey = Boolean(openRouterApiKey && (openRouterApiKey.startsWith("sk-or-") || openRouterApiKey.startsWith("sk-") || openRouterApiKey.length >= 10));
    const hasValidDeepSeekKey = Boolean(deepSeekApiKey && (deepSeekApiKey.startsWith("sk-") || deepSeekApiKey.length >= 10));

    if (activeProvider === "deepseek") {
      if (hasValidDeepSeekKey && !opts.media) providersToTry.push("deepseek");
      if (hasValidGeminiKey) providersToTry.push("gemini");
      if (hasValidOpenRouterKey) providersToTry.push("openrouter");
    } else if (activeProvider === "gemini") {
      if (hasValidGeminiKey) providersToTry.push("gemini");
      if (hasValidDeepSeekKey && !opts.media) providersToTry.push("deepseek");
      if (hasValidOpenRouterKey) providersToTry.push("openrouter");
    } else if (activeProvider === "openrouter") {
      if (hasValidOpenRouterKey) providersToTry.push("openrouter");
      if (hasValidDeepSeekKey && !opts.media) providersToTry.push("deepseek");
      if (hasValidGeminiKey) providersToTry.push("gemini");
    } else if (activeProvider === "gateway") {
      providersToTry.push("gateway");
      if (hasValidDeepSeekKey && !opts.media) providersToTry.push("deepseek");
      if (hasValidGeminiKey) providersToTry.push("gemini");
      if (hasValidOpenRouterKey) providersToTry.push("openrouter");
    } else {
      if (hasValidDeepSeekKey && !opts.media) providersToTry.push("deepseek");
      if (hasValidGeminiKey) providersToTry.push("gemini");
      if (hasValidOpenRouterKey) providersToTry.push("openrouter");
    }
    
    if (!providersToTry.includes("gateway")) {
      providersToTry.push("gateway");
    }

    log.info(`[ProviderManager] Failover queue: ${providersToTry.join(" -> ")} (active: ${activeProvider})`);

    let lastError = null;

    for (const providerId of providersToTry) {
      // 2. Check Circuit Breaker
      if (!this.isProviderHealthy(providerId)) {
        log.warn(`[ProviderManager] Skipping provider ${providerId} due to active Circuit Breaker.`);
        continue;
      }

      // 3. Resolve Model
      let model = this.getRecommendedModel(providerId, mode);
      if (providerId === activeProvider) {
        const configuredModel = store.get("activeModel");
        const availableModels = this.getAvailableModels(providerId);
        if (configuredModel && (availableModels.includes(configuredModel) || (providerId === "openrouter" && configuredModel.includes("/")))) {
          model = configuredModel;
        }
      }

      this.lastCallDiagnostic.provider = providerId;
      this.lastCallDiagnostic.model = model;
      this.lastCallDiagnostic.fallbackUsed = (providerId !== activeProvider);

      // 4. Instantiate Provider
      let apiKey = geminiApiKey;
      if (providerId === "openrouter") apiKey = openRouterApiKey;
      else if (providerId === "deepseek") apiKey = deepSeekApiKey;
      const attemptTimeout = opts.timeoutMs ? Math.max(opts.timeoutMs, 25000) : 25000;
      
      let provider;
      try {
        provider = this.createProvider(providerId, {
          apiKey: providerId === "gateway" ? undefined : apiKey,
          model: model,
          systemPrompt: opts.systemPrompt || SYSTEM_PROMPT,
          timeoutMs: attemptTimeout
        });
      } catch (err) {
        log.error(`[ProviderManager] Failed to create provider ${providerId}:`, err);
        lastError = err;
        continue;
      }

      // 5. Call Provider exactly once (Zero duplicate provider retries)
      const start = Date.now();
      try {
        log.info(`[ProviderManager] Executing refine on provider: ${providerId}, model: ${model}`);
        const rawOutput = await provider.refine(text, opts);
        const latency = Date.now() - start;

        log.info(`[ProviderManager] Refine success on provider: ${providerId} in ${latency}ms`);
        this.recordLatency(providerId, latency);
        
        const label = providerId.charAt(0).toUpperCase() + providerId.slice(1);
        metricsService.recordProviderCall(label, true, latency);

        this.lastCallDiagnostic.generationTimeMs = latency;

        // 6. Validation and Repair (No LLM recall/regeneration)
        let output = rawOutput;
        const inputPrompt = text;

        if (mode === "sparkle" || mode === "preserve" || mode === "click") {
          const validation = isValidAIResponse(inputPrompt, output);
          if (!validation.valid) {
            this.lastCallDiagnostic.validationError = validation.reason;
            this.lastCallDiagnostic.repairApplied = true;
            output = repairRefineOutput(inputPrompt, output, validation.reason);
          }
        } else if (mode === "expert" || mode === "hold") {
          const validation = isValidAIResponse(inputPrompt, output);
          if (!validation.valid) {
            this.lastCallDiagnostic.validationError = validation.reason;
            this.lastCallDiagnostic.repairApplied = true;
            output = repairRefineOutput(inputPrompt, output, validation.reason);
          }
          const recVal = validateRecreationOutput(output);
          if (!recVal.valid) {
            this.lastCallDiagnostic.validationError = "Recreation missing/forbidden sections";
            this.lastCallDiagnostic.repairApplied = true;
            output = repairRecreationOutput(output, recVal.forbidden, recVal.missing);
          }
        }
        
        return { output, providerId, model };
      } catch (err) {
        const latency = Date.now() - start;
        this.lastCallDiagnostic.retryCount++;
        this.lastCallDiagnostic.httpStatus = err.status || err.statusCode || null;
        this.lastCallDiagnostic.timeout = err.message?.toLowerCase().includes("timeout") || false;
        this.lastCallDiagnostic.is429 = err.status === 429 || err.message?.includes("429") || false;

        const diagnostic = {
          event: "ai_provider_failure",
          providerId,
          model,
          latency_ms: latency,
          error: err.message || String(err),
          statusCode: err.status || err.statusCode || null,
          code: err.code || null,
          timestamp: new Date().toISOString()
        };
        log.error("[ProviderManager] AI Failure Diagnostic:", JSON.stringify(diagnostic));

        this.markProviderFailed(providerId, err);

        const label = providerId.charAt(0).toUpperCase() + providerId.slice(1);
        metricsService.recordProviderCall(label, false, latency, err.code || "FAILED");
        lastError = err;
      }
    }

    if (!hasValidDeepSeekKey && !hasValidGeminiKey && !hasValidOpenRouterKey) {
      const err = new Error("DeepSeek API key required. Right-click Refinzi Tray > Settings to add your key (get one at platform.deepseek.com).");
      err.code = "MISSING_API_KEY";
      throw err;
    }

    throw lastError || new Error("All AI providers failed. Please check your API key in Settings (Right-click Refinzi Tray > Settings).");
  }
}
