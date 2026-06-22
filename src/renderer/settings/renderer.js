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
const progressStreak = document.getElementById("progressStreak");

// Advanced settings
const advancedHeader = document.getElementById("advancedHeader");
const advancedContent = document.getElementById("advancedContent");
const launchToggle = document.getElementById("launchToggle");
const saveHistoryToggle = document.getElementById("saveHistoryToggle");
const hotkeyInput = document.getElementById("hotkeyInput");

// Progress buttons
const shareBtn = document.getElementById("shareBtn");

// Share card
const shareCard = document.getElementById("shareCard");
const shareCardClose = document.getElementById("shareCardClose");
const shareRefinements = document.getElementById("shareRefinements");
const shareTimeSaved = document.getElementById("shareTimeSaved");
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

// History
const logsContainer = document.getElementById("logsContainer");
const clearLogsBtn = document.getElementById("clearLogsBtn");

// Onboarding
const onboardingModal = document.getElementById("onboardingModal");
const onboardingModalClose = document.getElementById("onboardingModalClose");
const onboardingModalGotIt = document.getElementById("onboardingModalGotIt");

// ── History ──
async function loadHistory() {
  if (!logsContainer) return;
  try {
    const result = await window.refinzi.logs.get();
    const logs = result.logs || [];
    if (logs.length === 0) {
      logsContainer.innerHTML = "<p>No history yet.</p>";
      return;
    }
    logsContainer.innerHTML = logs.map(log => `
      <div style="border-bottom: 1px solid var(--border-color, #ccc); padding: 8px 0;">
        <small style="color: gray;">${new Date(log.timestamp || Date.now()).toLocaleString()}</small>
        <div style="margin-top: 4px;"><strong>Input:</strong> ${(log.input || "").substring(0, 100)}...</div>
        <div style="margin-top: 4px;"><strong>Output:</strong> ${(log.output || "").substring(0, 100)}...</div>
      </div>
    `).join("");
  } catch (e) {
    console.error("[CommandCenter] loadHistory failed", e);
    logsContainer.innerHTML = "<p>Error loading history.</p>";
  }
}

async function clearHistory() {
  try {
    await window.refinzi.logs.clear();
    await loadHistory();
    showNotification("success", "History cleared.");
  } catch (e) {
    console.error("[CommandCenter] clearHistory failed", e);
    showNotification("error", "Failed to clear history.");
  }
}

// Theme
const themeKey = "refinzi:theme";

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
  window.refinzi.app.showToast({ type, message }).catch(() => { });
}

// ── Populate share card ──
function populateShareCard(s) {
  if (shareRefinements) shareRefinements.textContent = String(s.refinementsMade ?? 0);
  const totalSeconds = s.timeSavedSeconds || 0;
  const timeStr = totalSeconds >= 60 ? Math.round(totalSeconds / 60) + "m" : totalSeconds + "s";
  if (shareTimeSaved) shareTimeSaved.textContent = timeStr;
  if (shareRetries) shareRetries.textContent = String(Math.round((s.retriesAvoided ?? 0) * 10) / 10);
  if (shareStreak) shareStreak.textContent = String(s.currentStreak ?? 0);
}

// ── PNG download ──
function buildStatsCanvas() {
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = 560 * scale;
  canvas.height = 280 * scale;
  const ctx = canvas.getContext("2d");

  // Background — premium indigo-to-teal gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#1e1b4b");
  grad.addColorStop(0.5, "#1e3a5f");
  grad.addColorStop(1, "#0f2f3f");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, 28 * scale);
  ctx.fill();

  // Subtle dot pattern overlay
  ctx.fillStyle = "rgba(129,140,248,0.04)";
  for (let x = 20; x < canvas.width; x += 30 * scale) {
    for (let y = 20; y < canvas.height; y += 30 * scale) {
      ctx.beginPath();
      ctx.arc(x, y, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Header label
  ctx.fillStyle = "rgba(129,140,248,0.7)";
  ctx.font = `700 ${9 * scale}px 'Segoe UI', system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.letterSpacing = `${1.5 * scale}px`;
  ctx.fillText("REFINZI · MY STATS", 28 * scale, 40 * scale);

  // 2x2 stat grid
  const stats = [
    { label: "Refinements",      val: shareRefinements?.textContent || "0" },
    { label: "Time Saved",       val: shareTimeSaved?.textContent    || "0m" },
    { label: "Retries Prevented", val: shareRetries?.textContent    || "0" },
    { label: "Day Streak",       val: shareStreak?.textContent      || "0" }
  ];

  const colW = canvas.width / 2;
  const rowH = (canvas.height - 80 * scale) / 2;

  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = col * colW + 28 * scale;
    const cy = 70 * scale + row * rowH;

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${28 * scale}px 'Segoe UI', system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(s.val, cx, cy + 28 * scale);

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = `600 ${9 * scale}px 'Segoe UI', system-ui, sans-serif`;
    ctx.fillText(s.label.toUpperCase(), cx, cy + 46 * scale);
  });

  // Brand watermark
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.font = `700 ${10 * scale}px 'Segoe UI', system-ui, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("refinzi.app", canvas.width - 28 * scale, canvas.height - 20 * scale);

  return canvas;
}

function downloadPng() {
  const canvas = buildStatsCanvas();
  const link = document.createElement("a");
  link.download = "refinzi-stats.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ── Copy image to clipboard ──
function copyImage() {
  const canvas = buildStatsCanvas();
  canvas.toBlob((blob) => {
    if (blob) {
      navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]).then(() => {
        showNotification("success", "Stats image copied to clipboard!");
      }).catch(() => {
        showNotification("error", "Could not copy to clipboard.");
      });
    }
  });
}

// ── Share to X ──
function shareToX() {
  const text = encodeURIComponent(
    `I've enhanced ${shareRefinements?.textContent || '0'} texts with Refinzi! 🚀\n\nTime saved: ${shareTimeSaved?.textContent || '0m'}\nRetries prevented: ${shareRetries?.textContent || '0'}\nDay streak: ${shareStreak?.textContent || '0'} days\n\nAI text refinement, right in your workflow.`
  );
  window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
}

// ── Share to LinkedIn ──
function shareToLinkedIn() {
  const text = encodeURIComponent(
    `I've enhanced ${shareRefinements?.textContent || '0'} texts using Refinzi — a lightweight desktop utility that refines your writing with AI, right in your workflow. Time saved: ${shareTimeSaved?.textContent || '0m'}, Retries prevented: ${shareRetries?.textContent || '0'}. Try it — your data stays on your device.`
  );
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://refinzi.app&summary=${text}`, "_blank");
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
    const result = await window.refinzi.settings.verifyApiKey(key);
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
  const settings = await window.refinzi.settings.get();

  // Clear and populate model options based on provider
  modelSelect.innerHTML = "";
  let models = [];
  let apiKey = "";

  if (provider === "gemini") {
    models = [
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" }
    ];
    apiKey = settings.geminiApiKey || "";
  } else if (provider === "openrouter") {
    models = [
      { value: "google/gemini-2.0-flash-exp:free", label: "FREE: Gemini 2.0 Flash" },
      { value: "meta-llama/llama-3.3-70b-instruct:free", label: "FREE: Llama 3.3 70B" },
      { value: "mistralai/pixtral-12b:free", label: "FREE: Pixtral 12B" },
      { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" }
    ];
    apiKey = settings.openRouterApiKey || "";
  }

  models.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.value;
    opt.textContent = m.label;
    modelSelect.appendChild(opt);
  });

  // Update API key field
  if (apiKeyInput) apiKeyInput.value = apiKey;

  // Set default model for the provider
  const defaultModel = provider === "gemini" ? "gemini-2.5-flash" : "google/gemini-2.0-flash-exp:free";
  modelSelect.value = defaultModel;

  // Save provider and default model selection
  try {
    await window.refinzi.settings.set({ 
      activeProvider: provider,
      activeModel: defaultModel
    });
    
    // Refresh UI status
    refresh();
  } catch (e) {
    console.warn("[CommandCenter] Could not save provider", e);
  }
}

async function handleModelChange() {
  if (!modelSelect) return;
  const model = modelSelect.value;
  try {
    await window.refinzi.settings.set({ activeModel: model });
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
    const s = await window.refinzi.reward.get();
    const settings = await window.refinzi.settings.get();
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

    // Progress section
    if (progressRefinements) progressRefinements.textContent = String(count);
    if (progressTimeSaved) {
      const minutes = Math.floor(totalSeconds / 60);
      progressTimeSaved.textContent = `${minutes} ${minutes === 1 ? 'Minute' : 'Minutes'}`;
    }
    if (progressStreak) {
      const streak = s.currentStreak ?? 0;
      progressStreak.textContent = `${streak}-Day`;
    }

    // Provider select
    if (providerSelect) {
      providerSelect.value = settings.activeProvider || "gemini";
    }

    // API key field - Load the key for the active provider
    if (apiKeyInput) {
      const activeProvider = providerSelect?.value || settings.activeProvider || "gemini";
      apiKeyInput.value = (activeProvider === "openrouter" ? settings.openRouterApiKey : settings.geminiApiKey) || "";
    }

    // Model select
    if (modelSelect) {
      // Dynamic model population based on current provider
      const provider = providerSelect?.value || settings.activeProvider || "gemini";
      modelSelect.innerHTML = "";
      let models = [];
      if (provider === "gemini") {
        models = [
          { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
          { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
          { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
          { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" }
        ];
      } else if (provider === "openrouter") {
        models = [
          { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
          { value: "openai/gpt-4o", label: "GPT-4o" },
          { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
          { value: "anthropic/claude-3-haiku", label: "Haiku" },
          { value: "google/gemini-flash-1.5", label: "Gemini Flash 1.5 (via OR)" }
        ];
      }
      models.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.value;
        opt.textContent = m.label;
        modelSelect.appendChild(opt);
      });
      modelSelect.value = settings.activeModel || (provider === "gemini" ? "gemini-2.5-flash" : "openai/gpt-4o-mini");
    }

    // Connection status reset
    if (connectionIndicator) {
      const activeProvider = providerSelect?.value || settings.activeProvider || "gemini";
      const hasKey = activeProvider === "openrouter" ? settings.openRouterApiKey : settings.geminiApiKey;
      if (hasKey) {
        connectionIndicator.className = "connection-indicator success";
        if (connectionText) connectionText.textContent = "Key saved, ready to test";
      } else {
        connectionIndicator.className = "connection-indicator";
        if (connectionText) connectionText.textContent = "Not tested";
      }
    }

    // Settings fields
    if (launchToggle) launchToggle.checked = Boolean(settings.launchOnStartup);
    if (saveHistoryToggle) saveHistoryToggle.checked = Boolean(settings.saveHistoryLocally);
    if (hotkeyInput) hotkeyInput.value = settings.hotkey || "Ctrl+Alt+Space";

    // Hero shortcut badge
    const heroShortcut = document.getElementById("heroShortcut");
    if (heroShortcut) {
      const displayHotkey = (settings.hotkey || "Ctrl+Alt+Space").replaceAll("+", " + ");
      heroShortcut.textContent = displayHotkey;
    }

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
  const provider = providerSelect?.value || "gemini";
  try {
    const res = await window.refinzi.settings.setApiKey(key, provider);
    if (res?.ok) {
      showNotification("success", `${provider === "openrouter" ? "OpenRouter" : "Gemini"} API key saved successfully.`);

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
    await window.refinzi.settings.setLaunchOnStartup(launchToggle.checked);
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
    const res = await window.refinzi.settings.setHotkey(hk);
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
if (saveHistoryToggle) {
  saveHistoryToggle.addEventListener("change", async () => {
    await window.refinzi.settings.set({ saveHistoryLocally: saveHistoryToggle.checked });
    showNotification("success", `History ${saveHistoryToggle.checked ? "enabled" : "disabled"}.`);
    await loadHistory();
  });
}
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
    window.refinzi.reward.dismissShareCard();
  });
}
if (milestoneShare) {
  milestoneShare.addEventListener("click", () => {
    showShareCard();
  });
}

// History clear
if (clearLogsBtn) clearLogsBtn.addEventListener("click", clearHistory);

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



// ── Initial load ──
refresh().catch(() => { });
loadHistory().catch(() => { });
applySavedTheme();

// Listen for updates from the main process when refinements happen
if (window.refinzi && window.refinzi.reward && window.refinzi.reward.onRefresh) {
  window.refinzi.reward.onRefresh(() => {
    console.log("[Refinzi][Settings] Refreshing stats due to reward:refresh");
    refresh().catch(() => { });
  });
}