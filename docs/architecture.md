# Refinezy — Architecture

> Snapshot of the current Electron application as it exists today. No code modifications.
> Scope: the `refinezy-desktop` repository at the current `HEAD`.

---

## 1. Product in One Paragraph

Refinezy is a Windows-only, tray-resident background utility. The user highlights text in **any** application, presses a global hotkey, and Refinezy:

1. Simulates `Ctrl+C` to copy the selection.
2. Sends the text to Google Gemini with a refinement system prompt.
3. Writes the polished result back to the clipboard.
4. Simulates `Ctrl+V` to paste the result in place.
5. Surfaces a Windows toast (`✓ Done` or an error message).

The app is a **tray-first, no-main-window** Electron app. It also exposes two secondary UI surfaces: a "Reward" stat popover and a full "Command Center / Settings" window, plus a separate always-on-top toast window.

---

## 2. Current Folder Structure

```
refinezy-desktop/
├── assets/
│   ├── branding/                 # logo-mark.png (referenced by settings)
│   └── icons/                    # tray.png, icon-256.png, favicon.ico, app.ico
├── docs/
│   ├── architecture.md           # (this file)
│   ├── engineering_rules.md
│   ├── Product_truths.md
│   ├── vision.md
│   └── roles/
├── scripts/
│   ├── generate-assets.js
│   ├── list-models.js
│   ├── test-model.js
│   └── test-models.js
├── src/
│   ├── main/                     # Electron main process (Node, ESM)
│   │   ├── ai/
│   │   │   ├── AIProvider.js     # abstract base class
│   │   │   └── GeminiProvider.js # concrete Gemini implementation
│   │   ├── clipboardFlow.js      # OS keyboard + clipboard capture / paste
│   │   ├── constants.js          # APP_NAME, DEFAULT_HOTKEY, SYSTEM_PROMPT, REFINE_TIMEOUT_MS
│   │   ├── ipc.js                # ipcMain.handle registrations
│   │   ├── main.js               # entry: app lifecycle, hotkey, tray wiring
│   │   ├── notifications.js      # toast window facade
│   │   ├── refineController.js   # the end-to-end "refine" pipeline
│   │   ├── shortcuts.js          # globalShortcut register/unregister
│   │   ├── startup.js            # app.setLoginItemSettings wrapper
│   │   ├── store.js              # electron-store + metrics/quota helpers
│   │   ├── tray.js               # Tray + context menu
│   │   └── windows.js            # BrowserWindow factories
│   ├── preload/                  # contextBridge bridges (CJS)
│   │   ├── rewardPreload.js
│   │   ├── settingsPreload.js
│   │   └── sharedPreload.js
│   └── renderer/                 # three independent HTML/CSS/JS bundles
│       ├── reward/               # 320x400 popover (stats)
│       ├── settings/             # 1180x780 "Command Center"
│       └── toast/                # 360x74 always-on-top notification
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

### Key Conventions Observed

- **Main process is ESM** (`"type": "module"` in `package.json`); preload scripts are **CommonJS** because that is what Electron's `webPreferences.preload` loads on Windows in dev. The comments in each preload file explicitly call this out.
- **No build step for the renderer.** HTML / CSS / JS are loaded as plain files via `win.loadFile(...)`. No bundler, no transpiler, no framework.
- **Three isolated windows**, each with its own `index.html` and `renderer.js`. They share a `refinezy` global on `window` but no JS modules cross window boundaries.

---

## 3. Main Process

### 3.1 Entry Point — `src/main/main.js`

`main.js` is the orchestrator. It owns the two top-level `BrowserWindow` references (`settingsWindow`, `rewardWindow`) and the tray handle (`trayApi`).

**Lifecycle (in order):**

1. `app.whenReady()` → `initializeApp()`.
2. `app.setPath("cache", <userData>/cache)` — moves Electron's cache to a writable location.
3. `ensureAppUserModelId()` — `app.setAppUserModelId("com.refinezy.app")` for Windows toast identity.
4. `applyLaunchOnStartup(store.get("launchOnStartup"))` — configures login item.
5. Creates both `settingsWindow` and `rewardWindow` up front (both start hidden).
6. Builds the **tray** with a set of callback handlers (`onOpenSettings`, `onToggleReward`, `onQuit`, plus four debug handlers).
7. `registerIpcHandlers(...)` — wires all `ipcMain.handle` calls.
8. `registerShortcutFromStore()` — registers the hotkey from the store.
9. Both windows are explicitly hidden (tray-first).

**Top-level state in `main.js`:**

```js
let settingsWindow = null;
let rewardWindow = null;
let trayApi = null;
let isRefining = false;   // NOTE: also duplicated in refineController.js
```

**Hotkey handler `onHotkey()`:**

```text
onHotkey()
  ├─ if (isRefining) return                    // duplicate guard
  ├─ isRefining = true
  ├─ await refineSelectedText({ notifySuccess, notifyError, notifyWarning })
  └─ finally:
       isRefining = false
       rewardWindow?.webContents.send("reward:refresh")
```

**Debug menu (currently active in `tray.js`):**

`onDebugPing`, `onDebugShowNotification`, `onDebugTestGemini` (which directly instantiates `new GeminiProvider({...})`), `onDebugShowClipboard` (reads `clipboard.readText()`).

### 3.2 Window Factories — `src/main/windows.js`

Exports four functions:

| Function | Dimensions | Frame | Always-on-Top | Transparent | Click-through | Notes |
|---|---|---|---|---|---|---|
| `createSettingsWindow()` | 1180×780 | yes | no | no | no | Min size 1000×700, hides on close (minimize-to-tray) |
| `createRewardWindow()` | 320×400 | no | yes | yes | no | Hides on `blur` |
| `createToastWindow()` | 360×74 | no | yes | yes | yes (`setIgnoreMouseEvents(true, { forward: true })`) | Lazy-created by `notifications.js` |
| `showToast(window, opts)` | — | — | — | — | — | Centers on primary display, top of work area, `showInactive()` |

Also exports `positionRewardWindowNearTray(rewardWindow, trayBounds)` which snaps the reward popover above the tray icon.

All three windows share:

```js
webPreferences: {
  preload: <path>/<name>Preload.js,
  contextIsolation: true,
  nodeIntegration: false
}
```

The `sharedPreload.js` is currently the only one in active use by all three windows; `settingsPreload.js` and `rewardPreload.js` exist as alternate, narrower bridges but are not actually referenced from `windows.js`.

### 3.3 Tray — `src/main/tray.js`

- Loads `assets/icons/tray.png`, sets tooltip `"Refinezy — Running"`.
- Context menu: app name, ✓ Running (disabled), Open Dashboard, Quit.
- Left click → `onOpenSettings`. Right click → rebuild menu.
- Returns `{ tray, refreshMenu }`. `refreshMenu` is exposed so IPC handlers (e.g. hotkey change) can re-render the menu.

### 3.4 Hotkeys — `src/main/shortcuts.js`

- Wraps `globalShortcut.register` / `unregisterAll`.
- Tracks the currently registered accelerator in module-level state.
- On re-register, unregisters the previous accelerator first.
- On failure, attempts to restore the previous accelerator.
- Throws structured errors: `INVALID_HOTKEY`, `HOTKEY_REGISTER_FAILED`.

### 3.5 Persistence — `src/main/store.js`

A single `electron-store` instance, named `refinezy`, configured with a schema and an **encryption key derived from `app.getPath("userData")`** (SHA-256 hash). The schema is the single source of truth for persisted keys.

**Schema:**

| Key | Type | Default | Purpose |
|---|---|---|---|
| `geminiApiKey` | string | `""` | BYOK (bring your own key) |
| `hotkey` | string | `DEFAULT_HOTKEY` (`"Alt+Shift+F"`) | global accelerator |
| `launchOnStartup` | boolean | `true` | login item |
| `metrics` | object | `{ refinementsMade: 0, timeSavedSeconds: 0, retriesAvoided: 0, currentStreak: 0, lastRefinementDay: null }` | "reward" / progress |
| `refinementLogs` | array | `[]` | last 500 `{ input, output, timestamp }` (capped) |
| `shareCardDismissed` | boolean | `false` | milestone popover gate |
| `dailyQuota` | object | `{ maxPerDay: 50, usedToday: 0, todayDate: null }` | resets on day rollover |
| `userName` | string | `"Rahul"` | unused in UI today |
| `theme` | string | `"system"` | unused in UI today |

**Exported helpers (all in `store.js`):**

- `getSettingsSnapshot()` — public read view (`apiKey`, `hotkey`, `launchOnStartup`, `activeModel`, `userName`, `theme`).
- `getRewardStats()` — public read view for the popover (`refinementsMade`, `timeSavedSeconds`, `retriesAvoided`, `currentStreak`, `shareCardDismissed`, `quotaExceeded`).
- `appendRefinementLog({ input, output, timestamp })` — append + cap at 500.
- `recordSuccessfulRefinement()` — increments counters, advances daily streak, persists.
- `checkAndTrackQuota()` — auto-resets on new day, returns `{ exceeded, used, max }`.
- `dismissShareCard()` — flips `shareCardDismissed` to `true`.

### 3.6 Notifications — `src/main/notifications.js`

A thin facade over a single lazy-created `toastWindow`.

- `ensureAppUserModelId()` — sets Windows toast identity (idempotent).
- `notifySuccess(message, duration = 2500)`
- `notifyError(title, message, duration = 3000)`
- `notifyWarning(title, message, persistent = false)` — used for the "Improving your workflow…" processing toast.

The actual visible window lives in `windows.js#createToastWindow`; this module owns *when* to show it.

### 3.7 Startup — `src/main/startup.js`

- `applyLaunchOnStartup(enabled)` — `app.setLoginItemSettings({ openAtLogin, openAsHidden: true })`.
- `getLaunchOnStartupState()` — read-back via `app.getLoginItemSettings()`.

### 3.8 IPC — `src/main/ipc.js`

`registerIpcHandlers({ refreshTrayMenu, registerShortcut, openSettings })` registers the following channels on `ipcMain.handle`:

| Channel | Behavior |
|---|---|
| `settings:verifyApiKey` | **Instantiates `new GeminiProvider(...)`** and runs `provider.refine("Reply only with OK")`. Returns `{ ok, error }`. |
| `app:showToast` | Forwards to `notifySuccess` / `notifyError` / `notifyWarning`. |
| `settings:get` | Returns `getSettingsSnapshot()`. |
| `settings:setApiKey` | `store.set("geminiApiKey", ...)`. |
| `settings:setLaunchOnStartup` | `store.set(...)` + `applyLaunchOnStartup(...)`. |
| `settings:setHotkey` | `registerShortcut(accelerator)` then `store.set("hotkey", ...)` + `refreshTrayMenu()`. |
| `reward:get` | Returns `{ ...getRewardStats(), hotkey, running: true }`. |
| `app:openSettings` | Calls the injected `openSettings()` callback. |

Note: the preload exposes several channels that **are not registered** in `ipc.js` today: `reward:dismissShareCard`, `reward:shareCardSeen`, `settings:dismissQuota`, `settings:setTheme`, `toast:show`, `command:refresh`, plus `setApiKey` is declared in preload but the renderer also tries to call `settings.set({ activeProvider, activeModel })` which does not exist in the preload at all (see Coupling section).

---

## 4. Renderer Process

Three independent renderer bundles, each with `contextIsolation: true` and `nodeIntegration: false`. They communicate with the main process **only** through the `window.refinezy` global defined by their preload.

### 4.1 Settings / "Command Center" — `src/renderer/settings/`

- **Largest surface (1180×780).** Self-styles as "Refinzi" (branding inconsistency: code/README says "Refinezy", HTML says "Refinzi").
- Contains: header (logo, model chip, connection chip, theme toggle), hero (shortcut badge + headline + 2 stats), AI Provider card (provider select, model select, API key input with show/hide, Test Connection, Save Key), Your Progress card (3 stats + Preview / Share), Advanced Settings (collapsible: hotkey input, launch-on-startup toggle, "Coming soon" placeholder), footer.
- Overlays: Share Card modal (PNG download via canvas, "copy image" via `navigator.clipboard.write`, share to X / LinkedIn), Milestone Card (shown when `refinementsMade % 10 === 0` and not dismissed), Onboarding modal.
- All persistence is via `window.refinezy.settings.*` and `window.refinezy.reward.*`.
- Subscribes to `window.refinezy.command.onRefresh` — a refresh signal that has no current producer in `ipc.js`.
- Theme is stored in `localStorage` under `refinezy:theme` (duplicated against the unused `store.theme` schema key).

### 4.2 Reward Popover — `src/renderer/reward/`

- Small 320×400 frameless transparent always-on-top card.
- Shows 4 stats (refinements made, time saved, retries avoided, current streak) and the current hotkey.
- Receives `reward:refresh` over IPC after each refinement (sent from `main.js`).
- Loaded by `createRewardWindow()`; positioned by `positionRewardWindowNearTray(rewardWindow, trayBounds)`; hides itself on `blur`.

### 4.3 Toast — `src/renderer/toast/`

- A 360×74 frameless transparent always-on-top **click-through** window.
- Listens for `toast:trigger` and renders a single toast at a time (replaces prior toast on new trigger).
- Auto-dismisses unless `opts.persistent` is set.
- The same window is used for success, error, warning, and the "processing" indicator.

### 4.4 Preload Bridges

`sharedPreload.js` is the bridge in active use (referenced by all three windows). It exposes:

```js
window.refinezy = {
  reward:    { get, onRefresh, dismissShareCard, shareCardSeen },
  settings:  { get, setApiKey, verifyApiKey, setLaunchOnStartup, setHotkey,
              dismissQuota, setTheme },
  toast:     { show, onShow },
  command:   { onRefresh },
  app:       { openSettings, showToast }
}
```

`settingsPreload.js` and `rewardPreload.js` are narrower alternatives (only a subset of channels) but **are not currently wired** into any `BrowserWindow` — they appear to be an abandoned refactor. The renderer never actually receives two different `window.refinezy` shapes.

---

## 5. Clipboard Flow — `src/main/clipboardFlow.js`

The clipboard flow is implemented by **driving the OS keyboard** with `@nut-tree-fork/nut-js` and then reading/writing the Electron `clipboard` module.

### 5.1 `performCopy()` (private)

```text
keyboard.pressKey(LeftControl) → pressKey(C) → releaseKey(C) → releaseKey(LeftControl)
```

A literal emulation of `Ctrl+C`.

### 5.2 `autoPaste()` (exported)

Same shape as `performCopy` but for `Ctrl+V`.

### 5.3 `autoCopySelectedText()` (exported)

The selection-capture routine, with retries.

```text
for attempt in 1..3:
    before  = clipboard.readText()            // save current clipboard
    performCopy()                             // Ctrl+C
    wait 300 ms
    after   = clipboard.readText()            // read new clipboard
    if after !== before: return after         // selection captured
// all retries exhausted
throw Error("Failed to capture selected text after 3 attempts")
    .code = "SELECTION_CAPTURE_FAILED"
```

The 300 ms wait is hardcoded. The `before !== after` diff is the only signal that something was selected — it does **not** validate that `after` originated from the user's selection vs. some other process that updated the clipboard in the meantime.

### 5.4 `readClipboardText()` / `writeClipboardText()` (exported)

- `readClipboardText()` — defensive read, returns `""` on error.
- `writeClipboardText(text)` — writes, then **re-reads to verify** the write, logs a warning on mismatch. Throws on write failure.

### 5.5 Why This Approach

The README states: *"Auto-copy is implemented by sending `Ctrl+C` to the active window using `@nut-tree/nut-js` (Windows input automation)."*

This sidesteps the lack of a true OS-level "get selected text" API but introduces fragility (see Coupling section).

---

## 6. Selection Pipeline (End-to-End)

The full path from "user presses hotkey" to "refined text pasted in place":

```text
[User has selected text in some other app]

User presses hotkey (default: Alt+Shift+F)
        │
        ▼
Electron globalShortcut fires
        │
        ▼
main.js#onHotkey()
   ├─ guard: if (isRefining) return
   ├─ isRefining = true
   ├─ await refineSelectedText({ notifySuccess, notifyError, notifyWarning })
   │       │
   │       ▼
   │   refineController.js#refineSelectedText()
   │       │
   │       ├─ readClipboardText()            // save "before"
   │       ├─ notifyWarning("Improving your workflow", "Your prompts stay on your device.", true)
   │       │     → toast window appears (persistent)
   │       │
   │       ├─ copiedText = await autoCopySelectedText()       // 3× retry Ctrl+C + read
   │       ├─ input = copiedText || readClipboardText()
   │       ├─ if (!input.trim()) throw NO_SELECTION
   │       │
   │       ├─ quota = checkAndTrackQuota()    // electron-store.dailyQuota
   │       ├─ if (quota.exceeded) throw QUOTA_EXCEEDED
   │       │
   │       ├─ apiKey = store.get("geminiApiKey")
   │       ├─ if (!apiKey) throw MISSING_API_KEY
   │       │
   │       ├─ provider = new GeminiProvider({ apiKey, systemPrompt, timeoutMs })
   │       ├─ output  = await provider.refine(input)          // network call
   │       │
   │       ├─ writeClipboardText(output)      // replace clipboard
   │       ├─ autoPaste()                     // Ctrl+V in the previous app
   │       │
   │       ├─ notifySuccess("✓ Done", 300)    // brief toast
   │       ├─ recordSuccessfulRefinement()    // metrics + streak
   │       ├─ appendRefinementLog({ input, output, timestamp })
   │       │
   │       └─ return { ok: true, input, output }
   │
   └─ finally:
        isRefining = false
        rewardWindow?.webContents.send("reward:refresh")   // popover re-fetches stats

[on error path]
   ├─ restore clipboard: writeClipboardText(before)
   ├─ notifyError("Couldn't refine this selection.", errMsg, 3000)
   └─ return { ok: false, error: errMsg }
```

### Sequence of Side Effects

1. **Clipboard "before" is saved**, so we can restore it on failure.
2. **A persistent "processing" toast** appears immediately.
3. The active foreground app receives a synthetic `Ctrl+C` keystroke.
4. The OS clipboard now holds the selection.
5. A single HTTPS request is made to Gemini.
6. Clipboard is overwritten with the result.
7. The active foreground app receives a synthetic `Ctrl+V` keystroke.
8. **On success:** success toast (300 ms), metrics persisted, popover refreshed.
9. **On any error:** clipboard restored to `before`, error toast (3000 ms), no metrics update, no popover refresh.

### Error Codes Emitted

| Code | Source | Trigger |
|---|---|---|
| `NO_SELECTION` | refineController | empty input |
| `QUOTA_EXCEEDED` | refineController | daily limit |
| `MISSING_API_KEY` | refineController or GeminiProvider | no key in store / no key on provider |
| `EMPTY_INPUT` | GeminiProvider | empty `text` arg |
| `EMPTY_OUTPUT` | GeminiProvider | Gemini returned no text |
| `SELECTION_CAPTURE_FAILED` | clipboardFlow | 3× failed Ctrl+C capture |

---

## 7. Current Gemini Integration

### 7.1 The Abstraction — `src/main/ai/AIProvider.js`

```js
export class AIProvider {
  // throws on direct instantiation — abstract
  constructor({ apiKey, systemPrompt, timeoutMs }) { ... }
  async refine(text, opts = {}) { throw "Not implemented" }
}
```

- Stores `apiKey`, `systemPrompt`, `timeoutMs` on `this`.
- Subclass must override `refine(text, opts)`.
- `opts` is documented to support `{ signal: AbortSignal }` — **but no concrete implementation honors it today**.

### 7.2 The Concrete — `src/main/ai/GeminiProvider.js`

```js
export class GeminiProvider extends AIProvider {
  static MODEL = "gemini-2.5-flash";

  constructor(opts) {
    super(opts);
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async refine(text, opts = {}) {
    // validate apiKey, validate non-empty text
    const response = await this.client.models.generateContent({
      model: GeminiProvider.MODEL,
      contents: `${this.systemPrompt}\n\nInstruction:\n${text}`
    });
    return response.text;
  }
}
```

### 7.3 What It Does

- Uses `@google/genai` (the newer Google GenAI SDK), even though `@google/generative-ai` is also declared in `package.json` (the older SDK is unused).
- Sends a single non-streaming `generateContent` call.
- The `model` field is the **hardcoded** `GeminiProvider.MODEL = "gemini-2.5-flash"`. The model that the user picks in the Settings UI (`gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-1.5-flash`, `gemini-1.5-pro`) is **never read** by the provider.
- The system prompt comes from `constants.js#SYSTEM_PROMPT` and is prefixed to the user input, separated by `\n\nInstruction:\n`.
- `timeoutMs` is stored on `this` but **never enforced** — there is no `AbortController`, no `Promise.race` with a timeout, no SDK-level `signal` passed to `generateContent`. The README's "Requests abort after 5 seconds" claim is false; the constant is `REFINE_TIMEOUT_MS = 15000` in the code.
- No streaming, no JSON mode, no tools/functions, no multimodal, no usage metadata, no retry/backoff, no rate-limit handling.
- Errors are rethrown with extra JSON-stringified logging. The SDK's own error structure is not normalized into typed `code` values.

### 7.4 What `systemPrompt` Says

`constants.js`:

> You are an invisible writing copilot. Preserve intent, maintain length (≤+20% for large inputs), natural polish, clean output (no markdown, no code fences, no bullets unless present), output-only text, no explanations.

This is a string literal — there is no way for the user to customize it without editing code.

---

## 8. Existing Services (Quick Reference)

| Module | Role | Public API |
|---|---|---|
| `main.js` | app lifecycle, hotkey dispatch, window refs | — |
| `windows.js` | `BrowserWindow` factory + positioning | `createSettingsWindow`, `createRewardWindow`, `createToastWindow`, `showToast`, `positionRewardWindowNearTray` |
| `tray.js` | tray icon + menu | `createTray({...})` → `{ tray, refreshMenu }` |
| `shortcuts.js` | global hotkey register | `registerHotkey`, `unregisterAllHotkeys` |
| `store.js` | persistent state + metrics + quota | `store`, `getSettingsSnapshot`, `getRewardStats`, `appendRefinementLog`, `recordSuccessfulRefinement`, `checkAndTrackQuota`, `dismissShareCard` |
| `notifications.js` | toast facade | `ensureAppUserModelId`, `notifySuccess`, `notifyError`, `notifyWarning` |
| `ipc.js` | `ipcMain.handle` registrations | `registerIpcHandlers` |
| `clipboardFlow.js` | OS keyboard + clipboard | `autoCopySelectedText`, `autoPaste`, `readClipboardText`, `writeClipboardText` |
| `refineController.js` | end-to-end refine pipeline | `refineSelectedText` |
| `startup.js` | login item | `applyLaunchOnStartup`, `getLaunchOnStartupState` |
| `ai/AIProvider.js` | abstract base class | `class AIProvider` |
| `ai/GeminiProvider.js` | Gemini implementation | `class GeminiProvider` (with `static getModelName`) |
| `constants.js` | shared constants | `APP_NAME`, `DEFAULT_HOTKEY`, `SYSTEM_PROMPT`, `REFINE_TIMEOUT_MS` |
| `sharedPreload.js` | contextBridge for all windows | `window.refinezy.*` |
| `settingsPreload.js` | narrower bridge (unused) | `window.refinezy.settings.*` |
| `rewardPreload.js` | narrower bridge (unused) | `window.refinezy.reward.*` |

---

## 9. Current Coupling Points

This is the "where will it hurt when we change things" map. Each item is a real, observed coupling in the current code.

### 9.1 Concrete AI class is imported in three places

- `src/main/refineController.js` — `import { GeminiProvider } from "./ai/GeminiProvider.js"` and `new GeminiProvider({...})`.
- `src/main/ipc.js` — `import { GeminiProvider } from "./ai/GeminiProvider.js"` and `new GeminiProvider({...})` inside `settings:verifyApiKey`.
- `src/main/main.js` — `import { GeminiProvider } from "./ai/GeminiProvider.js"` and `new GeminiProvider({...})` inside `onDebugTestGemini`.

The abstract `AIProvider` base class is never used as a type, never registered in a factory, never injected. Every call site hard-codes the Gemini class. **There is no swap-in for OpenAI / Anthropic**, even though the Settings UI lists them as "coming soon".

### 9.2 `store.js` depends on `GeminiProvider`

`src/main/store.js` imports `GeminiProvider` purely to call `GeminiProvider.getModelName()` in `getSettingsSnapshot()`. The **persistence layer** is therefore coupled to the **AI layer** — switching providers would require touching the store schema/snapshot.

### 9.3 Hardcoded model name

`GeminiProvider.MODEL = "gemini-2.5-flash"` is a `static` field. The Settings UI offers four models in a `<select>` and calls `settings.set({ activeModel: model })`, but:
- There is no IPC handler for `settings:set { activeModel }`.
- There is no read of any `activeModel` / `activeProvider` key from the store during `refine()`.
- The provider always uses its hardcoded model.

The UI is effectively a no-op with respect to model choice.

### 9.4 Hardcoded system prompt

`SYSTEM_PROMPT` in `constants.js` is baked into every `GeminiProvider` instance at construction. The schema has no `systemPrompt` key, the IPC has no `setPrompt` channel, the UI has no prompt editor. Changing the prompt requires a code edit.

### 9.5 `timeoutMs` is dead state

`AIProvider` accepts `timeoutMs`, `GeminiProvider` stores it on `this`, but **no code path ever uses it** — no `AbortController`, no `Promise.race`, no SDK signal. The README's "Requests abort after 5 seconds" claim is false; the actual constant is `REFINE_TIMEOUT_MS = 15000`. The user has no way to cancel an in-flight refinement.

### 9.6 Duplicated `isRefining` guard

`let isRefining = false` is declared in **both** `main.js` and `refineController.js`. They are not the same variable — they are two independent module-level flags guarding the same logical action. A second hotkey press during a long network call is rejected by the controller, but a separate programmatic call to `refineSelectedText` would not see the main.js flag.

### 9.7 `refineController` is a single linear function

`refineController.js#refineSelectedText` is one ~100-line `try/catch/finally` that does, in order: clipboard backup, toast, capture, validation, quota, key fetch, provider construction, network call, clipboard write, paste, success toast, metrics, logging. There is no separation of phases, no event emission, no plug-in points. Adding a new step (e.g. "show diff before paste", "log to file", "stream response") requires editing this one function.

### 9.8 Direct store reads in the controller

`refineController.js` reads `store.get("geminiApiKey")` directly. The store schema key names are baked into the controller. There is no repository / DAO layer between the controller and `electron-store`.

### 9.9 Two Gemini SDKs in `package.json`

`@google/genai` (^2.7.0) is the one actually used. `@google/generative-ai` (^0.24.1) is declared but never imported anywhere in `src/`. Dead dependency, plus two valid-but-different APIs floating around.

### 9.10 Renderer hardcodes the model list

`src/renderer/settings/renderer.js#handleProviderChange` lists the four Gemini models inline:

```js
const models = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-pro",   label: "Gemini 2.5 Pro"   },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-1.5-pro",   label: "Gemini 1.5 Pro"   }
];
```

The list is **not** sourced from the provider or from any IPC call. Adding a model requires editing the renderer (and the dropdown `<option>` tags in `index.html` already shadow this list). The HTML and the JS are out of sync on this surface.

### 9.11 Brand-name drift

- `package.json`, `package-lock.json`, `main.js`, `windows.js`, `tray.js`, README: **"Refinezy"**.
- `src/renderer/settings/index.html` (multiple places, including `<title>Refinzi</title>` and the footer / hero / share modal labels): **"Refinzi"**.
- The user-facing name shown in the Command Center does not match the app metadata or the executable name.

### 9.12 Preload split with no consumer

Three preload files exist (`sharedPreload.js`, `settingsPreload.js`, `rewardPreload.js`) but `windows.js` references only `sharedPreload.js` for every window. The two narrower bridges are dead code that will mislead future readers into thinking they are wired up.

### 9.13 Renderer calls IPC channels that don't exist

The Settings renderer calls:

- `window.refinezy.settings.set({ activeProvider })` — **no such method** in any preload.
- `window.refinezy.settings.set({ activeModel })` — **no such method** in any preload.
- `window.refinezy.command.onRefresh(...)` — `ipcMain` never emits `command:refresh`.
- `window.refinezy.reward.dismissShareCard()` — preload exposes it, but `ipcMain` has **no handler** for `reward:dismissShareCard`.
- `window.refinezy.toast.show(...)` and `toast:show` — no main-side handler.

These silently no-op (the preload's `invoke` rejects and the renderer `.catch(() => {})` swallows it). The error path is invisible in production.

### 9.14 Clipboard capture is fragile

`autoCopySelectedText()` infers "user has selected text" by:

1. Reading the current clipboard (`before`).
2. Sending `Ctrl+C` to the focused app.
3. Waiting 300 ms.
4. Reading the clipboard again (`after`).
5. Returning `after` if it differs from `before`.

Failure modes this does not handle:

- Another process wrote to the clipboard between (1) and (4) — `after !== before` will be true even though no selection was made.
- The focused app does not implement `Ctrl+C` (e.g. some custom widgets, terminals) — `after === before` triggers an unnecessary retry, then `SELECTION_CAPTURE_FAILED`.
- The selection is identical to the prior clipboard content — treated as a failure.
- The active app is the Reward popover or Settings window — `Ctrl+C` is fired into Refinezy's own UI; the clipboard is overwritten with the wrong text.

There is no input-event-based capture, no accessibility / UI Automation fallback, and no signal to distinguish "no selection" from "selection not copyable".

### 9.15 Auto-paste fires into the wrong window

`autoPaste()` is called from `refineController` *after* `notifyWarning` is dismissed, but if the user has switched focus during the network call (very possible on a 15 s timeout), `Ctrl+V` lands wherever focus currently is — not where the selection came from. The Refinezy reward popover and Settings window are both candidates for receiving the paste.

### 9.16 `main.js` mixes lifecycle, hotkey, and debug

`main.js` is 194 lines. It owns: app lifecycle, window references, tray wiring, IPC registration, hotkey registration, and four debug menu handlers. The debug handlers (especially `onDebugTestGemini`, which constructs a provider) leak test code into production paths.

### 9.17 `windows.js` knows about tray geometry

`positionRewardWindowNearTray(rewardWindow, trayBounds)` lives in `windows.js` but is called from `main.js` with a `tray.getBounds()` value. The "window" module is doing display-relative geometry; the boundary between window factory and tray positioning is fuzzy.

### 9.18 Theme state lives in two places

- `electron-store` schema has a `theme: "system"` key — **never read or written** by anyone.
- Renderer uses `localStorage.getItem("refinezy:theme")` exclusively.

A future "sync settings across devices" or "load settings from main" will collide with the existing renderer-only theme.

### 9.19 Metrics are computed twice

`recordSuccessfulRefinement()` increments `refinementsMade` by 1 and `retriesAvoided` by `1.7` (a fractional constant) and `timeSavedSeconds` by 40 — all hardcoded. The renderer then computes `rewritesAvoided = count * 2` independently and displays it in the hero. The same number is fabricated in two different code paths, with different multipliers.

### 9.20 Quota is enforced in one place only

`checkAndTrackQuota()` is called inside `refineController.js`, **after** the selection has already been captured. The capture, the clipboard write, and the `Ctrl+V` paste are **not** undone if the quota is exceeded. The user gets a `Ctrl+V` of stale clipboard content and a quota error toast, which is a confusing UX.

### 9.21 No cancellation / no streaming

The flow is a single `await` chain. There is no `AbortController` passed through, no streaming token surfaced to the UI, no partial result handling. The 15-second "timeout" that isn't actually a timeout is the only cap on how long the UI is dark.

### 9.22 Renderer ↔ main schema is untyped

IPC channel names, payload shapes, and return values are scattered string literals across:
- `ipc.js` (handler side)
- `sharedPreload.js` (bridge side)
- `renderer/settings/renderer.js`, `renderer/reward/renderer.js`, `renderer/toast/renderer.js` (caller side)

A rename or signature change requires touching all three layers with no compile-time check.

---

## 10. Summary: What the App Actually Is

- **One tray icon.** One hotkey. One network call to Gemini per press.
- **Three windows** that exist only to (a) configure the hotkey / API key, (b) show four vanity stats, (c) flash a toast.
- **One pipeline** that simulates copy → calls Gemini → simulates paste, with a try/catch that restores the clipboard on failure.
- **One persistence file** (encrypted `electron-store`) holding the API key, hotkey, startup flag, metrics, refinement log, and quota.
- **One hardcoded AI implementation** behind an unused abstract base, with a hardcoded model name, a hardcoded system prompt, a dead timeout field, and a dead second SDK in `package.json`.

The architecture is functional but **maximally coupled**: every layer knows the names in every other layer, the abstract base is decorative, the UI's "model picker" and "provider picker" are no-ops, and the clipboard pipeline has no way to tell the user's selection from a coincidence.

### Natural Refactor Axes (for the next iteration)

1. **AI provider boundary** — turn `AIProvider` into a real injected dependency with a registry / factory. Move the `systemPrompt` and `model` out of the provider and into the call site. Read them from the store. Honor `timeoutMs` via `AbortController`. Honor the documented `opts.signal`.
2. **Pipeline decomposition** — split `refineSelectedText` into named phases (capture → validate → quota → invoke → write → paste → notify → log) so each can be tested and composed.
3. **IPC contract** — define a single source of truth (e.g. a `channels.js` with `invoke` / `handle` paired declarations, or generated types) and remove the dead preload files and dead handlers.
4. **Selection acquisition** — replace the `Ctrl+C` + diff heuristic with something deterministic (UI Automation, or a more explicit capture flow), and gate auto-paste on "the focus is still where it was when we copied".
5. **Rendered state** — collapse the three preloads into one. Have a single `settings` view that reads the actual model list from the provider. Stop storing the theme in two places.

---

*End of document.*
