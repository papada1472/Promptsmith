# Refactor Notes

> Working document for the Refinezy codebase. Documents hardcoded references, duplication, UI/business-logic mixing, and provider abstraction boundaries.
> This file is **not code** — it is a design-review reference for the next refactor pass.

---

## 1. Hardcoded Gemini References

Every file where the string "Gemini" or "gemini" appears as a literal — not as a variable name, not as a user-visible label that belongs there.

### 1.1 Source files

| File | Line(s) | What is hardcoded | Why it's a problem |
|---|---|---|---|
| `src/main/ai/GeminiProvider.js` | 5 | `static MODEL = "gemini-2.5-flash"` | Single source of truth for the model. Cannot be overridden at construction, at runtime, or by the user. |
| `src/main/ai/GeminiProvider.js` | 26 | `static getModelName()` returns the hardcoded `MODEL` | `store.js` calls this to populate `activeModel`. The "active model" is always the hardcoded default. |
| `src/main/ai/GeminiProvider.js` | 37 | `GeminiProvider.MODEL` in the `generateContent` call | The actual network call uses the hardcoded model. The user's dropdown selection is never read. |
| `src/main/store.js` | 5 | `import { GeminiProvider } from "./ai/GeminiProvider.js"` | The persistence layer directly imports the concrete AI class solely to call `GeminiProvider.getModelName()`. |
| `src/main/store.js` | 68 | `activeModel: GeminiProvider.getModelName()` | `getSettingsSnapshot()` returns a computed "activeModel" that is always the hardcoded default. |
| `src/main/refineController.js` | 2 | `import { GeminiProvider } from "./ai/GeminiProvider.js"` | Controller directly imports the concrete class. |
| `src/main/refineController.js` | 50 | `store.get("geminiApiKey")` | Reads the provider-specific key name from the store. |
| `src/main/refineController.js` | 52 | `"No Gemini API key configured..."` | User-visible error message names Gemini explicitly. |
| `src/main/refineController.js` | 58 | `new GeminiProvider({ apiKey, systemPrompt, timeoutMs })` | Constructs the provider inline using hardcoded constants. |
| `src/main/ipc.js` | 5 | `import { GeminiProvider } from "./ai/GeminiProvider.js"` | IPC handler imports the concrete class. |
| `src/main/ipc.js` | 12 | `new GeminiProvider({ apiKey, systemPrompt, timeoutMs })` | Constructs provider for API-key verification. Same hardcoded constants. |
| `src/main/main.js` | 10 | `import { GeminiProvider } from "./ai/GeminiProvider.js"` | Main process imports the concrete class for a debug handler. |
| `src/main/main.js` | 93 | `new GeminiProvider({ apiKey, systemPrompt, timeoutMs })` | Debug handler constructs a provider — same triple-import problem. |
| `src/main/main.js` | 99 | `provider.refine("Reply only with OK")` | Hardcoded test prompt for the debug menu. |
| `src/main/main.js` | 100 | `` `Gemini: ${response.substring(0, 100)}` `` | User-visible debug string names "Gemini". |

### 1.2 Renderer files (Settings UI)

| File | Line(s) | What is hardcoded | Why it's a problem |
|---|---|---|---|
| `src/renderer/settings/renderer.js` | 274-279 | Inline model list: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-1.5-flash`, `gemini-1.5-pro` | Not sourced from IPC or the provider. Adding a model requires editing JS *and* HTML separately. |
| `src/renderer/settings/renderer.js` | 326 | `modelSelect.value = settings.activeModel \|\| "gemini-2.5-flash"` | Fallback default hardcoded. |
| `src/renderer/settings/renderer.js` | 338 | `modelBadge.textContent = settings.activeModel \|\| "gemini-2.5-flash"` | Same fallback repeated. |
| `src/renderer/settings/renderer.js` | 370 | `if (provider === "gemini")` | Provider name is a string literal; would need updating for each new provider. |
| `src/renderer/settings/renderer.js` | 290 | `settings.activeProvider \|\| "gemini"` | Default provider hardcoded in JS. |
| `src/renderer/settings/index.html` | 110 | `<option value="gemini">Google AI Studio</option>` | Provider value hardcoded in HTML. |
| `src/renderer/settings/index.html` | 119-123 | `<option value="gemini-2.5-flash">` etc. | Model options hardcoded in HTML, duplicating the JS list. |

### 1.3 Dead dependency

| File | Line | What | Why |
|---|---|---|---|
| `package.json` | 20 | `"@google/generative-ai": "^0.24.1"` | Old Google AI SDK. Never imported anywhere in `src/`. Dead dependency. The actual SDK used is `@google/genai` (line 19). |

### 1.4 Summary

**54 literal hits** across `.js` files and **5 hits** across `.html` files:
- 4 files in `src/main/` import `GeminiProvider` directly (`store.js`, `refineController.js`, `ipc.js`, `main.js`).
- 3 of those 4 construct `new GeminiProvider(...)` using the same hardcoded constants.
- 2 files in `src/renderer/` hardcode the model list (JS array + HTML `<option>` tags).

---

## 2. Duplicated API Calls

### 2.1 `new GeminiProvider(...)` — constructed 3 times in 3 files

Each construction reads the same store key, uses the same constants, and creates a fresh `GoogleGenAI` client.

| Site | File | Line | Purpose |
|---|---|---|---|
| A | `refineController.js` | 58 | Production refinement |
| B | `ipc.js` | 12 | `settings:verifyApiKey` — "Test Connection" button |
| C | `main.js` | 93 | Debug menu: `onDebugTestGemini` |

**What's duplicated:** `apiKey` read, `systemPrompt`, `timeoutMs`, constructor shape.

**What's unique:** Site A runs the full pipeline; Sites B and C both run `refine("Reply only with OK")`.

**Fix direction:** A single `createProvider(apiKey?)` factory function. Sites B and C share a `verifyApiKey(provider)` helper.

### 2.2 `recordSuccessfulRefinement()` + `appendRefinementLog()` — two store write cycles

In `refineController.js` lines 81–86, each function does `get → mutate → set` independently. Two encrypted disk writes for one success event. Could be a single `recordSuccess({ input, output })`.

### 2.3 `checkAndTrackQuota()` + `recordSuccessfulRefinement()` — sequential independent writes

`checkAndTrackQuota()` writes `dailyQuota` at line 40. `recordSuccessfulRefinement()` writes `metrics` at line 81. Could be a single `consumeQuotaAndRecord()`.

### 2.4 Fallback defaults repeated across 5 locations

`"gemini-2.5-flash"` appears as fallback in:
1. `GeminiProvider.js:5` — `static MODEL`
2. `store.js:68` — `getModelName()` reads from `MODEL`
3. `renderer.js:326` — `modelSelect.value` fallback
4. `renderer.js:338` — `modelBadge.textContent` fallback
5. `renderer.js:402` — initial refresh fallback

If `MODEL` changes, the renderer still falls back to the old string.

### 2.5 `settings.activeProvider` / `settings.activeModel` — read but never persisted

The renderer reads these from `getSettingsSnapshot()`. The IPC layer has no handlers for writing them. The keys don't exist in the electron-store schema. The renderer calls `settings.set(...)` but the preload doesn't expose that method. All writes silently fail.

---

## 3. Files That Mix UI and Business Logic

### 3.1 `src/main/refineController.js` — the worst offender

One ~100-line `try/catch/finally` that mixes:
- **OS automation:** clipboard read/write, Ctrl+C, Ctrl+V
- **UI notifications:** `notifyWarning`, `notifySuccess`, `notifyError`
- **Business logic:** input validation, quota check, AI provider construction, network call
- **Data access:** `store.get("geminiApiKey")`, `recordSuccessfulRefinement()`, `appendRefinementLog()`

### 3.2 `src/main/main.js` — lifecycle + everything else

194 lines mixing:
- App lifecycle (`app.whenReady`, `before-quit`, `will-quit`)
- Window management (`settingsWindow`, `rewardWindow`)
- Tray creation and wiring
- IPC handler registration
- Hotkey registration and handler
- Debug menu handlers that construct AI providers and read clipboard directly

### 3.3 `src/main/ipc.js` — IPC + business logic

- `settings:verifyApiKey` constructs a `new GeminiProvider(...)` and calls `provider.refine(...)` — AI verification embedded in IPC wiring.
- `settings:setHotkey` calls `registerShortcut(...)` + `store.set(...)` + `refreshTrayMenu()` — shortcut registration, persistence, and UI refresh all inline.
- `settings:setLaunchOnStartup` calls `store.set(...)` + `applyLaunchOnStartup(...)` — persistence and OS integration mixed.

### 3.4 `src/main/store.js` — data + AI + UI-shape logic

- **Pure data:** schema, `appendRefinementLog`, `checkAndTrackQuota`, `dismissShareCard`
- **AI coupling:** `import { GeminiProvider }` for `getModelName()`
- **UI-shape concerns:** `getSettingsSnapshot()` returns `{ activeModel: GeminiProvider.getModelName() }` — shaped for the settings window. `getRewardStats()` returns `{ refinementsMade, timeSavedSeconds, ... }` — shaped for the reward popover DOM.

The data layer should not know what shape the UI wants.

### 3.5 `src/renderer/settings/renderer.js` — 550 lines, many concerns

Mixes:
- 60+ DOM ref declarations
- Theme management (localStorage)
- Toast notifications (IPC)
- Share card population, PNG generation via canvas, copy-image-to-clipboard, share-to-X, share-to-LinkedIn
- API key management, visibility toggle
- Connection testing (IPC)
- Provider/model selection handlers
- Advanced settings collapse
- Data refresh (fetches both `reward.get()` and `settings.get()`)
- Save handlers for key, launch, hotkey
- Onboarding modal
- Milestone card

The PNG/social-sharing functions are pure client-side with no main-process coupling and belong in a separate file.

---

## 4. Provider Abstraction Boundaries

### 4.1 Current abstraction shape

```
AIProvider (abstract)          src/main/ai/AIProvider.js   (24 lines)
  └─ GeminiProvider (concrete) src/main/ai/GeminiProvider.js (63 lines)
```

`AIProvider` contract: `{ apiKey, systemPrompt, timeoutMs }` + `refine(text, opts)`
`GeminiProvider` adds: `static MODEL`, `GoogleGenAI` client, hardcoded model in `generateContent`.

### 4.2 What's broken about it

| Issue | Current state | What the abstraction should own |
|---|---|---|
| Model | `static MODEL` — hardcoded on the class | Constructor parameter. The provider instance should not decide which model the user wants. |
| Prompt | Passed at construction, always from `constants.js` | Correct concept, but never from the store. Should be caller-provided per-refinement. |
| Timeout | Stored as `this.timeoutMs`, **never used** | Should create an `AbortController` from `timeoutMs` and pass its `signal` to the SDK. |
| `getModelName()` | Static, called from `store.js` | Provider should not expose static metadata for UI consumption. |
| Error structure | Ad-hoc `.code` on thrown errors | Should define a standard `RefineError` type with `code`, `message`, `cause`. |

### 4.3 Target abstraction architecture

```
ORCHESTRATION (refineController)
   reads clipboard → validates → quota → factory.create() → provider.refine() → writes → pastes → notifies → logs
         │
         ▼
AI BOUNDARY (ProviderFactory — NEW)
   reads store: activeProvider, apiKey, model, prompt
   instantiates AIProvider subclass from registry
   provides listProviders(), listModels()
         │
         ▼
AI PROVIDERS
   GeminiProvider { model, apiKey, timeout, signal }
   OpenAIProvider { model, apiKey, timeout, signal }     (future)
   AnthropicProvider { model, apiKey, timeout, signal }  (future)
```

**The factory eliminates 3× duplication** and becomes the single place where:
- Provider config is read from the store.
- Provider class is resolved from a registry.
- Model list is assembled for the UI.
- Default prompt is loaded.

### 4.4 IPC layer after refactoring

Today `ipc.js` mixes IPC registration with AI verification and OS integration.

Target: IPC layer becomes a thin router that delegates to service modules:

```
ipc.js                  — registers channels, delegates to services
services/
  providerService.js    — create(), verify(), listModels(), listProviders()
  settingsService.js    — get(), setApiKey(), setHotkey(), setLaunchOnStartup()
  rewardService.js      — getStats(), dismissShareCard()
```

### 4.5 Renderer model/provider discovery

Today the renderer hardcodes the model list. After refactoring:

```
renderer → ipc: "settings:getAvailableProviders"
main → ProviderFactory.listProviders()
  → [{ id: "gemini", label: "Google AI Studio", models: [...] }]

renderer → ipc: "settings:getAvailableModels" (with provider arg)
main → ProviderFactory.listModels("gemini")
  → [{ id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" }, ...]
```

The renderer no longer knows which providers exist. Adding a new provider means registering it in `providerRegistry.js`.

---

## 5. Additional Findings

### 5.1 Dead preload files

`src/preload/settingsPreload.js` and `src/preload/rewardPreload.js` exist but are not referenced by any `BrowserWindow` in `windows.js`. All three windows use `sharedPreload.js`. These are dead code.

### 5.2 Dead IPC channels (preload declares, no handler registered)

| Preload channel | Declared in `sharedPreload.js` | Handler in `ipc.js` |
|---|---|---|
| `reward:dismissShareCard` | Yes | Missing |
| `reward:shareCardSeen` | Yes | Missing |
| `settings:dismissQuota` | Yes | Missing |
| `settings:setTheme` | Yes | Missing |
| `toast:show` | Yes | Missing |
| `command:refresh` | Yes | Missing |

These silently fail — the renderer's `.catch(() => {})` swallows the rejections.

### 5.3 Dead store keys

| Store key | In schema | Read | Written |
|---|---|---|---|
| `userName` (default: `"Rahul"`) | Yes | Never | Never |
| `theme` (default: `"system"`) | Yes | Never | Never |

Schema-only keys with no read/write path.

### 5.4 Metrics inconsistency

`recordSuccessfulRefinement()` computes `retriesAvoided += 1.7`. The renderer computes `rewritesAvoided = count * 2`. Same metric, two different formulas, both arbitrary.

### 5.5 Brand name split

| Location | Name |
|---|---|
| `package.json`, `main.js`, `tray.js`, `README.md` | Refinezy |
| `src/renderer/settings/index.html` (title, hero, footer) | Refinzi |

---

## 6. Prioritized Refactor Recommendations

| Priority | Item | Effort | Impact |
|---|---|---|---|
| 1 | Add `AbortController` timeout to `GeminiProvider.refine()` | Low | Stops the 15s hang on slow networks |
| 2 | Move model to constructor param (not static field) | Low | First step toward user-selectable models |
| 3 | Create `ProviderFactory` that reads store config | Medium | Eliminates 3x duplication; enables multi-provider |
| 4 | Remove dead deps (`@google/generative-ai`, dead preloads) | Low | Reduces confusion; smaller bundle |
| 5 | Unify metrics computation | Low | Removes data-integrity bug |
| 6 | Register all missing IPC handlers or remove from preload | Low | Stops silent failures |
| 7 | Merge `recordSuccessfulRefinement` + `appendRefinementLog` | Low | Reduces disk I/O |
| 8 | Extract `refineSelectedText` into named phases | Medium | Makes pipeline testable and extensible |
| 9 | Move AI construction out of IPC/main.js into shared factory | Medium | Proper separation of concerns |
| 10 | Resolve brand name (Refinezy vs Refinzi) | Low | One source of truth |

---

*End of document.*