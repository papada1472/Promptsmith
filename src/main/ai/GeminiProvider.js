import { GoogleGenAI } from "@google/genai";
import { AIProvider } from "./AIProvider.js";
import { createLogger } from "../logger.js";

const log = createLogger("GeminiProvider");

export class GeminiProvider extends AIProvider {
  static MODEL = "gemini-flash-latest";

  constructor(opts) {
    super(opts);
    const rawModel = opts?.model || GeminiProvider.MODEL;
    this.model = (rawModel === "gemini-2.5-flash" || !rawModel) ? "gemini-flash-latest" : rawModel;
    log.debug("Creating GoogleGenAI client...");
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
    log.debug("Client created, model set to:", this.model);
  }

  static getModelName() {
    return GeminiProvider.MODEL;
  }

  async refine(text, opts = {}) {
    log.debug("refine() called, text length:", text?.length || 0);

    if (!this.apiKey) {
      const err = new Error("Missing Gemini API key");
      err.code = "MISSING_API_KEY";
      log.error("ERROR - MISSING_API_KEY:", err.message);
      throw err;
    }
    if (!text || !text.trim()) {
      const err = new Error("No text to refine");
      err.code = "EMPTY_INPUT";
      log.error("ERROR - EMPTY_INPUT:", err.message);
      throw err;
    }

    const controller = new AbortController();
    let timeoutId;
    if (this.timeoutMs) {
      timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    }
    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      opts.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      log.debug("Calling Google Gemini API REST endpoint, model:", this.model);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
      const payload = {
        system_instruction: this.systemPrompt ? { parts: [{ text: this.systemPrompt }] } : undefined,
        contents: [{
          parts: opts.media ? [
            { text },
            { inline_data: { mime_type: opts.media.mimeType, data: opts.media.data } }
          ] : [{ text }]
        }],
        ...(opts.responseMimeType && { generationConfig: { responseMimeType: opts.responseMimeType } })
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": this.apiKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `Gemini API error: ${res.status}`;
        const err = new Error(msg);
        err.code = res.status === 429 ? "RATE_LIMIT" : "API_ERROR";
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      log.debug("Response received, length:", responseText.length);

      if (!responseText) {
        const err = new Error("Empty response from Gemini");
        err.code = "EMPTY_OUTPUT";
        throw err;
      }

      return responseText;
    } catch (e) {
      if (timeoutId) clearTimeout(timeoutId);
      if (e.name === "AbortError" || controller.signal.aborted) {
        const err = new Error("Gemini request timed out");
        err.code = "timeout";
        throw err;
      }
      log.error("FULL ERROR RESPONSE:", e.message || String(e));
      throw e;
    }
  }
}