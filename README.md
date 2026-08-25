# Promptsmith 🔮

> **Transform raw clipboard text and rough thoughts into razor-sharp, expert-level AI prompts with an ambient desktop companion.**

Promptsmith is a lightweight, ambient Windows desktop utility built for AI power users, developers, and creators. Powered by **Google Gemini** and **OpenRouter**, Promptsmith sits quietly in your system tray or as an elegant floating Orb widget—ready to capture, analyze, and optimize your prompts on the fly without breaking your workflow.

---

## ✨ Key Features

- 🛸 **Floating Orb Companion & Global Hotkeys** — Trigger instant prompt refinement anywhere across Windows with a single shortcut (`Ctrl + Alt + Space` or custom keybinding).
- 🧠 **Intelligent Multi-Stage Prompt Engineering** — Deconstructs vague intentions, enriches context, and expands instructions into structured, high-clarity prompts for LLMs (Claude, GPT-4, Gemini, DeepSeek, etc.).
- 🧩 **Smart Artifact Classification** — Automatically recognizes code snippets, technical requirements, creative drafts, and system prompts to tailor refinement templates.
- 🔑 **BYOK (Bring Your Own Key) Vault** — Complete privacy with secure local credential storage. Plug in your own Google Gemini or OpenRouter API keys.
- ⚡ **Zero-Friction Workflow** — Auto-copies selected text, refines via AI, and syncs directly back to your clipboard with clean notification feedback.
- 🎨 **Sleek Glassmorphism Interface** — Built with modern dark-mode aesthetics, fluid micro-animations, and minimal CPU/memory footprint.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Windows 10 / 11

### Installation & Development

```bash
# 1. Clone the repository
git clone https://github.com/papada1472/Promptsmith.git

# 2. Navigate to project directory
cd Promptsmith

# 3. Install dependencies
npm install

# 4. Start the application in development mode
npm run dev
```

---

## 🛠️ Usage

1. Open **Settings** from the tray menu or Orb to configure your preferred AI provider (Gemini or OpenRouter API Key).
2. Select any rough text or task prompt in any application (e.g. VS Code, browser, Notepad).
3. Press `Ctrl + Alt + Space` (or click the floating Orb).
4. Promptsmith refines your text in seconds and places the engineered prompt right into your clipboard, ready to paste (`Ctrl + V`).

---

## 📦 Building the Standalone Installer

To build an optimized Windows `.exe` installer (NSIS):

```bash
npm run dist
```
The compiled installer will be saved to the `dist/` directory.

---

## 🛡️ Architecture & Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/)
- **AI Integrations**: Google Gemini SDK (`@google/genai`), OpenRouter API
- **OS Automation**: `@nut-tree-fork/nut-js`
- **Testing**: [Vitest](https://vitest.dev/)
- **Storage**: `electron-store` with encrypted BYOK vault

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
