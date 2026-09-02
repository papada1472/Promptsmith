/**
 * Refinzi Centralized Logger & Privacy-Hardened Diagnostic Stream
 *
 * Provides:
 * - Namespaced logging tag [Refinzi][ModuleName]
 * - Granular log levels: debug < info < warn < error
 * - Automated regex-based credential & secret redaction
 * - Environment level filtering (REFINZI_LOG_LEVEL)
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const SECRET_PATTERNS = [
  // OpenAI & general keys
  /\bsk-[a-zA-Z0-9_-]{12,}\b/g,
  // Anthropic keys
  /\bsk-ant-[a-zA-Z0-9_-]{12,}\b/g,
  // Google Gemini API keys
  /\bAIza[0-9A-Za-z-_]{32,}\b/g,
  // Groq API keys
  /\bgsk_[a-zA-Z0-9_-]{12,}\b/g,
  // xAI API keys
  /\bxai-[a-zA-Z0-9_-]{12,}\b/g,
  // GitHub PATs
  /\bghp_[a-zA-Z0-9]{20,}\b/g,
  // Bearer tokens
  /\bBearer\s+[a-zA-Z0-9_\-.]{8,}\b/gi,
  // Key-value headers or query params
  /(["']?(?:x-api-key|api-key|apiKey)["']?\s*[:=]\s*["']?)([^"',\s]{6,})(["']?)/gi
];

/**
 * Recursively cleanses strings, objects, and errors of API keys or sensitive authorization tokens.
 * @param {any} item
 * @param {WeakSet<object>} [seen]
 * @returns {any}
 */
export function redactSecrets(item, seen = new WeakSet()) {
  if (item === null || item === undefined) return item;

  if (typeof item === "string") {
    let sanitized = item;
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.source.includes("x-api-key|api-key|apiKey")) {
        sanitized = sanitized.replace(pattern, "$1••••••••••••[REDACTED]$3");
      } else if (pattern.source.includes("Bearer")) {
        sanitized = sanitized.replace(pattern, "Bearer ••••••••[REDACTED]");
      } else {
        sanitized = sanitized.replace(pattern, "[REDACTED_SECRET]");
      }
    }
    return sanitized;
  }

  if (typeof item === "number" || typeof item === "boolean" || typeof item === "symbol") {
    return item;
  }

  if (item instanceof Error) {
    const cleanErr = new Error(redactSecrets(item.message, seen));
    cleanErr.name = item.name;
    if (item.code) cleanErr.code = item.code;
    if (item.status) cleanErr.status = item.status;
    if (item.statusCode) cleanErr.statusCode = item.statusCode;
    if (item.stack) cleanErr.stack = redactSecrets(item.stack, seen);
    return cleanErr;
  }

  if (typeof item === "object") {
    if (seen.has(item)) return "[Circular]";
    seen.add(item);

    if (Array.isArray(item)) {
      return item.map(sub => redactSecrets(sub, seen));
    }

    const cleanObj = {};
    for (const [key, val] of Object.entries(item)) {
      if (/^(apiKey|key|password|secret|authorization|token|auth)$/i.test(key) && typeof val === "string") {
        cleanObj[key] = val ? "••••••••••••[REDACTED]" : "";
      } else {
        cleanObj[key] = redactSecrets(val, seen);
      }
    }
    return cleanObj;
  }

  return item;
}

function getMinLevel() {
  const isProd = (typeof process !== "undefined") && (
    process.env?.NODE_ENV === "production" ||
    process.env?.REFINZI_LOG_LEVEL === "warn" ||
    process.env?.REFINZI_LOG_LEVEL === "error" ||
    (!process.defaultApp && process.versions?.electron)
  );
  const defaultLevel = isProd ? "warn" : "debug";
  const envLevel = (
    (typeof process !== "undefined" && process.env?.REFINZI_LOG_LEVEL) || defaultLevel
  ).toLowerCase();
  return LEVELS[envLevel] !== undefined ? LEVELS[envLevel] : LEVELS.debug;
}

/**
 * Creates a namespaced logger instance with automatic secret redaction.
 *
 * @param {string} namespace - Short label for the module, e.g. "RefineController"
 * @returns {{ debug: Function, info: Function, warn: Function, error: Function, tag: string }}
 */
export function createLogger(namespace) {
  const tag = `[Refinzi][${namespace}]`;
  const minLevel = getMinLevel();

  return {
    tag,

    /**
     * Debug-level message — suppressed in production by default.
     * @param {...any} args
     */
    debug(...args) {
      if (LEVELS.debug >= minLevel) {
        const cleaned = args.map(a => redactSecrets(a));
        console.log(tag, ...cleaned);
      }
    },

    /**
     * Info-level message — standard operational messages.
     * @param {...any} args
     */
    info(...args) {
      if (LEVELS.info >= minLevel) {
        const cleaned = args.map(a => redactSecrets(a));
        console.log(tag, ...cleaned);
      }
    },

    /**
     * Warn-level message — recoverable issues or degraded behaviour.
     * @param {...any} args
     */
    warn(...args) {
      if (LEVELS.warn >= minLevel) {
        const cleaned = args.map(a => redactSecrets(a));
        console.warn(tag, ...cleaned);
      }
    },

    /**
     * Error-level message — failures that require attention.
     * @param {...any} args
     */
    error(...args) {
      if (LEVELS.error >= minLevel) {
        const cleaned = args.map(a => redactSecrets(a));
        console.error(tag, ...cleaned);
      }
    }
  };
}

/**
 * Pre-built loggers for core modules, ready to import without constructing a new instance.
 */
export const loggers = {
  refineController: createLogger("RefineController"),
  artifactAnalyzer: createLogger("ArtifactAnalyzer"),
  clipboardFlow: createLogger("ClipboardFlow"),
  metricsService: createLogger("MetricsService"),
  orbWindow: createLogger("OrbWindow"),
  providerManager: createLogger("ProviderManager"),
  startup: createLogger("Startup"),
};
