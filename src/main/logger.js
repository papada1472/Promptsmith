/**
 * Refinzi Centralized Logger
 *
 * Thin wrapper over console that:
 * - Prefixes every message with a namespaced tag
 * - Supports log levels: debug, info, warn, error
 * - Respects a NODE_ENV / REFINZI_LOG_LEVEL environment variable
 *   so verbose debug lines can be silenced in production builds
 *
 * Usage:
 *   import { createLogger } from "./logger.js";
 *   const log = createLogger("RefineController");
 *   log.info("Refinement started");
 *   log.error("Something broke", err);
 *
 * Log levels (lowest → highest priority):
 *   debug < info < warn < error
 *
 * Set REFINZI_LOG_LEVEL=warn to suppress debug/info in production.
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

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
 * Creates a namespaced logger instance.
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
        console.log(tag, ...args);
      }
    },

    /**
     * Info-level message — standard operational messages.
     * @param {...any} args
     */
    info(...args) {
      if (LEVELS.info >= minLevel) {
        console.log(tag, ...args);
      }
    },

    /**
     * Warn-level message — recoverable issues or degraded behaviour.
     * @param {...any} args
     */
    warn(...args) {
      if (LEVELS.warn >= minLevel) {
        console.warn(tag, ...args);
      }
    },

    /**
     * Error-level message — failures that require attention.
     * @param {...any} args
     */
    error(...args) {
      if (LEVELS.error >= minLevel) {
        console.error(tag, ...args);
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
