import { createLogger } from "../logger.js";

const log = createLogger("IntentCapture");

/**
 * Intent Capture – records raw user intent and routing metadata.
 *
 * This is a thin, side‑effect‑only utility that logs the captured event
 * and returns it for downstream processing. It does not affect any UI
 * or prompt generation logic.
 */

/**
 * Capture intent metadata for a given user interaction.
 *
 * @param {Object} params
 * @param {string} params.surface        – the raw user input (e.g., text, URL, etc.)
 * @param {string} params.mode           – "build" or "understand" (pipeline mode)
 * @param {string} [params.artifactType="text"] – type of the artifact (text, url, pdf, …)
 * @param {string} [params.destinationAI="unknown"] – target AI model/provider
 * @returns {Object} The captured event object, including a timestamp.
 */
export function captureIntent({
  surface,
  mode,
  artifactType = "text",
  destinationAI = "unknown",
}) {
  const event = {
    surface,
    mode,
    artifactType,
    destinationAI,
    timestamp: Date.now(),
  };

  // Log the capture for observability/debugging.
  log.debug(event);

  return event;
}
