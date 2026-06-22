# V1 Release Fix Plan

> Derived from GATEWAY-E2E-RELEASE-001 static audit.  
> **No code has been modified.** This plan requires explicit approval before execution.

---

## Blocker Summary

| ID | Severity | File | One-liner |
|----|----------|------|-----------|
| B3 | 🔴 P0 | `renderer.js` | `saveHistoryToggle` renders but is never wired — History always empty |
| B4 | 🔴 P0 | `renderer.js` | `loadHistory` calls `.substring()` on potentially null `input`/`output` — hard crash |
| B2 | 🟡 Medium | `sharedPreload.js` | `setApiKey` only sends key, not provider — OpenRouter key silently overwrites Gemini slot |
| B1 | 🟢 Low | `store.js` | `openRouterApiKey` missing from schema — electron-store returns `undefined` instead of `""` |

---

## Fix 1 — B3: Wire `saveHistoryToggle` in renderer.js

> [!IMPORTANT]
> Without this fix, the History section will always show "No history yet." regardless of how many refinements the user makes. The toggle exists in the HTML but is a dead control.

**File**: `src/renderer/settings/renderer.js`

### Change 1a — Add DOM ref (after `launchToggle` on line ~38)
```diff
  const launchToggle = document.getElementById("launchToggle");
+ const saveHistoryToggle = document.getElementById("saveHistoryToggle");
  const hotkeyInput = document.getElementById("hotkeyInput");
```

### Change 1b — Populate toggle state in `refresh()` (after `launchToggle` on line ~502)
```diff
  if (launchToggle) launchToggle.checked = Boolean(settings.launchOnStartup);
+ if (saveHistoryToggle) saveHistoryToggle.checked = Boolean(settings.saveHistoryLocally);
  if (hotkeyInput) hotkeyInput.value = settings.hotkey || "Ctrl+Alt+Space";
```

### Change 1c — Wire change event (after `launchToggle` listener on line ~605)
```diff
  if (launchToggle) launchToggle.addEventListener("change", saveLaunch);
+ if (saveHistoryToggle) {
+   saveHistoryToggle.addEventListener("change", async () => {
+     await window.refinzi.settings.set({ saveHistoryLocally: saveHistoryToggle.checked });
+     showNotification("success", `History ${saveHistoryToggle.checked ? "enabled" : "disabled"}.`);
+     await loadHistory();
+   });
+ }
  if (hotkeyInput) hotkeyInput.addEventListener("change", saveHotkey);
```

**IPC path already exists**: `settings:set` → `ipc.js:57` → `store.set(key, val)` ✅

---

## Fix 2 — B4: Defensive null guards in `loadHistory`

> [!IMPORTANT]
> If any log entry has a `null` or `undefined` input/output/timestamp, calling `.substring()` on `null` throws a `TypeError` that crashes the entire history view.

**File**: `src/renderer/settings/renderer.js`  
**Lines**: 85–91 (the `logs.map(...)` block)

```diff
-       <small style="color: gray;">${new Date(log.timestamp).toLocaleString()}</small>
-       <div style="margin-top: 4px;"><strong>Input:</strong> ${log.input.substring(0, 100)}...</div>
-       <div style="margin-top: 4px;"><strong>Output:</strong> ${log.output.substring(0, 100)}...</div>
+       <small style="color: gray;">${new Date(log.timestamp || Date.now()).toLocaleString()}</small>
+       <div style="margin-top: 4px;"><strong>Input:</strong> ${(log.input || "").substring(0, 100)}...</div>
+       <div style="margin-top: 4px;"><strong>Output:</strong> ${(log.output || "").substring(0, 100)}...</div>
```

---

## Fix 3 — B2: Fix `setApiKey` preload signature

> [!WARNING]
> Saving an OpenRouter key via the UI today silently saves it into the `geminiApiKey` slot. The IPC handler already accepts a `provider` argument — only the preload is missing it.

**File**: `src/preload/sharedPreload.js`  
**Line**: 37

```diff
-   setApiKey: (key) => invoke("settings:setApiKey", key),
+   setApiKey: (key, provider) => invoke("settings:setApiKey", key, provider),
```

---

## Fix 4 — B1: Add `openRouterApiKey` to store schema

> [!NOTE]
> Low risk today. Prevents a class of future bugs where strict equality checks against `""` behave differently from falsy checks against `undefined`.

**File**: `src/main/store.js`  
**After line 17** (`geminiApiKey` entry)

```diff
  geminiApiKey: { type: "string", default: "" },
+ openRouterApiKey: { type: "string", default: "" },
  hotkey: { type: "string", default: DEFAULT_HOTKEY },
```

---

## Execution Order

```
Fix 4 (store.js)  →  Fix 3 (sharedPreload.js)  →  Fix 2 + Fix 1 (renderer.js, single pass)
```

Fixes 1 and 2 both target `renderer.js` and are applied together in one edit.  
Total files touched: **3**

---

## Verification Checklist

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Fresh install, no keys → Sparkle | Gateway selected, orb recovers |
| 2 | Open Settings → Advanced → toggle "Save History Locally" ON | `saveHistoryLocally = true` persisted |
| 3 | Run 3 refinements | `historyLogs` has 3 entries |
| 4 | Open History panel | Entries render, no TypeError |
| 5 | Save OpenRouter key | Stored in `openRouterApiKey`, not `geminiApiKey` |
| 6 | Remove all keys | Gateway fallback, telemetry `provider="gateway"` |

---

## Out of Scope for V1 (Deferred to V2)

- Copy / Delete buttons per history item
- "Load More" pagination UI
- History search and export
