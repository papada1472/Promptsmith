/**
 * validators.js
 * Shared validation helpers used across the pre-release test suite.
 */

// ─── Output Structural Validators ────────────────────────────────────────────

/**
 * Asserts the output differs from the input (not a no-op).
 */
export function assertOutputDiffersFromInput(input, output) {
  if (!output || typeof output !== "string") return false;
  return output.trim() !== input.trim();
}

/**
 * Asserts the output is not empty.
 */
export function assertOutputNotEmpty(output) {
  return typeof output === "string" && output.trim().length > 0;
}

/**
 * Asserts the output length is within sensible bounds relative to input.
 * @param {string} output
 * @param {string} input
 * @param {number} maxMultiplier - output should not exceed input * multiplier
 */
export function assertOutputLengthBounds(output, input, maxMultiplier = 4) {
  if (!output || !input) return false;
  return output.length <= input.length * maxMultiplier;
}

// ─── Recreation Validators ────────────────────────────────────────────────────

const FORBIDDEN_PHRASES = [
  "analyze this",
  "study this",
  "review this",
  "based on the image",
  "based on the screenshot",
  "based on the attached",
  "extract",
];

const REQUIRED_SECTIONS = [
  "objective",
  "hero strategy",
  "section breakdown",
  "offer structure",
  "trust elements",
  "visual hierarchy",
  "cta framework",
  "build prompt",
  "structure",
  "components",
  "visual system",
  "content strategy",
  "recreation instructions",
];

const REEL_REQUIRED_SECTIONS = [
  "hook",
  "audience",
  "story structure",
  "scene breakdown",
  "editing cadence",
  "text overlays",
  "music direction",
  "cta",
  "recreation prompt",
  "objective",
  "structure",
  "components",
  "visual system",
  "content strategy",
  "recreation instructions",
];

/**
 * Validates a recreation output for forbidden and required phrases.
 * @param {string} output
 * @returns {{ valid: boolean, forbidden: string[], missing: string[] }}
 */
export function validateRecreationOutput(output) {
  if (!output || typeof output !== "string") {
    return { valid: false, forbidden: [], missing: REQUIRED_SECTIONS.slice() };
  }
  const lower = output.toLowerCase();
  const isReel = lower.includes("hook") || lower.includes("recreation prompt");
  const required = isReel ? REEL_REQUIRED_SECTIONS : REQUIRED_SECTIONS;
  const foundForbidden = FORBIDDEN_PHRASES.filter((p) => lower.includes(p));
  const missingSections = required.filter((s) => !lower.includes(s));
  return {
    valid: foundForbidden.length === 0 && missingSections.length === 0,
    forbidden: foundForbidden,
    missing: missingSections,
  };
}

// ─── Telemetry Validators ─────────────────────────────────────────────────────

const ALLOWED_TELEMETRY_FIELDS = [
  "type",
  "mode",
  "success",
  "duration_ms",
  "timestamp",
  "provider",
  "artifact_type",
  "app_version",
];

/**
 * Validates that a telemetry payload contains no disallowed fields.
 * @param {Object} payload
 * @returns {{ valid: boolean, disallowed: string[] }}
 */
export function validateTelemetryPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { valid: false, disallowed: [] };
  }
  const disallowed = Object.keys(payload).filter(
    (k) => !ALLOWED_TELEMETRY_FIELDS.includes(k)
  );
  return { valid: disallowed.length === 0, disallowed };
}

// ─── Schema Validators ────────────────────────────────────────────────────────

/**
 * Checks that an object has all required keys.
 * @param {Object} obj
 * @param {string[]} keys
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function assertRequiredKeys(obj, keys) {
  const missing = keys.filter((k) => !(k in (obj || {})));
  return { valid: missing.length === 0, missing };
}

// ─── Provider Contract Validators ────────────────────────────────────────────

/**
 * Creates a mock provider with a configurable refine behaviour.
 * @param {'success'|'timeout'|'empty'|'malformed'|'rate_limited'} mode
 * @returns {{ refine: Function }}
 */
export function createMockProvider(mode) {
  switch (mode) {
    case "success":
      return { refine: async () => "Improved prompt text that is clearly better." };
    case "timeout":
      return {
        refine: async () => {
          throw Object.assign(new Error("Request timed out"), { code: "TIMEOUT" });
        },
      };
    case "empty":
      return { refine: async () => "" };
    case "malformed":
      return { refine: async () => null };
    case "rate_limited":
      return {
        refine: async () => {
          throw Object.assign(new Error("Rate limited"), { code: "RATE_LIMITED", status: 429 });
        },
      };
    default:
      return { refine: async () => "default output" };
  }
}
