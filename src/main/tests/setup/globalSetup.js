/**
 * globalSetup.js
 * Global Vitest setup file. Mocks Electron, electron-store, nut-js, and
 * child_process before any test file imports source modules.
 *
 * IMPORTANT: This file must be plain JavaScript (not TypeScript) to ensure
 * reliable loading as a vitest setup file.
 */

import { vi } from "vitest";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDataDir = path.resolve(__dirname, "..", "..", "..", "..", "test-data");

// ─── electron-store ───────────────────────────────────────────────────────────
vi.mock("electron-store", () => {
    return {
        default: class MockStore {
            constructor(opts = {}) {
                this.opts = opts;
                this._data = new Map();
            }
            get(key, def) {
                return this._data.has(key) ? this._data.get(key) : def;
            }
            set(key, val) {
                this._data.set(key, val);
            }
            delete(key) {
                this._data.delete(key);
            }
            get path() {
                return "/mock/refinzi.json";
            }
        },
    };
});

// ─── electron ─────────────────────────────────────────────────────────────────
vi.mock("electron", () => ({
    app: {
        getPath: () => "/mock/userData",
        getVersion: () => "0.0.0",
        getName: () => "Refinzi",
        requestSingleInstanceLock: () => true,
        setLoginItemSettings: vi.fn(),
        getLoginItemSettings: () => ({ openAtLogin: false }),
        on: vi.fn(),
        quit: vi.fn(),
        whenReady: () => Promise.resolve(),
    },
    BrowserWindow: vi.fn(() => ({
        loadFile: vi.fn(),
        show: vi.fn(),
        hide: vi.fn(),
        showInactive: vi.fn(),
        focus: vi.fn(),
        isVisible: vi.fn().mockReturnValue(false),
        isFocused: vi.fn().mockReturnValue(false),
        getPosition: vi.fn().mockReturnValue([0, 0]),
        getSize: vi.fn().mockReturnValue([220, 120]),
        setPosition: vi.fn(),
        setSize: vi.fn(),
        on: vi.fn(),
        webContents: { send: vi.fn(), openDevTools: vi.fn() },
        destroy: vi.fn(),
        isMinimized: vi.fn().mockReturnValue(false),
        restore: vi.fn(),
        setIgnoreMouseEvents: vi.fn(),
        setAlwaysOnTop: vi.fn(),
        setVisibleOnAllWorkspaces: vi.fn(),
        setSkipTaskbar: vi.fn(),
        setResizable: vi.fn(),
        setMaximizable: vi.fn(),
        setMinimizable: vi.fn(),
        setClosable: vi.fn(),
    })),
    clipboard: {
        readText: vi.fn().mockReturnValue(""),
        writeText: vi.fn(),
        read: vi.fn(),
        write: vi.fn(),
        clear: vi.fn(),
    },
    screen: {
        getCursorScreenPoint: vi.fn().mockReturnValue({ x: 960, y: 540 }),
        getPrimaryDisplay: vi.fn().mockReturnValue({
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            workArea: { x: 0, y: 0, width: 1920, height: 1040 },
        }),
        getAllDisplays: vi.fn().mockReturnValue([
            { bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
        ]),
    },
    ipcMain: {
        handle: vi.fn(),
        on: vi.fn(),
        removeAllListeners: vi.fn(),
        removeHandler: vi.fn(),
    },
    ipcRenderer: {
        invoke: vi.fn(),
        on: vi.fn(),
        send: vi.fn(),
        removeAllListeners: vi.fn(),
    },
    globalShortcut: {
        register: vi.fn().mockReturnValue(true),
        unregister: vi.fn(),
        unregisterAll: vi.fn(),
        isRegistered: vi.fn().mockReturnValue(true),
    },
    contextBridge: { exposeInMainWorld: vi.fn() },
    Menu: {
        buildFromTemplate: vi.fn().mockReturnValue({ popup: vi.fn() }),
        setApplicationMenu: vi.fn(),
    },
    nativeImage: {
        createFromPath: vi.fn().mockReturnValue({
            resize: vi.fn().mockReturnThis(),
            toDataURL: vi.fn().mockReturnValue("data:image/png;base64,"),
            getSize: vi.fn().mockReturnValue({ width: 16, height: 16 }),
        }),
        createEmpty: vi.fn().mockReturnValue({}),
    },
    dialog: { showMessageBox: vi.fn(), showSaveDialog: vi.fn() },
    Notification: vi.fn(),
    Tray: vi.fn().mockReturnValue({
        setToolTip: vi.fn(),
        setContextMenu: vi.fn(),
        on: vi.fn(),
        displayBalloon: vi.fn(),
    }),
    session: {
        defaultSession: { setPermissionRequestHandler: vi.fn() },
    },
}));

// ─── @nut-tree-fork/nut-js ────────────────────────────────────────────────────
vi.mock("@nut-tree-fork/nut-js", () => ({
    keyboard: {
        pressKey: vi.fn().mockResolvedValue(undefined),
        releaseKey: vi.fn().mockResolvedValue(undefined),
    },
    Key: new Proxy({}, { get: (_t, p) => p }),
}));

// ─── child_process ────────────────────────────────────────────────────────────
vi.mock("child_process", () => ({
    exec: vi.fn((_cmd, cb) => {
        if (cb) cb(null, "false|0|");
    }),
}));