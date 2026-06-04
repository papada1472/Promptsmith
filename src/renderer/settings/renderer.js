// ── DOM refs ──
const apiStatus = document.getElementById("apiStatus");
const modelBadge = document.getElementById("modelBadge");
const themeToggle = document.getElementById("themeToggle");
const greetingTime = document.getElementById("greetingTime");
const userNameEl = document.getElementById("userName");
const todayCount = document.getElementById("todayCount");
const timeReclaimed = document.getElementById("timeReclaimed");
const refinementsMade = document.getElementById("refinementsMade");
const timeSavedMetric = document.getElementById("timeSavedMetric");
const retriesSaved = document.getElementById("retriesSaved");
const avgTimeSaved = document.getElementById("avgTimeSaved");
const shortcutChip = document.getElementById("shortcutChip");
const apiKeyInput = document.getElementById("apiKey");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const launchToggle = document.getElementById("launchToggle");
const hotkeyInput = document.getElementById("hotkey");

// Share card
const shareCard = document.getElementById("shareCard");
const shareCardClose = document.getElementById("shareCardClose");
const shareRefinements = document.getElementById("shareRefinements");
const shareTime = document.getElementById("shareTime");
const shareRetries = document.getElementById("shareRetries");
const shareStreak = document.getElementById("shareStreak");
const shareCardContent = document.getElementById("shareCardContent");
const downloadPngBtn = document.getElementById("downloadPngBtn");
const copyImageBtn = document.getElementById("copyImageBtn");
const shareXBtn = document.getElementById("shareXBtn");
const shareLinkedInBtn = document.getElementById("shareLinkedInBtn");

// Milestone inline card
const milestoneCard = document.getElementById("milestoneCard");
const milestoneCount = document.getElementById("milestoneCount");
const milestoneShare = document.getElementById("milestoneShare");
const milestoneClose = document.getElementById("milestoneClose");

// Share stats button in hero
const shareStatsBtn = document.getElementById("shareStatsBtn");

// ── Greeting ──
function setGreeting() {
  const h = new Date().getHours();
  if (h < 12) greetingTime.textContent = "morning";
  else if (h < 17) greetingTime.textContent = "afternoon";
  else greetingTime.textContent = "evening";
}

// ── State ──
let currentStats = null;

// ── Populate share card ──
function populateShareCard(s) {
  shareRefinements.textContent = String(s.refinementsMade ?? 0);
  const totalSeconds = s.timeSavedSeconds || 0;
  shareTime.textContent = totalSeconds >= 60 ? Math.round(totalSeconds / 60) + "m" : totalSeconds + "s";
  shareRetries.textContent = String(Math.round((s.retriesAvoided ?? 0) * 10) / 10);
  shareStreak.textContent = String(s.currentStreak ?? 0);
}

// ── PNG download ──
function downloadPng() {
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = 320 * scale;
  canvas.height = 200 * scale;
  const ctx = canvas.getContext("2d");

  // Background
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#6D5EF9");
  grad.addColorStop(1, "#00D4FF");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, 24 * scale);
  ctx.fill();

  // Content
  ctx.fillStyle = "white";
  ctx.font = `bold ${24 * scale}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Refinezy Stats", canvas.width / 2, 56 * scale);

  ctx.font = `${14 * scale}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  const texts = [
    `Texts Enhanced: ${shareRefinements.textContent}`,
    `Time Saved: ${shareTime.textContent}`,
    `Retries Prevented: ${shareRetries.textContent}`,
    `Day Streak: ${shareStreak.textContent}`
  ];
  texts.forEach((t, i) => {
    ctx.fillText(t, canvas.width / 2, 96 * scale + i * 26 * scale);
  });

  const link = document.createElement("a");
  link.download = "refinezy-stats.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ── Copy image to clipboard ──
function copyImage() {
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = 320 * scale;
  canvas.height = 200 * scale;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#6D5EF9");
  grad.addColorStop(1, "#00D4FF");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, 24 * scale);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = `bold ${24 * scale}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Refinezy Stats", canvas.width / 2, 56 * scale);

  ctx.font = `${14 * scale}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  const texts = [
    `Texts Enhanced: ${shareRefinements.textContent}`,
    `Time Saved: ${shareTime.textContent}`,
    `Retries Prevented: ${shareRetries.textContent}`,
    `Day Streak: ${shareStreak.textContent}`
  ];
  texts.forEach((t, i) => {
    ctx.fillText(t, canvas.width / 2, 96 * scale + i * 26 * scale);
  });

  canvas.toBlob((blob) => {
    if (blob) {
      navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]).catch(() => {});
    }
  });
}

// ── Share to X ──
function shareToX() {
  const text = encodeURIComponent(
    `I've enhanced ${shareRefinements.textContent} texts with Refinezy! 🚀\n\nTime saved: ${shareTime.textContent}\nRetries prevented: ${shareRetries.textContent}\nDay streak: ${shareStreak.textContent}`
  );
  window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
}

// ── Share to LinkedIn ──
function shareToLinkedIn() {
  const text = encodeURIComponent(
    `I've enhanced ${shareRefinements.textContent} texts using Refinezy — a lightweight desktop utility that turns rough instructions into polished AI prompts. Time saved: ${shareTime.textContent}, Retries prevented: ${shareRetries.textContent}.`
  );
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://refinezy.app&summary=${text}`, "_blank");
}

// ── Load data ──
async function refresh() {
  try {
    const s = await window.refinezy.reward.get();
    const settings = await window.refinezy.settings.get();
    currentStats = s;

    // Header
    apiStatus.textContent = settings.geminiApiKey ? "● Key set" : "○ No key";
    apiStatus.className = "api-status" + (settings.geminiApiKey ? "" : " api-status--unset");
    modelBadge.textContent = settings.activeModel || "gemini-2.5-flash";

    // Hero
    userNameEl.textContent = settings.userName || "Rahul";
    todayCount.textContent = String(s.refinementsMade ?? 0);

    // Time reclaimed
    const totalSeconds = s.timeSavedSeconds || 0;
    if (totalSeconds >= 3600) {
      timeReclaimed.textContent = Math.round(totalSeconds / 60) + "m";
    } else {
      timeReclaimed.textContent = totalSeconds + "s";
    }
    timeSavedMetric.textContent = totalSeconds >= 3600
      ? Math.round(totalSeconds / 60) + "m"
      : totalSeconds + "s";

    // Metrics
    refinementsMade.textContent = String(s.refinementsMade ?? 0);
    retriesSaved.textContent = String(Math.round((s.retriesAvoided ?? 0) * 10) / 10);
    avgTimeSaved.textContent = s.refinementsMade > 0
      ? Math.round((s.timeSavedSeconds ?? 0) / (s.refinementsMade ?? 1)) + "s"
      : "0s";

    // Shortcut chip
    shortcutChip.textContent = (s.hotkey || "Ctrl+Alt+Space").replaceAll("+", " + ");

    // Settings fields
    apiKeyInput.value = settings.geminiApiKey || "";
    launchToggle.checked = Boolean(settings.launchOnStartup);
    hotkeyInput.value = settings.hotkey || "Ctrl+Alt+Space";

    // Share card content
    populateShareCard(s);

    // Milestone card on milestone
    const count = s.refinementsMade ?? 0;
    if (count > 0 && count % 10 === 0 && !s.shareCardDismissed) {
      milestoneCount.textContent = String(count);
      milestoneCard.classList.remove("hidden");
    } else {
      milestoneCard.classList.add("hidden");
    }

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

// ── Share card visibility ──
function showShareCard() {
  if (currentStats) populateShareCard(currentStats);
  shareCard.classList.remove("hidden");
}

function hideShareCard() {
  shareCard.classList.add("hidden");
}

// ── Event wire-up ──

// Save buttons
saveKeyBtn.addEventListener("click", saveApiKey);
launchToggle.addEventListener("change", saveLaunch);
hotkeyInput.addEventListener("change", saveHotkey);

// Hero share button → opens the share card
shareStatsBtn.addEventListener("click", showShareCard);

// Share card close
shareCardClose.addEventListener("click", hideShareCard);

// Share card export actions
downloadPngBtn.addEventListener("click", downloadPng);
copyImageBtn.addEventListener("click", copyImage);
shareXBtn.addEventListener("click", shareToX);
shareLinkedInBtn.addEventListener("click", shareToLinkedIn);

// Milestone card
milestoneClose.addEventListener("click", () => {
  milestoneCard.classList.add("hidden");
  window.refinezy.reward.dismissShareCard();
});
milestoneShare.addEventListener("click", () => {
  showShareCard();
});

// ── Listen for command center refresh ──
window.refinezy.command.onRefresh(() => {
  setGreeting();
  refresh().catch(() => {});
});

// ── Initial load ──
setGreeting();
refresh().catch(() => {});