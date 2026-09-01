import { GeminiProvider } from "./GeminiProvider.js";
import { OpenRouterProvider } from "./OpenRouterProvider.js";
import { DeepSeekProvider } from "./DeepSeekProvider.js";
import { GatewayProvider } from "./GatewayProvider.js";
import { AnthropicProvider } from "./AnthropicProvider.js";
import { OpenAICompatibleProvider, PRESET_ENDPOINTS } from "./OpenAICompatibleProvider.js";
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
    "gateway": GatewayProvider,
    "anthropic": AnthropicProvider,
    "openai": OpenAICompatibleProvider,
    "groq": OpenAICompatibleProvider,
    "mistral": OpenAICompatibleProvider,
    "xai": OpenAICompatibleProvider,
    "ollama": OpenAICompatibleProvider,
    "lmstudio": OpenAICompatibleProvider,
    "custom": OpenAICompatibleProvider
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
    if (opts?.openAiApiKey && opts?.activeProvider === "openai") {
      return "openai";
    }
    if (opts?.anthropicApiKey && opts?.activeProvider === "anthropic") {
      return "anthropic";
    }
    if (opts?.groqApiKey && opts?.activeProvider === "groq") {
      return "groq";
    }
    if (opts?.mistralApiKey && opts?.activeProvider === "mistral") {
      return "mistral";
    }
    if (opts?.xaiApiKey && opts?.activeProvider === "xai") {
      return "xai";
    }
    if (opts?.customApiKey && opts?.activeProvider === "custom") {
      return "custom";
    }
    if (opts?.activeProvider === "ollama" || opts?.activeProvider === "lmstudio") {
      return opts.activeProvider;
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
   * @returns {import("./AIProvider.js").AIProvider} An instance of a concrete AIProvider.
   * @throws {Error} Throws if the provider is unknown or unregistered.
   */
  static createProvider(providerId, opts = {}) {
    const id = providerId?.toLowerCase();
    const ProviderClass = this.#registry[id];
    if (!ProviderClass) {
      throw new Error(`Unknown or unregistered AI provider: "${providerId}"`);
    }
    if (["openai", "groq", "mistral", "xai", "ollama", "lmstudio", "custom"].includes(id)) {
      const customUrl = id === "custom" ? (opts.baseUrl || store.get("customApiBaseUrl")) : undefined;
      return new OpenAICompatibleProvider({ ...opts, providerType: id, baseUrl: customUrl });
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
    if (id === "deepseek") return DeepSeekProvider.DEFAULT_MODEL;
    if (id === "gemini") return GeminiProvider.getModelName();
    if (id === "openrouter") return OpenRouterProvider.DEFAULT_MODEL;
    if (id === "anthropic") return AnthropicProvider.DEFAULT_MODEL;
    if (id === "openai") return "gpt-5.6-terra";
    if (id === "groq") return "llama-3.3-70b-versatile";
    if (id === "mistral") return "codestral-latest";
    if (id === "xai") return "grok-4.6";
    if (id === "ollama") return "deepseek-r1:latest";
    if (id === "lmstudio") return "local-model";
    if (id === "gateway") return "gateway-default";
    return "deepseek-chat";
  }

  /**
   * Returns the optimal model for a given provider and interaction mode.
   *
   * @param {string} providerId - The provider identifier.
   * @param {string} mode - The interaction mode.
   * @returns {string} The recommended model identifier.
   */
  static getRecommendedModel(providerId, mode) {
    const id = providerId?.toLowerCase();
    if (id === "deepseek") {
      if (mode === "expert" || mode === "hold") return "deepseek-v4-pro";
      if (mode === "drop") return "deepseek-v4-flash-vision-exp";
      return "deepseek-v4-flash";
    }
    if (id === "gemini") {
      if (mode === "expert" || mode === "hold") return "gemini-3.7-flash";
      if (mode === "drop") return "gemini-3.6-flash";
      return "gemini-3.6-flash";
    }
    if (id === "anthropic") {
      if (mode === "expert" || mode === "hold") return "claude-opus-5";
      return "claude-sonnet-5";
    }
    if (id === "openai") {
      if (mode === "expert" || mode === "hold") return "gpt-5.6-sol";
      return "gpt-5.6-terra";
    }
    if (id === "groq") {
      if (mode === "expert" || mode === "hold") return "openai/gpt-oss-120b";
      return "llama-3.3-70b-versatile";
    }
    if (id === "mistral") {
      if (mode === "expert" || mode === "hold") return "mistral-large-latest";
      return "codestral-latest";
    }
    if (id === "xai") {
      return "grok-4.6";
    }
    if (id === "ollama") {
      return "deepseek-r1:latest";
    }
    if (id !== "openrouter") {
      return this.getDefaultModel(providerId);
    }
    switch (mode) {
      case "expert":
        return "anthropic/claude-opus-5";
      case "drop":
        return "qwen/qwen3-coder:free";
      case "sparkle":
      default:
        return "nvidia/nemotron-3.5-lightning:free";
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
        "gemini-3.7-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest"
      ];
    }
    if (id === "deepseek") {
      return [
        "deepseek-reasoner",
        "deepseek-chat",
        "deepseek-v4-flash",
        "deepseek-v4-pro",
        "deepseek-v4-flash-vision-exp"
      ];
    }
    if (id === "anthropic") {
      return [
        "claude-opus-5",
        "claude-sonnet-5",
        "claude-haiku-4-5-20251001",
        "claude-3-7-sonnet-20250219",
        "claude-3-5-sonnet-20241022"
      ];
    }
    if (id === "openai") {
      return [
        "gpt-5.6-sol",
        "gpt-5.6-terra",
        "gpt-5.6-luna",
        "gpt-5.6",
        "o3-mini",
        "gpt-4o"
      ];
    }
    if (id === "groq") {
      return [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
        "deepseek-r1-distill-llama-70b"
      ];
    }
    if (id === "mistral") {
      return [
        "codestral-latest",
        "mistral-large-latest",
        "pixtral-large-latest",
        "mistral-small-latest"
      ];
    }
    if (id === "xai") {
      return [
        "grok-4.6",
        "grok-2-latest",
        "grok-beta"
      ];
    }
    if (id === "ollama") {
      return [
        "deepseek-r1:latest",
        "llama3.3:latest",
        "qwen2.5-coder:latest",
        "mistral:latest",
        "gemma2:latest"
      ];
    }
    if (id === "lmstudio") {
      return [
        "local-model"
      ];
    }
    if (id === "openrouter") {
      return [
        "anthropic/claude-sonnet-5",
        "anthropic/claude-opus-5",
        "openai/gpt-5.6-terra",
        "google/gemini-3.7-flash",
        "google/gemini-3.6-flash",
        "deepseek/deepseek-v4-pro-0813",
        "deepseek/deepseek-r1",
        "nvidia/nemotron-3.5-lightning:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen3-coder:free",
        "deepseek/deepseek-r1:free"
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
    gateway: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 },
    openai: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 },
    anthropic: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 },
    groq: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 },
    mistral: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 },
    xai: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 },
    ollama: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 },
    lmstudio: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 },
    custom: { healthy: true, state: "CLOSED", lastFailure: null, retryAfter: 0, failures: 0, averageLatency: 0 }
  };

  /**
   * Resets circuit breaker state for a specific provider or all providers.
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
    return { ...this.#healthState };
  }

  /**
   * Check if a provider is healthy (or if its cooldown has expired).
   */
  static isProviderHealthy(providerId) {
    const id = providerId?.toLowerCase();
    const state = this.#healthState[id];
    if (!state) return true;

    if (state.state === "CLOSED") return true;

    if (state.state === "OPEN") {
      if (state.retryAfter && Date.now() > state.retryAfter) {
        log.info(`[CircuitBreaker] Cooldown expired for ${id}. Transitioning to HALF-OPEN.`);
        state.state = "HALF-OPEN";
        return true;
      }
      return false;
    }

    if (state.state === "HALF-OPEN") {
      return true;
    }

    return state.healthy;
  }

  /**
   * Mark a provider as failed, setting a cooldown period.
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
      state.averageLatency = (state.averageLatency * 0.8) + (latencyMs * 0.2);
    }
  }

  /**
   * Refines text with automatic provider failover, health tracking, and circuit breaker.
   */
  static async refineWithFailover(text, opts = {}) {
    const mode = opts.mode || "sparkle";
    const activeProvider = (store.get("activeProvider") || "deepseek").toLowerCase();
    
    const keys = {
      deepseek: ByokVault.decrypt(store.get("deepSeekApiKey")) || process.env.DEEPSEEK_API_KEY || "",
      gemini: ByokVault.decrypt(store.get("geminiApiKey")) || process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || "",
      openrouter: ByokVault.decrypt(store.get("openRouterApiKey")) || process.env.OPENROUTER_API_KEY || "",
      openai: ByokVault.decrypt(store.get("openAiApiKey")) || process.env.OPENAI_API_KEY || "",
      anthropic: ByokVault.decrypt(store.get("anthropicApiKey")) || process.env.ANTHROPIC_API_KEY || "",
      groq: ByokVault.decrypt(store.get("groqApiKey")) || process.env.GROQ_API_KEY || "",
      mistral: ByokVault.decrypt(store.get("mistralApiKey")) || process.env.MISTRAL_API_KEY || "",
      xai: ByokVault.decrypt(store.get("xaiApiKey")) || process.env.XAI_API_KEY || "",
      custom: ByokVault.decrypt(store.get("customApiKey")) || ""
    };

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
    const isValidKey = (k) => Boolean(k && k.length >= 8);

    // Always try active provider first if configured
    if (["ollama", "lmstudio"].includes(activeProvider)) {
      providersToTry.push(activeProvider);
    } else if (keys[activeProvider] && isValidKey(keys[activeProvider])) {
      providersToTry.push(activeProvider);
    }

    // Add other available configured providers as failovers
    for (const [pId, pKey] of Object.entries(keys)) {
      if (pId !== activeProvider && isValidKey(pKey) && !providersToTry.includes(pId)) {
        if (!opts.media || pId !== "deepseek") {
          providersToTry.push(pId);
        }
      }
    }
    
    if (!providersToTry.includes("gateway")) {
      providersToTry.push("gateway");
    }

    log.info(`[ProviderManager] Failover queue: ${providersToTry.join(" -> ")} (active: ${activeProvider})`);

    let lastError = null;

    for (const providerId of providersToTry) {
      if (!this.isProviderHealthy(providerId)) {
        log.warn(`[ProviderManager] Skipping provider ${providerId} due to active Circuit Breaker.`);
        continue;
      }

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

      const apiKey = keys[providerId] || "";
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

    const hasAnyKey = Object.values(keys).some(k => k && k.length >= 8) || ["ollama", "lmstudio"].includes(activeProvider);
    if (!hasAnyKey) {
      const err = new Error("AI provider API key required. Right-click Refinzi Tray > Settings to add your key.");
      err.code = "MISSING_API_KEY";
      throw err;
    }

    throw lastError || new Error("All AI providers failed. Please check your API key in Settings (Right-click Refinzi Tray > Settings).");
  }
}
