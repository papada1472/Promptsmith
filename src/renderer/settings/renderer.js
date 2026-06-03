const statusEl = document.getElementById("status");
const apiKeyEl = document.getElementById("apiKey");
const launchToggleEl = document.getElementById("launchToggle");
const hotkeyEl = document.getElementById("hotkey");
const saveBtn = document.getElementById("save");

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

async function hydrate() {
  console.log("[Refinezy][Settings] hydrate -> requesting settings:get");
  if (!window.refinezy?.settings?.get) {
    const msg = "Bridge unavailable: preload did not expose refinezy.settings.get";
    console.error("[Refinezy][Settings]", msg);
    setStatus(msg);
    return;
  }

  const s = await window.refinezy.settings.get();
  console.log("[Refinezy][Settings] hydrate <- settings received", s);
  apiKeyEl.value = s.geminiApiKey || "";
  launchToggleEl.checked = Boolean(s.launchOnStartup);
  hotkeyEl.value = s.hotkey || "Ctrl+Alt+Space";
}

async function save() {
  console.log("[Refinezy][Settings] Save button clicked");
  setStatus("Saving…");

  if (!window.refinezy?.settings) {
    const msg = "Bridge unavailable: preload did not expose refinezy.settings";
    console.error("[Refinezy][Settings]", msg);
    setStatus(msg);
    return;
  }

  const apiKey = apiKeyEl.value.trim();
  const launchOnStartup = launchToggleEl.checked;
  const hotkey = hotkeyEl.value.trim() || "Ctrl+Alt+Space";

  console.log("[Refinezy][Settings] API key provided", Boolean(apiKey));
  console.log("[Refinezy][Settings] launchOnStartup captured", launchOnStartup);
  console.log("[Refinezy][Settings] hotkey captured", hotkey);

  try {
    console.log("[Refinezy][Settings] IPC message sent: settings:setApiKey");
    const r1 = await window.refinezy.settings.setApiKey(apiKey);
    console.log("[Refinezy][Settings] Success response returned: settings:setApiKey", r1);

    console.log("[Refinezy][Settings] IPC message sent: settings:setLaunchOnStartup");
    const r2 = await window.refinezy.settings.setLaunchOnStartup(launchOnStartup);
    console.log("[Refinezy][Settings] Success response returned: settings:setLaunchOnStartup", r2);

    console.log("[Refinezy][Settings] IPC message sent: settings:setHotkey");
    const hk = await window.refinezy.settings.setHotkey(hotkey);
    console.log("[Refinezy][Settings] Success response returned: settings:setHotkey", hk);

    if (!hk?.ok) {
      const msg = `Save failed (hotkey): ${hk?.error || "Unknown hotkey error"}`;
      console.error("[Refinezy][Settings]", msg);
      setStatus(msg);
      return;
    }

    setStatus("Settings Saved");
    console.log("[Refinezy][Settings] Settings Saved");
    setTimeout(() => setStatus(""), 1800);

    // Re-read to verify persistence and ensure UI reflects stored values
    await hydrate();
  } catch (e) {
    const msg = `Save failed: ${e?.message || String(e)}`;
    console.error("[Refinezy][Settings]", msg, e);
    setStatus(msg);
  }
}

saveBtn.addEventListener("click", () =>
  save().catch((e) => {
    const msg = `Save failed (unhandled): ${e?.message || String(e)}`;
    console.error("[Refinezy][Settings]", msg, e);
    setStatus(msg);
  })
);

hydrate().catch((e) => {
  const msg = `Failed to load settings: ${e?.message || String(e)}`;
  console.error("[Refinezy][Settings]", msg, e);
  setStatus(msg);
});

