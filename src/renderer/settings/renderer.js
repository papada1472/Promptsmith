const statusEl = document.getElementById("status");
const apiKeyEl = document.getElementById("apiKey");
const launchToggleEl = document.getElementById("launchToggle");
const hotkeyEl = document.getElementById("hotkey");
const saveBtn = document.getElementById("save");

const quotaCounterTextEl = document.getElementById("quotaCounterText");

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function formatCounter({ used, limit }) {
  return `${used} / ${limit} free requests used this minute`;
}

async function refreshCounter() {
  if (!window.refinezy?.quota?.counterGet) return;
  try {
    const c = await window.refinezy.quota.counterGet();
    if (quotaCounterTextEl && c && typeof c.used === "number") {
      quotaCounterTextEl.textContent = formatCounter(c);
    }
  } catch (e) {
    // Silently ignore counter fetch errors.
  }
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
  // Prefer the localStorage-cached value if present (last successful paste
  // through the modal). Fall back to whatever the main process has stored.
  let apiKey = s.geminiApiKey || "";
  try {
    const cached = window.localStorage?.getItem("gemini_api_key");
    if (cached) apiKey = cached;
  } catch { /* ignore */ }
  apiKeyEl.value = apiKey || "";
  launchToggleEl.checked = Boolean(s.launchOnStartup);
  hotkeyEl.value = s.hotkey || "Ctrl+Alt+Space";

  // Update built-in AI status and last provider info
  const builtinEl = document.getElementById("builtinStatus");
  const providerEl = document.getElementById("lastProviderHint");
  // Built-in is always active (env var provides the key)
  if (builtinEl) {
    builtinEl.textContent = "✓ Active";
    builtinEl.className = "status-badge status-badge--active";
  }
  if (providerEl) {
    // Show which provider was last used
    const lastProvider = s.lastProvider || "builtin";
    providerEl.textContent = lastProvider === "personal"
      ? "Last refinement: Personal API Key"
      : "Last refinement: Built-in AI";
  }
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

// ---- Quota modal wiring ----

if (window.quotaModal?.createQuotaModal) {
  const modal = window.quotaModal.createQuotaModal({
    onSave: async (newKey) => {
      console.log("[Refinezy][Settings] Modal Save -> quota:saveAndRetry");
      try {
        const res = await window.refinezy.quota.saveAndRetry(newKey);
        if (!res?.ok) {
          return { ok: false, error: res?.error || "Retry failed" };
        }
        // Success: keep local field in sync and refresh counter.
        try { apiKeyEl.value = newKey; } catch { /* ignore */ }
        refreshCounter().catch(() => {});
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e?.message || String(e) };
      }
    }
  });

  if (window.refinezy?.quota?.onShow) {
    window.refinezy.quota.onShow(() => {
      console.log("[Refinezy][Settings] IPC received: quota:show");
      // Make sure the settings window is visible when the modal opens.
      modal.show();
    });
  }
  if (window.refinezy?.quota?.onClose) {
    window.refinezy.quota.onClose(() => {
      console.log("[Refinezy][Settings] IPC received: quota:close");
      modal.hide();
    });
  }
  if (window.refinezy?.quota?.onCounter) {
    window.refinezy.quota.onCounter(() => {
      refreshCounter().catch(() => {});
    });
  }
}

// ---- Counter tick (60s) ----
refreshCounter().catch(() => {});
setInterval(() => { refreshCounter().catch(() => {}); }, 60000);
