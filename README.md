# Refinzi 2.0 ⚡

> **Ambient Windows desktop execution layer that transforms rough thoughts and unrefined prompts into production-grade AI prompts and architectural blueprints in 2 seconds.**

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011%20(64--bit)-blue.svg)](https://refinzi.com)
[![Version](https://img.shields.io/badge/Version-2.0.0-emerald.svg)](https://github.com/papada1472/refinzi/releases/tag/v2.0.0)
[![GitHub stars](https://img.shields.io/github/stars/papada1472/refinzi?style=social)](https://github.com/papada1472/refinzi)
[![GitHub forks](https://img.shields.io/github/forks/papada1472/refinzi?style=social)](https://github.com/papada1472/refinzi/fork)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Website](https://img.shields.io/badge/Website-refinzi.com-cyan.svg)](https://refinzi.com)
[![VirusTotal](https://img.shields.io/badge/VirusTotal-0%2F72%20Clean-success.svg)](https://refinzi.com)

> ⭐ **If you find Refinzi useful, please star the repository — it helps more developers and creators discover the project!**

Refinzi is a lightweight, high-performance ambient Windows utility built for developers, AI power users, and creators. Powered by multi-provider intelligence (**Google Gemini**, **Anthropic Claude**, **OpenAI**, **DeepSeek**, and **OpenRouter**), Refinzi sits quietly in your system tray or as an ultra-sleek floating Orb companion—ready to capture, analyze, and rebuild your prompts on the fly without breaking your focus.

---

## ⚡ Why Refinzi?

| Feature | ❌ Traditional Workflow | 🌐 Web Prompt Builders | ⚡ Refinzi 2.0 |
| :--- | :--- | :--- | :--- |
| **Workflow Friction** | Alt+Tab, copy-paste 5 times | Open browser tab, paste, copy back | **1-Click on Orb (`Ctrl+Alt+Space`) in-place** |
| **Synthesis Speed** | 2–5 minutes manual typing | 10–20 seconds | **< 2 seconds (Sub-200ms cache)** |
| **Output Scaffolding** | Wall of unstructured text | Generic templates | **5-Block UI & Prompt Architecture Specs** |
| **Privacy & Keys** | Stored on third-party cloud | Cloud databases | **100% Local DPAPI (AES-256) Encryption** |
| **AI Providers** | Locked to 1 provider | High markup subscriptions | **Zero-Markup BYOK (DeepSeek, Claude, Gemini, OpenAI)** |

---

## ✨ Key Features

- 🛸 **Ambient Floating Orb & Hotkeys** — 1-Click prompt refinement anywhere across Windows (`Ctrl + Alt + Space` or click the Orb).
- 🏗️ **5-Block Architectural Blueprint Engine** — Long-press the Orb (300ms) or press `Ctrl + Alt + B` to generate complete, structured specifications:
  1. **Structure & Hierarchy**: Component layout, responsive constraints, semantic DOM.
  2. **Component Assets & Tokens**: HSL color ramps, typography scales, glassmorphism tokens.
  3. **High-Converting Copy Hooks**: Headlines, body copy, sub-bullets, and CTA variations.
  4. **Motion & Interaction Curves**: Bézier curves, transition choreographies, entry springs.
  5. **Implementation Prompt Pack**: Formatted for Cursor rules, Claude code, ChatGPT, or v0.
- 🧠 **Multi-Provider AI Lineup (BYOK)** — Connect your own API keys directly with 0% markup:
  - **Google Gemini**: Gemini 2.5 Flash, 2.5 Pro, 2.0 Flash
  - **Anthropic**: Claude 3.5 Sonnet, Claude 3.7 Sonnet
  - **OpenAI**: GPT-4o, GPT-4o mini, o1, o3-mini
  - **DeepSeek**: DeepSeek-V3, DeepSeek-R1 (Reasoning)
  - **OpenRouter**: Access 300+ open-source and proprietary models (Llama 3.3, Qwen 2.5, Nemotron)
- 🛡️ **Zero-Log Privacy Vault** — 100% client-side execution. API keys are encrypted locally using Windows DPAPI / AES-256 with zero cloud telemetry.
- ⚡ **Seamless In-Place Insertion** — Automatically captures highlighted text, synthesizes the engineered prompt, and inserts or copies directly to your clipboard in under 2 seconds.
- 🎨 **Obsidian Glassmorphism Control Center** — Modern dark-mode interface with live model switching, latency telemetry, and customizable shortcuts.

---

## 🚀 Quick Start

### 📥 Direct Download (Windows Standalone)
Download the latest Windows installer:  
👉 **[Download Refinzi-Setup-v2.0.0.exe](https://github.com/papada1472/refinzi/releases/download/v2.0.0/Refinzi-Setup-v2.0.0.exe)** *(Windows 10 / 11 64-bit)*

---

### 💻 Local Development Setup

#### Prerequisites
- Node.js (v18+)
- Windows 10 or 11

```bash
# 1. Clone the repository
git clone https://github.com/papada1472/refinzi.git

# 2. Navigate to project directory
cd refinzi

# 3. Install dependencies
npm install

# 4. Start the application in development mode
npm run dev
```

---

## 🛠️ Usage

1. **Configure Provider**: Open **Settings** from the tray icon or Orb to enter your API key (Gemini, OpenAI, Anthropic, DeepSeek, or OpenRouter).
2. **Select & Transform**: Highlight any prompt or rough task in any Windows application (VS Code, Browser, Slack, Cursor, etc.).
3. **Trigger**:
   - **Click the Orb** (or press `Ctrl + Alt + Space`): Instantly refines the prompt in-place.
   - **Hold the Orb for 300ms** (or press `Ctrl + Alt + B`): Generates a 5-Block Blueprint.
4. **Paste & Execute**: Paste your calibrated prompt (`Ctrl + V`) directly into ChatGPT, Claude, Midjourney, Cursor, or v0.

---

## 🧪 Testing & Validation

Run the comprehensive unit test suite:

```bash
# Run Vitest test suite
npm test
```

---

## 📦 Building the Standalone Installer

To compile an optimized Windows `.exe` installer (NSIS):

```bash
npm run dist
```

The output executable will be created in `dist/Refinzi-Setup-v2.0.0.exe`.

---

## 🌐 Landing Page & Web Docs

The official landing page and documentation site is located in the `landing/` directory:

```bash
cd landing
npm install
npm run dev
```

---

## 📈 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=papada1472/refinzi&type=Date)](https://star-history.com/#papada1472/refinzi&Date)

---

## 🤝 Community & Support

- 💬 **Issue Tracker**: [Report bugs or request models](https://github.com/papada1472/refinzi/issues)
- 💡 **Discussions**: [Join the GitHub Community](https://github.com/papada1472/refinzi/discussions)
- 🌐 **Official Website**: [refinzi.com](https://refinzi.com)
- 📧 **Email**: [contact@refinzi.com](mailto:contact@refinzi.com)

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).

