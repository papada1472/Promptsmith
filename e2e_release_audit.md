# GATEWAY-E2E-RELEASE-001 — Static Audit Report

> Audit type: **Static code analysis only** — no code was modified, no runtime was executed.  
> All log predictions are derived from `console.log` / `console.error` statements in source.

---

## Summary Table

| Test | Scenario | Expected Provider | Verdict | Blocking? |
|------|----------|------------------|---------|-----------|
| TEST 1 | Fresh Install — No Gemini key | `gateway` | ⚠️ **CONDITIONAL PASS** | See [B1] |
| TEST 2 | Gold Mode (Expert) | `gateway` / `gemini` | ✅ **PASS** | — |
| TEST 3 | Gemini Override | `gemini` | ⚠️ **CONDITIONAL PASS** | See [B2] |
| TEST 4 | Gateway Failure / Timeout | `gateway` | ✅ **PASS** | — |
| TEST 5 | History — 20 refinements | N/A | ⚠️ **CONDITIONAL PASS** | See [B3, B4] |

---

## TEST 1 — Fresh Install, No Gemini Key

### Code Path Traced
**`orbWindow.js` → `runPipeline()` → `ProviderManager.getActiveProviderId()`**

```js
// orbWindow.js:221-225
const providerId = ProviderManager.getActiveProviderId({ 
  activeProvider,           // store default: "gemini"
  geminiApiKey: store.get("geminiApiKey"),   // ""  (fresh install)
  openRouterApiKey: store.get("openRouterApiKey") // undefined
});
```

**`ProviderManager.getActiveProviderId()` logic:**
```js
// ProviderManager.js:28-38
if (opts?.openRouterApiKey && opts?.activeProvider === "openrouter") → SKIP (no OR key)
if (opts?.geminiApiKey && opts?.activeProvider === "gemini")        → SKIP (geminiApiKey is "")
if (opts?.geminiApiKey && !opts?.activeProvider)                   → SKIP
return "gateway";  // ✅ CORRECT fallback
```

**`GatewayProvider` is constructed** with `GATEWAY_URL = https://refinzi-gateway.vercel.app/api/v1/refine`

### Expected Runtime Logs
```
[Refinzi][Main] electron-store initialized at <path>/refinzi.json
[Refinzi][GatewayProvider] Initializing with Gateway URL: https://refinzi-gateway.vercel.app/api/v1/refine
[Orb] No Gemini API key found. Routing to GatewayProvider.
[Orb] Input source: active selection
[Orb] Captured text length: <N>
[Orb] AI response received in <N>ms
[MAIN] status sent: ✨ Improving...
[MAIN] status sent: ✅ Done
[MAIN] response sent: <refined text>
```

### Active Provider
`gateway` → routes to `https://refinzi-gateway.vercel.app/api/v1/refine` → OpenRouter

### Verdict: ⚠️ CONDITIONAL PASS

> [!IMPORTANT]
> **[B1] — `store.get("openRouterApiKey")` returns `undefined`, not `""`.**  
> The store schema does NOT define `openRouterApiKey`. Reading an undefined key from electron-store returns `undefined`. In `getActiveProviderId`, the check is `opts?.openRouterApiKey &&` — `undefined` is falsy, so the condition is skipped correctly.  
> However, `settingsService.getSettings()` calls `store.get("openRouterApiKey")` which will return `undefined`. The renderer will receive `openRouterApiKey: undefined` in the settings object. This is harmless at runtime but is a schema gap that could trigger schema validation warnings in future electron-store upgrades.  
> **Recommendation**: Add `openRouterApiKey: { type: "string", default: "" }` to the store schema.

---

## TEST 2 — Gold Mode (Expert)

### Code Path Traced
**Renderer → `orb:clicked` with `mode = "expert"`**

```js
// orbWindow.js:398
ipcMain.handle("orb:clicked", async (_e, { mode }) => {
  // mode = "expert"
  ...
  await runPipeline(mode || "preserve", input, detection.type, telemetry);
```

```js
// orbWindow.js:202
sendStatus(mode === "expert" ? "🧠 Thinking deeper..." : "✨ Improving...");
```

```js
// buildExecutionPlan(optimized, mode)  → mode="expert" flows to expert system prompt branch
```

The `mode` is passed through to `buildExecutionPlan` which switches the system prompt. No provider selection is affected by mode — provider is still selected by key availability.

### Expected Runtime Logs
```
[Orb] Expert mode armed
[MAIN] status sent: 🧠 Thinking deeper...
[Orb] AI response received in <N>ms
[MAIN] status sent: ✅ Done
```

Telemetry event:
```json
{ "mode": "expert", "provider": "gateway", "success": true }
```

### Active Provider
Same as active session — `gateway` on fresh install, `gemini` if key is set.

### Verdict: ✅ PASS

Mode is correctly passed through the pipeline. No blockers.

---

## TEST 3 — Gemini Override

### Code Path Traced
After saving a Gemini API key via `settings:setApiKey`:

```js
// settingsService.js:30
store.set("geminiApiKey", String(apiKey));
```

On next `orb:clicked`:
```js
// orbWindow.js:218-225
const activeProvider = store.get("activeProvider") || "gemini";  // "gemini"
const apiKey = store.get("geminiApiKey");                         // "sk-..."

const providerId = ProviderManager.getActiveProviderId({
  activeProvider,       // "gemini"
  geminiApiKey: apiKey  // truthy
});
// → Returns "gemini" ✅
```

`GeminiProvider` is constructed. `GatewayProvider` is never instantiated.

### Expected Runtime Logs
```
[Refinzi][GeminiProvider] ... (GeminiProvider log, not GatewayProvider)
[Orb] AI response received in <N>ms
```

Telemetry:
```json
{ "provider": "gemini", "success": true }
```

### Active Provider
`gemini` — Gateway not called.

### Verdict: ⚠️ CONDITIONAL PASS

> [!WARNING]
> **[B2] — `settings:setApiKey` IPC signature mismatch.**  
> `sharedPreload.js` exposes:
> ```js
> setApiKey: (key) => invoke("settings:setApiKey", key)
> ```
> But the IPC handler in `ipc.js` expects:
> ```js
> ipcMain.handle("settings:setApiKey", async (_e, apiKey, provider) => ...)
> ```
> The preload only sends ONE argument (`key`). The `provider` argument will always be `undefined` in the main process, causing `settingsService.setApiKey(key, undefined)` → defaults to `"gemini"`. This means **saving an OpenRouter key through the UI always saves it as `geminiApiKey`** — a silent data corruption bug.  
> For the Gemini test specifically this is fine (key saves correctly to `geminiApiKey`), but OpenRouter users are broken.  
> **Recommendation**: Fix preload to `setApiKey: (key, provider) => invoke("settings:setApiKey", key, provider)` — or better, pass them as an object.

---

## TEST 4 — Gateway Failure / Timeout

### Code Path Traced

**AbortController enforcement:**
```js
// GatewayProvider.js:27-34
const controller = new AbortController();
let timeoutId;
if (this.timeoutMs) {  // REFINE_TIMEOUT_MS = 15000ms
  timeoutId = setTimeout(() => {
    controller.abort();
  }, this.timeoutMs);
}
// fetch(..., { signal: controller.signal })
```

**Abort handling:**
```js
// GatewayProvider.js:76-84
} catch (e) {
  if (e.name === 'AbortError') {
    console.error("[Refinzi][GatewayProvider] Gateway request timed out");
    const err = new Error("Gateway request timed out");
    err.code = "gateway_timeout";
    throw err;
  }
```

**Cleanup:**
```js
// GatewayProvider.js:85-88
} finally {
  if (timeoutId) clearTimeout(timeoutId);
}
```

**Orb recovery in `runPipeline`:**
```js
// orbWindow.js:364-372
failure: e?.code === "gateway_timeout" ? "gateway_timeout" : "unknown",
...
sendResponse("Unable to process right now. Please try again.");
flushPendingState();
return;
```

`isOrbRunning` is reset in the `finally` block of `orb:clicked` (line 537-539), so the orb is always unblocked after failure.

### Expected Runtime Logs (non-routable host)
```
[Refinzi][GatewayProvider] Initializing with Gateway URL: http://10.0.0.1:9999/api/v1/refine
[Orb] No Gemini API key found. Routing to GatewayProvider.
[Orb] Attempt 1 failed: Gateway request timed out
[Refinzi][GatewayProvider] Gateway request timed out
[MAIN] response sent: Unable to process right now. Please try again.
```

Time to timeout: **~15,000ms** (REFINE_TIMEOUT_MS).

### Active Provider
`gateway` (selected, but request aborted).

### Verdict: ✅ PASS

Timeout enforced via AbortController. Cleanup correct. Orb recovers. No process crash path exists (all errors caught at pipeline level).

---

## TEST 5 — History (20 refinements, open dashboard)

### Code Path Traced

**Writing history (on each refinement):**
```js
// metricsService.js:73-81
appendLog({ input, output, timestamp }) {
  if (!store.get("saveHistoryLocally")) return;  // OFF by default
  const existing = store.get("historyLogs") || [];
  const next = [...existing, { input, output, timestamp }];
  const capped = next.length > 500 ? next.slice(next.length - 500) : next;
  store.set("historyLogs", capped);
}
```

> [!CAUTION]
> **[B3] — `saveHistoryLocally` defaults to `false`.**  
> On a fresh install, `historyLogs` will ALWAYS be empty, regardless of how many refinements the user makes. The History section in the dashboard will always show "No history yet." until the user explicitly enables the toggle in Advanced Settings.  
> **The toggle is now present in the HTML** (added in the previous session), but **`renderer.js` does NOT wire the `saveHistoryToggle` element to any event listener or IPC call**. The toggle renders but has no effect when clicked.  
> **This is a P0 blocker for the History test.**

**Reading history:**
```js
// metricsService.js:87-93
getLogs({ offset = 0, limit = 50 } = {}) {
  const all = store.get("historyLogs") || [];
  const reversed = [...all].reverse();
  const page = reversed.slice(offset, offset + limit);
  return { logs: page, hasMore: offset + limit < reversed.length };
}
```

**Rendering history in `renderer.js`:**
```js
// renderer.js:80-95
const logs = await window.refinzi.logs.get();  // passes no params → offset=0, limit=50
if (logs.length === 0) { ... }
logsContainer.innerHTML = logs.map(log => `
  ...${log.input.substring(0, 100)}...   // ← UNSAFE: no null guard
  ...${log.output.substring(0, 100)}...  // ← UNSAFE: no null guard
  ...${new Date(log.timestamp).toLocaleString()}  // ← UNSAFE: no null guard
`).join("");
```

> [!CAUTION]
> **[B4] — Renderer `loadHistory` has no defensive guards.**  
> If any `historyLog` entry has `input = null`, `output = null`, or `timestamp = null/undefined`, `.substring()` will throw `TypeError: Cannot read properties of null`. This was an approved fix in the v1 implementation plan but has not been applied yet.  
> The `"Load More"` button and `currentOffset` pagination state were also not yet implemented.  
> **Copy/Delete button IPC wiring** is also absent from `renderer.js`.

**IPC chain for `logs.get()`:**
```
renderer → window.refinzi.logs.get(params)  
→ sharedPreload.js: invoke("logs:get", params)  
→ ipc.js: metricsService.getLogs(params || {})  
→ returns { logs: [], hasMore: false }
```

Chain is correct and complete.

### Active Provider
N/A (history is storage-only).

### Verdict: ⚠️ CONDITIONAL PASS (with blockers)

---

## Consolidated Release Blockers

| ID | Severity | Component | Description |
|----|----------|-----------|-------------|
| **B1** | Low | `store.js` | `openRouterApiKey` missing from schema — undefined key, no default |
| **B2** | Medium | `sharedPreload.js` | `setApiKey` only forwards 1 arg; `provider` always `undefined` in main |
| **B3** | **P0** | `renderer.js` | `saveHistoryToggle` has no event listener wired — toggle is non-functional |
| **B4** | **P0** | `renderer.js` | `loadHistory` missing null guards on `log.input`, `log.output`, `log.timestamp` |
| B5 | Low | `renderer.js` | No "Load More" / pagination state — entire history fetched at once (mitigated by server-side 50-item limit) |
| B6 | Low | `renderer.js` | Copy/Delete buttons not rendered or wired per v1 spec |

---

## What Is Working Correctly ✅

- **GatewayProvider timeout**: AbortController enforced, `clearTimeout` in `finally`, `err.code = "gateway_timeout"` propagated correctly.
- **Provider selection logic**: `getActiveProviderId()` correctly routes no-key installs to `gateway`.
- **Telemetry `provider` field**: All `deferAnalyticsEvent` calls in `orbWindow.js` use `providerId` (actual execution path), never `activeProvider` (configured value). Fallback is correctly reflected.
- **Schema separation**: `telemetryLogs` and `historyLogs` are fully separated. `orbWindow.js` writes only to `telemetryLogs` via `logAnalyticsEvent`. `metricsService.appendLog` writes only to `historyLogs`.
- **Privacy gate**: `appendLog` correctly returns early if `saveHistoryLocally === false`.
- **IPC handlers**: `logs:get`, `logs:delete`, `logs:clear` all present in `ipc.js` and exposed in `sharedPreload.js`.
- **Orb recovery**: `isOrbRunning = false` in `finally` block — guaranteed on all code paths.
- **Gold Mode**: `mode` passed correctly through pipeline to `buildExecutionPlan`. Telemetry logs the correct mode.

---

## Immediate Action Required (Before Release)

### Fix B3 — Wire `saveHistoryToggle` in renderer.js

Add to the DOM refs block and event wire-up in `renderer.js`:
```js
// In DOM refs section
const saveHistoryToggle = document.getElementById("saveHistoryToggle");

// In refresh() after launchToggle
if (saveHistoryToggle) saveHistoryToggle.checked = Boolean(settings.saveHistoryLocally);

// In event wire-up
if (saveHistoryToggle) {
  saveHistoryToggle.addEventListener("change", async () => {
    await window.refinzi.settings.set({ saveHistoryLocally: saveHistoryToggle.checked });
    showNotification("success", `History ${saveHistoryToggle.checked ? "enabled" : "disabled"}.`);
  });
}
```

### Fix B4 — Defensive rendering in loadHistory

```js
logsContainer.innerHTML = logs.map(log => `
  <div style="...">
    <small>${new Date(log.timestamp || Date.now()).toLocaleString()}</small>
    <div><strong>Input:</strong> ${(log.input || "").substring(0, 100)}...</div>
    <div><strong>Output:</strong> ${(log.output || "").substring(0, 100)}...</div>
  </div>
`).join("");
```

### Fix B2 — Preload `setApiKey` signature

```js
// sharedPreload.js
setApiKey: (key, provider) => invoke("settings:setApiKey", key, provider),
```
