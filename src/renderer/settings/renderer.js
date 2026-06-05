// Try to resize settings window to Command Center default size
try {
  window.resizeTo(1120, 720);
} catch (err) {
  console.warn("Could not resize window", err);
}

// ── DOM refs ──
const apiStatus = document.getElementById("apiStatus");
const modelBadge = document.getElementById("modelBadge");
const themeDarkBtn = document.getElementById("themeDarkBtn");
const themeLightBtn = document.getElementById("themeLightBtn");

// Hero
const heroRefinements = document.getElementById("heroRefinements");
const heroRewritesAvoided = document.getElementById("heroRewritesAvoided");

// API Provider
const apiKeyInput = document.getElementById("apiKey");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const testConnectionBtn = document.getElementById("testConnectionBtn");
const providerSelect = document.getElementById("providerSelect");
const modelSelect = document.getElementById("modelSelect");
const toggleApiKeyBtn = document.getElementById("toggleApiKey");
const connectionIndicator = document.getElementById("connectionIndicator");
const connectionText = document.getElementById("connectionText");
const providerHint = document.getElementById("providerHint");

// Progress section
const progressRefinements = document.getElementById("progressRefinements");
const progressRewritesAvoided = document.getElementById("progressRewritesAvoided");
const progressTimeSaved = document.getElementById("progressTimeSaved");

// Advanced settings
const advancedHeader = document.getElementById("advancedHeader");
const advancedContent = document.getElementById("advancedContent");
const launchToggle = document.getElementById("launchToggle");
const hotkeyInput = document.getElementById("hotkeyInput");

// Progress buttons
const previewBtn = document.getElementById("previewBtn");
const downloadBtn = document.getElementById("downloadBtn");
const shareBtn = document.getElementById("shareBtn");

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
const milestoneRewrites = document.getElementById("milestoneRewrites");
const milestoneShare = document.getElementById("milestoneShare");
const milestoneClose = document.getElementById("milestoneClose");

// Footer stats
const footerStats = document.getElementById("footerStats");

// Onboarding
const onboardingModal = document.getElementById("onboardingModal");
const onboardingModalClose = document.getElementById("onboardingModalClose");
const onboardingModalGotIt = document.getElementById("onboardingModalGotIt");

// Theme
const themeKey = "refinezy:theme";

// ── State ──
let currentStats = null;

// ── Theme ──
function applyTheme(theme) {
  const isLight = theme === "light";
  document.documentElement.setAttribute("data-theme", isLight ? "light" : "");
  localStorage.setItem(themeKey, isLight ? "light" : "dark");
  if (themeDarkBtn) {
    themeDarkBtn.classList.toggle("is-active", !isLight);
    themeDarkBtn.setAttribute("aria-checked", !isLight);
  }
  if (themeLightBtn) {
    themeLightBtn.classList.toggle("is-active", isLight);
    themeLightBtn.setAttribute("aria-checked", isLight);
  }
}

function applySavedTheme() {
  const saved = localStorage.getItem(themeKey) || "dark";
  applyTheme(saved);
}

// ── Premium Toast Notification ──
function showNotification(type, message) {
  window.refinezy.app.showToast({ type, message }).catch(() => { });
}

// ── Populate share card ──
function populateShareCard(s) {
  if (shareRefinements) shareRefinements.textContent = String(s.refinementsMade ?? 0);
  const totalSeconds = s.timeSavedSeconds || 0;
  if (shareTime) {
    shareTime.textContent = totalSeconds >= 60 ? Math.round(totalSeconds / 60) + "m" : totalSeconds + "s";
  }
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

// ── Connection test simulation ──
async function testConnection() {
  if (!testConnectionBtn || !connectionIndicator || !connectionText) return;

  const key = apiKeyInput ? apiKeyInput.value.trim() : "";

  if (!key) {
    connectionIndicator.className = "connection-indicator error";
    connectionText.textContent = "No API key provided";
    return;
  }

  // Show testing state
  connectionIndicator.className = "connection-indicator testing";
  connectionText.textContent = "Testing connection...";

  try {
    // Attempt to verify the key via the backend
    const result = await window.refinezy.settings.verifyApiKey(key);
    if (result?.ok) {
      connectionIndicator.className = "connection-indicator success";
      connectionText.textContent = "Connected successfully";
      showNotification("success", "Connection successful!");
    } else {
      connectionIndicator.className = "connection-indicator error";
      connectionText.textContent = result?.error || "Connection failed";
      showNotification("error", result?.error || "Connection failed");
    }
  } catch (e) {
    console.error("[CommandCenter] testConnection failed", e);
    connectionIndicator.className = "connection-indicator error";
    connectionText.textContent = "Connection failed";
    showNotification("error", "Connection failed");
  }
}

// ── API key visibility toggle ──
function toggleApiKeyVisibility() {
  if (!apiKeyInput || !toggleApiKeyBtn) return;
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
  toggleApiKeyBtn.setAttribute("aria-pressed", isPassword);

  // Toggle icons
  const eyeIcon = toggleApiKeyBtn.querySelector(".icon-eye");
  const eyeOffIcon = toggleApiKeyBtn.querySelector(".icon-eye-off");
  if (eyeIcon && eyeOffIcon) {
    eyeIcon.style.display = isPassword ? "none" : "block";
    eyeOffIcon.style.display = isPassword ? "block" : "none";
  }
}

// ── Provider / Model change handlers ──
async function handleProviderChange() {
  if (!providerSelect || !modelSelect) return;
  const provider = providerSelect.value;

  // Clear and populate model options based on provider
  modelSelect.innerHTML = "";
  if (provider === "gemini") {
    const models = [
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" }
    ];
    models.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.value;
      opt.textContent = m.label;
      modelSelect.appendChild(opt);
    });
  }

  // Save provider selection
  try {
    await window.refinezy.settings.set({ activeProvider: provider });
  } catch (e) {
    console.warn("[CommandCenter] Could not save provider", e);
  }
}

async function handleModelChange() {
  if (!modelSelect) return;
  const model = modelSelect.value;
  try {
    await window.refinezy.settings.set({ activeModel: model });
    if (modelBadge) modelBadge.textContent = model;
  } catch (e) {
    console.warn("[CommandCenter] Could not save model", e);
  }
}

// ── Advanced Settings Collapse ──
function toggleAdvanced() {
  if (!advancedHeader || !advancedContent) return;
  const isExpanded = advancedHeader.getAttribute("aria-expanded") === "true";
  const newState = !isExpanded;
  advancedHeader.setAttribute("aria-expanded", newState);
  advancedContent.hidden = !newState;
}

// ── Share card visibility ──
function showShareCard() {
  if (currentStats) populateShareCard(currentStats);
  if (shareCard) shareCard.classList.remove("hidden");
}

function hideShareCard() {
  if (shareCard) shareCard.classList.add("hidden");
}

// ── Load data ──
async function refresh() {
  try {
    const s = await window.refinezy.reward.get();
    const settings = await window.refinezy.settings.get();
    currentStats = s;

    const count = s.refinementsMade ?? 0;
    const totalSeconds = s.timeSavedSeconds || 0;
    const rewritesAvoided = count * 2;

    // Header - Status chip
    if (apiStatus) {
      const statusChip = document.getElementById("statusChip");
      const statusDot = document.getElementById("statusDot");
      if (settings.geminiApiKey) {
        apiStatus.textContent = "Connected";
        if (statusChip) statusChip.className = "status-chip connected";
        if (statusDot) statusDot.className = "status-dot connected";
      } else {
        apiStatus.textContent = "No key";
        if (statusChip) statusChip.className = "status-chip disconnected";
        if (statusDot) statusDot.className = "status-dot disconnected";
      }
    }

    // Header - Model badge
    if (modelBadge) {
      modelBadge.textContent = settings.activeModel || "gemini-2.5-flash";
    }

    // Hero stats
    if (heroRefinements) heroRefinements.textContent = String(count);
    if (heroRewritesAvoided) heroRewritesAvoided.textContent = String(rewritesAvoided);

    // API key field
    if (apiKeyInput) apiKeyInput.value = settings.geminiApiKey || "";

    // Model select
    if (modelSelect) {
      modelSelect.value = settings.activeModel || "gemini-2.5-flash";
    }

    // Provider select
    if (providerSelect) {
      providerSelect.value = settings.activeProvider || "gemini";
    }

    // Progress section
    if (progressRefinements) progressRefinements.textContent = String(count);
    if (progressRewritesAvoided) progressRewritesAvoided.textContent = String(rewritesAvoided);
    if (progressTimeSaved) {
      progressTimeSaved.textContent = totalSeconds >= 60
        ? Math.round(totalSeconds / 60) + "m"
        : totalSeconds + "s";
    }

    // Connection status reset
    if (connectionIndicator) {
      if (settings.geminiApiKey) {
        connectionIndicator.className = "connection-indicator success";
        if (connectionText) connectionText.textContent = "Key saved, ready to test";
      } else {
        connectionIndicator.className = "connection-indicator";
        if (connectionText) connectionText.textContent = "Not tested";
      }
    }

    // Settings fields
    if (launchToggle) launchToggle.checked = Boolean(settings.launchOnStartup);
    if (hotkeyInput) hotkeyInput.value = settings.hotkey || "Ctrl+Alt+Space";

    // Share card content
    populateShareCard(s);

    // Footer stats - use dynamic counters
    if (footerStats) {
      footerStats.textContent = `${count} refinements \u2022 ${rewritesAvoided} rewrites avoided`;
    }

    // Milestone card
    if (milestoneCard) {
      if (count > 0 && count % 10 === 0 && !s.shareCardDismissed) {
        if (milestoneCount) milestoneCount.textContent = String(count);
        if (milestoneRewrites) milestoneRewrites.textContent = String(Math.round((s.retriesAvoided ?? 0)));
        milestoneCard.classList.remove("hidden");
      } else {
        milestoneCard.classList.add("hidden");
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
      showNotification("success", "API key saved successfully.");

      // Update connection status
      if (connectionIndicator) {
        connectionIndicator.className = "connection-indicator success";
        if (connectionText) connectionText.textContent = "Key saved, ready to test";
      }

      await refresh();
    }
  } catch (e) {
    console.error("[CommandCenter] saveApiKey failed", e);
    showNotification("error", "Failed to save API key.");
  }
}

async function saveLaunch() {
  if (!launchToggle) return;
  try {
    await window.refinezy.settings.setLaunchOnStartup(launchToggle.checked);
    showNotification("success", `Launch on startup ${launchToggle.checked ? "enabled" : "disabled"}.`);
  } catch (e) {
    console.error("[CommandCenter] saveLaunch failed", e);
    showNotification("error", "Failed to update launch settings.");
  }
}

async function saveHotkey() {
  if (!hotkeyInput) return;
  const hk = hotkeyInput.value.trim() || "Ctrl+Alt+Space";
  try {
    const res = await window.refinezy.settings.setHotkey(hk);
    if (res?.ok) {
      showNotification("success", `Hotkey updated to ${hk}`);
      await refresh();
    } else {
      console.warn("[CommandCenter] hotkey save failed", res?.error);
      showNotification("error", `Hotkey update failed: ${res?.error}`);
    }
  } catch (e) {
    console.error("[CommandCenter] saveHotkey failed", e);
    showNotification("error", "An error occurred while saving the hotkey.");
  }
}

// ── Event wire-up ──

// Theme toggle
if (themeDarkBtn) themeDarkBtn.addEventListener("click", () => applyTheme("dark"));
if (themeLightBtn) themeLightBtn.addEventListener("click", () => applyTheme("light"));

// Provider and model selects
if (providerSelect) providerSelect.addEventListener("change", handleProviderChange);
if (modelSelect) modelSelect.addEventListener("change", handleModelChange);

// API key visibility toggle
if (toggleApiKeyBtn) toggleApiKeyBtn.addEventListener("click", toggleApiKeyVisibility);

// Save buttons
if (saveKeyBtn) saveKeyBtn.addEventListener("click", saveApiKey);
if (testConnectionBtn) testConnectionBtn.addEventListener("click", testConnection);
if (launchToggle) launchToggle.addEventListener("change", saveLaunch);
if (hotkeyInput) hotkeyInput.addEventListener("change", saveHotkey);

// Advanced settings collapse
if (advancedHeader) advancedHeader.addEventListener("click", toggleAdvanced);
if (advancedHeader) {
  advancedHeader.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleAdvanced();
    }
  });
}

// Progress section buttons
if (previewBtn) previewBtn.addEventListener("click", showShareCard);
if (downloadBtn) downloadBtn.addEventListener("click", downloadPng);
if (shareBtn) shareBtn.addEventListener("click", showShareCard);

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

// Onboarding modal wiring
function closeOnboardingModal() {
  if (onboardingModal) onboardingModal.classList.add("hidden");
}
if (onboardingModalClose) onboardingModalClose.addEventListener("click", closeOnboardingModal);
if (onboardingModalGotIt) onboardingModalGotIt.addEventListener("click", closeOnboardingModal);
if (onboardingModal) {
  onboardingModal.addEventListener("click", (e) => {
    if (e.target === onboardingModal) closeOnboardingModal();
  });
}

// ── Listen for command center refresh ──
window.refinezy.command.onRefresh(() => {
  refresh().catch(() => { });
});

// ── Initial load ──
refresh().catch(() => { });
applySavedTheme();