const refinementsEl = document.getElementById("refinementsMade");
const timeSavedEl = document.getElementById("timeSaved");
const retriesEl = document.getElementById("retriesAvoided");
const streakEl = document.getElementById("streak");
const hotkeyEl = document.getElementById("hotkey");

// ── Share / Reward Card ──
const shareCard = document.getElementById("shareCard");
const shareClose = document.getElementById("shareClose");
const shareCountEl = document.getElementById("shareCount");

// ── Quota Modal ──
const quotaModal = document.getElementById("quotaModal");
const quotaOpenSettings = document.getElementById("quotaOpenSettings");
const quotaDismiss = document.getElementById("quotaDismiss");

let stats = null;

function formatTimeSaved(seconds) {
  const mins = Math.round((seconds || 0) / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  return `${hours}h`;
}

function showShareCard(count) {
  shareCountEl.textContent = String(count);
  shareCard.classList.remove("hidden");
}

function hideShareCard() {
  shareCard.classList.add("hidden");
  window.refinezy.reward.dismissShareCard();
}

function showQuota() {
  quotaModal.classList.remove("hidden");
}

function hideQuota() {
  quotaModal.classList.add("hidden");
  window.refinezy.reward.shareCardSeen(); // reuse to mark quota dismissed
}

async function refresh() {
  const s = await window.refinezy.reward.get();
  stats = s;
  refinementsEl.textContent = String(s.refinementsMade ?? 0);
  timeSavedEl.textContent = formatTimeSaved(s.timeSavedSeconds ?? 0);
  retriesEl.textContent = String(Math.round((s.retriesAvoided ?? 0) * 10) / 10);
  streakEl.textContent = String(s.currentStreak ?? 0);
  hotkeyEl.textContent = (s.hotkey || "Ctrl+Alt+Space").replaceAll("+", " + ");

  // Show share card on milestone (every 10 refinements)
  const count = s.refinementsMade ?? 0;
  if (count > 0 && count % 10 === 0 && !s.shareCardDismissed) {
    showShareCard(count);
  } else {
    shareCard.classList.add("hidden");
  }

  // Show quota modal if applicable
  if (s.quotaExceeded) {
    showQuota();
  } else {
    quotaModal.classList.add("hidden");
  }
}

// ── Event wire-up ──
shareClose.addEventListener("click", hideShareCard);
quotaDismiss.addEventListener("click", hideQuota);
quotaOpenSettings.addEventListener("click", () => {
  hideQuota();
  window.refinezy.app.openSettings();
});

window.refinezy.reward.onRefresh(() => refresh().catch(() => {}));
refresh().catch(() => {});