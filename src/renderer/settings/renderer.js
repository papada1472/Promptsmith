// Try to resize settings window to Command Center default size
try {
  window.resizeTo(1120, 720);
} catch (err) {
  console.warn("Could not resize window", err);
}

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

// Onboarding / first-run state
const onboardingState = document.getElementById("onboardingState");
const onboardingCta = document.getElementById("onboardingCta");
const onboardingModal = document.getElementById("onboardingModal");
const onboardingModalClose = document.getElementById("onboardingModalClose");
const onboardingModalGotIt = document.getElementById("onboardingModalGotIt");

// Premium Toast Notification Helper
function showInAppNotification(message) {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.top = "24px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.backgroundColor = "#222834";
  toast.style.color = "#F8FAFC";
  toast.style.padding = "12px 24px";
  toast.style.borderRadius = "8px";
  toast.style.border = "1px solid rgba(255,255,255,0.1)";
  toast.style.boxShadow = "0px 12px 40px rgba(0,0,0,0.5)";
  toast.style.zIndex = "9999";
  toast.style.fontFamily = "'Inter', sans-serif";
  toast.style.fontSize = "13px";
  toast.style.fontWeight = "500";
  toast.style.pointerEvents = "none";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 200ms ease, transform 200ms ease";
  toast.style.transform = "translateX(-50%) translateY(-10px)";
  toast.textContent = message;
  document.body.appendChild(toast);

  // Force reflow
  toast.offsetHeight;

  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(-10px)";
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 2500);
}

// ── Greeting ──
function setGreeting() {
  const h = new Date().getHours();
  if (greetingTime) {
    if (h < 12) greetingTime.textContent = "morning";
    else if (h < 17) greetingTime.textContent = "afternoon";
    else greetingTime.textContent = "evening";
  }
}

// ── State ──
let currentStats = null;

// ── Populate share card ──
function populateShareCard(s) {
  if (shareRefinements) shareRefinements.textContent = String(s.refinementsMade ?? 0);
  const totalSeconds = s.timeSavedSeconds || 0;
  if (shareTime) shareTime.textContent = totalSeconds >= 60 ? Math.round(totalSeconds / 60) + "m" : totalSeconds + "s";
  if (shareRetries) shareRetries.textContent = String(Math.round((s.retriesAvoided ?? 0) * 10) / 10);
  if (shareStreak) shareStreak.textContent = String(s.currentStreak ?? 0);
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
    `Texts Enhanced: ${shareRefinements?.textContent || '0'}`,
    `Time Saved: ${shareTime?.textContent || '0s'}`,
    `Retries Prevented: ${shareRetries?.textContent || '0'}`,
    `Day Streak: ${shareStreak?.textContent || '0'}`
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
    `Texts Enhanced: ${shareRefinements?.textContent || '0'}`,
    `Time Saved: ${shareTime?.textContent || '0s'}`,
    `Retries Prevented: ${shareRetries?.textContent || '0'}`,
    `Day Streak: ${shareStreak?.textContent || '0'}`
  ];
  texts.forEach((t, i) => {
    ctx.fillText(t, canvas.width / 2, 96 * scale + i * 26 * scale);
  });

  canvas.toBlob((blob) => {
    if (blob) {
      navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]).catch(() => { });
    }
  });
}

// ── Share to X ──
function shareToX() {
  const text = encodeURIComponent(
    `I've enhanced ${shareRefinements?.textContent || '0'} texts with Refinezy! 🚀\n\nTime saved: ${shareTime?.textContent || '0s'}\nRetries prevented: ${shareRetries?.textContent || '0'}\nDay streak: ${shareStreak?.textContent || '0'}`
  );
  window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
}

// ── Share to LinkedIn ──
function shareToLinkedIn() {
  const text = encodeURIComponent(
    `I've enhanced ${shareRefinements?.textContent || '0'} texts using Refinezy — a lightweight desktop utility that turns rough instructions into polished AI prompts. Time saved: ${shareTime?.textContent || '0s'}, Retries prevented: ${shareRetries?.textContent || '0'}.`
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
    if (apiStatus) {
      if (settings.geminiApiKey) {
        apiStatus.textContent = "Connected.";
        apiStatus.className = "api-status";
      } else {
        apiStatus.textContent = "No key";
        apiStatus.className = "api-status api-status--unset";
      }
    }
    if (modelBadge) {
      modelBadge.textContent = settings.activeModel || "gemini-2.5-flash";
    }

    // Hero
    if (todayCount) {
      todayCount.textContent = String(s.refinementsMade ?? 0);
    }

    // Time reclaimed
    const totalSeconds = s.timeSavedSeconds || 0;
    if (timeReclaimed) {
      if (totalSeconds >= 3600) {
        timeReclaimed.textContent = Math.round(totalSeconds / 60) + "m";
      } else {
        timeReclaimed.textContent = totalSeconds + "s";
      }
    }
    if (timeSavedMetric) {
      timeSavedMetric.textContent = totalSeconds >= 3600
        ? Math.round(totalSeconds / 60) + "m"
        : totalSeconds + "s";
    }

    // Metrics
    if (refinementsMade) {
      refinementsMade.textContent = String(s.refinementsMade ?? 0);
    }
    if (retriesSaved) {
      retriesSaved.textContent = String(Math.round((s.retriesAvoided ?? 0) * 10) / 10);
    }
    if (avgTimeSaved) {
      avgTimeSaved.textContent = s.refinementsMade > 0
        ? Math.round((s.timeSavedSeconds ?? 0) / (s.refinementsMade ?? 1)) + "s"
        : "0s";
    }

    // Shortcut chip
    if (shortcutChip) {
      shortcutChip.textContent = (s.hotkey || "Ctrl+Alt+Space").replaceAll("+", " + ");
    }

    // Settings fields
    if (apiKeyInput) apiKeyInput.value = settings.geminiApiKey || "";
    if (launchToggle) launchToggle.checked = Boolean(settings.launchOnStartup);
    if (hotkeyInput) hotkeyInput.value = settings.hotkey || "Ctrl+Alt+Space";

    // Share card content
    populateShareCard(s);

    // Milestone card on milestone
    const count = s.refinementsMade ?? 0;
    if (milestoneCard) {
      if (count > 0 && count % 10 === 0 && !s.shareCardDismissed) {
        if (milestoneCount) milestoneCount.textContent = String(count);
        milestoneCard.classList.remove("hidden");
      } else {
        milestoneCard.classList.add("hidden");
      }
    }

    // First-run onboarding: visible only when no refinements have been made.
    if (onboardingState) {
      if (count === 0) {
        onboardingState.classList.remove("hidden");
      } else {
        onboardingState.classList.add("hidden");
      }
    }

  } catch (e) {
    console.error("[CommandCenter] refresh failed", e);
  }
}

// ── Save handlers ──
async function saveApiKey() {
  if (!apiKeyInput) return;
  const key = apiKeyInput.value.trim();
  try {
    const res = await window.refinezy.settings.setApiKey(key);
    if (res?.ok) {
      showInAppNotification("API key saved successfully.");
      await refresh();
    }
  } catch (e) {
    console.error("[CommandCenter] saveApiKey failed", e);
  }
}

async function saveLaunch() {
  if (!launchToggle) return;
  try {
    await window.refinezy.settings.setLaunchOnStartup(launchToggle.checked);
    showInAppNotification(`Launch on startup ${launchToggle.checked ? "enabled" : "disabled"}.`);
  } catch (e) {
    console.error("[CommandCenter] saveLaunch failed", e);
  }
}

async function saveHotkey() {
  if (!hotkeyInput) return;
  const hk = hotkeyInput.value.trim() || "Ctrl+Alt+Space";
  try {
    const res = await window.refinezy.settings.setHotkey(hk);
    if (res?.ok) {
      showInAppNotification(`Hotkey updated to ${hk}`);
      await refresh();
    } else {
      console.warn("[CommandCenter] hotkey save failed", res?.error);
      showInAppNotification(`Hotkey update failed: ${res?.error}`);
    }
  } catch (e) {
    console.error("[CommandCenter] saveHotkey failed", e);
  }
}

// ── Share card visibility ──
function showShareCard() {
  if (currentStats) populateShareCard(currentStats);
  if (shareCard) shareCard.classList.remove("hidden");
}

function hideShareCard() {
  if (shareCard) shareCard.classList.add("hidden");
}

// ── Event wire-up ──

// Save buttons
if (saveKeyBtn) saveKeyBtn.addEventListener("click", saveApiKey);
if (launchToggle) launchToggle.addEventListener("change", saveLaunch);
if (hotkeyInput) hotkeyInput.addEventListener("change", saveHotkey);

// Hero share button → opens the share card
if (shareStatsBtn) shareStatsBtn.addEventListener("click", showShareCard);

// Share card close
if (shareCardClose) shareCardClose.addEventListener("click", hideShareCard);

// Share card export actions
if (downloadPngBtn) downloadPngBtn.addEventListener("click", downloadPng);
if (copyImageBtn) copyImageBtn.addEventListener("click", copyImage);
if (shareXBtn) shareXBtn.addEventListener("click", shareToX);
if (shareLinkedInBtn) shareLinkedInBtn.addEventListener("click", shareToLinkedIn);

// Milestone card
if (milestoneClose) {
  milestoneClose.addEventListener("click", () => {
    if (milestoneCard) milestoneCard.classList.add("hidden");
    window.refinezy.reward.dismissShareCard();
  });
}
if (milestoneShare) {
  milestoneShare.addEventListener("click", () => {
    showShareCard();
  });
}

// ── Redesign Button Wirings ──

// Hero Section: Reward Card button
const rewardCardBtn = document.getElementById("rewardCardBtn");
if (rewardCardBtn) {
  rewardCardBtn.addEventListener("click", () => {
    document.getElementById("rewardSectionContainer")?.scrollIntoView({ behavior: "smooth" });
  });
}

// Quick Actions: Open Reward Card (the element ID in the HTML is 'openRewardCard')
const openRewardCard = document.getElementById("openRewardCard");
if (openRewardCard) {
  openRewardCard.addEventListener("click", () => {
    document.getElementById("rewardSectionContainer")?.scrollIntoView({ behavior: "smooth" });
  });
}

// Quick Actions: Share Progress (the element ID in the HTML is 'shareProgressBtn')
const shareProgressBtn = document.getElementById("shareProgressBtn");
if (shareProgressBtn) {
  shareProgressBtn.addEventListener("click", showShareCard);
}

// Quick Actions: Copy Last Output
const copyLastOutput = document.getElementById("copyLastOutput");
if (copyLastOutput) {
  copyLastOutput.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        await navigator.clipboard.writeText(text);
        showInAppNotification("Last output copied successfully!");
      } else {
        showInAppNotification("No output active in clipboard.");
      }
    } catch (err) {
      showInAppNotification("Last output copied to clipboard!");
    }
  });
}

// Quick Actions: Open Settings
const openSettings = document.getElementById("openSettings");
if (openSettings) {
  openSettings.addEventListener("click", () => {
    document.getElementById("settingsContainer")?.scrollIntoView({ behavior: "smooth" });
  });
}

// Reward Section buttons
const previewBtn = document.getElementById("previewBtn");
if (previewBtn) {
  previewBtn.addEventListener("click", showShareCard);
}

const downloadBtn = document.getElementById("downloadBtn");
if (downloadBtn) {
  downloadBtn.addEventListener("click", downloadPng);
}

const shareBtn = document.getElementById("shareBtn");
if (shareBtn) {
  shareBtn.addEventListener("click", showShareCard);
}

// Onboarding CTA and modal wiring
if (onboardingCta) {
  onboardingCta.addEventListener("click", () => {
    if (onboardingModal) onboardingModal.classList.remove("hidden");
  });
}
function closeOnboardingModal() {
  if (onboardingModal) onboardingModal.classList.add("hidden");
}
if (onboardingModalClose) {
  onboardingModalClose.addEventListener("click", closeOnboardingModal);
}
if (onboardingModalGotIt) {
  onboardingModalGotIt.addEventListener("click", closeOnboardingModal);
}
if (onboardingModal) {
  onboardingModal.addEventListener("click", (e) => {
    if (e.target === onboardingModal) closeOnboardingModal();
  });
}

// ── Listen for command center refresh ──
window.refinezy.command.onRefresh(() => {
  setGreeting();
  refresh().catch(() => { });
});

// ── Initial load ──
setGreeting();
refresh().catch(() => { });