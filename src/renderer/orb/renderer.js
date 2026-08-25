// [Refinzi][Orb] Renderer loaded

import { classifyArtifact } from "./artifactClassifier.js";

const debugLog = (...args) => {
  if (typeof window !== "undefined" && (window.localStorage?.getItem("REFINZI_DEBUG") === "true" || window.REFINZI_DEBUG)) {
    console.log(...args);
  }
};

// DOM Elements - with null checks to prevent startup failures
const orbEl = document.querySelector(".orb");
const orbHitEl = document.getElementById("orbHit");        // 140×140px invisible hit layer
const orbHoldRingEl = document.getElementById("orbHoldRing"); // 38px centered hold ring
const orbContainerEl = document.querySelector(".orb-container");
const orbDragHandle = document.getElementById("orbDragHandle"); // Dedicated drag handle
const statusBubbleEl = document.getElementById("statusBubble");
const rotatePlaceholderEl = document.getElementById("rotate-placeholder");// 📥 Refinzi • Drop to recreate.

const readyCardEl = document.getElementById("ready-card");
const processingCardEl = document.getElementById("processing-card");
const errorCardEl = document.getElementById("error-card");
const errorTextEl = document.getElementById("error-text");
const retryBtnEl = document.getElementById("retry-btn");
const personalizationToastEl = document.getElementById("personalization-toast");
const onboardingCardEl = document.getElementById("onboarding-card");
const onboardingGotItBtn = document.getElementById("onboarding-got-it");

// Safely query sparkle and brain elements
const sparkleEl = orbEl ? orbEl.querySelector(".sparkle") : null;
const brainEl = orbEl ? orbEl.querySelector(".brain") : null;

// Log critical DOM elements for debugging
if (!orbEl || !orbHitEl) {
  console.error("[Refinzi][Orb] Critical DOM elements missing - orb:", !!orbEl, "orbHit:", !!orbHitEl);
}


let isIgnoring = true;

function updateIgnoreState(clientX, clientY) {
  // If dragging or pointer down is in progress, do not ignore mouse events
  if (isDragging || downTime > 0) {
    if (isIgnoring) {
      isIgnoring = false;
      if (window.refinzi?.orb?.setIgnoreMouse) {
        window.refinzi.orb.setIgnoreMouse(false);
      }
    }
    return;
  }

  try {
    const el = document.elementFromPoint(clientX, clientY);
    let interactive = false;
    if (el) {
      const isOrbHit = el.id === "orbHit" || el.closest("#orbHit") || el.closest(".orb-container");
      const isStatusBubble = el.closest("#statusBubble") && statusBubbleEl && !statusBubbleEl.classList.contains("hidden");
      const isOnboarding = el.closest("#onboarding-card") && onboardingCardEl && !onboardingCardEl.classList.contains("hidden");
      const isQuickStart = el.closest("#quick-start-overlay") && quickStartOverlayEl && !quickStartOverlayEl.classList.contains("hidden");
      const isFirstRefinement = el.closest("#first-refinement-tooltip") && firstRefinementTooltipEl && !firstRefinementTooltipEl.classList.contains("hidden");
      const isMilestone = el.closest("#milestone-celebration") && milestoneCelebrationEl && !milestoneCelebrationEl.classList.contains("hidden");
      const isToast = el.closest("#personalization-toast") && personalizationToastEl && !personalizationToastEl.classList.contains("hidden");

      if (isOrbHit || isStatusBubble || isOnboarding || isQuickStart || isFirstRefinement || isMilestone || isToast) {
        interactive = true;
      }
    }

    const shouldIgnore = !interactive;
    if (shouldIgnore !== isIgnoring) {
      isIgnoring = shouldIgnore;
      if (window.refinzi?.orb?.setIgnoreMouse) {
        window.refinzi.orb.setIgnoreMouse(shouldIgnore);
      }
    }
  } catch (e) {
    // Silently fail if elementFromPoint or DOM operations fail
    debugLog("[Orb] updateIgnoreState error:", e);
  }
}

window.addEventListener("pointermove", (e) => {
  updateIgnoreState(e.clientX, e.clientY);
});

window.addEventListener("mouseleave", () => {
  if (!isIgnoring && !isDragging && downTime === 0) {
    isIgnoring = true;
    if (window.refinzi?.orb?.setIgnoreMouse) {
      window.refinzi.orb.setIgnoreMouse(true);
    }
  }
});

// ── State ──
let appState = "ready";
let isOnboardingActive = false;

// Safety flag to prevent multiple initialization attempts
let isInitialized = false;

// ── Unified Drag + Interaction State ──
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let windowStartPos = { x: 0, y: 0 };
let localOrbPos = { x: 0, y: 0 };
const DRAG_THRESHOLD_PX = 8;   // pixels of movement before a hold becomes a drag

// ── Center Interaction State ──
let holdTimer = null;
let wasHeld = false;
let downTime = 0;
const HOLD_THRESHOLD_MS = 300;
let activePointerId = null;

let brainMorphTimer = null;
let watchdogTimer = null;
const WATCHDOG_TIMEOUT_MS = 30_000;
let lastInteractionMode = 'sparkle';

let lastPayload = null;

function setHolding(active) {
  if (active) {
    if (orbHitEl) orbHitEl.classList.add("holding");
    if (orbEl) orbEl.classList.add("holding");
    if (orbHoldRingEl) orbHoldRingEl.classList.add("active");
  } else {
    if (orbHitEl) orbHitEl.classList.remove("holding");
    if (orbEl) orbEl.classList.remove("holding");
    if (orbHoldRingEl) orbHoldRingEl.classList.remove("active");
  }
}

// Coalescing RAF for moves
let moveRafId = null;
let pendingPos = null;

// ── ORB-UX-002 Interaction Telemetry ────────────────────────────────────────
const telemetry = {
  _hoverStart: 0,
  _downAt: 0,
  _downX: 0,
  _downY: 0,

  emit(type, extra = {}) {
    if (!window.refinzi?.orb?.logTelemetry) return;
    window.refinzi.orb.logTelemetry({ type, ts: Date.now(), ...extra });
  },

  hoverStart(clientX, clientY) {
    this._hoverStart = Date.now();
    this.emit('hover_start', {
      hitX: Math.round(clientX),
      hitY: Math.round(clientY)
    });
  },

  hoverEnd() {
    const duration = this._hoverStart ? Date.now() - this._hoverStart : 0;
    this._hoverStart = 0;
    this.emit('hover_end', { duration_ms: duration });
  },

  pointerDown(screenX, screenY, clientX, clientY) {
    this._downAt = Date.now();
    this._downX = screenX;
    this._downY = screenY;
    this.emit('pointer_down', {
      hitX: Math.round(clientX),
      hitY: Math.round(clientY)
    });
  },

  dragStart() {
    this.emit('drag_start', { latency_ms: Date.now() - this._downAt });
  },

  dragEnd(screenX, screenY) {
    const distX = screenX - this._downX;
    const distY = screenY - this._downY;
    const dist = Math.round(Math.sqrt(distX * distX + distY * distY));
    this.emit('drag_end', { distance_px: dist });
  },

  dragAborted() {
    this.emit('drag_aborted');
  },

  click() {
    this.emit('click', { latency_ms: Date.now() - this._downAt });
  },

  holdAttempt() {
    this.emit('hold_attempt');
  },

  holdSuccess() {
    this.emit('hold_success', { held_ms: Date.now() - this._downAt });
  },

  holdAborted() {
    this.emit('hold_aborted', { held_ms: Date.now() - this._downAt });
  },

  refinementSuccess(mode) {
    this.emit('refinement_success', { mode });
  },

  refinementFailed(mode) {
    this.emit('refinement_failed', { mode });
  }
};

// ────────────────────────────────────────────────────────────────────────────

// Sync localOrbPos once on load so the first drag is correct
if (window.refinzi && window.refinzi.orb && window.refinzi.orb.getPosition) {
  window.refinzi.orb.getPosition().then(pos => {
    if (pos) localOrbPos = pos;
  });
}

// Onboarding State Checks
let onboardingTimeout = null;
let quickStartOverlayEl = null;
let firstRefinementTooltipEl = null;
let milestoneCelebrationEl = null;
let quickStartSkipBtn = null;
let quickStartStartBtn = null;

// Onboarding state tracking
let hasSeenQuickStart = false;
let hasCompletedFirstRefinement = false;
let refinementCount = 0;

async function dismissOnboarding(tryIt = false) {
  if (onboardingTimeout) {
    clearTimeout(onboardingTimeout);
    onboardingTimeout = null;
  }
  isOnboardingActive = false;
  if (window.refinzi && window.refinzi.settings && window.refinzi.settings.set) {
    await window.refinzi.settings.set({ onboardingSeen: true });
  }
  onboardingCardEl.classList.add("hidden");
  if (window.refinzi && window.refinzi.orb && window.refinzi.orb.resize) {
    await window.refinzi.orb.resize({ width: 220, height: 120 });
  }
  updateBubbleVisibility();

  if (tryIt) {
    const sampleArtifact = {
      type: "landing-page",
      name: "SaaS Hero Page",
      text: "Landing Page: Minimalist layout with light theme, large typography hero heading 'Design at the speed of thought', dual action buttons 'Start Free Trial' and 'Book Demo', floating 3D browser showcase illustration below, followed by three horizontal customer logo vectors.",
      isSample: true
    };

    try {
      showState("processing");
      let promptData = await window.refinzi.orb.generatePrompt(sampleArtifact);
      if (promptData && (promptData.reason === "quota_exceeded" || promptData.ok === false)) {
        promptData = { prompt: "", isQuotaExceeded: true };
      }
      await window.refinzi.orb.showPromptWindow(promptData);
      showState("ready");
    } catch (err) {
      console.error("Failed to run sample:", err);
      showState("error");
    }
  }
}

// Quick Start Overlay
function showQuickStartOverlay() {
  if (!quickStartOverlayEl) {
    quickStartOverlayEl = document.getElementById("quick-start-overlay");
  }
  if (quickStartOverlayEl) {
    quickStartOverlayEl.classList.remove("hidden");
    hasSeenQuickStart = true;
  }
}

function hideQuickStartOverlay() {
  if (quickStartOverlayEl) {
    quickStartOverlayEl.classList.add("hidden");
  }
}

async function dismissQuickStart() {
  hideQuickStartOverlay();
  isOnboardingActive = false;
  if (window.refinzi && window.refinzi.settings && window.refinzi.settings.set) {
    await window.refinzi.settings.set({ quickStartSeen: true, onboardingSeen: true });
  }
  if (window.refinzi && window.refinzi.orb && window.refinzi.orb.resize) {
    await window.refinzi.orb.resize({ width: 220, height: 120 });
  }
  updateBubbleVisibility();
}

// First-Refinement Tooltip
function showFirstRefinementTooltip() {
  if (!firstRefinementTooltipEl) {
    firstRefinementTooltipEl = document.getElementById("first-refinement-tooltip");
  }
  if (firstRefinementTooltipEl && !hasCompletedFirstRefinement) {
    firstRefinementTooltipEl.classList.remove("hidden");
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
      hideFirstRefinementTooltip();
    }, 8000);
  }
}

function hideFirstRefinementTooltip() {
  if (firstRefinementTooltipEl) {
    firstRefinementTooltipEl.classList.add("hidden");
  }
}

// Milestone Celebration
function showMilestoneCelebration(icon, text, subtext) {
  if (!milestoneCelebrationEl) {
    milestoneCelebrationEl = document.getElementById("milestone-celebration");
  }
  if (milestoneCelebrationEl) {
    const milestoneIconEl = document.getElementById("milestone-icon");
    const milestoneTextEl = document.getElementById("milestone-text");
    const milestoneSubtextEl = document.getElementById("milestone-subtext");
    
    if (milestoneIconEl) milestoneIconEl.textContent = icon;
    if (milestoneTextEl) milestoneTextEl.textContent = text;
    if (milestoneSubtextEl) milestoneSubtextEl.textContent = subtext;
    
    milestoneCelebrationEl.classList.remove("hidden");
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      hideMilestoneCelebration();
    }, 3000);
  }
}

function hideMilestoneCelebration() {
  if (milestoneCelebrationEl) {
    milestoneCelebrationEl.classList.add("hidden");
  }
}

// Enhanced Error Messages
function showEnhancedError(title, description, suggestion) {
  if (errorTextEl) {
    // Hide the original span
    errorTextEl.style.display = 'none';
    
    // Create or get the enhanced error container
    let enhancedErrorEl = document.querySelector('.error-message-enhanced');
    if (!enhancedErrorEl) {
      enhancedErrorEl = document.createElement('div');
      enhancedErrorEl.className = 'error-message-enhanced';
      errorTextEl.parentNode.appendChild(enhancedErrorEl);
    }
    
    enhancedErrorEl.innerHTML = `
      <div class="error-title">⚠️ ${title}</div>
      <div class="error-description">${description}</div>
      ${suggestion ? `<div class="error-suggestion">💡 ${suggestion}</div>` : ''}
    `;
    enhancedErrorEl.style.display = 'flex';
  }
  showState("error");
}

// Check onboarding status on load
if (window.refinzi && window.refinzi.settings && window.refinzi.settings.get) {
  window.refinzi.settings.get().then((settings) => {
    // Keep onboarding flags updated without hijacking the floating Orb window
    if (settings && (!settings.onboardingSeen || !settings.quickStartSeen)) {
      if (window.refinzi.settings.set) {
        window.refinzi.settings.set({ onboardingSeen: true, quickStartSeen: true });
      }
    }
    if (window.refinzi.orb && window.refinzi.orb.resize) {
      window.refinzi.orb.resize({ width: 220, height: 120 });
    }
  });
}

// Quick Start button handlers
if (!quickStartSkipBtn) {
  quickStartSkipBtn = document.getElementById("quick-start-skip");
}
if (quickStartSkipBtn) {
  quickStartSkipBtn.addEventListener("click", () => dismissQuickStart());
}

if (!quickStartStartBtn) {
  quickStartStartBtn = document.getElementById("quick-start-start");
}
if (quickStartStartBtn) {
  quickStartStartBtn.addEventListener("click", () => dismissQuickStart());
}

if (onboardingGotItBtn) {
  onboardingGotItBtn.addEventListener("click", () => dismissOnboarding(false));
}

const onboardingTryItBtn = document.getElementById("onboarding-try-it");
if (onboardingTryItBtn) {
  onboardingTryItBtn.addEventListener("click", () => dismissOnboarding(true));
}

if (retryBtnEl) {
  retryBtnEl.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (lastPayload) {
      try {
        showState("processing");
        let promptData = await window.refinzi.orb.generatePrompt(lastPayload);
        if (promptData && (promptData.reason === "quota_exceeded" || promptData.ok === false)) {
          promptData = { prompt: "", isQuotaExceeded: true };
        }
        await window.refinzi.orb.showPromptWindow(promptData);
        showState("ready");
      } catch (err) {
        console.error("[Orb] Retry failed:", err);
        showState("error");
      }
    } else {
      showState("ready");
    }
  });
}

function updateBubbleVisibility() {
  if (isOnboardingActive) {
    statusBubbleEl.classList.add("hidden");
    return;
  }

  if (appState === "processing" || appState === "error") {
    statusBubbleEl.classList.remove("hidden");
    return;
  }

  // Ready state: bubble is hidden (hovers removed)
  statusBubbleEl.classList.add("hidden");
}

// ── MOUSE CLICK-THROUGH ──
// Window stays in setIgnoreMouseEvents(true, {forward:true}) PERMANENTLY.
// CSS pointer-events: none on body, auto on .orb-hit handles interactivity.

// ── Coalesced drag move via RAF ──
function sendMove(x, y) {
  pendingPos = { x, y };
  if (!moveRafId) {
    moveRafId = requestAnimationFrame(() => {
      if (pendingPos && window.refinzi && window.refinzi.orb && window.refinzi.orb.move) {
        window.refinzi.orb.move(pendingPos);
      }
      moveRafId = null;
      pendingPos = null;
    });
  }
}

// ── Unified Orb Interaction (Click / Hold / Drag — all from orbHit) ───────
//
// Interaction rules:
//   Tap  (< HOLD_THRESHOLD_MS, < DRAG_THRESHOLD_PX movement) → Sparkle / Preserve
//   Hold (≥ HOLD_THRESHOLD_MS, < DRAG_THRESHOLD_PX movement) → Expert / Brain
//   Drag (≥ DRAG_THRESHOLD_PX movement while held)           → Move window freely

function firePreserve() {
  telemetry.click();
  lastInteractionMode = 'preserve';
  if (window.refinzi?.orb?.clicked) window.refinzi.orb.clicked("preserve");
}

function fireExpert() {
  telemetry.holdSuccess();
  lastInteractionMode = 'expert';
  if (window.refinzi?.orb?.clicked) window.refinzi.orb.clicked("expert");
  // Show brain for 1.5s then revert to sparkle
  if (brainMorphTimer) { clearTimeout(brainMorphTimer); brainMorphTimer = null; }
  if (sparkleEl) sparkleEl.classList.add("hidden");
  if (brainEl) brainEl.classList.add("visible");
  brainMorphTimer = setTimeout(() => {
    if (sparkleEl) sparkleEl.classList.remove("hidden");
    if (brainEl) brainEl.classList.remove("visible");
    brainMorphTimer = null;
    updateBubbleVisibility();
  }, 1500);
}

function centerPointerDown(e) {
  if (e.pointerType === "touch") return;
  e.preventDefault();

  activePointerId = e.pointerId;
  downTime = Date.now();
  wasHeld = false;
  isDragging = false;
  dragStart = { x: e.screenX, y: e.screenY };
  windowStartPos = { x: localOrbPos.x, y: localOrbPos.y };

  telemetry.pointerDown(e.screenX, e.screenY, e.offsetX, e.offsetY);

  // Immediate visual feedback
  orbEl.classList.add("orb-down");
  orbEl.classList.remove("expert-active");

  // Capture pointer so we keep receiving moves/ups even if cursor leaves the element
  try { orbHitEl.setPointerCapture(e.pointerId); } catch (_) {}

  // Show hold progress ring
  setHolding(true);

  // Start hold timer — cancelled if movement exceeds drag threshold first
  if (holdTimer) clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    if (isDragging) return;   // drag already started — ignore hold
    wasHeld = true;
    holdTimer = null;
    telemetry.holdAttempt();

    // Remove holding ring, release down pressure, and activate expert spring state
    setHolding(false);
    orbEl.classList.remove("orb-down");
    orbEl.classList.add("expert-active");

    if (sparkleEl) sparkleEl.classList.add("hidden");
    if (brainEl) brainEl.classList.add("visible");
    updateBubbleVisibility();
  }, HOLD_THRESHOLD_MS);
}

function centerPointerMove(e) {
  if (e.pointerType === "touch") return;
  if (downTime === 0) return;   // pointer not pressed

  const dx = e.screenX - dragStart.x;
  const dy = e.screenY - dragStart.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (!isDragging && dist >= DRAG_THRESHOLD_PX) {
    // ── Transition into drag mode ──
    isDragging = true;

    // Cancel any pending hold/click intent
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    setHolding(false);
    wasHeld = false;

    // Clear active/down pressure states
    orbEl.classList.remove("orb-down");
    orbEl.classList.remove("expert-active");

    // Restore orb icon if brain was showing
    if (sparkleEl && brainEl) {
      sparkleEl.classList.remove("hidden");
      brainEl.classList.remove("visible");
    }

    // Visual feedback
    orbEl.classList.add("dragging");
    orbHitEl.style.cursor = "grabbing";
    document.body.style.cursor = "grabbing";

    telemetry.dragStart();
    updateBubbleVisibility();
  }

  if (isDragging) {
    const newX = windowStartPos.x + (e.screenX - dragStart.x);
    const newY = windowStartPos.y + (e.screenY - dragStart.y);
    localOrbPos = { x: newX, y: newY };
    sendMove(newX, newY);
  }
}

function centerPointerUp(e) {
  if (e.pointerType === "touch") return;

  // Release pointer capture
  try {
    if (orbHitEl.hasPointerCapture(e.pointerId)) orbHitEl.releasePointerCapture(e.pointerId);
  } catch (_) {}

  activePointerId = null;
  orbEl.classList.remove("orb-down");
  orbEl.classList.remove("expert-active");

  if (isDragging) {
    // ── End drag ──
    isDragging = false;
    orbEl.classList.remove("dragging");
    orbHitEl.style.cursor = "grab";
    document.body.style.cursor = "";

    telemetry.dragEnd(e.screenX, e.screenY);

    if (window.refinzi?.orb) {
      if (window.refinzi.orb.dragEnd) window.refinzi.orb.dragEnd();
      window.refinzi.orb.getPosition().then(pos => { if (pos) localOrbPos = pos; });
    }

    updateBubbleVisibility();
    downTime = 0;
    return;
  }

  // ── Not a drag — fire click/hold action ──
  if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
  setHolding(false);

  const elapsed = Date.now() - downTime;
  if (wasHeld || elapsed >= HOLD_THRESHOLD_MS) {
    fireExpert();
  } else {
    firePreserve();
  }

  wasHeld = false;
  downTime = 0;
}

function centerPointerCancel(e) {
  if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
  setHolding(false);

  activePointerId = null;
  orbEl.classList.remove("orb-down");
  orbEl.classList.remove("expert-active");

  if (isDragging) {
    isDragging = false;
    orbEl.classList.remove("dragging");
    orbHitEl.style.cursor = "grab";
    document.body.style.cursor = "";
    telemetry.dragAborted();
  }

  wasHeld = false;
  downTime = 0;

  // Revert brain to sparkle
  if (sparkleEl && brainEl) {
    sparkleEl.classList.remove("hidden");
    brainEl.classList.remove("visible");
  }
  updateBubbleVisibility();
}

// ── Drag Handle (legacy — hidden, no longer primary drag surface) ──────────

function handleDragStart(e) {
  if (e.pointerType === "touch") return;
  e.preventDefault();
  e.stopPropagation();

  isDragging = true;
  dragStart = { x: e.screenX, y: e.screenY };
  windowStartPos = { x: localOrbPos.x, y: localOrbPos.y };

  orbEl.classList.add("dragging");
  orbDragHandle.classList.add("dragging");
  document.body.style.cursor = "grabbing";

  try { orbDragHandle.setPointerCapture(e.pointerId); } catch (err) {
    console.warn("[Orb] setPointerCapture on handle failed:", err);
  }

  telemetry.dragStart();
  updateBubbleVisibility();
}

function handleDragMove(e) {
  if (e.pointerType === "touch") return;
  if (!isDragging) return;

  const newX = windowStartPos.x + (e.screenX - dragStart.x);
  const newY = windowStartPos.y + (e.screenY - dragStart.y);
  localOrbPos = { x: newX, y: newY };
  sendMove(newX, newY);
}

function handleDragEnd(e) {
  if (!isDragging) return;
  isDragging = false;
  orbEl.classList.remove("dragging");
  orbDragHandle.classList.remove("dragging");
  document.body.style.cursor = "";
  try {
    if (orbDragHandle.hasPointerCapture(e.pointerId)) orbDragHandle.releasePointerCapture(e.pointerId);
  } catch (err) {}

  telemetry.dragEnd(e.screenX, e.screenY);
  if (window.refinzi?.orb) {
    if (window.refinzi.orb.dragEnd) window.refinzi.orb.dragEnd();
    window.refinzi.orb.getPosition().then(pos => { if (pos) localOrbPos = pos; });
  }
  updateBubbleVisibility();
}

function handleDragCancel(e) {
  if (!isDragging) return;
  isDragging = false;
  orbEl.classList.remove("dragging");
  orbDragHandle.classList.remove("dragging");
  document.body.style.cursor = "";
  telemetry.dragAborted();
  updateBubbleVisibility();
}

// ── Pointer Event Listeners: Orb Center (ZONE 1) ──

orbHitEl.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (window.refinzi && window.refinzi.orb && window.refinzi.orb.showContextMenu) {
    window.refinzi.orb.showContextMenu();
  }
});

orbHitEl.addEventListener("pointerdown", centerPointerDown);
orbHitEl.addEventListener("pointermove", centerPointerMove);   // now handles drag
orbHitEl.addEventListener("pointerup", centerPointerUp);
orbHitEl.addEventListener("pointercancel", centerPointerCancel);

// ── Hover events for telemetry and visual feedback ──

const hoverEls = [orbHitEl, orbContainerEl];
hoverEls.forEach(el => {
  el.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "touch") return;
    orbEl.classList.add("orb-hovered");
    telemetry.hoverStart(e.offsetX, e.offsetY);
  });

  el.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "touch") return;
    if (isDragging) return;
    orbEl.classList.remove("orb-hovered");
    telemetry.hoverEnd();
  });
});

// ── Pointer Event Listeners: Drag Handle (ZONE 2) ──

orbDragHandle.addEventListener("pointerdown", handleDragStart);
orbDragHandle.addEventListener("pointermove", handleDragMove);
orbDragHandle.addEventListener("pointerup", handleDragEnd);
orbDragHandle.addEventListener("pointercancel", handleDragCancel);

// ── Touch Event Listeners (for completeness) ──
let activeTouchId = null;

// Orb center touch handlers
orbHitEl.addEventListener("touchstart", (e) => {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    activeTouchId = touch.identifier;
    downTime = Date.now();
    wasHeld = false;
    setHolding(true);
    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      wasHeld = true;
      holdTimer = null;
      debugLog("[Orb] Elite mode armed (touch)");
      setHolding(false);
      if (sparkleEl) sparkleEl.classList.add("hidden");
      if (brainEl) brainEl.classList.add("visible");
      updateBubbleVisibility();
    }, HOLD_THRESHOLD_MS);
    e.preventDefault();
  }
}, { passive: false });

orbHitEl.addEventListener("touchmove", (e) => {
  // Intentionally ignored — no drag from center
  if (e.cancelable) e.preventDefault();
}, { passive: false });

orbHitEl.addEventListener("touchend", (e) => {
  if (activeTouchId !== null) {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    setHolding(false);
    const elapsed = Date.now() - downTime;
    if (wasHeld || elapsed >= HOLD_THRESHOLD_MS) {
      fireExpert();
    } else {
      firePreserve();
    }
    wasHeld = false;
    downTime = 0;
    activeTouchId = null;
    e.preventDefault();
  }
}, { passive: false });

orbHitEl.addEventListener("touchcancel", () => {
  if (activeTouchId !== null) {
    centerPointerCancel({ pointerType: "touch" });
    activeTouchId = null;
  }
});

// ── Drag & Drop Diagnostic Logging ──────────────────────────────────────
// Safety reset: if a drag is abandoned mid-air (no drop or dragleave),
// restore click-through after this many ms to avoid the window getting
// stuck in interactive mode.
const DND_SAFETY_RESET_MS = 3000;
let dndSafetyTimer = null;

function armDndSafetyReset() {
  if (dndSafetyTimer) clearTimeout(dndSafetyTimer);
  dndSafetyTimer = setTimeout(() => {
    dndSafetyTimer = null;
    debugLog("[DnD] Safety reset — restoring click-through (drag abandoned)");
    if (window.refinzi?.orb?.setIgnoreMouse) {
      window.refinzi.orb.setIgnoreMouse(true);
    }
  }, DND_SAFETY_RESET_MS);
}

function disarmDndSafetyReset() {
  if (dndSafetyTimer) {
    clearTimeout(dndSafetyTimer);
    dndSafetyTimer = null;
  }
}

// VERIFY STAGE 1: window layer — first to receive native DnD events
window.addEventListener("dragenter", (e) => {
  debugLog("[TRACE_DROP][HOP 1: PASS] dragenter — window layer first to receive native DnD");
  debugLog("[DnD] STAGE 1 (window).dragenter — event received at window layer");
  if (window.refinzi?.orb?.setIgnoreMouse) {
    window.refinzi.orb.setIgnoreMouse(false);
  }
  armDndSafetyReset();
});

window.addEventListener("dragover", (e) => {
  e.preventDefault(); // Marks window as a valid drop target so events propagate to children
  // Continuously reinforce non-ignore state while drag is active.
  if (window.refinzi?.orb?.setIgnoreMouse) {
    window.refinzi.orb.setIgnoreMouse(false);
  }
  armDndSafetyReset();
});

window.addEventListener("dragleave", (e) => {
  if (!e.relatedTarget) {
    debugLog("[DnD] STAGE 1 (window).dragleave — cursor left window entirely");
    disarmDndSafetyReset();
    if (window.refinzi?.orb?.setIgnoreMouse) {
      window.refinzi.orb.setIgnoreMouse(true);
    }
  }
});

window.addEventListener("drop", (e) => {
  debugLog("[DnD] STAGE 1 (window).drop — event received at window layer");
  disarmDndSafetyReset();
  if (window.refinzi?.orb?.setIgnoreMouse) {
    window.refinzi.orb.setIgnoreMouse(true);
  }
});

// VERIFY STAGE 2: document layer — intermediate layer between window and DOM children
document.addEventListener("dragenter", (e) => {
  debugLog("[DnD] STAGE 2 (document).dragenter — event reached document");
  e.preventDefault();
});

document.addEventListener("dragover", (e) => {
  e.preventDefault();
});

document.addEventListener("dragleave", (e) => {
  if (!e.relatedTarget) {
    debugLog("[DnD] STAGE 2 (document).dragleave — cursor left document");
  }
});

document.addEventListener("drop", (e) => {
  debugLog("[DnD] STAGE 2 (document).drop — event reached document");
  e.preventDefault();
});

// VERIFY STAGE 3: orbHit — receives events after window + document validate the drop target chain
orbHitEl.addEventListener("dragenter", (e) => {
  e.preventDefault();
  debugLog("[DnD] STAGE 3 (orbHit).dragenter — event reached orbHit");
  if (window.refinzi?.orb?.setIgnoreMouse) {
    window.refinzi.orb.setIgnoreMouse(false);
  }
  // Visual feedback: swap to brain emoji and add drag-over pulsing glow on dragenter
  orbEl.classList.add("drag-over");
  if (sparkleEl) sparkleEl.classList.add("hidden");
  if (brainEl) brainEl.classList.add("visible");
});

orbHitEl.addEventListener("dragleave", (e) => {
  e.preventDefault();
  debugLog("[DnD] STAGE 3 (orbHit).dragleave — event reached orbHit");
  if (window.refinzi?.orb?.setIgnoreMouse) {
    window.refinzi.orb.setIgnoreMouse(true);
  }
  // Restore sparkle emoji and remove drag-over highlight on dragleave
  orbEl.classList.remove("drag-over");
  if (!wasHeld) {
    if (sparkleEl) sparkleEl.classList.remove("hidden");
    if (brainEl) brainEl.classList.remove("visible");
  }
});

orbHitEl.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (window.refinzi?.orb?.setIgnoreMouse) {
    window.refinzi.orb.setIgnoreMouse(false);
  }
});

orbHitEl.addEventListener("drop", async (e) => {
  e.preventDefault();
  debugLog("[TRACE_DROP][HOP 3: PASS] drop — DROP received on orbHit, starting recreation pipeline");
  debugLog("[DnD] STAGE 3 (orbHit).drop — DROP -> recreation FIRED");
  if (window.refinzi?.orb?.setIgnoreMouse) {
    window.refinzi.orb.setIgnoreMouse(true);
  }
  // Restore sparkle emoji and remove drag-over highlight
  orbEl.classList.remove("drag-over");
  if (!wasHeld) {
    if (sparkleEl) sparkleEl.classList.remove("hidden");
    if (brainEl) brainEl.classList.remove("visible");
  }

  const result = classifyArtifact(e.dataTransfer);
  if (!result) {
    if (errorTextEl) errorTextEl.textContent = "Unsupported content type.";
    showState("error");
    return;
  }

  // Populate data fields expected by parseArtifact (Fix 3)
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    result.path = file.path;
    result.name = file.name;
  } else {
    const text = e.dataTransfer.getData("text/plain");
    result.text = text;
    result.name = result.type === "url" || result.type === "youtube" || result.type === "instagram" ? text : "Text Snippet";
  }

  lastPayload = result;

  // Drop shockwave feedback animation
  orbEl.classList.add("dropped");
  setTimeout(() => {
    orbEl.classList.remove("dropped");
  }, 450);

    try {
      showState("processing");
      // Call generatePrompt(result) without double wrapping
      let promptData = await window.refinzi.orb.generatePrompt(result);
      if (promptData && (promptData.reason === "quota_exceeded" || promptData.ok === false)) {
        promptData = { prompt: "", isQuotaExceeded: true };
      }
      await window.refinzi.orb.showPromptWindow(promptData);
      showState("ready");
      
      // Track refinement success
      refinementCount++;
      if (window.refinzi && window.refinzi.settings && window.refinzi.settings.set) {
        await window.refinzi.settings.set({ refinementCount });
      }
      
      // First refinement milestone
      if (refinementCount === 1 && !hasCompletedFirstRefinement) {
        hasCompletedFirstRefinement = true;
        hideFirstRefinementTooltip();
        showMilestoneCelebration(
          "🎉",
          "First Refinement Complete!",
          "You're on your way to becoming a refinement master"
        );
      }
      
      // Milestone celebrations
      if (refinementCount === 10) {
        showMilestoneCelebration("⭐", "10 Refinements!", "You're becoming a refinement pro!");
      } else if (refinementCount === 50) {
        showMilestoneCelebration("🌟", "50 Refinements!", "Incredible! You're a power user!");
      } else if (refinementCount === 100) {
        showMilestoneCelebration("🏆", "100 Refinements!", "You've mastered the art of refinement!");
      }
      
    } catch (err) {
      console.error("[Orb] Drop handler error:", err);
      showEnhancedError(
        "Processing Failed",
        "Failed to process dropped content. Please try again.",
        "Check your internet connection and API key in settings"
      );
    }
});

// ── Suggestion Rotation Ticker ──
let suggestionInterval = null;
const SUGGESTIONS = [
  "Drop a Reel or Landing Page.",
  "Tap to Refine Prompt ⚡",
  "Hold for Deep Blueprint 🧠",
  "Drop any PDF, Image, or Text."
];
let suggestionIdx = 0;

function startSuggestionRotation() {
  if (suggestionInterval) clearInterval(suggestionInterval);
  suggestionInterval = setInterval(() => {
    if (rotatePlaceholderEl && appState === "ready") {
      rotatePlaceholderEl.style.opacity = "0";
      setTimeout(() => {
        suggestionIdx = (suggestionIdx + 1) % SUGGESTIONS.length;
        if (rotatePlaceholderEl) {
          rotatePlaceholderEl.textContent = SUGGESTIONS[suggestionIdx];
          rotatePlaceholderEl.style.opacity = "1";
        }
      }, 220);
    }
  }, 4500);
}

function stopSuggestionRotation() {
  if (suggestionInterval) {
    clearInterval(suggestionInterval);
    suggestionInterval = null;
  }
}

// ── State Management ──
function showState(stateName) {
  try {
    // Disarm watchdog whenever we leave processing state
    if (stateName !== "processing" && watchdogTimer) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }

    if (readyCardEl) readyCardEl.classList.add("hidden");
    if (processingCardEl) processingCardEl.classList.add("hidden");
    if (errorCardEl) errorCardEl.classList.add("hidden");

  if (stateName === "ready") {
    if (readyCardEl) readyCardEl.classList.remove("hidden");
    startSuggestionRotation();
  } else {
    stopSuggestionRotation();
  }
  if (stateName === "processing") {
    if (processingCardEl) processingCardEl.classList.remove("hidden");
    // Arm watchdog: if no completion signal within 30s, transition to error
    if (watchdogTimer) { clearTimeout(watchdogTimer); watchdogTimer = null; }
    watchdogTimer = setTimeout(() => {
      watchdogTimer = null;
      if (errorTextEl) errorTextEl.textContent = "Request timed out. Please try again.";
      showState("error");
    }, WATCHDOG_TIMEOUT_MS);
  } else if (stateName === "error") {
    if (errorCardEl) errorCardEl.classList.remove("hidden");
    
    // Reset error display when showing error state
    if (errorTextEl) {
      errorTextEl.style.display = '';
      const enhancedErrorEl = document.querySelector('.error-message-enhanced');
      if (enhancedErrorEl) {
        enhancedErrorEl.style.display = 'none';
      }
    }
    
    // Show first refinement tooltip if this is the first attempt
    if (refinementCount === 0 && !hasCompletedFirstRefinement) {
      showFirstRefinementTooltip();
    }
  }

  appState = stateName;
  updateBubbleVisibility();
  } catch (e) {
    console.error("[Refinzi][Orb] showState error:", e);
  }
}

// ── Connect Main Process Pipeline Status Updates ──
if (window.refinzi && window.refinzi.orb) {
  if (window.refinzi.orb.onStatus) {
    window.refinzi.orb.onStatus((msg) => {
      debugLog("[Orb] Status update:", msg);
      if (msg === "✅ Done") {
        telemetry.refinementSuccess(lastInteractionMode); // ORB-UX-002
        showState("ready");
      } else if (msg && msg.startsWith('❌')) {
        telemetry.refinementFailed(lastInteractionMode); // ORB-UX-002
        showState("error");
      } else {
        const pulseEl = processingCardEl.querySelector(".pulse");
        if (pulseEl) {
          pulseEl.textContent = msg;
        }
        showState("processing");
      }
    });
  }

  if (window.refinzi.orb.onResponse) {
    window.refinzi.orb.onResponse((response) => {
      debugLog("[Orb] Response received");
      showState("ready");
    });
  }
}

// Initial start - with safety check
if (!isInitialized) {
  isInitialized = true;
  try {
    showState("ready");
  } catch (e) {
    console.error("[Refinzi][Orb] Initial state setup failed:", e);
  }
}

// ── Interaction Cancel and State Resets ──

function cancelAllInteractions() {
  debugLog("[Orb] cancelAllInteractions triggered");
  if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
  setHolding(false);

  if (isDragging) {
    isDragging = false;
    orbEl.classList.remove("dragging");
    orbHitEl.style.cursor = "grab";
    document.body.style.cursor = "";
    telemetry.dragAborted();
  }

  wasHeld = false;
  downTime = 0;

  // Release pointer capture if active
  if (activePointerId !== null) {
    try {
      if (orbHitEl.hasPointerCapture(activePointerId)) {
        orbHitEl.releasePointerCapture(activePointerId);
      }
    } catch (_) {}
    activePointerId = null;
  }

  // Clear visual state classes
  orbEl.classList.remove("orb-down");
  orbEl.classList.remove("expert-active");
  orbEl.classList.remove("drag-over");
  orbEl.classList.remove("orb-hovered");

  // Revert brain to sparkle
  if (sparkleEl && brainEl) {
    sparkleEl.classList.remove("hidden");
    brainEl.classList.remove("visible");
  }

  updateBubbleVisibility();
}

// Esc -> Cancel
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cancelAllInteractions();
  }
});

// Window Blur -> Cancel
window.addEventListener("blur", () => {
  cancelAllInteractions();
});