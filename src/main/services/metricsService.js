import { store } from "../store.js";
import { loggers } from "../logger.js";

const log = loggers.metricsService;

/**
 * MetricsService — tracks refinement stats, history logs, telemetry, and
 * per-provider reliability metrics (success/failure rates, latency).
 */
class MetricsService {
  // ── Provider Reliability Metrics ────────────────────────────────────────
  /**
   * Records a provider call outcome.
   *
   * @param {string} providerName - e.g. "Gemini", "OpenRouter", "Gateway"
   * @param {boolean} success - true if the call succeeded
   * @param {number} durationMs - elapsed time for the call
   * @param {string} [errorCode] - optional error identifier if failed
   */
  recordProviderCall(providerName, success, durationMs, errorCode) {
    if (!providerName) return;
    const all = store.get("providerMetrics") || {};
    const entry = all[providerName] || {
      successCount: 0,
      failureCount: 0,
      totalDurationMs: 0,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastErrorCode: null
    };

    if (success) {
      entry.successCount += 1;
      entry.lastSuccessAt = new Date().toISOString();
    } else {
      entry.failureCount += 1;
      entry.lastFailureAt = new Date().toISOString();
      entry.lastErrorCode = errorCode || null;
    }

    entry.totalDurationMs += durationMs;

    all[providerName] = entry;
    store.set("providerMetrics", all);
  }

  /**
   * Returns reliability metrics for all providers, or a specific one.
   *
   * Each entry contains:
   *   - successCount {number}
   *   - failureCount {number}
   *   - totalDurationMs {number}
   *   - avgDurationMs {number|null}  — derived, not stored
   *   - successRate {number|null}    — 0.0–1.0, derived
   *   - lastSuccessAt {string|null}
   *   - lastFailureAt {string|null}
   *   - lastErrorCode {string|null}
   *
   * @param {string} [providerName] - if provided, returns only that provider's entry
   * @returns {Object}
   */
  getProviderMetrics(providerName) {
    const all = store.get("providerMetrics") || {};

    // Enrich each entry with derived fields
    const enrich = (entry) => {
      const total = (entry.successCount || 0) + (entry.failureCount || 0);
      return {
        ...entry,
        avgDurationMs: total > 0 ? Math.round(entry.totalDurationMs / total) : null,
        successRate: total > 0 ? entry.successCount / total : null
      };
    };

    if (providerName) {
      const raw = all[providerName];
      return raw ? enrich(raw) : null;
    }

    const result = {};
    for (const [name, raw] of Object.entries(all)) {
      result[name] = enrich(raw);
    }
    return result;
  }

  /**
   * Clears all stored provider metrics.
   */
  clearProviderMetrics() {
    store.set("providerMetrics", {});
  }

  // ── Core Refinement Metrics ──────────────────────────────────────────────
  /**
   * Aggregates reward statistics for the UI.
   * @returns {Object}
   */
  getStats() {
    let metrics = store.get("metrics");
    if (typeof metrics !== "object" || metrics === null) {
      metrics = {};
      store.set("metrics", {});
      store.set("metrics.settingsRecovered", true);
    }
    const nowDay = this.#isoDay(new Date());
    const quotaExceeded = metrics.quotaDay === nowDay && (metrics.dailyCount || 0) >= 50;

    return {
      refinementsMade: metrics.refinementsMade || 0,
      timeSavedSeconds: metrics.timeSavedSeconds || 0,
      retriesAvoided: metrics.retriesAvoided || 0,
      currentStreak: metrics.currentStreak || 0,
      shareCardDismissed: store.get("shareCardDismissed"),
      quotaExceeded,
      artifactCount: store.get("artifactCount") || 0,
      reelsReverseEngineered: metrics.reelsReverseEngineered || 0,
      landingPagesReverseEngineered: metrics.landingPagesReverseEngineered || 0,
      promptsImproved: metrics.promptsImproved || 0,
      blueprintsGenerated: metrics.blueprintsGenerated || 0
    };
  }

  /**
   * Checks whether the user has hit the daily quota (50 refinements/day).
   * Resets the daily counter if the current ISO date differs from the stored one.
   * @returns {{ exceeded: boolean, count: number, limit: number }}
   */
  checkAndTrackQuota() {
    const DAILY_LIMIT = 50;
    const nowDay = this.#isoDay(new Date());
    const metrics = store.get("metrics") || {};
    const storedDay = metrics.quotaDay || null;
    let count = metrics.dailyCount || 0;

    if (storedDay !== nowDay) {
      // New day — reset counter
      count = 0;
      store.set("metrics", { ...metrics, quotaDay: nowDay, dailyCount: 0 });
    }

    if (count >= DAILY_LIMIT) {
      return { exceeded: true, count, limit: DAILY_LIMIT };
    }

    // Increment
    store.set("metrics", { ...metrics, quotaDay: nowDay, dailyCount: count + 1 });
    return { exceeded: false, count: count + 1, limit: DAILY_LIMIT };
  }

  /**
   * Records a successful refinement and updates streaks.
   */
  recordSuccess(type) {
    const metrics = store.get("metrics") || {};
    const nowDay = this.#isoDay(new Date());

    const lastDay = metrics.lastRefinementDay;
    let nextStreak = metrics.currentStreak || 0;
    if (!lastDay) {
      nextStreak = 1;
    } else if (lastDay === nowDay) {
      // streak unchanged
    } else {
      const delta = this.#daysBetweenIso(lastDay, nowDay);
      nextStreak = delta === 1 ? nextStreak + 1 : 1;
    }

    let reelsCount = metrics.reelsReverseEngineered || 0;
    let lpCount = metrics.landingPagesReverseEngineered || 0;
    let promptsCount = metrics.promptsImproved || 0;
    let bgCount = metrics.blueprintsGenerated || 0;

    if (type === "reel") {
      reelsCount += 1;
      bgCount += 1;
    } else if (type === "landing-page") {
      lpCount += 1;
      bgCount += 1;
    } else if (type === "website-concept") {
      // V4 Creative Director output — counts as a blueprint
      bgCount += 1;
    } else if (type === "prompt-improve") {
      promptsCount += 1;
    }

    store.set("metrics", {
      ...metrics,
      refinementsMade: (metrics.refinementsMade || 0) + 1,
      timeSavedSeconds: (metrics.timeSavedSeconds || 0) + 40,
      retriesAvoided: (metrics.retriesAvoided || 0) + 1.7,
      currentStreak: nextStreak,
      lastRefinementDay: nowDay,
      reelsReverseEngineered: reelsCount,
      landingPagesReverseEngineered: lpCount,
      promptsImproved: promptsCount,
      blueprintsGenerated: bgCount
    });
  }

  /**
   * Appends a refinement log entry to historyLogs, capped at 500.
   * Respects the saveHistoryLocally privacy toggle.
   */
  appendLog({ input, output, timestamp }) {
    if (!store.get("saveHistoryLocally")) {
      return; // Privacy: user has not opted in to local history
    }
    let existing = store.get("historyLogs");
    if (!Array.isArray(existing)) {
      existing = [];
      store.set("historyLogs", []);
      store.set("metrics.settingsRecovered", true);
    }
    const next = [...existing, { input, output, timestamp }];
    const capped = next.length > 500 ? next.slice(next.length - 500) : next;
    store.set("historyLogs", capped);
  }

  /**
   * Retrieves history logs with pagination.
   * Returns { logs: [], hasMore: boolean }
   */
  getLogs({ offset = 0, limit = 50 } = {}) {
    let all = store.get("historyLogs");
    if (!Array.isArray(all)) {
      all = [];
      store.set("historyLogs", []);
      store.set("metrics.settingsRecovered", true);
    }
    // Map with original indices before reversing to ensure correct deletion index
    const mapped = all.map((log, index) => ({ ...log, originalIndex: index }));
    const reversed = [...mapped].reverse();
    const page = reversed.slice(offset, offset + limit);
    return { logs: page, hasMore: offset + limit < reversed.length };
  }

  /**
   * Deletes a single history log entry by its index in the stored array.
   */
  deleteLog(index) {
    const existing = store.get("historyLogs") || [];
    if (index < 0 || index >= existing.length) return;
    existing.splice(index, 1);
    store.set("historyLogs", existing);
  }

  /**
   * Clears all history logs.
   */
  clearLogs() {
    store.set("historyLogs", []);
  }

  /**
   * Appends a telemetry event to telemetryLogs, capped at 500.
   */
  appendTelemetry(event) {
    let logs = store.get("telemetryLogs");
    if (!Array.isArray(logs)) {
      logs = [];
      store.set("telemetryLogs", []);
      store.set("metrics.settingsRecovered", true);
    }
    logs.push(event);
    const capped = logs.length > 500 ? logs.slice(logs.length - 500) : logs;
    store.set("telemetryLogs", capped);
  }

  /**
   * Retrieves all telemetry logs.
   */
  getTelemetryLogs() {
    let logs = store.get("telemetryLogs");
    if (!Array.isArray(logs)) {
      logs = [];
      store.set("telemetryLogs", []);
      store.set("metrics.settingsRecovered", true);
    }
    return logs;
  }

  /**
   * Clears all telemetry logs.
   */
  clearTelemetryLogs() {
    store.set("telemetryLogs", []);
  }

  /**
   * Logs a telemetry event.
   * @param {string} eventName
   * @param {Object} payload
   */
  logEvent(eventName, payload) {
    log.info(`Telemetry Event: ${eventName}`, JSON.stringify(payload));
  }

  /**
   * Sanitizes telemetry payload by allowing only approved fields.
   * @param {Object} payload - raw telemetry payload
   * @returns {Object} filtered payload containing only allowed fields
   */
  sanitizeTelemetry(payload) {
    const ALLOWED_FIELDS = [
      "type",
      "mode",
      "success",
      "duration_ms",
      "timestamp",
      "provider",
      "artifact_type",
      "app_version"
    ];
    return Object.fromEntries(
      Object.entries(payload).filter(([k]) => ALLOWED_FIELDS.includes(k))
    );
  }
  // ── Private helpers ──────────────────────────────────────────────────────
  #isoDay(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  #daysBetweenIso(a, b) {
    const ad = new Date(`${a}T00:00:00`);
    const bd = new Date(`${b}T00:00:00`);
    return Math.round((bd - ad) / (24 * 60 * 60 * 1000));
  }
}

export const metricsService = new MetricsService();
