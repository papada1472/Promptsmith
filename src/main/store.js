import { DEFAULT_HOTKEY } from "./constants.js";

// Detect test environment early — MUST be evaluated before any electron-store import
const __isVitest = typeof process !== "undefined" &&
  !process.versions?.electron &&
  (process.env.VITEST || process.env.NODE_ENV === "test");

let store;

if (__isVitest) {
  // In-memory store for tests — no electron-store dependency needed
  store = {
    _data: new Map(),
    path: "/mock/refinzi.json",
    get(key, def) { return this._data.has(key) ? this._data.get(key) : def; },
    set(key, val) { this._data.set(key, val); },
    delete(key) { this._data.delete(key); },
    get store() { return Object.fromEntries(this._data); }
  };
} else {
  // Dynamic import to avoid loading electron-store in test env
  const { default: Store } = await import("electron-store");
  const { app } = await import("electron");
  const crypto = (await import("crypto")).default;
  const fs = (await import("fs")).default;
  const path = (await import("path")).default;

  function getEncryptionKey() {
    try {
      return crypto.createHash("sha256").update(app.getPath("userData")).digest("hex");
    } catch {
      return undefined;
    }
  }

  const schema = {
    deepSeekApiKey: { type: "string", default: "" },
    geminiApiKey: { type: "string", default: "" },
    openRouterApiKey: { type: "string", default: "" },
    openAiApiKey: { type: "string", default: "" },
    anthropicApiKey: { type: "string", default: "" },
    groqApiKey: { type: "string", default: "" },
    mistralApiKey: { type: "string", default: "" },
    xaiApiKey: { type: "string", default: "" },
    customApiKey: { type: "string", default: "" },
    ollamaBaseUrl: { type: "string", default: "http://localhost:11434" },
    lmStudioBaseUrl: { type: "string", default: "http://localhost:1234" },
    customApiBaseUrl: { type: "string", default: "" },
    hotkey: { type: "string", default: DEFAULT_HOTKEY },
    launchOnStartup: { type: "boolean", default: true },
    onboardingSeen: { type: "boolean", default: false },
    premiumWelcomePending: { type: "boolean", default: false },
    lastRefinement: { type: "object", default: {} },
    metrics: {
      type: "object",
      default: {
        refinementsMade: 0, timeSavedSeconds: 0, retriesAvoided: 0,
        currentStreak: 0, lastRefinementDay: null,
        reelsReverseEngineered: 0, landingPagesReverseEngineered: 0,
        promptsImproved: 0, blueprintsGenerated: 0
      }
    },
    refinementLogs: { type: "array", default: [] },
    telemetryLogs: { type: "array", default: [] },
    orbInteractionLogs: { type: "array", default: [] },
    historyLogs: { type: "array", default: [] },
    saveHistoryLocally: { type: "boolean", default: false },
    shareCardDismissed: { type: "boolean", default: false },
    dailyQuota: {
      type: "object",
      default: { maxPerDay: 50, usedToday: 0, todayDate: null }
    },
    userName: { type: "string", default: "User" },
    theme: { type: "string", default: "system" },
    activeProvider: { type: "string", default: "deepseek" },
    activeModel: { type: "string", default: "deepseek-chat" },
    installedAt: { type: "number", default: 0 },
    reminder1Shown: { type: "boolean", default: false },
    reminder2Shown: { type: "boolean", default: false },
    reminder3Shown: { type: "boolean", default: false },
    quickStartSeen: { type: "boolean", default: false },
    refinementCount: { type: "number", default: 0 }
  };

  try {
    store = new Store({
      name: "refinzi",
      schema,
      encryptionKey: getEncryptionKey()
    });
  } catch (e) {
    console.warn("[Refinzi] Store init failed, using fallback:", e?.message || e);
    store = {
      _data: new Map(),
      path: "/mock/refinzi.json",
      get(key, def) { return this._data.has(key) ? this._data.get(key) : def; },
      set(key, val) { this._data.set(key, val); },
      delete(key) { this._data.delete(key); },
      get store() { return Object.fromEntries(this._data); }
    };
  }

  console.log("[Refinzi][Main] electron-store initialized at", store.path);

  // Migration from old Refinezy store
  try {
    const userData = app.getPath("userData");
    const dir = path.dirname(userData);
    const oldUserData = path.join(dir, "Refinezy");
    const oldStoreFile = path.join(oldUserData, "refinezy.json");

    if (fs.existsSync(oldStoreFile)) {
      const migratedFlag = store.get("migratedFromRefinezy");
      if (!migratedFlag) {
        console.log("[Refinzi][Migration] Old Refinezy store found. Migrating data...");
        const oldEncryptionKey = crypto.createHash("sha256").update(oldUserData).digest("hex");
        const oldStore = new Store({
          name: "refinezy", cwd: oldUserData, encryptionKey: oldEncryptionKey
        });
        const keys = ["geminiApiKey", "openRouterApiKey", "hotkey", "launchOnStartup", "metrics", "refinementLogs", "telemetryLogs", "historyLogs", "saveHistoryLocally", "shareCardDismissed", "dailyQuota", "userName", "theme", "activeProvider", "activeModel"];
        for (const key of keys) {
          const val = oldStore.get(key);
          if (val !== undefined) store.set(key, val);
        }
        store.set("migratedFromRefinezy", true);
        console.log("[Refinzi][Migration] Migration successfully completed.");
      }
    }
  } catch (err) {
    console.error("[Refinzi][Migration] Failed to migrate from old store:", err.message);
  }
}

export { store };
