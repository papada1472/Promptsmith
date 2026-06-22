import { GeminiProvider } from "./GeminiProvider.js";

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
    "gemini": GeminiProvider
  };

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
    if (providerId?.toLowerCase() === "gemini") {
      return GeminiProvider.getModelName();
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
    if (providerId?.toLowerCase() === "gemini") {
      return [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
      ];
    }
    return [];
  }
}
