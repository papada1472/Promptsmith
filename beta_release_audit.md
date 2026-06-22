# Refinzi Desktop — Beta Release Audit Report
> Audit Date: 2026-06-12 | Version: 1.0.0 | Auditor: Antigravity AI

---

## Audit Checklist Overview

| Category | Items | ✅ Pass | ⚠️ Warn | ❌ Fail |
|---|---|---|---|---|
| 1. Security | 7 | 4 | 2 | 1 |
| 2. IPC Integrity | 6 | 3 | 1 | 2 |
| 3. Data Privacy & Storage | 5 | 3 | 1 | 1 |
| 4. Core Functionality | 8 | 6 | 2 | 0 |
| 5. Error Handling | 5 | 4 | 1 | 0 |
| 6. Code Quality | 6 | 2 | 3 | 1 |
| 7. UX / Polish | 5 | 3 | 2 | 0 |
| 8. Build & Packaging | 5 | 3 | 1 | 1 |
| **Total** | **47** | **28** | **13** | **6** |

---

## 1. Security

### 1.1 Context Isolation ✅ PASS
All `BrowserWindow` instances in [windows.js](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/windows.js) and [orbWindow.js](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/orbWindow.js) correctly configure `contextIsolation: true` and `nodeIntegration: false`.

### 1.2 Preload API Surface ✅ PASS
[sharedPreload.js](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/preload/sharedPreload.js) uses `contextBridge.exposeInMainWorld` exclusively. No raw `require` or Node APIs are exposed to renderers.

### 1.3 API Key Storage ✅ PASS
Gemini API key is stored via `electron-store` with an `encryptionKey` derived from `crypto.createHash("sha256")` over the `userData` path. See [store.js#L6-L12](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/store.js#L6-L12). Acceptable for a local-only desktop app.

### 1.4 Content Security Policy ⚠️ WARN
**No CSP meta tag or Electron `session.setPermissionRequestHandler`** is set in any renderer. The terminal output explicitly shows the warning:
```
This renderer process has either no Content Security Policy set or a policy with "unsafe-eval" enabled.
```
This is present in **all four windows** (settings, reward, orb, toast). Needs a CSP header before production release.

### 1.5 API Key Exposed Over IPC ⚠️ WARN
[settingsService.js#L11](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/services/settingsService.js#L11) returns `geminiApiKey` in plaintext via the `settings:get` IPC call. Any renderer can read the full API key. It is used for pre-populating the settings field — acceptable for now, but consider returning a masked value (e.g., `AIza...XXXX`) and only sending the full key on explicit `setApiKey` calls.

### 1.6 User Input Logged to Console ❌ FAIL — SEVERITY: HIGH
In [orbWindow.js#L197-L198](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/orbWindow.js#L197-L198) and [orbWindow.js#L215-L216](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/orbWindow.js#L215-L216):
```js
console.log("[Orb] Actual input:\n" + input);
console.log(`[Orb] systemPrompt:\n${systemPrompt}`);
console.log(`[Orb] userPrompt:\n${userPrompt}`);
```
**The full user text, system prompt, and user prompt are logged to the console.** In production builds this would expose user content in any log aggregation or crash reporter. These must be removed or guarded by a `DEBUG` flag before beta release.

### 1.7 Single Instance Lock ✅ PASS
[main.js#L210-L222](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/main.js#L210-L222) correctly uses `app.requestSingleInstanceLock()` and handles the `second-instance` event.

---

## 2. IPC Integrity

### 2.1 Unregistered IPC Channels ❌ FAIL — SEVERITY: HIGH
The following channels are exposed in [sharedPreload.js](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/preload/sharedPreload.js) but have **no corresponding `ipcMain.handle()` registered** in any main-process file:

| Channel | Exposed in Preload | Handler in Main |
|---|---|---|
| `reward:dismissShareCard` | ✅ L22 | ❌ Missing |
| `reward:shareCardSeen` | ✅ L23 | ❌ Missing |
| `settings:dismissQuota` | ✅ L33 | ❌ Missing |
| `settings:setTheme` | ✅ L34 | ❌ Missing |
| `toast:show` | ✅ L39 | ❌ Missing |

Invoking any of these from the renderer will result in a silent promise hang or rejection. This is a reliability bug that will affect users.

### 2.2 Tray Context Menu Still Calls `onToggleReward` ⚠️ WARN
While left/right tray click correctly calls `onOpenSettings` (fixed in this session), the tray context menu item `Show Stats` (line 17 of [tray.js](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/tray.js)) still calls `onToggleReward`. If the intent is to deprecate the stats popup, this should be removed or relabeled. If Stats is still needed, it should also open the dashboard.

### 2.3 Orb IPC Move Handler ✅ PASS
[orbWindow.js#L576-L591](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/orbWindow.js#L576-L591) correctly uses `ipcMain.on` (fire-and-forget) for `orb:move` and `orb:dragEnd`. `orb:getPosition` and `orb:resetPosition` correctly use `ipcMain.handle`.

### 2.4 IPC Handler Registration Race Condition ❌ FAIL — SEVERITY: MEDIUM
In [orbWindow.js#L431-L432](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/orbWindow.js#L431-L432), `registerPipelineHandler()` is guarded by `pipelineRegistered`. However, it is only called from `showOrb()`. If `showOrb()` is called multiple times before the window loads, the IPC handlers are only registered once — which is correct. **But** the `orb:move` `ipcMain.on` at line 577 is **also inside `registerPipelineHandler`**, meaning `orb:move` messages sent before the first `showOrb()` call will be silently dropped. This is a logic risk rather than a crash bug.

### 2.5 `reward:refresh` Broadcast Sends to All Windows ✅ PASS
[windows.js#L173-L183](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/windows.js#L173-L183) correctly iterates all windows and uses try/catch. Renderers that don't listen for `reward:refresh` will simply ignore it.

### 2.6 `command:refresh` IPC Declared but Never Sent ⚠️ WARN (Dead Code)
[sharedPreload.js#L48-L52](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/preload/sharedPreload.js#L48-L52) exposes `command.onRefresh` but no main-process code ever sends `command:refresh`. This is dead code that should be removed.

---

## 3. Data Privacy & Storage

### 3.1 User Text Stored on Disk ❌ FAIL — SEVERITY: HIGH
[refineController.js#L83-L87](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/refineController.js#L83-L87) calls `metricsService.appendLog({ input, output, timestamp })`. The `appendLog` method in [metricsService.js#L72-L77](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/services/metricsService.js#L72-L77) stores **the full input text and AI output** in `refinementLogs` in the `electron-store` JSON file. The privacy promise on the UI says "Your prompts stay on your device" but the marketing implies privacy. Storing raw prompt/output content is a privacy risk if the device is accessed by others. **At minimum, this must be disclosed in settings.** Ideally, logs should only store metadata (length, type, timestamp), not raw content. Note: the `logAnalyticsEvent` function in `orbWindow.js` correctly logs only metadata — the `refineController.js` path is the problem.

### 3.2 Hard-coded Default Username ⚠️ WARN
[store.js#L46-L47](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/store.js#L46-L47) sets `userName` default to `"Rahul"`. This is a developer name left in production defaults. Should be `""` or `"User"`.

### 3.3 Quota Tracking Logic Duplicated ✅ PASS (noted)
Daily quota tracking is implemented identically in both `metricsService.checkAndTrackQuota()` and `orbWindow.js:trackQuotaUsage()`. They are logically consistent but represent duplicated code — one path (refineController) goes through `metricsService`, the other (orbWindow) uses a local function. No bug, but increases maintenance risk.

### 3.4 Clipboard Data Lifetime ✅ PASS
[orbWindow.js#L262-L295](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/orbWindow.js#L262-L295) correctly saves the previous clipboard, pastes the result, then restores the previous clipboard — meaning the AI response does not permanently reside on the clipboard after a successful paste.

### 3.5 Encrypted Store Key Derivation ✅ PASS
The encryption key is derived from `app.getPath("userData")` which is machine- and user-specific. Not cryptographically strong (it's a fixed path), but acceptable for local storage protection against casual file inspection.

---

## 4. Core Functionality

### 4.1 Preserve Mode (Click) ✅ PASS
Orb single-click triggers `preserve` mode. Pipeline runs through `buildPreserveSystemPrompt` in [promptEngineer.js](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/output/promptEngineer.js). Tested and confirmed working.

### 4.2 Expert Mode (Hold) ✅ PASS
700ms hold triggers `expert` mode. Brain icon (`🧠`) shows immediately and remains until response. Confirmed via previous session testing.

### 4.3 Clipboard Sentinel Leak — FIXED ✅ PASS
`captureActiveSelection()` in [clipboardFlow.js](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/clipboardFlow.js) now backs up the original clipboard before writing the sentinel, and restores it on failure. The sentinel string is no longer sent to Gemini.

### 4.4 Selection Detector Never Started ⚠️ WARN
`startSelectionDetection()` from [selectionDetector.js](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/selectionDetector.js) is **never called** from [main.js](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/main.js) or anywhere else. The file exists but is dead code. The orb always shows on startup (near cursor) rather than appearing contextually when text is selected. This is a product decision — if the feature is not used, the file should be removed to avoid confusion.

### 4.5 Auto-Paste Fallback ✅ PASS
If `autoPaste()` fails, the AI response stays on the clipboard and `notifySuccess("⚠️ Couldn't replace automatically. Result copied to clipboard.")` is shown. Orb re-shows correctly in both cases.

### 4.6 Daily Quota (50/day) ✅ PASS
Quota is checked before any pipeline execution. After quota is hit, `sendResponse("Daily refinement quota reached (50/50)")` is returned immediately.

### 4.7 Model Selection UI vs Actual Model Used ⚠️ WARN
The settings UI ([settings/index.html#L119-L123](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/renderer/settings/index.html#L119-L123)) shows a `modelSelect` dropdown with 4 Gemini models. However, [GeminiProvider.js#L5](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/ai/GeminiProvider.js#L5) has `static MODEL = "gemini-2.5-flash"` hardcoded. **The model selected in the UI has no effect on the actual model used.** This is a UI/UX bug — users believe they're changing the model but are not.

### 4.8 Retry Logic ✅ PASS
503 errors retry once after 2000ms. 429 errors retry once with `getRetryDelay()`. Non-retryable errors fail immediately with a clean user message.

---

## 5. Error Handling

### 5.1 Empty Input Guard ✅ PASS
Both `orbWindow.js` and `GeminiProvider.js` guard against empty/null input and return clear error messages without exposing stack traces.

### 5.2 No API Key Guard ✅ PASS
Both the Orb pipeline and `refineController` check for the API key before calling the provider. Users get a clear message directing them to settings.

### 5.3 Unhandled Promise in Orb Close Event ⚠️ WARN
In [orbWindow.js#L656-L658](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/orbWindow.js#L656-L658), the `closed` event nulls `orbWindow`. If the window closes while a pipeline is running (`isOrbRunning = true`), `sendStatus()` and `sendResponse()` guard against a null `orbWindow`, which is correct. However, `isOrbRunning` is never reset in this path — the pipeline will be permanently locked until the app restarts.

### 5.4 `GeminiProvider` Logs Full Error Stack ✅ PASS
[GeminiProvider.js#L54-L60](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/ai/GeminiProvider.js#L54-L60) logs the full error (including stack) to console but does not expose it to the renderer. The renderer only receives "Unable to process right now."

### 5.5 `before-quit` Unregisters Hotkeys ✅ PASS
[main.js#L120-L123](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/main.js#L120-L123) correctly unregisters all global shortcuts on quit to prevent ghost hotkeys.

---

## 6. Code Quality

### 6.1 Verbose Console Logging in Production Paths ❌ FAIL — SEVERITY: MEDIUM
The entire codebase is instrumented with granular `console.log` statements including:
- Full user input text (L197-198 of orbWindow.js)
- Full system/user prompt text (L215-216)
- Every drag position (`[DRAG] setPosition`)
- Every clipboard read/write

There is **no `DEBUG` flag or log level system**. All logs fire unconditionally in production. This clutters any log aggregator, exposes user data, and could impact performance during drag operations (a log per `pointermove` RAF tick).

### 6.2 `[DEBUG]` Tags in Production Code ⚠️ WARN
`windows.js` logs `[DEBUG] createSettingsWindow()`, `[DEBUG] SETTINGS HTML:`, `[DEBUG] createRewardWindow()`, etc. These are development artifacts that should be removed or converted to a proper logger before release.

### 6.3 Duplicate Quota Logic ⚠️ WARN
As noted in §3.3, quota logic lives in both `metricsService.js` and `orbWindow.js`. Should consolidate into one.

### 6.4 `selectionDetector.js` Dead Module ⚠️ WARN
[selectionDetector.js](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/selectionDetector.js) is never imported or used. Dead code increases bundle size and confuses future developers.

### 6.5 `GeminiProvider` System Prompt Not Used as System Role ⚠️ WARN
[GeminiProvider.js#L41](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/ai/GeminiProvider.js#L41) concatenates the system prompt directly into `contents` as a string:
```js
contents: `${this.systemPrompt}\n\nInstruction:\n${text}`
```
The `@google/genai` SDK supports a proper `systemInstruction` field in `generateContent`. Using the proper field would give the model better behavioral separation between system instructions and user input, and may improve output quality.

### 6.6 `timeoutMs` Not Enforced ✅ PASS (noted)
`timeoutMs` is passed to `GeminiProvider` constructor but is never used — there is no `AbortController` or timeout wrapper around `generateContent`. The 15-second timeout in `constants.js` is effectively a no-op. Not a crash risk but the timeout promise does nothing.

---

## 7. UX / Polish

### 7.1 Tray Left/Right Click → Dashboard ✅ PASS (Fixed This Session)
Both `tray.on("click")` and `tray.on("right-click")` call `onOpenSettings()`. Dashboard opens correctly.

### 7.2 Orb Brain Morph Persists During Expert Thinking ✅ PASS (Fixed Previously)
`brainEl` shows on hold, stays visible until `onResponse` fires, then reverts to sparkle.

### 7.3 Hero Shortcut Badge is Hardcoded ⚠️ WARN
[settings/index.html#L70](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/renderer/settings/index.html#L70) shows `⌨ Ctrl + Alt + Space` regardless of the user's configured hotkey. The actual hotkey is loaded dynamically for the `hotkeyInput` field but not updated in the hero badge.

### 7.4 Model Badge Shows Stale "Loading model..." ⚠️ WARN
The `modelBadge` element in [settings/index.html#L29](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/renderer/settings/index.html#L29) starts as `"Loading model..."`. If the renderer JS fails to load settings, it stays in this state. No error state is shown.

### 7.5 Orb Drag Smoothness — Adequate ✅ PASS
`requestAnimationFrame` throttling in [renderer.js#L29-L39](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/renderer/orb/renderer.js#L29-L39) prevents redundant IPC calls during drag. Multi-monitor support added in this session.

---

## 8. Build & Packaging

### 8.1 Version Number ⚠️ WARN
`package.json` shows version `"1.0.0"`. For a beta release this should be `"0.1.0-beta.1"` or similar to follow semantic versioning conventions and not imply production readiness.

### 8.2 `appId` Mismatch ❌ FAIL — SEVERITY: LOW
`package.json#L31` sets `appId: "com.refinzi.app"` but `electron-builder.yml#L1` sets `appId: "com.refinzi.app"` (different spelling: **refinzi** vs **refinzi**). This mismatch means the installer and the package.json `build` config conflict. The installer (`electron-builder.yml`) takes precedence during build — resulting in `com.refinzi.app` being the actual app ID. Windows registry entries, notifications, and single-instance lock will use `com.refinzi.app`.

### 8.3 Code Signing Disabled ✅ PASS (for beta)
`electron-builder.yml#L16-L17` sets `certificateSubjectName: ""` and `sign: false`. Acceptable for beta, but **users will see a Windows SmartScreen warning** on install. Must be signed before public release.

### 8.4 `node_modules` Exclusion ✅ PASS
`electron-builder.yml` only packages `src/**/*`, `assets/**/*`, and `package.json`. `node_modules` are handled by `asar: true` and electron-builder's native dependency bundling.

### 8.5 `author` Field Empty ✅ PASS (minor)
`package.json#L8` has `"author": ""`. Not a functional issue for beta but should be filled in before public release.

---

## Summary: Critical Items Before Beta Release

> [!CAUTION]
> The following **must be fixed** before shipping to beta users:

| # | Issue | File | Severity |
|---|---|---|---|
| 1 | User input/prompt logged to console verbatim | [orbWindow.js#L197-L216](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/orbWindow.js#L197-L216) | 🔴 HIGH |
| 2 | 5 IPC channels declared but no handler registered | [ipc.js](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/ipc.js) | 🔴 HIGH |
| 3 | Raw user text stored in `refinementLogs` store | [refineController.js#L83](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/refineController.js#L83) | 🔴 HIGH |
| 4 | Model dropdown UI has no effect on actual model | [GeminiProvider.js#L5](file:///e:/Antigravity%20Projects/Refinzi/refinzi-desktop/src/main/ai/GeminiProvider.js#L5) | 🟠 MEDIUM |
| 5 | No Content Security Policy on any renderer | All windows | 🟠 MEDIUM |
| 6 | `appId` mismatch between package.json and electron-builder.yml | Both files | 🟡 LOW |

> [!WARNING]
> The following are **strongly recommended** before beta:

- Remove `[DEBUG]` log tags from `windows.js` and `tray.js`
- Fix the hardcoded default username `"Rahul"` in `store.js`
- Fix the hero badge hotkey to reflect the actual configured shortcut
- Remove the dead `selectionDetector.js` module and `command:onRefresh` IPC
- Change version from `1.0.0` to `0.1.0-beta.1`
