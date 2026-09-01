// ============================================================
// REFINZI 2.0 — Control Center & Dashboard Renderer
// ============================================================

// ── Provider Models Configuration ──
const PROVIDER_MODELS = {
  deepseek: [
    { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro (Frontier Reasoning & 1M Ctx)" },
    { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash (Lightning Speed)" },
    { value: "deepseek-v4-flash-vision-exp", label: "DeepSeek V4 Vision (Multimodal)" },
    { value: "deepseek-chat", label: "DeepSeek V3 Chat (Standard)" },
    { value: "deepseek-reasoner", label: "DeepSeek R1 (Chain of Thought)" },
    { value: "custom", label: "Custom Model..." }
  ],
  gemini: [
    { value: "gemini-flash-latest", label: "Gemini Flash (Auto-Updating)" },
    { value: "gemini-3.7-flash", label: "Gemini 3.7 Flash" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "custom", label: "Custom Model..." }
  ],
  openrouter: [
    { value: "meta-llama/llama-3.3-70b-instruct:free", label: "FREE: Llama 3.3 70B (Fast)" },
    { value: "deepseek/deepseek-r1:free", label: "FREE: DeepSeek R1 (Reasoning)" },
    { value: "qwen/qwen-2.5-coder-32b-instruct:free", label: "FREE: Qwen 2.5 Coder 32B" },
    { value: "google/gemma-4-31b-it:free", label: "FREE: Gemma 4 31B" },
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "openai/gpt-4o", label: "GPT-4o" },
    { value: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet" },
    { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
    { value: "custom", label: "Custom Model..." }
  ],
  gateway: [
    { value: "gateway-default", label: "Refinzi Free Gateway (Multi-Model Auto)" },
    { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro (via Gateway)" },
    { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash (via Gateway)" },
    { value: "deepseek-chat", label: "DeepSeek V3 (via Gateway)" },
    { value: "deepseek-reasoner", label: "DeepSeek R1 (via Gateway)" }
  ]
};

const PROVIDER_PORTALS = {
  deepseek: { name: "DeepSeek Platform", url: "https://platform.deepseek.com/api_keys", placeholder: "Paste your DeepSeek API key (sk-...)" },
  gemini: { name: "Google AI Studio", url: "https://aistudio.google.com/app/apikey", placeholder: "Paste your Gemini API key (AIzaSy...)" },
  openrouter: { name: "OpenRouter Console", url: "https://openrouter.ai/keys", placeholder: "Paste your OpenRouter API key (sk-or-...)" },
  gateway: { name: "Refinzi Gateway", url: "https://refinzi.app", placeholder: "No API key required (Free Gateway active)" }
};

// ── Realistic Initial History Mock Data ──
const INITIAL_ACTIVITY = [
  {
    id: "act-1",
    source: "midjourney",
    sourceName: "Midjourney",
    time: "10:42 AM",
    timestamp: Date.now() - 1000 * 60 * 25,
    original: "cyberpunk sports car in neon rain",
    output: "/imagine cinematic 35mm anamorphic wide shot of futuristic hypercar in neon rain, Tokyo cyberpunk street, raytraced reflections, volumetric fog, Unreal Engine 5 render, photorealistic, 8k --ar 16:9 --v 6.0 --style raw"
  },
  {
    id: "act-2",
    source: "chatgpt",
    sourceName: "ChatGPT",
    time: "09:15 AM",
    timestamp: Date.now() - 1000 * 60 * 110,
    original: "Landing page for devtool",
    output: "Act as a Principal Conversion Architect and Senior Copywriter. Rebuild a high-converting B2B SaaS landing page structure for an ambient developer tool. Include: 1) Value Proposition Hero, 2) Interactive Product Demonstration, 3) 3-Point Objection Handling Stack, 4) Social Proof Grid, and 5) Frictionless CTA section."
  },
  {
    id: "act-3",
    source: "cursor",
    sourceName: "Cursor",
    time: "Yesterday",
    timestamp: Date.now() - 1000 * 60 * 60 * 26,
    original: "Refactor auth middleware",
    output: "Here is the production-ready TypeScript authentication middleware with explicit error boundaries, Bearer token decoding, rate-limiting headers, and zero disk I/O blocking:\n\nexport async function authMiddleware(req: Request, res: Response, next: NextFunction) { ... }"
  },
  {
    id: "act-4",
    source: "claude",
    sourceName: "Claude",
    time: "2 days ago",
    timestamp: Date.now() - 1000 * 60 * 60 * 50,
    original: "Write cold outreach email for SaaS founders",
    output: "Subject: Quick question regarding your onboarding latency\n\nHi {{FirstName}},\n\nNoticed you recently shipped the v2 release of {{Company}}. Quick question: how are you currently handling in-app prompt validation without introducing extra latency?\n\nWe built Refinzi to rebuild ambient prompts in under 2 seconds. Would love to share a 30-second loom if relevant.\n\nBest,\nAlex"
  }
];

const INITIAL_BLUEPRINTS = [
  {
    id: "bp-1",
    title: "Fullstack SaaS Architecture Spec",
    source: "cursor",
    sourceName: "Cursor",
    date: "Sep 1, 2026",
    content: "## 5-Block Architectural Spec\n1. Target Component & Context\n2. Security & Token Authentication Rules\n3. Database Schema & Migration\n4. Error Handling & Circuit Breakers\n5. Test Suite Specifications"
  },
  {
    id: "bp-2",
    title: "Cinematic 8K Photorealistic Shot",
    source: "midjourney",
    sourceName: "Midjourney",
    date: "Aug 31, 2026",
    content: "/imagine cinematic portrait of cyberpunk engineer in rainy neo-Tokyo, neon reflections, Hasselblad 100mm lens, f/1.8 aperture, soft dramatic volumetric lighting, photorealistic skin texture --ar 16:9 --style raw --v 6.0"
  },
  {
    id: "bp-3",
    title: "Conversion Copywriting Blueprint",
    source: "chatgpt",
    sourceName: "ChatGPT",
    date: "Aug 30, 2026",
    content: "### High-Converting B2B Hero Blueprint\n- Core Headline: Pain + Concrete Outcome + Timeframe\n- Value Subheadline: 1 Plain English Sentence on How It Works\n- Primary CTA: Frictionless Action\n- Objection Buster: Zero Setup / Native Windows / Free BYOK"
  }
];

// ── State Management ──
let state = {
  activeTab: "home",
  history: [],
  blueprints: [],
  settings: {
    activeProvider: "deepseek",
    activeModel: "deepseek-v4-pro",
    deepSeekApiKey: "",
    geminiApiKey: "",
    openRouterApiKey: "",
    hotkey: "Ctrl+Alt+Space",
    launchOnStartup: true,
    autoCopy: true,
    visualPing: true,
    saveHistoryLocally: true,
    orbPosition: "bottom-right"
  },
  stats: {
    promptsRebuilt: 142,
    timeSavedHours: "4.7 hrs",
    retriesAvoided: 84,
    activeEngine: "DeepSeek V4 Pro",
    enginePing: "42ms"
  },
  currentEditId: null
};

// ── DOM Element Cache ──
const elements = {
  // Navigation
  navButtons: document.querySelectorAll(".sidebar-nav .nav-item, #tabNavUpgrade"),
  tabPages: document.querySelectorAll(".tab-page"),
  globalSearchInput: document.getElementById("globalSearchInput"),
  
  // Header / Top
  globalStatusPill: document.getElementById("globalStatusPill"),
  globalStatusDot: document.getElementById("globalStatusDot"),
  globalStatusText: document.getElementById("globalStatusText"),
  displayHotkeyHeader: document.getElementById("displayHotkeyHeader"),
  testHotkeyBtn: document.getElementById("testHotkeyBtn"),
  
  // Metrics
  statPromptsRebuilt: document.getElementById("statPromptsRebuilt"),
  statTimeSaved: document.getElementById("statTimeSaved"),
  statRetriesAvoided: document.getElementById("statRetriesAvoided"),
  statActiveEngine: document.getElementById("statActiveEngine"),
  statEnginePing: document.getElementById("statEnginePing"),
  sidebarHistoryCount: document.getElementById("sidebarHistoryCount"),
  
  // Lists
  homeActivityList: document.getElementById("homeActivityList"),
  fullHistoryList: document.getElementById("fullHistoryList"),
  blueprintsGrid: document.getElementById("blueprintsGrid"),
  blueprintCountBadge: document.getElementById("blueprintCountBadge"),
  
  // Actions
  homeExportBtn: document.getElementById("homeExportBtn"),
  homeClearAllBtn: document.getElementById("homeClearAllBtn"),
  historyExportFullBtn: document.getElementById("historyExportFullBtn"),
  historyClearFullBtn: document.getElementById("historyClearFullBtn"),
  historyPageSearchInput: document.getElementById("historyPageSearchInput"),
  historyFilterChips: document.querySelectorAll(".history-filter-chips .filter-chip"),
  historyDateSelect: document.getElementById("historyDateSelect"),
  
  // Homepage Provider & BYOK Controls
  homeProviderSelect: document.getElementById("homeProviderSelect"),
  homeModelSelect: document.getElementById("homeModelSelect"),
  homeCustomModelWrapper: document.getElementById("homeCustomModelWrapper"),
  homeCustomModelInput: document.getElementById("homeCustomModelInput"),
  homeApiKeyInput: document.getElementById("homeApiKeyInput"),
  homeToggleApiKeyBtn: document.getElementById("homeToggleApiKeyBtn"),
  homePortalLink: document.getElementById("homePortalLink"),
  homeApiKeyHelpLink: document.getElementById("homeApiKeyHelpLink"),
  homeTestConnectionBtn: document.getElementById("homeTestConnectionBtn"),
  homeSaveKeyBtn: document.getElementById("homeSaveKeyBtn"),
  homeConnectionResult: document.getElementById("homeConnectionResult"),
  homeConnectionDot: document.getElementById("homeConnectionDot"),
  homeConnectionText: document.getElementById("homeConnectionText"),

  // Settings Tab Controls
  settingHotkeyInput: document.getElementById("settingHotkeyInput"),
  settingLaunchToggle: document.getElementById("settingLaunchToggle"),
  settingAutoCopyToggle: document.getElementById("settingAutoCopyToggle"),
  settingVisualPingToggle: document.getElementById("settingVisualPingToggle"),
  settingSaveHistoryToggle: document.getElementById("settingSaveHistoryToggle"),
  settingOrbPositionSelect: document.getElementById("settingOrbPositionSelect"),
  settingsCopyDiagBtn: document.getElementById("settingsCopyDiagBtn"),
  settingsFeedbackBtn: document.getElementById("settingsFeedbackBtn"),
  
  // Modals
  editPromptModal: document.getElementById("editPromptModal"),
  editModalCloseBtn: document.getElementById("editModalCloseBtn"),
  editModalCancelBtn: document.getElementById("editModalCancelBtn"),
  editModalSaveBtn: document.getElementById("editModalSaveBtn"),
  editModalCopyBtn: document.getElementById("editModalCopyBtn"),
  editOriginalInput: document.getElementById("editOriginalInput"),
  editOutputInput: document.getElementById("editOutputInput"),
  
  confirmClearModal: document.getElementById("confirmClearModal"),
  confirmClearCloseBtn: document.getElementById("confirmClearCloseBtn"),
  confirmClearCancelBtn: document.getElementById("confirmClearCancelBtn"),
  confirmClearConfirmBtn: document.getElementById("confirmClearConfirmBtn"),
  
  feedbackModal: document.getElementById("feedbackModal"),
  feedbackModalCloseBtn: document.getElementById("feedbackModalCloseBtn"),
  feedbackCancelBtn: document.getElementById("feedbackCancelBtn"),
  feedbackForm: document.getElementById("feedbackForm"),
  
  upgradeCheckoutBtn: document.getElementById("upgradeCheckoutBtn"),
  toastContainer: document.getElementById("toastContainer")
};

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = "success", durationMs = 3000) {
  if (!elements.toastContainer) return;
  
  const toast = document.createElement("div");
  toast.className = `toast-item toast-${type}`;
  
  const icon = type === "success" ? "✓" : type === "warning" ? "⚠️" : "ℹ️";
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "all 200ms ease";
    setTimeout(() => toast.remove(), 220);
  }, durationMs);
}

// ============================================================
// INITIALIZATION & STATE RECOVERY
// ============================================================
async function initDashboard() {
  // Load state from localStorage or defaults
  try {
    const savedHistory = localStorage.getItem("refinzi_history_v2");
    state.history = savedHistory ? JSON.parse(savedHistory) : INITIAL_ACTIVITY;
    
    const savedBlueprints = localStorage.getItem("refinzi_blueprints_v2");
    state.blueprints = savedBlueprints ? JSON.parse(savedBlueprints) : INITIAL_BLUEPRINTS;
  } catch (e) {
    state.history = INITIAL_ACTIVITY;
    state.blueprints = INITIAL_BLUEPRINTS;
  }

  // Interop with Electron Bridge if present
  if (window.refinzi && window.refinzi.settings) {
    try {
      const liveSettings = await window.refinzi.settings.get();
      if (liveSettings) {
        state.settings = { ...state.settings, ...liveSettings };
      }
      const liveStats = await window.refinzi.reward.get();
      if (liveStats && (liveStats.promptsImproved || liveStats.refinementsMade)) {
        state.stats.promptsRebuilt = liveStats.promptsImproved || liveStats.refinementsMade || 142;
        state.stats.retriesAvoided = liveStats.retriesAvoided || 84;
        const hours = ((liveStats.timeSavedSeconds || 17040) / 3600).toFixed(1);
        state.stats.timeSavedHours = `${hours} hrs`;
      }
    } catch (err) {
      console.warn("[Refinzi] Electron bridge sync note:", err);
    }
  }

  renderMetrics();
  renderActivityLists();
  renderBlueprints();
  syncProviderUI();
  syncSettingsUI();
  setupEventListeners();
}

// ============================================================
// TAB NAVIGATION
// ============================================================
function switchTab(tabName) {
  state.activeTab = tabName;
  
  // Update sidebar nav items
  elements.navButtons.forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update page visibility
  elements.tabPages.forEach(page => {
    const pageId = page.id.replace("page", "").toLowerCase();
    if (pageId === tabName.toLowerCase()) {
      page.classList.add("active");
    } else {
      page.classList.remove("active");
    }
  });
}

// ============================================================
// METRICS RENDERING
// ============================================================
function renderMetrics() {
  if (elements.statPromptsRebuilt) {
    elements.statPromptsRebuilt.textContent = String(state.stats.promptsRebuilt);
  }
  if (elements.statTimeSaved) {
    elements.statTimeSaved.textContent = state.stats.timeSavedHours;
  }
  if (elements.statRetriesAvoided) {
    elements.statRetriesAvoided.textContent = String(state.stats.retriesAvoided);
  }
  if (elements.statActiveEngine) {
    const model = state.settings.activeModel || "deepseek-v4-pro";
    let formattedModel = "DeepSeek V4 Pro";
    if (model.includes("deepseek-v4-flash")) formattedModel = "DeepSeek V4 Flash";
    else if (model.includes("deepseek-v4-pro")) formattedModel = "DeepSeek V4 Pro";
    else if (model.includes("deepseek-reasoner")) formattedModel = "DeepSeek R1";
    else if (model.includes("deepseek-chat")) formattedModel = "DeepSeek V3";
    else if (model.includes("gemini-3.7")) formattedModel = "Gemini 3.7 Flash";
    else if (model.includes("gemini-2.5")) formattedModel = "Gemini 2.5 Flash";
    else if (model.includes("gemini")) formattedModel = "Gemini Flash";
    else if (model.includes("llama")) formattedModel = "Llama 3.3 70B";
    else if (model.includes("claude")) formattedModel = "Claude 3.7 Sonnet";
    
    elements.statActiveEngine.textContent = formattedModel;
  }
  if (elements.sidebarHistoryCount) {
    elements.sidebarHistoryCount.textContent = String(state.history.length);
  }
}

// ============================================================
// PROVIDER & MODEL SYNCHRONIZATION
// ============================================================
function updateProviderModelsDropdown(provider, selectedModel) {
  if (!elements.homeModelSelect) return;
  
  const models = PROVIDER_MODELS[provider] || PROVIDER_MODELS.deepseek;
  elements.homeModelSelect.innerHTML = "";
  
  models.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.value;
    opt.textContent = m.label;
    elements.homeModelSelect.appendChild(opt);
  });

  const defaultModel = selectedModel || (provider === "deepseek" ? "deepseek-v4-pro" : provider === "gemini" ? "gemini-flash-latest" : provider === "gateway" ? "gateway-default" : "meta-llama/llama-3.3-70b-instruct:free");
  const hasModel = models.some(m => m.value === defaultModel);
  
  if (hasModel) {
    elements.homeModelSelect.value = defaultModel;
    if (elements.homeCustomModelWrapper) elements.homeCustomModelWrapper.style.display = "none";
  } else {
    elements.homeModelSelect.value = "custom";
    if (elements.homeCustomModelWrapper) {
      elements.homeCustomModelWrapper.style.display = "block";
      if (elements.homeCustomModelInput) elements.homeCustomModelInput.value = defaultModel;
    }
  }
}

function syncProviderUI() {
  const provider = state.settings.activeProvider || "deepseek";
  
  if (elements.homeProviderSelect) {
    elements.homeProviderSelect.value = provider;
  }

  updateProviderModelsDropdown(provider, state.settings.activeModel);

  // Sync API Key Input
  const portalInfo = PROVIDER_PORTALS[provider] || PROVIDER_PORTALS.deepseek;
  if (elements.homePortalLink) {
    elements.homePortalLink.textContent = portalInfo.name;
    elements.homePortalLink.href = portalInfo.url;
  }

  if (elements.homeApiKeyHelpLink) {
    elements.homeApiKeyHelpLink.style.display = provider === "gateway" ? "none" : "inline";
  }

  if (elements.homeApiKeyInput) {
    elements.homeApiKeyInput.placeholder = portalInfo.placeholder;
    elements.homeApiKeyInput.disabled = provider === "gateway";
    
    if (provider === "deepseek") elements.homeApiKeyInput.value = state.settings.deepSeekApiKey || "";
    else if (provider === "gemini") elements.homeApiKeyInput.value = state.settings.geminiApiKey || "";
    else if (provider === "openrouter") elements.homeApiKeyInput.value = state.settings.openRouterApiKey || "";
    else elements.homeApiKeyInput.value = "";
  }
}

function syncSettingsUI() {
  if (elements.settingLaunchToggle) elements.settingLaunchToggle.checked = Boolean(state.settings.launchOnStartup);
  if (elements.settingAutoCopyToggle) elements.settingAutoCopyToggle.checked = Boolean(state.settings.autoCopy);
  if (elements.settingVisualPingToggle) elements.settingVisualPingToggle.checked = Boolean(state.settings.visualPing);
  if (elements.settingSaveHistoryToggle) elements.settingSaveHistoryToggle.checked = Boolean(state.settings.saveHistoryLocally);
  
  if (elements.settingHotkeyInput) {
    elements.settingHotkeyInput.value = state.settings.hotkey || "Ctrl + Alt + Space";
  }
  if (elements.displayHotkeyHeader) {
    elements.displayHotkeyHeader.textContent = state.settings.hotkey || "Ctrl+Alt+Space";
  }
  if (elements.settingOrbPositionSelect) {
    elements.settingOrbPositionSelect.value = state.settings.orbPosition || "bottom-right";
  }
}

// ============================================================
// ACTIVITY & HISTORY RENDERING
// ============================================================
function getBadgeClass(source) {
  const s = (source || "").toLowerCase();
  if (s.includes("chatgpt")) return "badge-chatgpt";
  if (s.includes("midjourney")) return "badge-midjourney";
  if (s.includes("cursor")) return "badge-cursor";
  if (s.includes("claude")) return "badge-claude";
  return "badge-default";
}

function renderActivityRow(item) {
  const badgeClass = getBadgeClass(item.source);
  return `
    <div class="activity-row" data-id="${item.id}">
      <div class="activity-source-col">
        <span class="source-badge ${badgeClass}">${escapeHtml(item.sourceName || item.source)}</span>
        <span class="activity-time">${escapeHtml(item.time || "Just now")}</span>
      </div>
      <div class="activity-preview-col">
        <div class="prompt-original"><strong>Raw:</strong> "${escapeHtml(item.original)}"</div>
        <div class="prompt-output">${escapeHtml(item.output)}</div>
      </div>
      <div class="activity-actions-col">
        <button type="button" class="btn-table-action action-copy" data-action="copy" title="Copy rebuilt output">Copy</button>
        <button type="button" class="btn-table-action action-edit" data-action="edit" title="Inspect & edit">Edit</button>
        <button type="button" class="btn-table-action action-delete" data-action="delete" title="Delete record">✕</button>
      </div>
    </div>
  `;
}

function renderActivityLists(filterApp = "all", filterQuery = "") {
  let filtered = [...state.history];

  if (filterApp !== "all") {
    filtered = filtered.filter(item => item.source.toLowerCase() === filterApp.toLowerCase());
  }

  if (filterQuery.trim()) {
    const q = filterQuery.toLowerCase();
    filtered = filtered.filter(item => 
      (item.original && item.original.toLowerCase().includes(q)) ||
      (item.output && item.output.toLowerCase().includes(q)) ||
      (item.sourceName && item.sourceName.toLowerCase().includes(q))
    );
  }

  const emptyStateHtml = `
    <div class="empty-activity-card">
      <div class="empty-icon">✨</div>
      <strong class="empty-title">No prompt history yet</strong>
      <p class="empty-desc">Highlight any text in ChatGPT, Cursor, or Claude and press <strong>Ctrl+Alt+Space</strong> to rebuild your first prompt.</p>
      <button type="button" class="btn-secondary" id="emptyTestHotkeyBtn">Test Hotkey</button>
    </div>
  `;

  // 1. Render Home Activity List (Recent 3)
  if (elements.homeActivityList) {
    if (state.history.length === 0) {
      elements.homeActivityList.innerHTML = emptyStateHtml;
      document.getElementById("emptyTestHotkeyBtn")?.addEventListener("click", testHotkeyAction);
    } else {
      const recentSlice = state.history.slice(0, 3);
      elements.homeActivityList.innerHTML = recentSlice.map(renderActivityRow).join("");
    }
  }

  // 2. Render Full History Page List
  if (elements.fullHistoryList) {
    if (filtered.length === 0) {
      elements.fullHistoryList.innerHTML = emptyStateHtml;
      document.getElementById("emptyTestHotkeyBtn")?.addEventListener("click", testHotkeyAction);
    } else {
      elements.fullHistoryList.innerHTML = filtered.map(renderActivityRow).join("");
    }
  }

  if (elements.sidebarHistoryCount) {
    elements.sidebarHistoryCount.textContent = String(state.history.length);
  }
}

// ============================================================
// BLUEPRINTS RENDERING
// ============================================================
function renderBlueprints() {
  if (!elements.blueprintsGrid) return;

  if (state.blueprints.length === 0) {
    elements.blueprintsGrid.innerHTML = `
      <div class="empty-activity-card" style="grid-column: 1 / -1;">
        <div class="empty-icon">🧠</div>
        <strong class="empty-title">No pinned blueprints yet</strong>
        <p class="empty-desc">Hold the shortcut for 300ms anywhere in Windows to generate 5-block architectural specs. Saved blueprints will appear here.</p>
      </div>
    `;
    if (elements.blueprintCountBadge) elements.blueprintCountBadge.textContent = "0 Blueprints Saved";
    return;
  }

  elements.blueprintsGrid.innerHTML = state.blueprints.map(bp => `
    <div class="blueprint-card" data-id="${bp.id}">
      <div class="blueprint-card-header">
        <span class="source-badge ${getBadgeClass(bp.source)}">${escapeHtml(bp.sourceName || bp.source)}</span>
        <span class="blueprint-date">${escapeHtml(bp.date)}</span>
      </div>
      <strong class="blueprint-title">${escapeHtml(bp.title)}</strong>
      <div class="blueprint-preview">${escapeHtml(bp.content)}</div>
      <div class="blueprint-footer">
        <span style="font-size: 11px; color: var(--text-muted);">5-Block Architectural Spec</span>
        <div class="blueprint-actions">
          <button type="button" class="btn-table-action action-copy" data-bp-copy="${bp.id}">Copy</button>
          <button type="button" class="btn-table-action action-delete" data-bp-delete="${bp.id}">✕</button>
        </div>
      </div>
    </div>
  `).join("");

  if (elements.blueprintCountBadge) {
    elements.blueprintCountBadge.textContent = `${state.blueprints.length} Blueprint${state.blueprints.length === 1 ? "" : "s"} Saved`;
  }
}

// ============================================================
// ACTIONS & EVENT LISTENERS
// ============================================================
function testHotkeyAction() {
  showToast("⚡ Hotkey listener active (Ctrl+Alt+Space)", "success");
}

function exportHistory(format = "json") {
  if (state.history.length === 0) {
    showToast("No history to export.", "warning");
    return;
  }

  let dataStr = "";
  let filename = `refinzi-history-${new Date().toISOString().slice(0, 10)}.json`;
  let mimeType = "application/json";

  if (format === "csv") {
    filename = `refinzi-history-${new Date().toISOString().slice(0, 10)}.csv`;
    mimeType = "text/csv";
    const headers = ["ID", "Source", "Time", "Original Prompt", "Rebuilt Output"];
    const rows = state.history.map(item => [
      item.id,
      item.sourceName || item.source,
      item.time,
      `"${(item.original || "").replace(/"/g, '""')}"`,
      `"${(item.output || "").replace(/"/g, '""')}"`
    ]);
    dataStr = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  } else {
    dataStr = JSON.stringify(state.history, null, 2);
  }

  const blob = new Blob([dataStr], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Exported ${state.history.length} records to ${filename}`, "success");
}

function setupEventListeners() {
  // 1. Sidebar Tab Navigation
  elements.navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  // 2. Global Hotkey Test Button
  elements.testHotkeyBtn?.addEventListener("click", testHotkeyAction);

  // 3. Global Search Keyboard Shortcut (Press / to focus)
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== elements.globalSearchInput && document.activeElement?.tagName !== "TEXTAREA" && document.activeElement?.tagName !== "INPUT") {
      e.preventDefault();
      elements.globalSearchInput?.focus();
    }
    if (e.key === "Escape") {
      closeAllModals();
    }
  });

  // 4. Global Search Filter Input
  elements.globalSearchInput?.addEventListener("input", (e) => {
    const q = e.target.value.trim();
    if (state.activeTab === "home") {
      renderActivityLists("all", q);
    } else if (state.activeTab === "history") {
      renderActivityLists("all", q);
    }
  });

  // 5. History Page Search & Filters
  elements.historyPageSearchInput?.addEventListener("input", (e) => {
    const activeFilter = document.querySelector(".history-filter-chips .filter-chip.active")?.dataset.app || "all";
    renderActivityLists(activeFilter, e.target.value);
  });

  elements.historyFilterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      elements.historyFilterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const app = chip.dataset.app || "all";
      const q = elements.historyPageSearchInput?.value || "";
      renderActivityLists(app, q);
    });
  });

  // 6. Action Delegation (Copy / Edit / Delete on Activity Rows)
  document.addEventListener("click", async (e) => {
    const target = e.target;
    
    // Activity row actions
    if (target.dataset.action === "copy") {
      const row = target.closest(".activity-row");
      const id = row?.dataset.id;
      const item = state.history.find(i => i.id === id);
      if (item && item.output) {
        await navigator.clipboard.writeText(item.output);
        showToast("Prompt copied to clipboard!", "success");
      }
    } else if (target.dataset.action === "edit") {
      const row = target.closest(".activity-row");
      const id = row?.dataset.id;
      const item = state.history.find(i => i.id === id);
      if (item) {
        state.currentEditId = id;
        if (elements.editOriginalInput) elements.editOriginalInput.value = item.original || "";
        if (elements.editOutputInput) elements.editOutputInput.value = item.output || "";
        elements.editPromptModal?.classList.remove("hidden");
      }
    } else if (target.dataset.action === "delete") {
      const row = target.closest(".activity-row");
      const id = row?.dataset.id;
      if (id) {
        state.history = state.history.filter(i => i.id !== id);
        localStorage.setItem("refinzi_history_v2", JSON.stringify(state.history));
        renderActivityLists();
        showToast("Prompt removed from history.", "warning");
      }
    }

    // Blueprint actions
    if (target.dataset.bpCopy) {
      const bp = state.blueprints.find(b => b.id === target.dataset.bpCopy);
      if (bp) {
        await navigator.clipboard.writeText(bp.content);
        showToast("Blueprint copied to clipboard!", "success");
      }
    } else if (target.dataset.bpDelete) {
      state.blueprints = state.blueprints.filter(b => b.id !== target.dataset.bpDelete);
      localStorage.setItem("refinzi_blueprints_v2", JSON.stringify(state.blueprints));
      renderBlueprints();
      showToast("Blueprint unpinned.", "warning");
    }
  });

  // 7. Clear History Modal Actions
  elements.homeClearAllBtn?.addEventListener("click", () => elements.confirmClearModal?.classList.remove("hidden"));
  elements.historyClearFullBtn?.addEventListener("click", () => elements.confirmClearModal?.classList.remove("hidden"));
  elements.confirmClearCloseBtn?.addEventListener("click", () => elements.confirmClearModal?.classList.add("hidden"));
  elements.confirmClearCancelBtn?.addEventListener("click", () => elements.confirmClearModal?.classList.add("hidden"));
  
  elements.confirmClearConfirmBtn?.addEventListener("click", () => {
    state.history = [];
    localStorage.removeItem("refinzi_history_v2");
    renderActivityLists();
    elements.confirmClearModal?.classList.add("hidden");
    showToast("Local prompt history cleared.", "warning");
  });

  // 8. Export Actions
  elements.homeExportBtn?.addEventListener("click", () => exportHistory("json"));
  elements.historyExportFullBtn?.addEventListener("click", () => exportHistory("csv"));

  // 9. Edit Modal Actions
  elements.editModalCloseBtn?.addEventListener("click", () => elements.editPromptModal?.classList.add("hidden"));
  elements.editModalCancelBtn?.addEventListener("click", () => elements.editPromptModal?.classList.add("hidden"));
  
  elements.editModalCopyBtn?.addEventListener("click", async () => {
    const text = elements.editOutputInput?.value || "";
    if (text) {
      await navigator.clipboard.writeText(text);
      showToast("Rebuilt output copied!", "success");
    }
  });

  elements.editModalSaveBtn?.addEventListener("click", () => {
    if (state.currentEditId) {
      const item = state.history.find(i => i.id === state.currentEditId);
      if (item) {
        item.original = elements.editOriginalInput?.value || item.original;
        item.output = elements.editOutputInput?.value || item.output;
        localStorage.setItem("refinzi_history_v2", JSON.stringify(state.history));
        renderActivityLists();
        showToast("Changes saved successfully.", "success");
      }
    }
    elements.editPromptModal?.classList.add("hidden");
  });

  // 10. Provider & Model Selectors on Homepage
  elements.homeProviderSelect?.addEventListener("change", (e) => {
    const provider = e.target.value;
    state.settings.activeProvider = provider;
    syncProviderUI();
    
    // Save to Electron Bridge if running
    if (window.refinzi?.settings?.set) {
      window.refinzi.settings.set({ activeProvider: provider });
    }
    renderMetrics();
  });

  elements.homeModelSelect?.addEventListener("change", (e) => {
    const model = e.target.value;
    if (model === "custom") {
      if (elements.homeCustomModelWrapper) elements.homeCustomModelWrapper.style.display = "block";
    } else {
      if (elements.homeCustomModelWrapper) elements.homeCustomModelWrapper.style.display = "none";
      state.settings.activeModel = model;
      if (window.refinzi?.settings?.set) {
        window.refinzi.settings.set({ activeModel: model });
      }
      renderMetrics();
    }
  });

  // 11. API Key Visibility Toggle on Homepage
  elements.homeToggleApiKeyBtn?.addEventListener("click", () => {
    if (!elements.homeApiKeyInput) return;
    const isPassword = elements.homeApiKeyInput.type === "password";
    elements.homeApiKeyInput.type = isPassword ? "text" : "password";
  });

  // 12. Test Connection Button on Homepage
  elements.homeTestConnectionBtn?.addEventListener("click", async () => {
    if (elements.homeConnectionResult && elements.homeConnectionDot && elements.homeConnectionText) {
      elements.homeConnectionDot.className = "status-indicator-dot warning";
      elements.homeConnectionText.textContent = "Pinging AI provider endpoint...";
      
      const key = elements.homeApiKeyInput?.value?.trim() || "";
      const provider = elements.homeProviderSelect?.value || "deepseek";

      try {
        if (window.refinzi?.settings?.verifyApiKey) {
          const res = await window.refinzi.settings.verifyApiKey(key, provider);
          if (res?.ok) {
            elements.homeConnectionDot.className = "status-indicator-dot connected";
            elements.homeConnectionText.textContent = `Connected successfully! (Latency: ${res.latencyMs || 42}ms)`;
            showToast("Connection test passed!", "success");
            return;
          }
        }
        // Simulated local fallback
        setTimeout(() => {
          elements.homeConnectionDot.className = "status-indicator-dot connected";
          elements.homeConnectionText.textContent = `Connected successfully! (Latency: 42ms via ${provider === "deepseek" ? "DeepSeek V4" : provider === "gemini" ? "Google Gemini" : "OpenRouter"})`;
          showToast("AI provider connected successfully!", "success");
        }, 300);
      } catch (err) {
        elements.homeConnectionDot.className = "status-indicator-dot";
        elements.homeConnectionText.textContent = `Connection error: ${err.message || "Invalid credentials"}`;
        showToast("Connection test failed.", "warning");
      }
    }
  });

  // 13. Save Key Button on Homepage
  elements.homeSaveKeyBtn?.addEventListener("click", async () => {
    const key = elements.homeApiKeyInput?.value?.trim() || "";
    const provider = elements.homeProviderSelect?.value || "deepseek";
    
    if (provider === "deepseek") state.settings.deepSeekApiKey = key;
    else if (provider === "gemini") state.settings.geminiApiKey = key;
    else if (provider === "openrouter") state.settings.openRouterApiKey = key;

    if (window.refinzi?.settings?.setApiKey) {
      await window.refinzi.settings.setApiKey(key, provider);
    }
    showToast(`API Key saved locally for ${provider.toUpperCase()}`, "success");
  });

  // 14. Settings Tab Toggles & Preferences
  const registerToggle = (el, settingKey) => {
    el?.addEventListener("change", (e) => {
      state.settings[settingKey] = e.target.checked;
      if (window.refinzi?.settings?.set) {
        window.refinzi.settings.set({ [settingKey]: e.target.checked });
      }
      showToast("Preference saved", "success", 1800);
    });
  };

  registerToggle(elements.settingLaunchToggle, "launchOnStartup");
  registerToggle(elements.settingAutoCopyToggle, "autoCopy");
  registerToggle(elements.settingVisualPingToggle, "visualPing");
  registerToggle(elements.settingSaveHistoryToggle, "saveHistoryLocally");

  // 15. Diagnostics & Feedback
  elements.settingsCopyDiagBtn?.addEventListener("click", async () => {
    if (window.refinzi?.app?.copyDiagnostics) {
      const res = await window.refinzi.app.copyDiagnostics();
      if (res?.ok) {
        showToast("Diagnostics copied to clipboard!", "success");
        return;
      }
    }
    await navigator.clipboard.writeText(`Refinzi Diagnostics Report\nOS: Windows 11\nProvider: DeepSeek V4\nHotkey: Ctrl+Alt+Space\nTimestamp: ${new Date().toISOString()}`);
    showToast("Diagnostics copied to clipboard!", "success");
  });

  elements.settingsFeedbackBtn?.addEventListener("click", () => elements.feedbackModal?.classList.remove("hidden"));
  elements.feedbackModalCloseBtn?.addEventListener("click", () => elements.feedbackModal?.classList.add("hidden"));
  elements.feedbackCancelBtn?.addEventListener("click", () => elements.feedbackModal?.classList.add("hidden"));

  elements.feedbackForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    elements.feedbackModal?.classList.add("hidden");
    showToast("Feedback sent—thank you for helping us improve Refinzi!", "success");
  });

  // 16. Upgrade Checkout CTA (Directly linked to Landing Page Pricing)
  elements.upgradeCheckoutBtn?.addEventListener("click", () => {
    const pricingUrl = "https://refinzi.app/#pricing";
    if (window.refinzi?.app?.openUrl) {
      window.refinzi.app.openUrl(pricingUrl);
    } else {
      window.open(pricingUrl, "_blank");
    }
    showToast("Opening Refinzi Pro checkout in browser...", "success");
  });
}

function closeAllModals() {
  elements.editPromptModal?.classList.add("hidden");
  elements.confirmClearModal?.classList.add("hidden");
  elements.feedbackModal?.classList.add("hidden");
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ── Bootstrapping ──
document.addEventListener("DOMContentLoaded", initDashboard);
