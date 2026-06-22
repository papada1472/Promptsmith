# Refinzi (Windows Desktop Utility)

Refinzi is a lightweight background tray utility (not a chatbot, not a web app) that refines selected text into **expert-level AI instructions** using the Gemini API.

## Core Flow

Select text anywhere → press `Ctrl + Alt + Space` → Refinzi auto-copies → sends to Gemini → replaces clipboard → Windows notification: **✓ Refined instruction copied**

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run:

```bash
npm run dev
```

3. Open **Settings** from the tray menu and set your **Gemini API Key**.

## Success Test

1. Open Notepad
2. Type: `Build login system`
3. Select the text
4. Press `Ctrl + Alt + Space`
5. Wait < 3 seconds
6. Paste anywhere — the refined instruction should be on your clipboard

## Build Windows EXE (Installer)

```bash
npm run dist
```

The installer will be created in `dist/`.

## Notes

- Auto-copy is implemented by sending `Ctrl + C` to the active window using `@nut-tree/nut-js` (Windows input automation).
- Requests abort after **5 seconds** and show a notification on timeout.

