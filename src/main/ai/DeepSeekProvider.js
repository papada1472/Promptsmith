import { AIProvider } from "./AIProvider.js";
import { createLogger } from "../logger.js";

const log = createLogger("DeepSeekProvider");

/**
 * DeepSeek implementation of the AIProvider.
 * Adheres strictly to the official DeepSeek API (https://api-docs.deepseek.com/).
 *
 * Supported Models:
 *   deepseek-v4-flash           — DeepSeek-V4 Flash (284B/13B active, 1M context, ultra-fast inference)
 *   deepseek-v4-pro             — DeepSeek-V4 Pro (1.6T/49B active, 1M context, frontier reasoning & agentic code)
 *   deepseek-v4-flash-vision-exp — DeepSeek-V4 Vision (Multimodal image analysis & OCR understanding)
 *   deepseek-chat               — DeepSeek-V3, 64K context window, fast general-purpose chat & code
 *   deepseek-reasoner           — DeepSeek-R1, 64K context window, extended chain-of-thought reasoning
 *
 * NOTE on Multimodal Vision:
 * - When media (image) is provided, `deepseek-v4-flash-vision-exp` formats the payload using OpenAI-compatible image_url format.
 * - Text-only models throw MEDIA_UNSUPPORTED allowing ProviderManager to failover to vision-capable providers.
 */
export class DeepSeekProvider extends AIProvider {
  static DEFAULT_MODEL = "deepseek-chat";
  static BASE_URL =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/chat/completions";

  constructor(opts) {
    super(opts);
    const rawModel = opts?.model || DeepSeekProvider.DEFAULT_MODEL;
    // Normalize model IDs and aliases
    const MODEL_ALIASES = {
      "deepseek/deepseek-chat": "deepseek-chat",
      "deepseek/deepseek-r1:free": "deepseek-reasoner",
      "deepseek/deepseek-r1": "deepseek-reasoner",
      "deepseek/deepseek-r1-distill-llama-70b": "deepseek-reasoner",
      "deepseek-v3": "deepseek-chat",
      "deepseek-r1": "deepseek-reasoner",
      "deepseek-v4": "deepseek-v4-flash",
      "deepseek-v4-flash": "deepseek-v4-flash",
      "deepseek-v4-pro": "deepseek-v4-pro",
      "deepseek-v4-vision": "deepseek-v4-flash-vision-exp",
      "deepseek-v4-flash-vision-exp": "deepseek-v4-flash-vision-exp"
    };
    this.model = MODEL_ALIASES[rawModel] || (typeof rawModel === "string" && rawModel.startsWith("deepseek-") ? rawModel : DeepSeekProvider.DEFAULT_MODEL);
    this.apiKey = (this.apiKey || "").trim();
    log.debug("Initializing with model:", this.model);
  }

  static getModelName() {
    return DeepSeekProvider.DEFAULT_MODEL;
  }

  async refine(text, opts = {}) {
    log.debug("refine() called, text length:", text?.length || 0);

    if (!this.apiKey) {
      const err = new Error("Missing DeepSeek API key");
      err.code = "MISSING_API_KEY";
      throw err;
    }

    if (!text || !text.trim()) {
      const err = new Error("No text to refine");
      err.code = "EMPTY_INPUT";
      throw err;
    }

    const isVisionModel = this.model.includes("vision") || this.model === "deepseek-v4-flash-vision-exp";
    if (opts.media && !isVisionModel) {
      const err = new Error("This DeepSeek model does not support image input. Falling back to a vision-capable provider.");
      err.code = "MEDIA_UNSUPPORTED";
      throw err;
    }

    const controller = new AbortController();
    let timeoutId;

    if (this.timeoutMs) {
      timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeoutMs);
    }

    const onAbort = () => controller.abort();
    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      else opts.signal.addEventListener("abort", onAbort, { once: true });
    }

    try {
      const isReasoner = this.model === "deepseek-reasoner";
      
      let userContent;
      if (opts.media && isVisionModel) {
        userContent = [
          { type: "text", text },
          {
            type: "image_url",
            image_url: {
              url: `data:${opts.media.mimeType || "image/png"};base64,${opts.media.data}`
            }
          }
        ];
      } else {
        userContent = text;
      }

      const requestBody = {
        model: this.model,
        messages: [
          ...(this.systemPrompt ? [{ role: "system", content: this.systemPrompt }] : []),
          { role: "user", content: userContent }
        ],
        // DeepSeek API docs: deepseek-reasoner rejects temperature parameter with 400 error
        ...(!isReasoner && { temperature: 0.7 })
      };

      if (opts.responseMimeType === "application/json") {
        requestBody.response_format = { type: "json_object" };
      }

      log.debug("Sending POST request to DeepSeek API, model:", this.model);
      const response = await fetch(DeepSeekProvider.BASE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      log.debug("DeepSeek response received, status:", response.status);

      if (!response.ok) {
        const errorBodyText = await response.text().catch(() => "Unreadable error body");
        log.error("DeepSeek returned error response:", {
          status: response.status,
          model: this.model,
          body: errorBodyText
        });

        let errorMsg = `DeepSeek API error: ${response.status}`;
        try {
          const jsonError = JSON.parse(errorBodyText);
          if (jsonError?.error?.message) errorMsg = jsonError.error.message;
        } catch (e) {}

        const err = new Error(errorMsg);
        if (response.status === 429) {
          err.code = "RATE_LIMIT";
        } else if (response.status === 402) {
          err.code = "INSUFFICIENT_BALANCE";
        } else if (response.status === 401) {
          err.code = "INVALID_API_KEY";
        } else if (response.status === 503) {
          err.code = "SERVICE_UNAVAILABLE";
        } else {
          err.code = "API_ERROR";
        }
        err.status = response.status;
        throw err;
      }

      const rawText = await response.text();
      log.debug("DeepSeek full response body length:", rawText.length);

      const data = JSON.parse(rawText);
      const message = data?.choices?.[0]?.message;
      // Extract final answer, falling back to reasoning_content if content is omitted
      const responseText = message?.content || message?.reasoning_content || "";

      log.debug("DeepSeek response text length:", responseText.length);

      if (!responseText) {
        const err = new Error("Empty response from DeepSeek");
        err.code = "EMPTY_OUTPUT";
        throw err;
      }

      return responseText;
    } catch (e) {
      if (e.name === "AbortError") {
        log.error("DeepSeek request timed out");
        const err = new Error("DeepSeek request timed out");
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
