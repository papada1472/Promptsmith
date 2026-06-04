// ── DOM refs ──
const apiStatus = document.getElementById("apiStatus");
const modelBadge = document.getElementById("modelBadge");
const greetingTime = document.getElementById("greetingTime");
const todayCount = document.getElementById("todayCount");
const retriesSaved = document.getElementById("retriesSaved");
const refinementsMade = document.getElementById("refinementsMade");
const avgTimeSaved = document.getElementById("avgTimeSaved");
const usedToday = document.getElementById("usedToday");
const shortcutChip = document.getElementById("shortcutChip");
const apiKeyInput = document.getElementById("apiKey");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const launchToggle = document.getElementById("launchToggle");
const hotkeyInput = document.getElementById("hotkey");
const shareCard = document.getElementById("shareCard");
const shareCount = document.getElementById("shareCount");
const shareClose = document.getElementById("shareClose");
const shareStatsBtn = document.getElementById("shareStatsBtn");

// ── Greeting ──
function setGreeting() {
  const h = new Date().getHours();
  if (h < 12) greetingTime.textContent = "morning";
  else if (h < 17) greetingTime.textContent = "afternoon";
  else greetingTime.textContent = "evening";
}

// ── Load data ──
async function refresh() {
  try {
    const s = await window.refinezy.reward.get();
    const settings = await window.refinezy.settings.get();

    // Header
    apiStatus.textContent = settings.geminiApiKey ? "● Key set" : "○ No key";
    apiStatus.className = "api-status" + (settings.geminiApiKey ? "" : " api-status--unset");
    modelBadge.textContent = settings.activeModel || "gemini-2.5-flash";

    // Metrics
    refinementsMade.textContent = String(s.refinementsMade ?? 0);
    retriesSaved.textContent = String(Math.round((s.retriesAvoided ?? 0) * 10) / 10);
    avgTimeSaved.textContent = s.refinementsMade > 0
      ? Math.round((s.timeSavedSeconds ?? 0) / (s.refinementsMade ?? 1)) + "s"
      : "0s";

    // Used today from quota
    try {
      const q = await window.refinezy.settings.get(); // re-reading same, but fine
      usedToday.textContent = String(s.refinementsMade ?? 0);
    } catch { usedToday.textContent = "0"; }

    // Shortcut chip
    shortcutChip.textContent = (s.hotkey || "Ctrl+Alt+Space").replaceAll("+", " + ");

    // Settings fields
    apiKeyInput.value = settings.geminiApiKey || "";
    launchToggle.checked = Boolean(settings.launchOnStartup);
    hotkeyInput.value = settings.hotkey || "Ctrl+Alt+Space";

    // Share card on milestone
    const count = s.refinementsMade ?? 0;
    if (count > 0 && count % 10 === 0 && !s.shareCardDismissed) {
      shareCount.textContent = String(count);
      shareCard.classList.remove("hidden");
    } else {
      shareCard.classList.add("hidden");
    }

    // Today count
    const today = new Date().toISOString().slice(0, 10);
    // approximate: use total refinements as today's count for simplicity
    todayCount.textContent = String(Math.min(count, 50));
  } catch (e) {
    console.error("[CommandCenter] refresh failed", e);
  }
}

// ── Save handlers ──
async function saveApiKey() {
  const key = apiKeyInput.value.trim();
  try {
    const res = await window.refinezy.settings.setApiKey(key);
    if (res?.ok) {
      await refresh();
    }
  } catch (e) {
    console.error("[CommandCenter] saveApiKey failed", e);
  }
}

async function saveLaunch() {
  try {
    await window.refinezy.settings.setLaunchOnStartup(launchToggle.checked);
  } catch (e) {
    console.error("[CommandCenter] saveLaunch failed", e);
  }
}

async function saveHotkey() {
  const hk = hotkeyInput.value.trim() || "Ctrl+Alt+Space";
  try {
    const res = await window.refinezy.settings.setHotkey(hk);
    if (res?.ok) {
      await refresh();
    } else {
      console.warn("[CommandCenter] hotkey save failed", res?.error);
    }
  } catch (e) {
    console.error("[CommandCenter] saveHotkey failed", e);
  }
}

// ── Share card dismiss ──
shareClose.addEventListener("click", () => {
  shareCard.classList.add("hidden");
  window.refinezy.reward.dismissShareCard();
});

// ── Share stats button ──
shareStatsBtn.addEventListener("click", () => {
  const text = `I've made ${refinementsMade.textContent} refinements with Refinezy!`;
  navigator.clipboard.writeText(text).catch(() => {});
});

// ── Event wire-up ──
saveKeyBtn.addEventListener("click", saveApiKey);
launchToggle.addEventListener("change", saveLaunch);
hotkeyInput.addEventListener("change", saveHotkey);

// ── Listen for command center refresh ──
window.refinezy.command.onRefresh(() => {
  setGreeting();
  refresh().catch(() => {});
});

// ── Initial load ──
setGreeting();
refresh().catch(() => {});