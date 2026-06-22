# History Feature Audit (HISTORY-AUDIT-001)

## 1. Feature Verification Checklist

| Requirement | Status | Notes |
| :--- | :--- | :--- |
| **1. Maximum entries stored** | ✅ Verified | Hard-capped at 500 entries (`logs.slice(logs.length - 500)`). |
| **2. Persistence across app restart** | ✅ Verified | Saved to disk via `electron-store` under the `refinementLogs` key. |
| **3. Performance after 500+ refinements** | ⚠️ Warning | 500 entries are processed at once and injected as a massive HTML string (`.map().join("")`). No virtualization or pagination exists. IPC serialization of 500 full text logs could cause UI stutter. |
| **4. Search capability** | ❌ Missing | No search bar or logic implemented. |
| **5. Copy previous result** | ❌ Missing | No copy button or functionality. |
| **6. Re-run previous refinement** | ❌ Missing | No capability to re-run past tasks. |
| **7. Delete history item** | ❌ Missing | No individual delete capability. |
| **8. Clear all history** | ✅ Verified | Implemented via `window.refinzi.logs.clear()`. |
| **9. Export history** | ❌ Missing | No export logic exists. |

---

## 2. Risk Assessment

> [!CAUTION]
> **Data Corruption & Critical Crash Risk**
> Both `orbWindow.js` and `refineController.js` append to the EXACT SAME storage key (`refinementLogs`), but they use completely different schemas:
> - `refineController.js` stores: `{ input, output, timestamp }`
> - `orbWindow.js` stores: `{ mode, artifactType, success, inputLength, provider, ... }`
> 
> Because `renderer.js` assumes the schema has `input` and `output`, when it encounters an entry from `orbWindow.js`, `log.input.substring(0, 100)` will throw a `TypeError: Cannot read properties of undefined (reading 'substring')`. **This will permanently crash the History UI** for the user until they manually wipe the store file.

> [!WARNING]
> **Privacy Risk**
> `refineController.js` stores the full raw text of the user's input and the AI output directly to disk. This is a significant privacy risk and contradicts the ambient marketing promise of "Your data stays on your device/unlogged" unless explicitly consented to by the user via an opt-in toggle.

> [!WARNING]
> **Memory & IPC Overhead**
> At 500 entries, if each log contains 10KB of raw input/output text, `window.refinzi.logs.get()` will serialize and transmit 5MB+ over IPC simultaneously, which will block the main thread and spike memory usage.

---

## 3. UX Issues
1. **Broken State Handling:** If a log entry is missing `input` or `output`, the UI throws an exception and fails to render instead of failing gracefully.
2. **Missing Interactivity:** The history list is entirely static text. Users expect at least a "Copy" button to retrieve lost outputs.
3. **No Empty State Design:** When empty, it displays a raw `<p>No history yet.</p>` instead of a styled placeholder that matches the premium aesthetics of the app.
4. **Massive Scroll List:** The `logsContainer` has `max-height: 300px`. Dumping 500 unstructured items into a 300px box with no search/filter makes navigation impossible.

---

## 4. Recommended v1 Scope
To stabilize the feature for a V1 release, the following should be implemented:

1. **Schema Separation:** Separate telemetry and history. `orbWindow.js` metadata should log to a `telemetryLogs` key, and `refineController` should log strictly to a `historyLogs` key.
2. **Defensive Rendering:** Update the `renderer.js` map function to handle undefined inputs safely: `(log.input || "").substring(0, 100)`.
3. **Privacy Opt-In:** Implement a toggle in Settings: "Save History Locally" (defaulting to off) before storing raw input/output text.
4. **Basic Actions:** Add a "Copy" and "Delete" icon to each history item. (Search, Re-run, and Export can be pushed to v2).
5. **Pagination/Virtualization:** Restrict the initial load to the last 50 items and implement a "Load More" button to prevent IPC thread-blocking.
