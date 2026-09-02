import { AIProvider } from "./AIProvider.js";
import { createLogger } from "../logger.js";

const log = createLogger("OpenAICompatibleProvider");

export const PRESET_ENDPOINTS = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-5.6-terra",
    requiresKey: true
  },
  groq: {
    name: "GroqCloud",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    requiresKey: true
  },
  mistral: {
    name: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1/chat/completions",
    defaultModel: "codestral-latest",
    requiresKey: true
  },
  xai: {
    name: "xAI / Grok",
    baseUrl: "https://api.x.ai/v1/chat/completions",
    defaultModel: "grok-4.6",
    requiresKey: true
  },
  ollama: {
    name: "Ollama (Local)",
    baseUrl: "http://localhost:11434/v1/chat/completions",
    defaultModel: "deepseek-r1:latest",
    requiresKey: false
  },
  lmstudio: {
    name: "LM Studio (Local)",
    baseUrl: "http://localhost:1234/v1/chat/completions",
    defaultModel: "local-model",
    requiresKey: false
  },
  custom: {
    name: "OpenAI Compatible",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    defaultModel: "custom",
    requiresKey: false
  }
};

/**
 * Universal OpenAI-Compatible API Provider.
 * Supports OpenAI, Groq, Mistral, xAI, Ollama, LM Studio, Together, vLLM, and custom base URLs.
 */
export class OpenAICompatibleProvider extends AIProvider {
  constructor(opts) {
    super(opts);
    this.providerType = opts?.providerType || "openai";
    const preset = PRESET_ENDPOINTS[this.providerType] || PRESET_ENDPOINTS.openai;
    
    this.baseUrl = opts?.baseUrl || preset.baseUrl;
    this.model = opts?.model || preset.defaultModel;
    this.requiresKey = opts?.requiresKey !== undefined ? opts.requiresKey : preset.requiresKey;
    this.apiKey = (this.apiKey || "").trim();
    
    log.debug(`Initializing OpenAICompatibleProvider [${this.providerType}] with model: ${this.model} at ${this.baseUrl}`);
  }

  async refine(text, opts = {}) {
    log.debug("refine() called, text length:", text?.length || 0);

    if (this.requiresKey && !this.apiKey) {
      const err = new Error(`Missing API key for ${this.providerType.toUpperCase()}`);
      err.code = "MISSING_API_KEY";
      throw err;
    }

    if (!text || !text.trim()) {
      const err = new Error("No text to refine");
      err.code = "EMPTY_INPUT";
      throw err;
    }

    const controller = new AbortController();
    let timeoutId;

    if (this.timeoutMs) {
      timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    }

    const onAbort = () => controller.abort();
    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      else opts.signal.addEventListener("abort", onAbort, { once: true });
    }

    try {
      const messages = [];
      if (this.systemPrompt) {
        messages.push({ role: "system", content: this.systemPrompt });
      }

      if (opts.media) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text },
            {
              type: "image_url",
              image_url: {
                url: `data:${opts.media.mimeType || "image/png"};base64,${opts.media.data}`
              }
            }
          ]
        });
      } else {
        messages.push({ role: "user", content: text });
      }

      const requestBody = {
        model: this.model,
        messages,
        temperature: 0.7
      };

      if (opts.responseMimeType === "application/json") {
        requestBody.response_format = { type: "json_object" };
      }

      const headers = {
        "Content-Type": "application/json"
      };

      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      log.debug(`Sending POST request to ${this.baseUrl}...`);
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      log.debug(`Response received from ${this.providerType}, status:`, response.status);

      if (!response.ok) {
        const errorBodyText = await response.text().catch(() => "Unreadable error body");
        log.error(`${this.providerType} returned error:`, {
          status: response.status,
          model: this.model,
          body: errorBodyText
        });

        let errorMsg = `${this.providerType.toUpperCase()} API error: ${response.status}`;
        try {
          const jsonError = JSON.parse(errorBodyText);
          if (jsonError?.error?.message) errorMsg = jsonError.error.message;
        } catch (e) {}

        const err = new Error(errorMsg);
        err.code = response.status === 401 ? "INVALID_API_KEY" : (response.status === 429 ? "RATE_LIMIT" : "API_ERROR");
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const choice = data?.choices?.[0];
      const responseText = choice?.message?.content || choice?.message?.reasoning_content || "";

      if (!responseText) {
        const err = new Error(`Empty response from ${this.providerType}`);
        err.code = "EMPTY_OUTPUT";
        throw err;
      }

      return responseText;
    } catch (e) {
      if (e.name === "AbortError") {
        log.error(`${this.providerType} request timed out`);
        const err = new Error(`${this.providerType} request timed out`);
        err.code = "timeout";
        throw err;
      }
      log.error(`Error during refine in ${this.providerType}:`, e);
      throw e;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
}
