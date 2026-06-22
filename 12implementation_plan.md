# Refinzi Beta Simplification Plan (Grammarly for AI prompts)

This plan outlines the changes to simplify Refinzi to a single core job: helping users send better prompts to ChatGPT, Claude, and Gemini directly in-place.

---

## User Review Required

> [!IMPORTANT]
> **Active Element Validation & Keyboard Automation**: 
> - We will use Windows UI Automation via PowerShell to check if the active focused element is indeed editable (like a textbox, combobox, or document area). This validation runs in **~250ms**, ensuring excellent performance.
> - For text reading and writing, we will simulate standard keyboard shortcuts (`Ctrl+A` then `Ctrl+C` to copy, and `Ctrl+A` then `Ctrl+V` to replace). This approach guarantees **100% web application compatibility** and ensures all web-page Javascript change handlers (React, Vue, Svelte) are correctly triggered, which is not possible when modifying DOM properties directly.

> [!IMPORTANT]
> **No Modals, Side Panels, or Alternative Angles**: 
> - The prompt modal window (`outputModalWindow`) and drag-and-drop file processing are disabled/hidden. The interaction becomes strictly click-and-replace or hold-and-replace.

> [!IMPORTANT]
> **In-Place Undo (REF-015)**:
> - We will implement a global hotkey `Ctrl+Alt+Z` and a right-click Orb context menu containing **Undo Last Refinement**.
> - When triggered, it will inspect the focused field. If editable, it will replace the text with the pre-refinement prompt and show a toast: `↩ Refinement Undone`.

---

## Proposed Changes

### Main Process

#### [MODIFY] [store.js](file:///e:/Antigravity%20Projects/Refinezy/Refinzi%202.0/src/main/store.js)
- Add `onboardingSeen` boolean schema property (defaulting to `false`) to track if the user has completed onboarding.
- Add `lastRefinement` object schema property (defaulting to `null`) to persist the undo state across short runs:
  ```json
  {
    "before": "...",
    "after": "...",
    "timestamp": "..."
  }
  ```

#### [MODIFY] [main.js](file:///e:/Antigravity%20Projects/Refinezy/Refinzi%202.0/src/main/main.js)
- On startup, do **not** open the Settings window (stays tray-first).
- Register the global hotkey `Ctrl+Alt+Z` to trigger `undoLastRefinement()`.
- Register the global hotkey `Ctrl+Alt+Space` (or current hotkey) to trigger inline refinement.

#### [MODIFY] [clipboardFlow.js](file:///e:/Antigravity%20Projects/Refinezy/Refinzi%202.0/src/main/clipboardFlow.js)
- **Add** `checkActiveElementIsEditable()`:
  - Executes a fast, lightweight PowerShell command using Windows UI Automation to verify if the focused element is editable (e.g. `ControlType.Edit`, `ControlType.ComboBox`, or `ControlType.Document` excluding read-only host windows).
- **Add** `captureActivePrompt()`:
  - Backs up the clipboard.
  - Simulates `Ctrl+A` followed by `Ctrl+C`.
  - Reads the copied text and restores the original clipboard content.
- **Add** `replaceActivePrompt(newText)`:
  - Writes `newText` to the clipboard.
  - Simulates `Ctrl+A` followed by `Ctrl+V` to overwrite the text.
  - Restores the original clipboard content.

#### [MODIFY] [orbWindow.js](file:///e:/Antigravity%20Projects/Refinezy/Refinzi%202.0/src/main/orbWindow.js)
- Update `orb:clicked` handler:
  1. Validate if the active element is editable using `checkActiveElementIsEditable()`.
  2. If not, trigger a warning toast: `⚠️ Focus a textbox to improve prompt` (and do not run AI pipeline).
  3. If editable, copy the prompt using `captureActivePrompt()`. If empty, trigger toast: `⚠️ Focus a textbox and type a prompt`.
  4. Run the refinement pipeline asynchronously, measuring `duration_ms`.
  5. Replace the text in-place using `replaceActivePrompt()`.
  6. Store the pre-refinement and post-refinement state to `store.set("lastRefinement", { before, after, timestamp })`.
  7. Trigger success toast:
     - Sparkle Mode (Click): `✨ Prompt Improved`
     - Gold Mode (Hold): `🧠 Expert Prompt Created`
- **Add** IPC handler `orb:contextmenu` to show a context menu with options:
  - `Undo Last Refinement` (disabled if `lastRefinement` is null)
  - `Open Dashboard`
  - `Quit`
- **Add** `undoLastRefinement()` implementation:
  1. Verify the active element is editable. If not, show warning toast.
  2. Replace content in-place with `lastRefinement.before`.
  3. Set `lastRefinement` to `null`.
  4. Show toast: `↩ Refinement Undone`.
- Simplify `logAnalyticsEvent()` to record **strictly** and **only** the required keys:
  ```json
  {
    "mode": "sparkle" | "gold",
    "success": true,
    "prompt_length_before": number,
    "prompt_length_after": number,
    "duration_ms": number,
    "timestamp": string
  }
  ```
  - Ensure zero user text, prompt contents, or PII is recorded.
- Remove drop handler action trigger (make it block/ignore dropping to avoid opening modals).

#### [MODIFY] [refineController.js](file:///e:/Antigravity%20Projects/Refinezy/Refinzi%202.0/src/main/refineController.js)
- Update the hotkey refinement flow to perform the same editable check, active prompt capture, in-place prompt replacement, and `lastRefinement` storage.
- Update telemetry logging to follow the simplified analytics structure including `duration_ms`.

#### [MODIFY] [promptEngineer.js](file:///e:/Antigravity%20Projects/Refinezy/Refinzi%202.0/src/main/output/promptEngineer.js)
- Update `buildPreserveSystemPrompt` and `buildExpertSystemPrompt` system prompts to incorporate:
  - **Prompt Length Guardrail (REF-OE-011)**: Only add complexity when it improves output quality. Do not inflate prompt length unnecessarily. A simple request should remain simple.
  - **Smart Skip (REF-OE-012)**: If prompt quality is already high, make minimal improvements. Avoid rewriting for the sake of rewriting.

#### [MODIFY] [constants.js](file:///e:/Antigravity%20Projects/Refinezy/Refinzi%202.0/src/main/constants.js)
- Update the default fallback `SYSTEM_PROMPT` to incorporate the same `REF-OE-011` and `REF-OE-012` guardrails.

---

### Renderer Process (Orb Window)

#### [MODIFY] [index.html](file:///e:/Antigravity%20Projects/Refinezy/Refinzi%202.0/src/renderer/orb/index.html)
- Add a `#onboarding-card` element that will serve as the mini onboarding card inside the Orb window if `onboardingSeen` is false.
  - Title: **Refinzi**
  - **✨ Click**: Improve Prompt
  - **🧠 Hold**: Create Expert Prompt
  - **📍 Drag**: anywhere
  - **⌨ Shortcut**: Ctrl+Alt+Space
  - Button: **Got It**

#### [MODIFY] [renderer.js](file:///e:/Antigravity%20Projects/Refinezy%202.0/src/renderer/orb/renderer.js)
- Read `onboardingSeen` from settings / store.
- If `false`, hide the standard status bubble, resize the window to `240x260` via `window.refinzi.orb.resize()`, and display the `#onboarding-card`.
- When the "Got It" button is clicked:
  - Set `onboardingSeen: true` in the store.
  - Hide the onboarding card.
  - Resize the window back to its default size (`220x120`).
  - Show the standard status bubble with the cycling hints.
- Modify suggestion rotation to cycle between usage instructions instead of file types:
  1. `✨ Click to Improve Prompt`
  2. `🧠 Hold to Create Expert Prompt`
  3. `⌨ Ctrl + Alt + Space to Improve`
  4. `📍 Drag Orb anywhere`
- Remove drop listener execution logic (block file drop processing).
- Add right-click listener `contextmenu` to trigger the IPC context menu event `orb:contextmenu`.

---

### Renderer Process (Toast Window)

#### [MODIFY] [renderer.js](file:///e:/Antigravity%20Projects/Refinezy/Refinzi%202.0/src/renderer/toast/renderer.js)
- Simplify toast element construction. Render a single text block directly from `opts.message`, removing separate headers, titles, and icons.

#### [MODIFY] [styles.css](file:///e:/Antigravity%20Projects/Refinezy%202.0/src/renderer/toast/styles.css)
- Update `.toast` CSS to display as a minimal, pill-like toast (e.g. `border-radius: 20px`, centered, padding `8px 16px`) shown beautifully at the top of the screen.

---

## Verification Plan

### Automated Tests
- Run `npm start` to launch the application.

### Manual Verification
1. **In-Orb Onboarding verification**: Delete store cache, start application. Verify Orb window displays immediately with the mini onboarding card and Got It button. Click "Got It", verify card closes, Orb resizes back to `220x120` and starts suggestion rotation.
2. **Idle State**: Verify suggestion bubble below Orb cycles through instructions (`✨ Click to Improve...`, etc.).
3. **Validation & Sparkle (Click)**:
   - Focus a text field in ChatGPT/Claude/Gemini, type a prompt, click Sparkle Orb. Verify bubble shows `✨ Improving...`, prompt is rewritten directly inside the textbox, and toast shows `✨ Prompt Improved` for 2 seconds.
   - Click background of webpage (no text focus), click Sparkle Orb. Verify prompt does not run, and toast shows warning.
4. **Gold (Hold)**:
   - Focus textbox, type prompt, press-and-hold Orb. Verify morphs to brain, runs, replaces text in-place, and shows `🧠 Expert Prompt Created` success toast.
5. **Undo**:
   - Perform a refinement. Press `Ctrl+Alt+Z` or right-click the Orb and click `Undo Last Refinement`. Verify the prompt reverts to the original pre-refinement text and shows `↩ Refinement Undone`.
6. **Hotkey**:
   - Focus textbox, press `Ctrl+Alt+Space` (or current hotkey `Alt+Shift+F`), verify runs and replaces in-place.
7. **Guardrails**:
   - Focus textbox, type `"Translate this to Hindi"`. Click Sparkle Orb. Verify it does not inflate length unnecessarily (remains a simple request).
   - Focus textbox, type a highly structured PM instruction. Click Sparkle Orb. Verify minimal (Smart Skip) changes.
8. **Analytics**:
   - Check `telemetryLogs` in store database. Verify entries follow the exact simplified structure containing `duration_ms`, mode, success, and length metrics with no prompt text or PII.
