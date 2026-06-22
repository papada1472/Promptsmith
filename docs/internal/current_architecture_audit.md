# Current Architecture Audit: AI Request Pipeline

This document provides a comprehensive technical audit of the complete end-to-end AI request pipeline in Refinzi. It traces the operational flow of a single refinement action, lists every file participating in the pipeline, and identifies all hardcoded Google Gemini dependencies that must be decoupled to support a provider-agnostic architecture.

---

## 1. End-to-End Pipeline Trace

The refinement pipeline transitions through six distinct phases: from the user's physical input to the automated paste of the polished result.

```
[User Action]
      │ (globalShortcut fires)
      ▼
[Selection Capture]
      │ (Ctrl+C sequence automated via @nut-tree-fork/nut-js)
      ▼
[Prompt Construction]
      │ (Quota/API checks + constant prompt combination)
      ▼
[Gemini API Call]
      │ (googleGenAI client.models.generateContent)
      ▼
[Response Handling]
      │ (Response verification or error clipboard recovery)
      ▼
[Auto Paste & UI Update]
        (Ctrl+V sequence automated, stats logged, and IPC refresh dispatched)
```

### Phase 1: User Action
* **Trigger:** The user selects text in any third-party active Windows application and presses the global hotkey (default: `Alt+Shift+F`), or triggers refinement from the tray context menu (Debug menu).
* **Shortcut Capturing (`src/main/shortcuts.js`):** The global accelerator is registered in Electron's `globalShortcut` registry. When pressed, the registry triggers the registered anonymous wrapper function, which logs the accelerator and delegates execution to `onHotkey` in `src/main/main.js`.
* **Locking Guard (`src/main/main.js`):** `onHotkey` checks `isRefining` (a module-level boolean flag). If a refinement is already in progress, the keypress is discarded immediately. If free, it sets `isRefining = true` and invokes `refineSelectedText()` in `src/main/refineController.js`.

### Phase 2: Selection Capture
* **State Preservation (`src/main/refineController.js`):** The orchestrator reads and caches the current OS clipboard contents using `readClipboardText()` from `src/main/clipboardFlow.js` to ensure the user's clipboard can be restored if the request fails.
* **Ambient Feedback (`src/main/notifications.js`):** To preserve flow, Refinzi displays a persistent "processing" toast: `notifyWarning("Improving your workflow", "Your prompts stay on your device.", true)` which creates the `toastWindow` if it is not already initialized, rendering the toast at the top-center of the primary display.
* **Input Capture & Retries (`src/main/clipboardFlow.js`):**
  1. `refineSelectedText` calls `autoCopySelectedText()`.
  2. `autoCopySelectedText` initiates an iterative loop (up to 3 attempts, spaced with 300 ms delays).
  3. In each attempt, it reads the current clipboard contents (`before`), then calls `performCopy()`.
  4. `performCopy()` utilizes `@nut-tree-fork/nut-js` to simulate direct Windows keystroke events: press `LeftControl` -> press `C` -> release `C` -> release `LeftControl`.
  5. It sleeps for 300 ms, then reads the clipboard again (`after`).
  6. If `after !== before`, it declares success and returns the new text immediately.
  7. If the text has not changed after 3 attempts, it throws a `SELECTION_CAPTURE_FAILED` error.
* **Empty Input Guard (`src/main/refineController.js`):** If the capture routine fails or returns blank text, the controller falls back to the static clipboard text (`copiedText || readClipboardText()`). If the resulting string contains only whitespace, the controller throws a `NO_SELECTION` error.

### Phase 3: Prompt Construction
* **Validation & Quota Checks (`src/main/refineController.js`):**
  1. The controller runs `checkAndTrackQuota()` from `src/main/store.js`.
  2. If the user has exhausted their limit (default: 50 per day), it throws a `QUOTA_EXCEEDED` error.
  3. The controller fetches the API key from storage (`store.get("geminiApiKey")`). If missing, it throws a `MISSING_API_KEY` error.
* **Provider Instantiation (`src/main/refineController.js`):** It creates an instance of `GeminiProvider` using the configured API key, `SYSTEM_PROMPT` from `src/main/constants.js`, and the hardcoded timeout length `REFINE_TIMEOUT_MS` (15,000 ms).
* **Payload Assembly (`src/main/ai/GeminiProvider.js`):** Inside `GeminiProvider.js`, the final prompt payload is constructed using a string template combining the system instructions and the input selection:
  ```js
  contents: `${this.systemPrompt}\n\nInstruction:\n${text}`
  ```

### Phase 4: Gemini API Call
* **SDK Invocation (`src/main/ai/GeminiProvider.js`):** The provider instantiates a new `@google/genai` client:
  ```js
  this.client = new GoogleGenAI({ apiKey: this.apiKey });
  ```
  It issues an asynchronous request to the Google GenAI SDK:
  ```js
  const response = await this.client.models.generateContent({
    model: GeminiProvider.MODEL, // Hardcoded as "gemini-2.5-flash"
    contents: promptText
  });
  ```
* **Timeout Ignored:** Though `timeoutMs` is retrieved and passed, it is **never implemented**. No `AbortController` or custom request wrapper is used to enforce the 15-second cutoff, resulting in potential hangs on slow network connections.

### Phase 5: Response Handling
* **Verification (`src/main/ai/GeminiProvider.js`):** The response is inspected. If `response.text` is empty, it throws an `EMPTY_OUTPUT` error.
* **Error Catch & Rollback (`src/main/refineController.js`):** If any error is thrown during capture, validation, or the API call:
  1. The controller catches the exception and logs the error code.
  2. It restores the user's previous clipboard content by writing the cached `before` state back to the clipboard using `writeClipboardText(before)`.
  3. It fires an error notification using `notifyError("Couldn't refine this selection.", errMsg, 3000)`.
  4. It releases the refinement lock (`isRefining = false`).

### Phase 6: Auto Paste & UI Update
* **Clipboard Write & Verification (`src/main/clipboardFlow.js`):**
  On success, `refineSelectedText` invokes `writeClipboardText(output)`. This function writes the refined text to the OS clipboard, then immediately re-reads it. If there is a mismatch, a console warning is emitted.
* **Keystroke Automation (`src/main/clipboardFlow.js`):**
  The controller triggers `autoPaste()`, which uses `@nut-tree-fork/nut-js` to drive paste keystrokes: press `LeftControl` -> press `V` -> release `V` -> release `LeftControl`.
* **Visual Success (`src/main/notifications.js`):** The processing notification is replaced with a success toast: `notifySuccess("✓ Done", 300)`.
* **Telemetry & History (`src/main/store.js`):**
  1. `recordSuccessfulRefinement()` increments the user's total refinements, calculates streak progression, and saves the metrics to the store.
  2. `appendRefinementLog()` pushes `{ input, output, timestamp }` into the history array in `store.js` (capped at 500 items).
* **Window Update Trigger (`src/main/main.js`):** Once execution concludes, the `finally` block in `onHotkey` notifies the reward popover to refresh:
  ```js
  rewardWindow?.webContents.send("reward:refresh");
  ```
  This prompts the popover's renderer process to fetch the newly recorded stats and update the UI.

---

## 2. Participating Files

The following files compose the complete refinement pipeline:

### Core Main Process
1. **`src/main/main.js`**
   * Handles the Electron lifecycle, global shortcut bindings, and wires context-menu triggers.
2. **`src/main/shortcuts.js`**
   * Wraps Electron's `globalShortcut` API to register, unregister, and clean up accelerators.
3. **`src/main/refineController.js`**
   * Acts as the transactional controller that coordinates the flow, manages the refinement lock, and performs rollback on error.
4. **`src/main/clipboardFlow.js`**
   * Manages low-level OS keystroke simulation and contains defensive clipboard reading, writing, and verification helpers.
5. **`src/main/store.js`**
   * Backed by `electron-store`. Manages encryption, configuration retrieval, daily quota tracking, streak logic, and refinement history logs.
6. **`src/main/constants.js`**
   * Defines constant values including `DEFAULT_HOTKEY`, `SYSTEM_PROMPT` (the core refinement system prompt), and `REFINE_TIMEOUT_MS`.
7. **`src/main/ipc.js`**
   * Houses `ipcMain.handle` registrations which connect frontend requests (e.g. key verification) to the backend.

### Providers & Abstractions
8. **`src/main/ai/AIProvider.js`**
   * The abstract base class that establishes the shared constructor interface and the abstract `refine(text, opts)` signature.
9. **`src/main/ai/GeminiProvider.js`**
   * The concrete implementation of `AIProvider` that couples to the Google GenAI SDK.

### UI & Notifications
10. **`src/main/windows.js`**
    * Generates the settings, reward, and toast BrowserWindows and contains positioning algorithms.
11. **`src/main/notifications.js`**
    * Serves as a main-process interface that dispatches configurations to the toast window.
12. **`src/preload/sharedPreload.js`**
    * The context-bridge script that exposes safe IPC channels to the three renderers under `window.refinzi`.
13. **`src/renderer/settings/renderer.js`**
    * Houses frontend handlers for saving keys, toggles, and model selections.
14. **`src/renderer/settings/index.html`**
    * Contains the markup and dropdown selectors for models and providers.

---

## 3. Gemini Dependencies & Coupling points

To introduce a fully provider-agnostic, modular, and extensible architecture, several explicit Gemini dependencies must be refactored and decoupled:

### 1. Concrete Class Import & Coupling (`src/main/refineController.js`)
* **Coupling Point:** `refineController.js` directly imports `GeminiProvider` and instantiates it.
* **Refactor Required:** The controller should not have compile-time knowledge of specific providers. It must delegate provider instantiation to an abstract registry, factory, or `ProviderManager` service.

### 2. Main Process Hardcoded Verification (`src/main/ipc.js`)
* **Coupling Point:** The `settings:verifyApiKey` IPC handler is hardcoded to instantiate `new GeminiProvider` and invoke its refinement process.
* **Refactor Required:** Create a generic key verification flow that routes through a unified `ProviderManager` based on the active provider selection.

### 3. Inflexible Settings Schema (`src/main/store.js`)
* **Coupling Point:** The `electron-store` schema defines a key specifically named `geminiApiKey`. 
* **Refactor Required:** The schema must be expanded to support multiple keys (e.g. `openRouterApiKey`) or refactored to hold a generic credentials object.

### 4. Broken Model/Provider Persistency Sync (`src/main/store.js` & `src/renderer/settings/renderer.js`)
* **Coupling Point:**
  * The frontend settings page contains model and provider selectors. When changed, `renderer.js` attempts to invoke `window.refinzi.settings.set(...)`.
  * However, `set` does not exist in `sharedPreload.js`. This results in a silent caught `TypeError`, preventing selections from ever being saved.
  * In addition, `store.js` does **not** include `activeProvider` or `activeModel` in its schema.
  * To obtain the active model, `store.js`'s `getSettingsSnapshot()` hardcodes:
    ```js
    activeModel: GeminiProvider.getModelName() // Always returns "gemini-2.5-flash"
    ```
* **Refactor Required:**
  * Add `activeProvider` and `activeModel` to the schema in `store.js`.
  * Expose a generic `setSettings` IPC handler and wire it into the `sharedPreload.js` bridge.
  * Dynamically load the active model and active provider rather than hardcoding.

### 5. SDK Exposure in Providers
* **Coupling Point:** The concrete provider utilizes `@google/genai` directly.
* **Refactor Required:** Ensure all SDK dependencies are strictly contained within their respective provider files. No SDK-specific structures should ever leak into `refineController.js` or `ipc.js`.

### 6. UI Hardcoding (`src/renderer/settings/index.html` & `renderer.js`)
* **Coupling Point:** The model options (e.g., `gemini-2.5-flash`, `gemini-2.5-pro`) and provider selections are hardcoded within the HTML and the frontend dropdown mapping code in `renderer.js`.
* **Refactor Required:** Models and providers should be dynamically queried from the main process over IPC (e.g., `settings:getAvailableProviders` and `settings:getAvailableModels`) based on registered providers.
