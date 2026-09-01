import { Menu, Tray, nativeImage, app } from "electron";
import { APP_NAME } from "./constants.js";
import path from "path";
import { store } from "./store.js";
import { createLogger } from "./logger.js";

const log = createLogger("Tray");

export function createTray({ onOpenSettings, onQuit, getHotkey }) {
  const iconPath = path.join(app.getAppPath(), "assets", "icons", "tray.png");
  const tray = new Tray(iconPath);
  tray.setToolTip(`${APP_NAME} — Running`);

  const PROVIDERS = [
    { id: "deepseek", name: "DeepSeek (R1 / V3)", defaultModel: "deepseek-chat" },
    { id: "anthropic", name: "Anthropic Claude (3.5 / 3.7)", defaultModel: "claude-3-5-sonnet-20241022" },
    { id: "openai", name: "OpenAI (ChatGPT / GPT-4o / o3)", defaultModel: "gpt-4o" },
    { id: "gemini", name: "Google Gemini (2.0 / 2.5 Flash)", defaultModel: "gemini-2.0-flash" },
    { id: "openrouter", name: "OpenRouter (300+ Frontier Models)", defaultModel: "anthropic/claude-3.5-sonnet" },
    { id: "groq", name: "GroqCloud (Ultra-Fast Llama 3.3)", defaultModel: "llama-3.3-70b-versatile" },
    { id: "mistral", name: "Mistral AI (Codestral / Large)", defaultModel: "codestral-latest" },
    { id: "xai", name: "xAI (Grok 2 / Grok Beta)", defaultModel: "grok-2-latest" },
    { id: "ollama", name: "Ollama (Localhost:11434)", defaultModel: "deepseek-r1:latest" },
    { id: "lmstudio", name: "LM Studio (Localhost:1234)", defaultModel: "local-model" },
    { id: "gateway", name: "Refinzi Free Gateway (Failover)", defaultModel: "gateway-default" }
  ];

  function buildMenu() {
    const hotkey = String(getHotkey() || "Ctrl+Alt+Space").trim() || "Ctrl+Alt+Space";
    const activeProvider = store.get("activeProvider") || "deepseek";
    const activeProviderObj = PROVIDERS.find(p => p.id === activeProvider) || PROVIDERS[0];

    return Menu.buildFromTemplate([
      { label: `Refinzi 2.0 (${activeProviderObj.name.split(" ")[0]})`, enabled: false },
      { label: `Open Dashboard (${hotkey})`, click: onOpenSettings },
      { type: "separator" },
      {
        label: "Switch AI Engine",
        submenu: PROVIDERS.map(p => ({
          label: p.name,
          type: "radio",
          checked: activeProvider === p.id,
          click: () => {
            store.set("activeProvider", p.id);
            store.set("activeModel", p.defaultModel);
            setContext();
            log.info(`Active AI Provider changed via Tray to ${p.id}`);
          }
        }))
      },
      { type: "separator" },
      { label: "Quit Refinzi", click: onQuit }
    ]);
  }

  const setContext = () => tray.setContextMenu(buildMenu());
  setContext();

  tray.on("click", () => {
    log.debug("TRAY LEFT CLICK - Opening Dashboard");
    onOpenSettings();
  });

  return {
    tray,
    refreshMenu: setContext
  };
}