import Store from "electron-store";
import { app } from "electron";
import crypto from "crypto";
import fs from "fs";
import path from "path";
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
  openRouterApiKey: { type: "string", default: "" },
  hotkey: { type: "string", default: DEFAULT_HOTKEY },
  launchOnStartup: { type: "boolean", default: true },
  onboardingSeen: { type: "boolean", default: false },
  lastRefinement: {
    type: "object",
    default: {}
  },
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
  },
  telemetryLogs: {
    type: "array",
    default: []
  },
  historyLogs: {
    type: "array",
    default: []
  },
  saveHistoryLocally: {
    type: "boolean",
    default: false
  },
  shareCardDismissed: {
    type: "boolean",
    default: false
  },
  dailyQuota: {
    type: "object",
    default: {
      maxPerDay: 50,
      usedToday: 0,
      todayDate: null
    }
  },
  userName: {
    type: "string",
    default: "User"
  },
  theme: {
    type: "string",
    default: "system"
  },
  activeProvider: {
    type: "string",
    default: "gemini"
  },
  activeModel: {
    type: "string",
    default: "gemini-2.5-flash"
  }
};

export const store = new Store({
  name: "refinzi",
  schema,
  encryptionKey: getEncryptionKey()
});

console.log("[Refinzi][Main] electron-store initialized at", store.path);

function migrateFromOldStore() {
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
          name: "refinezy",
          cwd: oldUserData,
          encryptionKey: oldEncryptionKey
        });

        const keysToMigrate = [
          "geminiApiKey",
          "hotkey",
          "launchOnStartup",
          "metrics",
          "refinementLogs",
          "telemetryLogs",
          "historyLogs",
          "saveHistoryLocally",
          "shareCardDismissed",
          "dailyQuota",
          "userName",
          "theme",
          "activeProvider",
          "activeModel"
        ];

        for (const key of keysToMigrate) {
          const val = oldStore.get(key);
          if (val !== undefined) {
            store.set(key, val);
          }
        }

        store.set("migratedFromRefinezy", true);
        console.log("[Refinzi][Migration] Migration successfully completed.");
      }
    }
  } catch (err) {
    console.error("[Refinzi][Migration] Failed to migrate from old store:", err.message);
  }
}

migrateFromOldStore();

