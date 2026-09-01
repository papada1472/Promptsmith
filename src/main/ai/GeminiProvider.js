import dns from "dns";
import { GoogleGenAI } from "@google/genai";
import { AIProvider } from "./AIProvider.js";
import { createLogger } from "../logger.js";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (_) {}

const log = createLogger("GeminiProvider");

import https from "https";

export class GeminiProvider extends AIProvider {
  // Canonical stable model verified live against Google Generative Language API
  static MODEL = "gemini-3.7-flash";

  constructor(opts) {
    super(opts);
    const rawModel = opts?.model || GeminiProvider.MODEL;
    // Map UI model selections & aliases to active Google Generative AI API endpoints
    const MODEL_ALIASES = {
      "gemini-3.7-flash": "gemini-3.7-flash",
      "gemini-3.6-flash": "gemini-3.6-flash",
      "gemini-3.5-flash": "gemini-3.5-flash",
      "gemini-3.5-flash-lite": "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite": "gemini-3.1-flash-lite",
      "gemini-flash-latest": "gemini-flash-latest",
      "gemini-2.5-pro": "gemini-3.7-flash",
      "gemini-2.5-flash": "gemini-3.6-flash",
      "gemini-2.0-flash": "gemini-3.6-flash",
      "gemini-2.0-flash-lite": "gemini-3.5-flash-lite",
      "gemini-2.0-flash-thinking-exp-01-21": "gemini-3.7-flash",
      "gemini-2.0-flash-thinking-exp": "gemini-3.7-flash",
      "gemini-2.0-pro-exp-02-05": "gemini-3.7-flash",
      "gemini-2.0-pro-exp": "gemini-3.7-flash",
      "gemini-1.5-pro": "gemini-3.7-flash",
      "gemini-1.5-flash": "gemini-3.6-flash",
      "gemini-1.5-flash-latest": "gemini-3.6-flash",
      "gemini-1.5-pro-latest": "gemini-3.7-flash",
      "gemini-pro-latest": "gemini-3.7-flash"
    };
    if (MODEL_ALIASES[rawModel]) {
      this.model = MODEL_ALIASES[rawModel];
    } else if (typeof rawModel === "string" && rawModel.startsWith("gemini-")) {
      this.model = rawModel;
    } else {
      this.model = GeminiProvider.MODEL;
    }
    log.debug("GeminiProvider model set to:", this.model);
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

    const requestBody = JSON.stringify(payload);
    const urlStr = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    return new Promise((resolve, reject) => {
      let isSettled = false;
      const timeoutMs = this.timeoutMs || 25000;
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          req.destroy();
          const err = new Error("Gemini request timed out");
          err.code = "timeout";
          reject(err);
        }
      }, timeoutMs);

      if (opts.signal) {
        opts.signal.addEventListener("abort", () => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            req.destroy();
            const err = new Error("Gemini request aborted");
            err.code = "timeout";
            reject(err);
          }
        });
      }

      log.debug("Calling Google Gemini API, model:", this.model);

      const req = https.request(urlStr, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
          "Connection": "close"
        }
      }, (res) => {
        let data = "";
        res.on("data", chunk => { data += chunk; });
        res.on("end", () => {
          if (isSettled) return;
          isSettled = true;
          clearTimeout(timer);

          if (res.statusCode !== 200) {
            let errJson;
            try { errJson = JSON.parse(data); } catch (_) {}
            const msg = errJson?.error?.message || `Gemini API error: ${res.statusCode}`;
            const err = new Error(msg);
            err.code = res.statusCode === 429 ? "RATE_LIMIT" : (res.statusCode === 503 ? "SERVICE_UNAVAILABLE" : "API_ERROR");
            err.status = res.statusCode;
            return reject(err);
          }

          try {
            const parsed = JSON.parse(data);
            const responseText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (!responseText) {
              const err = new Error("Empty response from Gemini");
              err.code = "EMPTY_OUTPUT";
              return reject(err);
            }
            log.debug("Response received, length:", responseText.length);
            resolve(responseText);
          } catch (parseErr) {
            reject(parseErr);
          }
        });
      });

      req.on("error", (err) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          reject(err);
        }
      });

      req.write(requestBody);
      req.end();
    });
  }
}