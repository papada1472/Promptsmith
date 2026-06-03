import Store from "electron-store";
import { app } from "electron";
import crypto from "crypto";
import { DEFAULT_HOTKEY } from "./constants.js";

function getEncryptionKey() {
  try {
    return crypto.createHash("sha256").update(app.getPath("userData")).digest("hex");
  } catch {
    return undefined;
  }
}

const schema = {
  geminiApiKey: { type: "string", default: "" },
  hotkey: { type: "string", default: DEFAULT_HOTKEY },
  launchOnStartup: { type: "boolean", default: true },
  metrics: {
    type: "object",
    default: {
      refinementsMade: 0,
      timeSavedSeconds: 0,
      retriesAvoided: 0,
      currentStreak: 0,
      lastRefinementDay: null
    }
  },
  refinementLogs: {
    type: "array",
    default: []
  }
};

export const store = new Store({
  name: "refinezy",
  schema,
  encryptionKey: getEncryptionKey()
});

console.log("[Refinezy][Main] electron-store initialized at", store.path);

export function getSettingsSnapshot() {
  return {
    geminiApiKey: store.get("geminiApiKey"),
    hotkey: store.get("hotkey"),
    launchOnStartup: store.get("launchOnStartup")
  };
}

export function appendRefinementLog({ input, output, timestamp }) {
  const existing = store.get("refinementLogs") || [];
  const next = [...existing, { input, output, timestamp }];
  const capped = next.length > 500 ? next.slice(next.length - 500) : next;
  store.set("refinementLogs", capped);
}

function isoDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetweenIso(a, b) {
  const ad = new Date(`${a}T00:00:00`);
  const bd = new Date(`${b}T00:00:00`);
  return Math.round((bd - ad) / (24 * 60 * 60 * 1000));
}

export function recordSuccessfulRefinement() {
  const metrics = store.get("metrics");
  const nowDay = isoDay(new Date());

  const lastDay = metrics.lastRefinementDay;
  let nextStreak = metrics.currentStreak || 0;
  if (!lastDay) {
    nextStreak = 1;
  } else if (lastDay === nowDay) {
    // streak unchanged
  } else {
    const delta = daysBetweenIso(lastDay, nowDay);
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

export function getRewardStats() {
  const metrics = store.get("metrics");
  return {
    refinementsMade: metrics.refinementsMade || 0,
    timeSavedSeconds: metrics.timeSavedSeconds || 0,
    retriesAvoided: metrics.retriesAvoided || 0,
    currentStreak: metrics.currentStreak || 0
  };
}

