export class AIProvider {
  /**
   * @param {{ apiKey: string, systemPrompt: string, timeoutMs: number }} opts
   */
  constructor(opts) {
    if (new.target === AIProvider) {
      throw new Error("AIProvider is abstract. Instantiate a concrete provider.");
    }
    this.apiKey = opts.apiKey;
    this.systemPrompt = opts.systemPrompt;
    this.timeoutMs = opts.timeoutMs;
  }

  /**
   * @param {string} text
   * @param {{ signal?: AbortSignal }} [opts]
   * @returns {Promise<string>}
   */
  // eslint-disable-next-line no-unused-vars
  async refine(text, opts = {}) {
    throw new Error("Not implemented");
  }
}

