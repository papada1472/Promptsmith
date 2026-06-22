import { GoogleGenAI } from "@google/genai";
import { AIProvider } from "./AIProvider.js";

export class GeminiProvider extends AIProvider {
  static MODEL = "gemini-2.5-flash";

  constructor(opts) {
    super(opts);
    this.model = opts?.model || GeminiProvider.MODEL;
    console.log("[Refinzi][GeminiProvider] Initializing with API key (length:", this.apiKey?.length, ")");
    console.log("[Refinzi][GeminiProvider] Creating GoogleGenAI client...");
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
    console.log("[Refinzi][GeminiProvider] Client created, model set to:", this.model);
  }

  static getModelName() {
    return GeminiProvider.MODEL;
  }

  async refine(text, opts = {}) {
    console.log("[Refinzi][GeminiProvider] refine() called, text length:", text?.length || 0);

    if (!this.apiKey) {
      const err = new Error("Missing Gemini API key");
      err.code = "MISSING_API_KEY";
      console.error("[Refinzi][GeminiProvider] ERROR - MISSING_API_KEY:", err.message);
      throw err;
    }
    if (!text || !text.trim()) {
      const err = new Error("No text to refine");
      err.code = "EMPTY_INPUT";
      console.error("[Refinzi][GeminiProvider] ERROR - EMPTY_INPUT:", err.message);
      throw err;
    }

    console.log("[Refinzi][GeminiProvider] Model:", this.model);

    try {
      console.log("[Refinzi][GeminiProvider] Calling client.models.generateContent...");
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: text,
        config: {
          systemInstruction: this.systemPrompt
        }
      });
      const responseText = response?.text || "";
      console.log("[Refinzi][GeminiProvider] Response received, length:", responseText.length);
      if (!responseText) {
        const err = new Error("Empty response from Gemini");
        err.code = "EMPTY_OUTPUT";
        console.error("[Refinzi][GeminiProvider] ERROR - EMPTY_OUTPUT:", err.message);
        throw err;
      }
      console.log("[Refinzi][GeminiProvider] Returning refined text successfully");
      return responseText;
    } catch (e) {
      const fullError = JSON.stringify({
        message: e?.message || String(e),
        code: e?.code,
        stack: e?.stack
      });
      console.error("[Refinzi][GeminiProvider] FULL ERROR RESPONSE:", fullError);
      throw e;
    }
  }
}