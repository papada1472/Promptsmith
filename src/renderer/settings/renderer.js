// ── DOM Elements ──

// Header Status
const apiStatus = document.getElementById("apiStatus");
const modelBadge = document.getElementById("modelBadge");
const themeToggle = document.getElementById("themeToggle");

// Hero Greeting & Stats
const greetingTime = document.getElementById("greetingTime");
const userNameEl = document.getElementById("userName");
const todayCount = document.getElementById("todayCount");
const timeReclaimed = document.getElementById("timeReclaimed");
const shareStatsBtn = document.getElementById("shareStatsBtn");

// Shortcut Chip
const shortcutChip = document.getElementById("shortcutChip");

// Tabs & Navigation
const tabDashboard = document.getElementById("tab-dashboard");
const tabActivity = document.getElementById("tab-activity");
const pageDashboard = document.getElementById("page-dashboard");
const pageActivity = document.getElementById("page-activity");

// Dashboard Metrics
const refinementsMade = document.getElementById("refinementsMade");
const timeSavedMetric = document.getElementById("timeSavedMetric");
const retriesSaved = document.getElementById("retriesSaved");
const avgTimeSaved = document.getElementById("avgTimeSaved");

// Form Inputs & Preferences
const apiKeyInput = document.getElementById("apiKey");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const hotkeyInput = document.getElementById("hotkey");
const launchToggle = document.getElementById("launchToggle");

// System Status indicators
const statusStartupDot = document.getElementById("statusStartupDot");
const statusStartupText = document.getElementById("statusStartupText");

// Activity Feed container
const activityLogsContainer = document.getElementById("activityLogsContainer");

// Celebration Celebration card
const milestoneCard = document.getElementById("milestoneCard");
const milestoneCount = document.getElementById("milestoneCount");
const milestoneShare = document.getElementById("milestoneShare");
const milestoneClose = document.getElementById("milestoneClose");

// Share Modal Elements
const shareModal = document.getElementById("share-modal");
const shareCardClose = document.getElementById("shareCardClose");
const shareCardCloseBtn = document.getElementById("shareCardCloseBtn");
const shareTime = document.getElementById("shareTime");
const shareRefinements = document.getElementById("shareRefinements");
const shareStreak = document.getElementById("shareStreak");
const shareRetries = document.getElementById("shareRetries");

// Export Actions
const downloadPngBtn = document.getElementById("downloadPngBtn");
const copyImageBtn = document.getElementById("copyImageBtn");
const shareLinkedInBtn = document.getElementById("shareLinkedInBtn");
const shareXBtn = document.getElementById("shareXBtn");

// ── Local State ──
let currentStats = null;
let currentSettings = null;

// ── Time of Day Greeting ──
function setGreeting() {
  const h = new Date().getHours();
  if (h < 12) greetingTime.textContent = "morning";
  else if (h < 17) greetingTime.textContent = "afternoon";
  else greetingTime.textContent = "evening";
}

// ── Tab Switching Navigation ──
function initTabs() {
  tabDashboard.addEventListener("click", () => switchTab("dashboard"));
  tabActivity.addEventListener("click", () => switchTab("activity"));
}

function switchTab(target) {
  if (target === "dashboard") {
    // Buttons style
    tabDashboard.className = "text-sm font-semibold pb-3 border-b-2 border-accent text-accent dark:text-white dark:border-white transition-colors";
    tabActivity.className = "text-sm font-medium pb-3 border-b-2 border-transparent text-textMuted hover:text-textSub transition-colors";
    
    // Page visibility
    pageDashboard.classList.remove("hidden");
    pageActivity.classList.add("hidden");
  } else {
    // Buttons style
    tabActivity.className = "text-sm font-semibold pb-3 border-b-2 border-accent text-accent dark:text-white dark:border-white transition-colors";
    tabDashboard.className = "text-sm font-medium pb-3 border-b-2 border-transparent text-textMuted hover:text-textSub transition-colors";
    
    // Page visibility
    pageActivity.classList.remove("hidden");
    pageDashboard.classList.add("hidden");
  }
}

// ── Theme Management ──
function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

async function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  const nextTheme = isDark ? "light" : "dark";
  applyTheme(nextTheme);
  try {
    await window.refinezy.settings.setTheme(nextTheme);
  } catch (err) {
    console.error("[Dashboard] Theme persistence failed:", err);
  }
}

// ── Populate Activity Logs ──
function renderActivityLogs(logs) {
  activityLogsContainer.innerHTML = "";
  if (!logs || logs.length === 0) {
    activityLogsContainer.innerHTML = `
      <div class="p-8 text-center text-textMuted text-xs font-medium">
        No text enhancements recorded yet. Try using the global shortcut!
      </div>
    `;
    return;
  }

  // Render newest first
  const reversedLogs = [...logs].reverse();
  reversedLogs.forEach((log) => {
    const item = document.createElement("div");
    item.className = "p-4 flex flex-col gap-1 hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors";
    
    const timeStr = log.timestamp 
      ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " · " + new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : "Just now";

    item.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-semibold text-accent">Enhanced text</span>
        <span class="text-[10px] text-textMuted font-medium">${timeStr}</span>
      </div>
      <p class="text-xs text-textSub italic mt-0.5 line-clamp-2 pl-2 border-l border-border select-all">Original: "${log.input}"</p>
      <p class="text-xs text-textMain mt-1 font-medium pl-2 border-l border-accent select-all">Result: "${log.output}"</p>
    `;
    activityLogsContainer.appendChild(item);
  });
}

// ── Populate Share Card Stats ──
function populateShareModal(s) {
  shareRefinements.textContent = String(s.refinementsMade ?? 0);
  shareStreak.textContent = `${s.currentStreak ?? 0} Day${(s.currentStreak === 1) ? "" : "s"}`;
  shareRetries.textContent = String(Math.round((s.retriesAvoided ?? 0) * 10) / 10);
  
  const totalSeconds = s.timeSavedSeconds || 0;
  if (totalSeconds >= 3600) {
    shareTime.textContent = (totalSeconds / 3600).toFixed(1) + "h";
  } else if (totalSeconds >= 60) {
    shareTime.textContent = Math.round(totalSeconds / 60) + "m";
  } else {
    shareTime.textContent = totalSeconds + "s";
  }
}

// ── Modal Visibility ──
function showShareModal() {
  if (currentStats) {
    populateShareModal(currentStats);
  }
  shareModal.classList.remove("hidden");
  shareModal.classList.add("flex");
}

function hideShareModal() {
  shareModal.classList.add("hidden");
  shareModal.classList.remove("flex");
}

// ── Data Loading & Refresh ──
async function refresh() {
  try {
    const s = await window.refinezy.reward.get();
    const settings = await window.refinezy.settings.get();
    currentStats = s;
    currentSettings = settings;

    // Header values
    const hasKey = !!settings.geminiApiKey;
    apiStatus.textContent = hasKey ? "● Key set" : "○ No key";
    if (hasKey) {
      apiStatus.className = "font-sans font-semibold text-emerald-500";
    } else {
      apiStatus.className = "font-sans font-semibold text-textMuted";
    }
    modelBadge.textContent = settings.activeModel || "gemini-2.5-flash";

    // Greeting Header
    userNameEl.textContent = settings.userName || "Rahul";
    todayCount.textContent = String(s.refinementsMade ?? 0);

    // Time reclaimed parsing
    const totalSeconds = s.timeSavedSeconds || 0;
    if (totalSeconds >= 3600) {
      timeReclaimed.textContent = (totalSeconds / 3600).toFixed(1) + "h";
      timeSavedMetric.textContent = (totalSeconds / 3600).toFixed(1) + "h";
    } else if (totalSeconds >= 60) {
      timeReclaimed.textContent = Math.round(totalSeconds / 60) + "m";
      timeSavedMetric.textContent = Math.round(totalSeconds / 60) + "m";
    } else {
      timeReclaimed.textContent = totalSeconds + "s";
      timeSavedMetric.textContent = totalSeconds + "s";
    }

    // Metric items
    refinementsMade.textContent = String(s.refinementsMade ?? 0);
    retriesSaved.textContent = String(Math.round((s.retriesAvoided ?? 0) * 10) / 10);
    avgTimeSaved.textContent = s.refinementsMade > 0
      ? Math.round((s.timeSavedSeconds ?? 0) / (s.refinementsMade ?? 1)) + "s"
      : "0s";

    // Shortcut indicator
    shortcutChip.textContent = (s.hotkey || "Ctrl+Alt+Space").replaceAll("+", " + ");

    // Inputs population
    apiKeyInput.value = settings.geminiApiKey || "";
    hotkeyInput.value = settings.hotkey || "Ctrl+Alt+Space";
    launchToggle.checked = Boolean(settings.launchOnStartup);

    // System Status indicators
    if (settings.launchOnStartup) {
      statusStartupDot.className = "w-2 h-2 rounded-full bg-emerald-500 shrink-0";
      statusStartupText.textContent = "Launch on Startup Enabled";
    } else {
      statusStartupDot.className = "w-2 h-2 rounded-full bg-gray-400 shrink-0";
      statusStartupText.textContent = "Launch on Startup Disabled";
    }

    // Theme loading
    applyTheme(settings.theme || "light");

    // Render Recent logs
    renderActivityLogs(settings.refinementLogs || []);

    // Check milestones
    const count = s.refinementsMade ?? 0;
    if (count > 0 && count % 10 === 0 && !s.shareCardDismissed) {
      milestoneCount.textContent = String(count);
      milestoneCard.classList.remove("hidden");
    } else {
      milestoneCard.classList.add("hidden");
    }

  } catch (err) {
    console.error("[Dashboard] Refresh failed:", err);
  }
}

// ── Save handlers ──
async function saveApiKey() {
  const key = apiKeyInput.value.trim();
  try {
    const res = await window.refinezy.settings.setApiKey(key);
    if (res?.ok) {
      apiKeyInput.classList.add("border-emerald-500");
      setTimeout(() => apiKeyInput.classList.remove("border-emerald-500"), 1500);
      await refresh();
    }
  } catch (err) {
    console.error("[Dashboard] saveApiKey failed:", err);
  }
}

async function saveLaunch() {
  try {
    await window.refinezy.settings.setLaunchOnStartup(launchToggle.checked);
    await refresh();
  } catch (err) {
    console.error("[Dashboard] saveLaunch failed:", err);
  }
}

async function saveHotkey() {
  const hk = hotkeyInput.value.trim() || "Ctrl+Alt+Space";
  try {
    const res = await window.refinezy.settings.setHotkey(hk);
    if (res?.ok) {
      hotkeyInput.classList.add("border-emerald-500");
      setTimeout(() => hotkeyInput.classList.remove("border-emerald-500"), 1500);
      await refresh();
    } else {
      hotkeyInput.classList.add("border-rose-500");
      setTimeout(() => hotkeyInput.classList.remove("border-rose-500"), 1500);
    }
  } catch (err) {
    console.error("[Dashboard] saveHotkey failed:", err);
  }
}

// ── Export Shares Utilities ──
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
      ]).then(() => {
        const copyBtnText = copyImageBtn.innerHTML;
        copyImageBtn.innerHTML = "✓ Copied!";
        setTimeout(() => copyImageBtn.innerHTML = copyBtnText, 1500);
      }).catch(() => {});
    }
  });
}

function shareToX() {
  const text = encodeURIComponent(
    `I've enhanced ${shareRefinements.textContent} texts with Refinezy! 🚀\n\nTime saved: ${shareTime.textContent}\nRetries prevented: ${shareRetries.textContent}\nDay streak: ${shareStreak.textContent}`
  );
  window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
}

function shareToLinkedIn() {
  const text = encodeURIComponent(
    `I've enhanced ${shareRefinements.textContent} texts using Refinezy — a lightweight desktop utility that turns rough instructions into polished AI prompts. Time saved: ${shareTime.textContent}, Retries prevented: ${shareRetries.textContent}.`
  );
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://refinezy.app&summary=${text}`, "_blank");
}

// ── Event Wire-ups ──
function init() {
  setGreeting();
  initTabs();

  // Theme Toggle
  themeToggle.addEventListener("click", toggleTheme);

  // Settings Handlers
  saveKeyBtn.addEventListener("click", saveApiKey);
  apiKeyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveApiKey();
  });
  hotkeyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveHotkey();
  });
  launchToggle.addEventListener("change", saveLaunch);

  // Modal open & close
  shareStatsBtn.addEventListener("click", showShareModal);
  shareCardClose.addEventListener("click", hideShareModal);
  shareCardCloseBtn.addEventListener("click", hideShareModal);

  // Modal Share actions
  downloadPngBtn.addEventListener("click", downloadPng);
  copyImageBtn.addEventListener("click", copyImage);
  shareXBtn.addEventListener("click", shareToX);
  shareLinkedInBtn.addEventListener("click", shareToLinkedIn);

  // Milestone actions
  milestoneClose.addEventListener("click", () => {
    milestoneCard.classList.add("hidden");
    window.refinezy.reward.dismissShareCard();
  });
  milestoneShare.addEventListener("click", showShareModal);

  // Auto-refresh on updates from backend
  window.refinezy.command.onRefresh(() => {
    setGreeting();
    refresh();
  });

  // Initial load
  refresh();
}

// Start everything
document.addEventListener("DOMContentLoaded", init);
