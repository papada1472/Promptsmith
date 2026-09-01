import { AIProvider } from "./AIProvider.js";
import { createLogger } from "../logger.js";

const log = createLogger("OpenRouterProvider");

/**
 * OpenRouter implementation of the AIProvider.
 * Uses standard fetch to call the OpenRouter API.
 */
export class OpenRouterProvider extends AIProvider {
  static DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning:free";
  static BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

  constructor(opts) {
    super(opts);
    const raw = opts?.model;
    if (typeof raw === "string" && raw.includes("/")) {
      this.model = raw;
    } else {
      this.model = OpenRouterProvider.DEFAULT_MODEL;
    }
    this.apiKey = (this.apiKey || "").trim();
    log.debug("Initializing with model:", this.model);
  }

  async refine(text, opts = {}) {
    log.debug("refine() called, text length:", text?.length || 0);

    if (!this.apiKey) {
      const err = new Error("Missing OpenRouter API key");
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
      timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeoutMs);
    }

    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      opts.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const requestBody = {
        model: this.model,
        messages: [
          { role: "system", content: this.systemPrompt }
        ],
        temperature: 0.7
      };

      if (opts.media) {
        requestBody.messages.push({
          role: "user",
          content: [
            { type: "text", text: text },
            { type: "image_url", image_url: { url: `data:${opts.media.mimeType};base64,${opts.media.data}` } }
          ]
        });
      } else {
        requestBody.messages.push({ role: "user", content: text });
      }

      if (opts.responseMimeType === "application/json") {
        requestBody.response_format = { type: "json_object" };
      }

      log.debug("Sending POST request to OpenRouter API...");
      const response = await fetch(OpenRouterProvider.BASE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://refinzi.app", // Required for OpenRouter ranking
          "X-Title": "Refinzi Desktop",          // Required for OpenRouter ranking
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      log.debug("OpenRouter response received, status:", response.status);

      const headersObj = {};
      response.headers.forEach((value, key) => {
        if (key.toLowerCase().startsWith('x-ratelimit') || key.toLowerCase() === 'content-type') {
          headersObj[key] = value;
        }
      });
      log.debug("OpenRouter relevant headers:", JSON.stringify(headersObj));

      if (!response.ok) {
        const errorBodyText = await response.text().catch(() => "Unreadable error body");
        log.error("OpenRouter returned error response:", {
          status: response.status,
          model: this.model,
          body: errorBodyText
        });
        
        let errorMsg = `OpenRouter API error: ${response.status}`;
        try {
          const jsonError = JSON.parse(errorBodyText);
          if (jsonError?.error?.message) errorMsg = jsonError.error.message;
        } catch (e) {}

        const err = new Error(errorMsg);
        err.code = "API_ERROR";
        err.status = response.status;
        throw err;
      }

      const rawText = await response.text();
      log.debug("OpenRouter full response body:", rawText);

      const data = JSON.parse(rawText);
      const responseText = data?.choices?.[0]?.message?.content || "";
      
      log.debug("OpenRouter response text length:", responseText.length);

      if (!responseText) {
        const err = new Error("Empty response from OpenRouter");
        err.code = "EMPTY_OUTPUT";
        throw err;
      }

      return responseText;
    } catch (e) {
      if (e.name === 'AbortError') {
        log.error("OpenRouter request timed out");
        const err = new Error("OpenRouter request timed out");
        err.code = "timeout";
        throw err;
      }
      log.error("Error during refine:", e);
      throw e;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}

