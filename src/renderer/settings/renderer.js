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
const heroReels = document.getElementById("heroReels");
const heroLandingPages = document.getElementById("heroLandingPages");
const heroPromptsImproved = document.getElementById("heroPromptsImproved");

// API Provider
const apiKeyInput = document.getElementById("apiKey");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const testConnectionBtn = document.getElementById("testConnectionBtn");
const providerSelect = document.getElementById("providerSelect");
const modelSelect = document.getElementById("modelSelect");
const customModelWrapper = document.getElementById("customModelWrapper");
const customModelInput = document.getElementById("customModelInput");
const toggleApiKeyBtn = document.getElementById("toggleApiKey");
const connectionIndicator = document.getElementById("connectionIndicator");
const connectionText = document.getElementById("connectionText");
const connectionStatus = document.getElementById("connectionStatus");
const providerHint = document.getElementById("providerHint");

// Advanced settings
const launchToggle = document.getElementById("launchToggle");
const saveHistoryToggle = document.getElementById("saveHistoryToggle");
const hotkeyInput = document.getElementById("hotkeyInput");

// Progress buttons
const shareBtn = document.getElementById("shareBtn");

// Share card
const shareCard = document.getElementById("shareCard");
const shareCardClose = document.getElementById("shareCardClose");
const shareRefinements = document.getElementById("shareRefinements");
const shareReels = document.getElementById("shareReels");
const shareLandingPages = document.getElementById("shareLandingPages");
const sharePromptsImproved = document.getElementById("sharePromptsImproved");
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
const loadMoreContainer = document.getElementById("loadMoreContainer");
const loadMoreBtn = document.getElementById("loadMoreBtn");

// Onboarding
const onboardingModal = document.getElementById("onboardingModal");
const onboardingModalClose = document.getElementById("onboardingModalClose");
const onboardingModalGotIt = document.getElementById("onboardingModalGotIt");
const feedbackModal = document.getElementById("feedbackModal");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackModalClose = document.getElementById("feedbackModalClose");
const feedbackCancel = document.getElementById("feedbackCancel");
const feedbackCategory = document.getElementById("feedbackCategory");
const feedbackDescription = document.getElementById("feedbackDescription");
const feedbackContact = document.getElementById("feedbackContact");

// First-launch Premium introduction (kept inside the dashboard by design).
const premiumWelcome = document.getElementById("premiumWelcome");
const premiumWelcomeDismiss = document.getElementById("premiumWelcomeDismiss");
let premiumWelcomeScheduled = false;

function dismissPremiumWelcome() {
  if (premiumWelcome) premiumWelcome.classList.add("hidden");
  window.refinzi.settings.set({ premiumWelcomePending: false }).catch(() => { });
}

function showPremiumWelcomeIfNeeded(settings) {
  if (!settings.premiumWelcomePending || !premiumWelcome || premiumWelcomeScheduled) return;
  premiumWelcomeScheduled = true;
  window.setTimeout(() => premiumWelcome.classList.remove("hidden"), 650);
}

if (premiumWelcomeDismiss) premiumWelcomeDismiss.addEventListener("click", dismissPremiumWelcome);

// ── History ──
// ── History Pagination & State ──
let loadedLogs = [];
let currentOffset = 0;
const pageLimit = 10;

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function loadHistory(append = false, showLoading = true) {
  if (!logsContainer) return;
  try {
    if (!append) {
      loadedLogs = [];
      currentOffset = 0;
      if (showLoading) {
        logsContainer.innerHTML = `
          <div class="loading-history-state">
            <div class="skeleton-item"></div>
            <div class="skeleton-item"></div>
            <div class="skeleton-item"></div>
          </div>
        `;
      }
    }

    const result = await window.refinzi.logs.get({ offset: currentOffset, limit: pageLimit });
    const logs = result.logs || [];

    if (!append) {
      logsContainer.innerHTML = "";
    }

    loadedLogs = loadedLogs.concat(logs);
    currentOffset += logs.length;

    if (loadedLogs.length === 0) {
      logsContainer.innerHTML = `
        <div class="empty-history-state">
          <span class="empty-history-icon">✨</span>
          <strong>${saveHistoryToggle?.checked ? "Your first blueprint starts here" : "Keep your best work close"}</strong>
          <span class="empty-history-text">${saveHistoryToggle?.checked ? "Use one of the starter prompts above, then your result will appear here." : "Turn on local history to save refinements privately on this device."}</span>
          <button type="button" class="btn-secondary empty-history-action" id="historyEmptyAction">${saveHistoryToggle?.checked ? "Copy a starter prompt" : "Enable local history"}</button>
        </div>
      `;
      document.getElementById("historyEmptyAction")?.addEventListener("click", async () => {
        if (!saveHistoryToggle?.checked) {
          saveHistoryToggle.checked = true;
          await window.refinzi.settings.set({ saveHistoryLocally: true });
          showNotification("success", "Local history is on. Your next refinement will be saved here.");
          loadHistory(false, false);
        } else {
          document.querySelector(".starter-prompt")?.click();
        }
      });
      if (loadMoreContainer) loadMoreContainer.classList.add("hidden");
      return;
    }

    const newLogsHtml = logs.map(log => `
      <div class="log-item" data-index="${log.originalIndex}">
        <div class="log-header">
          <span class="log-time">${new Date(log.timestamp || Date.now()).toLocaleString()}</span>
          <div class="log-actions">
            <button class="log-action-btn copy-btn" title="Copy output" aria-label="Copy output">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="log-action-btn delete-btn" title="Delete entry" aria-label="Delete entry">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
        <div class="log-body">
          <div class="log-field">
            <span class="log-label">Input</span>
            <div class="log-text">${escapeHtml(log.input)}</div>
          </div>
          <div class="log-field">
            <span class="log-label">Output</span>
            <div class="log-text">${escapeHtml(log.output)}</div>
          </div>
        </div>
      </div>
    `).join("");

    logsContainer.insertAdjacentHTML("beforeend", newLogsHtml);

    if (result.hasMore) {
      if (loadMoreContainer) loadMoreContainer.classList.remove("hidden");
    } else {
      if (loadMoreContainer) loadMoreContainer.classList.add("hidden");
    }
  } catch (e) {
    console.error("[CommandCenter] loadHistory failed", e);
    logsContainer.innerHTML = `
      <div class="error-history-state">
        <span class="error-icon">⚠️</span>
        <span class="error-text">Failed to load history logs. Please try again.</span>
      </div>
    `;
    if (loadMoreContainer) loadMoreContainer.classList.add("hidden");
  }
}

async function clearHistory() {
  if (!confirm("Are you sure you want to clear your local refinement history? This action cannot be undone.")) {
    return;
  }
  try {
    await window.refinzi.logs.clear();
    await loadHistory(false);
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
  if (shareRefinements) shareRefinements.textContent = String(s.blueprintsGenerated ?? 0);
  if (shareReels) shareReels.textContent = String(s.reelsReverseEngineered ?? 0);
  if (shareLandingPages) shareLandingPages.textContent = String(s.landingPagesReverseEngineered ?? 0);
  if (sharePromptsImproved) sharePromptsImproved.textContent = String(s.promptsImproved ?? 0);
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
    { label: "Blueprints", val: shareRefinements?.textContent || "0" },
    { label: "Reels", val: shareReels?.textContent || "0" },
    { label: "Landing Pages", val: shareLandingPages?.textContent || "0" },
    { label: "Prompts Improved", val: sharePromptsImproved?.textContent || "0" }
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
    `I've generated ${shareRefinements?.textContent || '0'} blueprints (Reels: ${shareReels?.textContent || '0'}, Landing Pages: ${shareLandingPages?.textContent || '0'}) with Refinzi! 🚀\n\nPrompts improved: ${sharePromptsImproved?.textContent || '0'}\n\nReverse engineer viral content instantly.`
  );
  window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
}

// ── Share to LinkedIn ──
function shareToLinkedIn() {
  const text = encodeURIComponent(
    `I've generated ${shareRefinements?.textContent || '0'} blueprints using Refinzi (Reels: ${shareReels?.textContent || '0'}, Landing Pages: ${shareLandingPages?.textContent || '0'}). Prompts improved: ${sharePromptsImproved?.textContent || '0'}. Try it out at refinzi.app — your data stays on your device.`
  );
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://refinzi.app&summary=${text}`, "_blank");
}

// ── Connection test simulation ──
async function testConnection() {
  if (!testConnectionBtn || !connectionIndicator || !connectionText) return;

  const key = apiKeyInput ? apiKeyInput.value.trim() : "";
  const provider = providerSelect?.value || "gemini";

  if (!key && provider !== "gemini" && provider !== "gateway") {
    if (connectionStatus) connectionStatus.className = "connection-status status-error";
    connectionIndicator.className = "connection-indicator error";
    connectionText.textContent = "No API key provided";
    return;
  }

  // Show testing state
  testConnectionBtn.disabled = true;
  const originalBtnText = testConnectionBtn.textContent;
  testConnectionBtn.textContent = "Testing...";

  if (connectionStatus) connectionStatus.className = "connection-status status-testing";
  connectionIndicator.className = "connection-indicator testing";
  connectionText.textContent = "Testing connection...";

  try {
    const result = await window.refinzi.settings.verifyApiKey(key, provider);
    if (result?.ok) {
      if (connectionStatus) connectionStatus.className = "connection-status status-success";
      connectionIndicator.className = "connection-indicator success";
      if (!key && (provider === "gemini" || provider === "gateway")) {
        connectionText.textContent = "Gateway Connected";
      } else {
        connectionText.textContent = "Connected successfully";
      }
      showNotification("success", "Connection successful!");
    } else {
      if (connectionStatus) connectionStatus.className = "connection-status status-error";
      connectionIndicator.className = "connection-indicator error";
      connectionText.textContent = result?.error || "Connection failed";
      showNotification("error", result?.error || "Connection failed");
    }
  } catch (e) {
    console.error("[CommandCenter] testConnection failed", e);
    if (connectionStatus) connectionStatus.className = "connection-status status-error";
    connectionIndicator.className = "connection-indicator error";
    connectionText.textContent = "Connection failed";
    showNotification("error", "Failed to test connection.");
  } finally {
    testConnectionBtn.disabled = false;
    testConnectionBtn.textContent = originalBtnText;
  }
}

// ── API key visibility toggle ──
function toggleApiKeyVisibility() {
  if (!apiKeyInput || !toggleApiKeyBtn) return;
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
  toggleApiKeyBtn.setAttribute("aria-pressed", isPassword);

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

  modelSelect.innerHTML = "";
  let models = [];
  let apiKey = "";

  if (provider === "gemini") {
    models = [
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
      { value: "custom", label: "Custom Model..." }
    ];
    apiKey = settings.geminiApiKey || "";
  } else if (provider === "openrouter") {
    models = [
      { value: "google/gemini-2.0-flash-exp:free", label: "FREE: Gemini 2.0 Flash" },
      { value: "meta-llama/llama-3.3-70b-instruct:free", label: "FREE: Llama 3.3 70B" },
      { value: "deepseek/deepseek-r1:free", label: "FREE: DeepSeek R1" },
      { value: "qwen/qwen-2.5-coder-32b-instruct:free", label: "FREE: Qwen 2.5 Coder 32B" },
      { value: "google/gemma-2-9b-it:free", label: "FREE: Gemma 2 9B" },
      { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "openai/gpt-4o", label: "GPT-4o" },
      { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
      { value: "custom", label: "Custom Model..." }
    ];
    apiKey = settings.openRouterApiKey || "";
  } else if (provider === "gateway") {
    models = [
      { value: "gateway-default", label: "Refinzi Free Gateway (Multi-Model)" }
    ];
    apiKey = "";
  }

  models.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.value;
    opt.textContent = m.label;
    modelSelect.appendChild(opt);
  });

  if (apiKeyInput) apiKeyInput.value = apiKey;

  const defaultModel = provider === "gemini" ? "gemini-2.5-flash" : provider === "gateway" ? "gateway-default" : "google/gemini-2.0-flash-exp:free";
  modelSelect.value = defaultModel;

  if (customModelWrapper) {
    customModelWrapper.classList.add("hidden");
    customModelWrapper.style.display = "none";
  }

  try {
    await window.refinzi.settings.set({
      activeProvider: provider,
      activeModel: defaultModel
    });
    if (modelBadge) modelBadge.textContent = defaultModel;
  } catch (e) {
    console.warn("[CommandCenter] Could not save provider settings", e);
  }
  refresh();
}

async function handleModelChange() {
  if (!modelSelect) return;
  const model = modelSelect.value;

  if (model === "custom") {
    if (customModelWrapper) {
      customModelWrapper.classList.remove("hidden");
      customModelWrapper.style.display = "flex";
      setTimeout(() => customModelInput?.focus(), 60);
    }
    const customValue = customModelInput?.value?.trim() || "";
    try {
      await window.refinzi.settings.set({ activeModel: customValue });
      if (modelBadge) modelBadge.textContent = customValue || "custom";
    } catch (e) {
      console.warn("[CommandCenter] Could not save model", e);
    }
  } else {
    if (customModelWrapper) {
      customModelWrapper.classList.add("hidden");
      customModelWrapper.style.display = "none";
    }
    try {
      await window.refinzi.settings.set({ activeModel: model });
      if (modelBadge) modelBadge.textContent = model;
    } catch (e) {
      console.warn("[CommandCenter] Could not save model", e);
    }
  }
}

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
    showPremiumWelcomeIfNeeded(settings);

    // Header - Status chip
    if (apiStatus) {
      const statusChip = document.getElementById("statusChip");
      const statusDot = document.getElementById("statusDot");
      const activeProvider = settings.activeProvider || "gemini";
      const hasKey = activeProvider === "openrouter" ? settings.openRouterApiKey : settings.geminiApiKey;

      if (hasKey) {
        apiStatus.textContent = "Connected";
        if (statusChip) statusChip.className = "status-chip connected";
        if (statusDot) statusDot.className = "status-dot connected";
      } else if (activeProvider === "gemini" || activeProvider === "gateway") {
        apiStatus.textContent = "Gateway Active";
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
    if (heroRefinements) heroRefinements.textContent = String(s.blueprintsGenerated ?? 0);
    if (heroReels) heroReels.textContent = String(s.reelsReverseEngineered ?? 0);
    if (heroLandingPages) heroLandingPages.textContent = String(s.landingPagesReverseEngineered ?? 0);
    if (heroPromptsImproved) heroPromptsImproved.textContent = String(s.promptsImproved ?? 0);

    // Provider select
    if (providerSelect) {
      providerSelect.value = settings.activeProvider || "gemini";
    }

    // API key field
    if (apiKeyInput) {
      const activeProvider = providerSelect?.value || settings.activeProvider || "gemini";
      apiKeyInput.value = (activeProvider === "openrouter" ? settings.openRouterApiKey : settings.geminiApiKey) || "";
    }

    // Model select
    if (modelSelect) {
      const provider = providerSelect?.value || settings.activeProvider || "gemini";
      modelSelect.innerHTML = "";
      let models = [];
      if (provider === "gemini") {
        models = [
          { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
          { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
          { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
          { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
          { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
          { value: "custom", label: "Custom Model..." }
        ];
      } else if (provider === "openrouter") {
        models = [
          { value: "google/gemini-2.0-flash-exp:free", label: "FREE: Gemini 2.0 Flash" },
          { value: "meta-llama/llama-3.3-70b-instruct:free", label: "FREE: Llama 3.3 70B" },
          { value: "deepseek/deepseek-r1:free", label: "FREE: DeepSeek R1" },
          { value: "qwen/qwen-2.5-coder-32b-instruct:free", label: "FREE: Qwen 2.5 Coder 32B" },
          { value: "google/gemma-2-9b-it:free", label: "FREE: Gemma 2 9B" },
          { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
          { value: "openai/gpt-4o", label: "GPT-4o" },
          { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
          { value: "custom", label: "Custom Model..." }
        ];
      } else if (provider === "gateway") {
        models = [
          { value: "gateway-default", label: "Refinzi Free Gateway (Multi-Model)" }
        ];
      }

      models.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.value;
        opt.textContent = m.label;
        modelSelect.appendChild(opt);
      });

      const activeModel = settings.activeModel || (provider === "gemini" ? "gemini-2.5-flash" : provider === "gateway" ? "gateway-default" : "google/gemini-2.0-flash-exp:free");
      const isPredefined = models.some(m => m.value === activeModel && m.value !== "custom");

      if (isPredefined) {
        modelSelect.value = activeModel;
        if (customModelWrapper) {
          customModelWrapper.classList.add("hidden");
          customModelWrapper.style.display = "none";
        }
      } else {
        modelSelect.value = "custom";
        if (customModelWrapper) {
          customModelWrapper.classList.remove("hidden");
          customModelWrapper.style.display = "flex";
        }
        if (customModelInput) {
          customModelInput.value = activeModel;
        }
      }
    }

    // Connection status reset
    if (connectionIndicator) {
      const activeProvider = providerSelect?.value || settings.activeProvider || "gemini";
      const hasKey = activeProvider === "openrouter" ? settings.openRouterApiKey : settings.geminiApiKey;
      if (hasKey) {
        if (connectionStatus) connectionStatus.className = "connection-status status-success";
        connectionIndicator.className = "connection-indicator success";
        if (connectionText) connectionText.textContent = "Key saved, ready to test";
      } else if (activeProvider === "gemini" || activeProvider === "gateway") {
        if (connectionStatus) connectionStatus.className = "connection-status status-success";
        connectionIndicator.className = "connection-indicator success";
        if (connectionText) connectionText.textContent = "Gateway Active (No key needed)";
      } else {
        if (connectionStatus) connectionStatus.className = "connection-status";
        connectionIndicator.className = "connection-indicator";
        if (connectionText) connectionText.textContent = "Not tested";
      }
    }
    if (launchToggle) launchToggle.checked = Boolean(settings.launchOnStartup);
    if (saveHistoryToggle) saveHistoryToggle.checked = Boolean(settings.saveHistoryLocally);
    if (hotkeyInput) hotkeyInput.value = settings.hotkey || "Ctrl+Alt+Space";

    // Hero shortcut badge
    const heroShortcut = document.getElementById("heroShortcut");
    if (heroShortcut) {
      const displayHotkey = (settings.hotkey || "Ctrl+Alt+Space").replaceAll("+", " + ");
      heroShortcut.textContent = displayHotkey;
    }

    // Onboarding modal shortcut
    const onboardingModalShortcut = document.getElementById("onboardingModalShortcut");
    if (onboardingModalShortcut) {
      const parts = (settings.hotkey || "Ctrl+Alt+Space").split("+");
      onboardingModalShortcut.innerHTML = parts.map(p => `<kbd class="onboarding-kbd">${p.trim()}</kbd>`).join(" + ");
    }

    // Share card content
    populateShareCard(s);

    // Footer stats - use dynamic counters
    if (footerStats) {
      footerStats.textContent = `${s.blueprintsGenerated ?? 0} blueprints generated \u2022 ${s.promptsImproved ?? 0} prompts improved`;
    }

    // Milestone card
    const artCount = s.blueprintsGenerated ?? 0;
    if (milestoneCard) {
      if (artCount > 0 && artCount % 10 === 0 && !s.shareCardDismissed) {
        if (milestoneCount) milestoneCount.textContent = String(artCount);
        if (milestoneRewrites) milestoneRewrites.textContent = String(s.promptsImproved ?? 0);
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
        if (connectionStatus) connectionStatus.className = "connection-status status-success";
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
  if (hk === "Press keys..." || hk.endsWith("+...")) {
    await refresh(); // Revert to stored value
    return;
  }
  try {
    const res = await window.refinzi.settings.setHotkey(hk);
    if (res?.ok) {
      showNotification("success", `Hotkey updated to ${hk}`);
      await refresh();
    } else {
      console.warn("[CommandCenter] hotkey save failed", res?.error);
      showNotification("error", `Hotkey update failed: ${res?.error}`);
      await refresh(); // Revert
    }
  } catch (e) {
    console.error("[CommandCenter] saveHotkey failed", e);
    showNotification("error", "An error occurred while saving the hotkey.");
    await refresh(); // Revert
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
if (customModelInput) {
  customModelInput.addEventListener("input", async () => {
    const val = customModelInput.value.trim();
    try {
      await window.refinzi.settings.set({ activeModel: val });
      if (modelBadge) modelBadge.textContent = val || "custom";
    } catch (e) {
      console.warn("[CommandCenter] Could not save custom model", e);
    }
  });
}

if (hotkeyInput) {
  hotkeyInput.style.caretColor = "transparent"; // Hide text cursor for hotkey recording

  hotkeyInput.addEventListener("focus", () => {
    hotkeyInput.classList.add("recording");
    hotkeyInput.value = "Press keys...";
  });

  hotkeyInput.addEventListener("blur", async () => {
    hotkeyInput.classList.remove("recording");
    await saveHotkey();
  });

  hotkeyInput.addEventListener("keydown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Cancel / exit recording on plain Escape
    if (e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
      hotkeyInput.blur();
      return;
    }

    const key = e.key;
    const modifiers = [];
    if (e.ctrlKey) modifiers.push("Ctrl");
    if (e.altKey) modifiers.push("Alt");
    if (e.shiftKey) modifiers.push("Shift");
    if (e.metaKey) modifiers.push("Meta");

    const isModifierKey = ["Control", "Alt", "Shift", "Meta", "OS"].includes(key);

    if (!isModifierKey) {
      let keyName = key;
      if (key === " ") keyName = "Space";
      else if (keyName.length === 1) keyName = keyName.toUpperCase();

      if (modifiers.length > 0) {
        hotkeyInput.value = [...modifiers, keyName].join("+");
      } else {
        hotkeyInput.value = keyName;
      }
      hotkeyInput.blur();
    } else {
      if (modifiers.length > 0) {
        hotkeyInput.value = modifiers.join("+") + "+...";
      } else {
        hotkeyInput.value = "Press keys...";
      }
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

if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", async () => {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = "Loading...";
    try {
      await loadHistory(true);
    } finally {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Load More";
    }
  });
}

if (logsContainer) {
  logsContainer.addEventListener("click", async (e) => {
    const copyBtn = e.target.closest(".copy-btn");
    const deleteBtn = e.target.closest(".delete-btn");
    const logItem = e.target.closest(".log-item");
    if (!logItem) return;

    const originalIndex = parseInt(logItem.getAttribute("data-index"), 10);

    if (copyBtn) {
      const log = loadedLogs.find(l => l.originalIndex === originalIndex);
      if (log && log.output) {
        try {
          await navigator.clipboard.writeText(log.output);
          showNotification("success", "Output copied to clipboard.");

          // Wire copy success checkmark icon micro-animation
          const originalSVG = copyBtn.innerHTML;
          copyBtn.classList.add("copy-success");
          copyBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          `;
          setTimeout(() => {
            copyBtn.classList.remove("copy-success");
            copyBtn.innerHTML = originalSVG;
          }, 2000);
        } catch (err) {
          console.error("Failed to copy text", err);
          showNotification("error", "Failed to copy text to clipboard.");
        }
      }
    } else if (deleteBtn) {
      logItem.classList.add("removing");
      // Wait for animation to finish (280ms)
      await new Promise(resolve => setTimeout(resolve, 280));
      try {
        await window.refinzi.logs.delete(originalIndex);
        showNotification("success", "Log entry deleted.");
        await loadHistory(false, false);
      } catch (err) {
        console.error("Failed to delete log", err);
        showNotification("error", "Failed to delete history item.");
        logItem.classList.remove("removing");
      }
    }
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

function openFeedbackModal() {
  if (!feedbackModal) return;
  feedbackModal.classList.remove("hidden");
  feedbackDescription?.focus();
}
function closeFeedbackModal() {
  if (feedbackModal) feedbackModal.classList.add("hidden");
}
if (feedbackModalClose) feedbackModalClose.addEventListener("click", closeFeedbackModal);
if (feedbackCancel) feedbackCancel.addEventListener("click", closeFeedbackModal);
if (feedbackModal) feedbackModal.addEventListener("click", (event) => {
  if (event.target === feedbackModal) closeFeedbackModal();
});
if (feedbackForm) feedbackForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = feedbackForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const result = await window.refinzi.app.submitFeedback({
      category: feedbackCategory?.value,
      description: feedbackDescription?.value,
      contact: feedbackContact?.value
    });
    if (!result?.ok) throw new Error(result?.error || "Could not submit feedback.");
    feedbackForm.reset();
    closeFeedbackModal();
    showNotification("success", result.delivery === "sent" ? "Feedback sent—thank you." : "Feedback saved securely on this device.");
  } catch (error) {
    showNotification("error", error.message || "Could not submit feedback.");
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelectorAll(".starter-prompt").forEach((button) => {
  button.addEventListener("click", async () => {
    const result = await window.refinzi.app.copyText(button.dataset.prompt || "");
    if (result?.ok) {
      showNotification("success", "Starter prompt copied. Paste it anywhere, then refine.");
      const origText = button.textContent;
      button.textContent = "✓ Copied";
      button.style.borderColor = "var(--success)";
      button.style.color = "var(--success)";
      setTimeout(() => {
        button.textContent = origText;
        button.style.borderColor = "";
        button.style.color = "";
      }, 2000);
    } else {
      showNotification("error", "Could not copy the starter prompt.");
    }
  });
});

// ── Initial load ──
refresh().then(() => loadHistory()).catch(() => { });
applySavedTheme();

// Copy Diagnostics button listener
const copyDiagnosticsBtn = document.getElementById("copyDiagnosticsBtn");
if (copyDiagnosticsBtn) {
  copyDiagnosticsBtn.addEventListener("click", async () => {
    try {
      const res = await window.refinzi.app.copyDiagnostics();
      if (res && res.ok) {
        showNotification("success", "Diagnostics copied to clipboard.");
      } else {
        showNotification("error", "Failed to copy diagnostics: " + (res?.error || "unknown"));
      }
    } catch (err) {
      showNotification("error", "Error generating diagnostics.");
    }
  });
}

// Report Bug button listener
const reportBugBtn = document.getElementById("reportBugBtn");
if (reportBugBtn) {
  reportBugBtn.addEventListener("click", openFeedbackModal);
}

// Listen for updates from the main process when refinements happen
if (window.refinzi && window.refinzi.reward && window.refinzi.reward.onRefresh) {
  window.refinzi.reward.onRefresh(() => {
    console.log("[Refinzi][Settings] Refreshing stats due to reward:refresh");
    refresh().catch(() => { });
  });
}

// Listen for deep-link key configuration focus requests
if (window.refinzi && window.refinzi.settings && window.refinzi.settings.onFocusApiKey) {
  window.refinzi.settings.onFocusApiKey(() => {
    const keyInput = document.getElementById("apiKey");
    if (keyInput) {
      keyInput.focus();
      keyInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}
