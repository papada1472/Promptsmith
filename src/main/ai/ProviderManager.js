import { GeminiProvider } from "./GeminiProvider.js";
import { OpenRouterProvider } from "./OpenRouterProvider.js";
import { GatewayProvider } from "./GatewayProvider.js";

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
    "gateway": GatewayProvider
  };

  /**
   * Retrieves the provider to use based on available credentials.
   * 
   * @param {Object} opts - Options containing API keys.
   * @returns {string} The provider identifier.
   */
  static getActiveProviderId(opts) {
    if (opts?.openRouterApiKey && opts?.activeProvider === "openrouter") {
      return "openrouter";
    }
    if (opts?.geminiApiKey && opts?.activeProvider === "gemini") {
      return "gemini";
    }
    // Backward compatibility if activeProvider is not passed
    if (opts?.geminiApiKey && !opts?.activeProvider) {
      return "gemini";
    }
    return "gateway";
  }

  /**
   * Instantiates a registered AI provider.
   * 
   * @param {string} providerId - The unique identifier of the provider (e.g., "gemini").
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
    if (id === "gemini") {
      return GeminiProvider.getModelName();
    }
    if (id === "openrouter") {
      return OpenRouterProvider.DEFAULT_MODEL;
    }
    if (id === "gateway") {
      return "gateway-default";
    }
    return "";
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
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
      ];
    }
    if (id === "openrouter") {
      return [
        // Free Models
        "google/gemini-2.0-flash-exp:free",
        "google/gemini-flash-1.5-8b-exp:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "mistralai/pixtral-12b:free",
        "qwen/qwq-32b-preview:free",
        // Premium Models
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
}
