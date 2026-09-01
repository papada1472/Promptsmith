// Web-environment mock APIs for settings renderer.
// Injected only when window.refinzi is not provided by the preload bridge.
if (!window.refinzi) {
  console.log("[Refinzi][Mock] Web environment detected. Injecting mock APIs.");
  window.refinzi = {
    reward: {
      get: async () => ({
        refinementsMade: 142,
        timeSavedSeconds: 17040,
        retriesAvoided: 84,
        currentStreak: 5,
        shareCardDismissed: false,
        reelsReverseEngineered: 64,
        landingPagesReverseEngineered: 48,
        promptsImproved: 120,
        blueprintsGenerated: 112
      }),
      dismissShareCard: async () => {
        console.log("[Mock] Dismissed share card");
      },
      onRefresh: (cb) => {
        console.log("[Mock] Registered refresh listener");
      }
    },
    settings: {
      get: async () => ({
        activeProvider: "gemini",
        activeModel: "gemini-flash-latest",
        geminiApiKey: "••••••••••••1234",
        openRouterApiKey: "",
        launchOnStartup: true,
        saveHistoryLocally: true,
        hotkey: "Ctrl+Alt+Space"
      }),
      set: async (val) => {
        console.log("[Mock] Settings saved:", val);
      },
      setApiKey: async (key, provider) => {
        console.log(`[Mock] API key saved for ${provider}:`, key);
        return { ok: true };
      },
      verifyApiKey: async (key) => {
        console.log("[Mock] Verifying API key:", key);
        return { ok: true };
      },
      setLaunchOnStartup: async (val) => {
        console.log("[Mock] Set launch on startup:", val);
      },
      setHotkey: async (hk) => {
        console.log("[Mock] Set hotkey:", hk);
        return { ok: true };
      }
    },
    logs: {
      get: async () => ({
        logs: [
          { originalIndex: 0, timestamp: Date.now() - 60000, input: "make this email more professional", output: "Dear team,\n\nI would like to request that we coordinate our schedules for the upcoming review..." },
          { originalIndex: 1, timestamp: Date.now() - 3600000, input: "explain quantum computing to a 5 year old", output: "Quantum computing is like having a magical box. Instead of doing one thing at a time, it can think about lots of paths at the exact same moment!" }
        ],
        hasMore: false
      }),
      clear: async () => {
        console.log("[Mock] Cleared history");
      },
      delete: async (idx) => {
        console.log("[Mock] Deleted history item:", idx);
      }
    },
    app: {
      showToast: async (opts) => {
        console.log("[Mock] Show toast:", opts);
      }
    }
  };
}
