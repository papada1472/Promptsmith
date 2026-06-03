const refinementsEl = document.getElementById("refinementsMade");
const timeSavedEl = document.getElementById("timeSaved");
const retriesEl = document.getElementById("retriesAvoided");
const streakEl = document.getElementById("streak");
const hotkeyEl = document.getElementById("hotkey");

function formatTimeSaved(seconds) {
  const mins = Math.round((seconds || 0) / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  return `${hours}h`;
}

async function refresh() {
  const s = await window.refinezy.reward.get();
  refinementsEl.textContent = String(s.refinementsMade ?? 0);
  timeSavedEl.textContent = formatTimeSaved(s.timeSavedSeconds ?? 0);
  retriesEl.textContent = String(Math.round((s.retriesAvoided ?? 0) * 10) / 10);
  streakEl.textContent = String(s.currentStreak ?? 0);
  hotkeyEl.textContent = (s.hotkey || "Ctrl+Alt+Space").replaceAll("+", " + ");
}

window.refinezy.reward.onRefresh(() => refresh().catch(() => {}));
refresh().catch(() => {});

