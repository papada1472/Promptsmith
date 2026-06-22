# History V1 Stabilization

Stabilize the History feature for a V1 release with schema separation, defensive rendering, privacy opt-in, basic actions (copy/delete), and pagination.

## Proposed Changes

### 1. Schema Separation — Telemetry vs. History

Currently both `orbWindow.js` (telemetry metadata) and `refineController.js` (input/output history) write to the **same** `refinementLogs` store key, mixing concerns and producing entries with incompatible shapes.

#### [MODIFY] [store.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/main/store.js)
- Add two new store keys replacing the single `refinementLogs`:
  - `telemetryLogs` — array, default `[]` — for orbWindow metadata events
  - `historyLogs` — array, default `[]` — for refineController input/output records
- Keep `refinementLogs` in schema temporarily for migration (read-once, then clear)

#### [MODIFY] [orbWindow.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/main/orbWindow.js)
- Change `logAnalyticsEvent()` to write to `telemetryLogs` instead of `refinementLogs`

#### [MODIFY] [metricsService.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/main/services/metricsService.js)
- `appendLog()` → write to `historyLogs` instead of `refinementLogs`
- `getLogs()` → read from `historyLogs`
- `clearLogs()` → clear `historyLogs`
- Add `getTelemetryLogs()` and `clearTelemetryLogs()` for the telemetry side

---

### 2. Defensive Rendering

#### [MODIFY] [renderer.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/renderer/settings/renderer.js)
- In `loadHistory()`, change:
  ```diff
  - ${log.input.substring(0, 100)}
  + ${(log.input || "").substring(0, 100)}
  ```
  ```diff
  - ${log.output.substring(0, 100)}
  + ${(log.output || "").substring(0, 100)}
  ```
- Also guard `log.timestamp` against undefined

---

### 3. Privacy Opt-In Toggle

#### [MODIFY] [store.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/main/store.js)
- Add `saveHistoryLocally` boolean, default `false`

#### [MODIFY] [settingsService.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/main/services/settingsService.js)
- Include `saveHistoryLocally` in `getSettings()` return

#### [MODIFY] [metricsService.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/main/services/metricsService.js)
- `appendLog()` checks `store.get("saveHistoryLocally")` — if `false`, skip storing input/output

#### [MODIFY] [index.html](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/renderer/settings/index.html)
- Add a "Save History Locally" toggle in the settings panel (Advanced or its own section)

#### [MODIFY] [renderer.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/renderer/settings/renderer.js)
- Wire the toggle to `settings:set` with `{ saveHistoryLocally: <bool> }`
- Show a hint: "When off, refinement history is not stored. Telemetry metadata is always stored."

---

### 4. Basic Actions — Copy & Delete per History Item

#### [MODIFY] [renderer.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/renderer/settings/renderer.js)
- Render a Copy (📋) and Delete (🗑️) icon button on each history item
- Copy: writes `log.output` to clipboard via `navigator.clipboard.writeText()`
- Delete: calls a new IPC `logs:delete` with the item index/timestamp

#### [MODIFY] [ipc.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/main/ipc.js)
- Add `logs:delete` handler → calls `metricsService.deleteLog(index)`

#### [MODIFY] [sharedPreload.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/preload/sharedPreload.js)
- Expose `logs.delete(index)` in the `refinzi.logs` namespace

#### [MODIFY] [metricsService.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/main/services/metricsService.js)
- Add `deleteLog(index)` method — removes entry by index from `historyLogs`

---

### 5. Pagination — Load Last 50 + "Load More"

#### [MODIFY] [ipc.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/main/ipc.js)
- Change `logs:get` to accept an optional `{ offset, limit }` parameter
- Default: `offset = 0, limit = 50`, returns most recent items first

#### [MODIFY] [metricsService.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/main/services/metricsService.js)
- `getLogs({ offset, limit })` — returns a paginated slice from the end of the array + a `hasMore` flag

#### [MODIFY] [sharedPreload.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/preload/sharedPreload.js)
- Update `logs.get()` to accept optional pagination params

#### [MODIFY] [renderer.js](file:///e:/Antigravity%20Projects/Refinezy/refinezy-desktop/src/renderer/settings/renderer.js)
- Track `currentOffset` state
- Initial load: fetch last 50
- Render a "Load More" button if `hasMore === true`
- Append older items on click, increment offset

---

## Verification Plan

### Manual Verification
1. **Schema separation**: After app restart, confirm `telemetryLogs` and `historyLogs` are separate keys in the store JSON
2. **Defensive rendering**: Insert a log entry with `null` input/output, confirm no crash
3. **Privacy toggle**: Confirm toggling "Save History Locally" off prevents new history entries while telemetry still logs
4. **Copy/Delete**: Click copy on a history item → verify clipboard. Click delete → verify item removed
5. **Pagination**: Generate 60+ history entries, confirm only 50 load initially, "Load More" fetches the rest
