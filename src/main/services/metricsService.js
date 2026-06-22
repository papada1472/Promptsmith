import { store } from "../store.js";

export class MetricsService {
  /**
   * Aggregates reward statistics for the UI.
   * @returns {Object}
   */
  getStats() {
    const metrics = store.get("metrics");
    const quota = store.get("dailyQuota");
    const today = new Date().toISOString().slice(0, 10);
    const quotaExceeded = quota.todayDate === today && (quota.usedToday || 0) >= (quota.maxPerDay || 50);
    
    return {
      refinementsMade: metrics.refinementsMade || 0,
      timeSavedSeconds: metrics.timeSavedSeconds || 0,
      retriesAvoided: metrics.retriesAvoided || 0,
      currentStreak: metrics.currentStreak || 0,
      shareCardDismissed: store.get("shareCardDismissed"),
      quotaExceeded
    };
  }

  /**
   * Tracks and updates the daily quota.
   * @returns {Object}
   */
  checkAndTrackQuota() {
    const quota = store.get("dailyQuota");
    const today = new Date().toISOString().slice(0, 10);
    if (quota.todayDate !== today) {
      store.set("dailyQuota", { maxPerDay: 50, usedToday: 1, todayDate: today });
      return { exceeded: false, used: 1, max: 50 };
    }
    const used = (quota.usedToday || 0) + 1;
    const exceeded = used >= (quota.maxPerDay || 50);
    store.set("dailyQuota", { ...quota, usedToday: used });
    return { exceeded, used, max: quota.maxPerDay || 50 };
  }

  /**
   * Records a successful refinement and updates streaks.
   */
  recordSuccess() {
    const metrics = store.get("metrics");
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

    store.set("metrics", {
      ...metrics,
      refinementsMade: (metrics.refinementsMade || 0) + 1,
      timeSavedSeconds: (metrics.timeSavedSeconds || 0) + 40,
      retriesAvoided: (metrics.retriesAvoided || 0) + 1.7,
      currentStreak: nextStreak,
      lastRefinementDay: nowDay
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
    const existing = store.get("historyLogs") || [];
    const next = [...existing, { input, output, timestamp }];
    const capped = next.length > 500 ? next.slice(next.length - 500) : next;
    store.set("historyLogs", capped);
  }

  /**
   * Retrieves history logs with pagination.
   * Returns { logs: [], hasMore: boolean }
   */
  getLogs({ offset = 0, limit = 50 } = {}) {
    const all = store.get("historyLogs") || [];
    // Return newest-first: slice from end
    const reversed = [...all].reverse();
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
    const logs = store.get("telemetryLogs") || [];
    logs.push(event);
    const capped = logs.length > 500 ? logs.slice(logs.length - 500) : logs;
    store.set("telemetryLogs", capped);
  }

  /**
   * Retrieves all telemetry logs.
   */
  getTelemetryLogs() {
    return store.get("telemetryLogs") || [];
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
    console.log(`[MetricsService] Telemetry Event: ${eventName}`, JSON.stringify(payload));
  }

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
