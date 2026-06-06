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
    default: "Rahul"
  },
  theme: {
    type: "string",
    default: "system"
  }
};

export const store = new Store({
  name: "refinezy",
  schema,
  encryptionKey: getEncryptionKey()
});

console.log("[Refinezy][Main] electron-store initialized at", store.path);

