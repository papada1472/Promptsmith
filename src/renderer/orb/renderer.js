console.log("[Refinzi][Orb] Renderer loaded");

import { classifyArtifact } from "./artifactClassifier.js";

// DOM Elements
const orbEl = document.querySelector(".orb");
const orbHitEl = document.getElementById("orbHit");        // 60×60px invisible hit layer
const orbContainerEl = document.querySelector(".orb-container");
const statusBubbleEl = document.getElementById("statusBubble");
const rotatePlaceholderEl = document.getElementById("rotate-placeholder");

const readyCardEl = document.getElementById("ready-card");
const processingCardEl = document.getElementById("processing-card");
const errorCardEl = document.getElementById("error-card");
const errorTextEl = document.getElementById("error-text");
const retryBtnEl = document.getElementById("retry-btn");
const personalizationToastEl = document.getElementById("personalization-toast");
const onboardingCardEl = document.getElementById("onboarding-card");
const onboardingGotItBtn = document.getElementById("onboarding-got-it");

const sparkleEl = orbEl.querySelector(".sparkle");
const brainEl = orbEl.querySelector(".brain");

// ── State ──
let appState = "ready";
let isOnboardingActive = false;
let isDragging = false;
let dragStart = { x: 0, y: 0 };       // Screen coords at drag start
let windowStartPos = { x: 0, y: 0 };  // Window top-left at drag start
let localOrbPos = { x: 0, y: 0 };     // Last known window top-left (from main process)

let isOrbHovered = false;
let isBubbleHovered = false;

// ── Interaction Thresholds (tuned for Fitts's Law) ──
// F-03 fix: 2px threshold (was 5px — 18% of 28px orb, far too high)
const DRAG_THRESHOLD_PX = 2;
// F-06 fix: 450ms hold (was 700ms — too long, felt broken)
const HOLD_THRESHOLD_MS = 450;

let holdTimer = null;
let wasHold = false;
let brainMorphTimer = null;

let lastPayload = null;

// Coalescing RAF for moves
let moveRafId = null;
let pendingPos = null;

// Sync localOrbPos once on load so the first drag is correct
if (window.refinzi && window.refinzi.orb && window.refinzi.orb.getPosition) {
  window.refinzi.orb.getPosition().then(pos => {
    if (pos) localOrbPos = pos;
  });
}

// Onboarding State Checks
if (window.refinzi && window.refinzi.settings && window.refinzi.settings.get) {
  window.refinzi.settings.get().then((settings) => {
    if (settings && !settings.onboardingSeen) {
      isOnboardingActive = true;
      statusBubbleEl.classList.add("hidden");
      if (window.refinzi.orb.resize) {
        window.refinzi.orb.resize({ width: 240, height: 280 });
      }
      onboardingCardEl.classList.remove("hidden");
    }
  });
}

if (onboardingGotItBtn) {
  onboardingGotItBtn.addEventListener("click", async () => {
    isOnboardingActive = false;
    if (window.refinzi && window.refinzi.settings && window.refinzi.settings.set) {
      await window.refinzi.settings.set({ onboardingSeen: true });
    }
    onboardingCardEl.classList.add("hidden");
    if (window.refinzi && window.refinzi.orb && window.refinzi.orb.resize) {
      await window.refinzi.orb.resize({ width: 220, height: 120 });
    }
    statusBubbleEl.classList.add("hidden");
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
  
  // Ready state: only show when hovered
  if (isOrbHovered || isBubbleHovered) {
    statusBubbleEl.classList.remove("hidden");
    if (wasHold || brainEl.classList.contains("visible")) {
      rotatePlaceholderEl.textContent = "🧠 Expert Prompt";
    } else {
      rotatePlaceholderEl.textContent = "✨ Improve Prompt";
    }
  } else {
    statusBubbleEl.classList.add("hidden");
  }
}

// ── MOUSE CLICK-THROUGH ──
// Window stays in setIgnoreMouseEvents(true, {forward:true}) PERMANENTLY.
// CSS pointer-events: none on body, auto on .orb-hit handles interactivity.
// Toggling setIgnoreMouseEvents from IPC causes synthetic mouseleave → chase loop.

// ── Hover: listen on orbHit (the 60×60px target), apply classes to orbEl ──
orbHitEl.addEventListener("mouseenter", () => {
  isOrbHovered = true;
  orbEl.classList.add("hovered");
  orbHitEl.style.cursor = "grab";
  if (orbContainerEl) orbContainerEl.classList.add("hovered");
  updateBubbleVisibility();
});

orbHitEl.addEventListener("mouseleave", () => {
  if (isDragging) return; // Don't lose hover during drag
  isOrbHovered = false;
  orbEl.classList.remove("hovered");
  if (orbContainerEl) orbContainerEl.classList.remove("hovered");
  setTimeout(() => {
    updateBubbleVisibility();
  }, 50);
});

statusBubbleEl.addEventListener("mouseenter", () => {
  isBubbleHovered = true;
  updateBubbleVisibility();
});

statusBubbleEl.addEventListener("mouseleave", () => {
  isBubbleHovered = false;
  setTimeout(() => {
    updateBubbleVisibility();
  }, 50);
});

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

// ── Drag Helpers ──

function startDrag(screenX, screenY, pointerId = null) {
  isDragging = false;
  wasHold = false;

  // Capture cursor position and window position at drag start
  dragStart = { x: screenX, y: screenY };
  windowStartPos = { x: localOrbPos.x, y: localOrbPos.y };

  if (pointerId !== null) {
    try {
      orbHitEl.setPointerCapture(pointerId);
    } catch (e) {
      console.warn("setPointerCapture failed:", e);
    }
  }

  // Hold timer: 450ms (F-06 fix from 700ms)
  if (holdTimer) clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    if (isDragging) return; // Dragging trumps hold
    wasHold = true;
    console.log("[Orb] Expert mode armed");
    if (brainMorphTimer) {
      clearTimeout(brainMorphTimer);
      brainMorphTimer = null;
    }
    if (sparkleEl) sparkleEl.classList.add("hidden");
    if (brainEl) brainEl.classList.add("visible");
    updateBubbleVisibility();
  }, HOLD_THRESHOLD_MS);
}

function moveDrag(screenX, screenY) {
  const dx = Math.abs(screenX - dragStart.x);
  const dy = Math.abs(screenY - dragStart.y);
  
  // F-03 fix: 2px threshold (was 5px)
  if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    if (wasHold) {
      if (sparkleEl) sparkleEl.classList.remove("hidden");
      if (brainEl) brainEl.classList.remove("visible");
      wasHold = false;
    }
    if (!isDragging) {
      isDragging = true;
      orbEl.classList.add("dragging");
      orbHitEl.classList.add("dragging");
      updateBubbleVisibility();
    }
  }

  if (isDragging) {
    // F-02 fix: Direct delta from cursor to window start position.
    // windowStartPos = window top-left at drag start (screen coords).
    // Delta = how far cursor has moved since drag start.
    // New window pos = where the window was + how far cursor moved.
    const newX = windowStartPos.x + (screenX - dragStart.x);
    const newY = windowStartPos.y + (screenY - dragStart.y);
    localOrbPos = { x: newX, y: newY }; // Keep local state in sync during drag
    sendMove(newX, newY);
  }
}

function endDrag(pointerId = null) {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
  if (pointerId !== null && orbHitEl.hasPointerCapture(pointerId)) {
    try {
      orbHitEl.releasePointerCapture(pointerId);
    } catch (e) {
      console.warn("releasePointerCapture failed:", e);
    }
  }
  
  orbEl.classList.remove("dragging");
  orbHitEl.classList.remove("dragging");
  orbHitEl.style.cursor = "grab";
  
  if (isDragging) {
    if (window.refinzi && window.refinzi.orb) {
      if (window.refinzi.orb.dragEnd) window.refinzi.orb.dragEnd();
      // Sync final position from main process
      window.refinzi.orb.getPosition().then(pos => {
        if (pos) localOrbPos = pos;
      });
    }
  } else {
    // Was a click or hold — not a drag
    if (wasHold) {
      console.log("[Orb] Hold detected → expert mode");
      if (window.refinzi && window.refinzi.orb && window.refinzi.orb.clicked) {
        window.refinzi.orb.clicked("expert");
      }
      if (brainMorphTimer) clearTimeout(brainMorphTimer);
      brainMorphTimer = setTimeout(() => {
        if (sparkleEl) sparkleEl.classList.remove("hidden");
        if (brainEl) brainEl.classList.remove("visible");
        brainMorphTimer = null;
        updateBubbleVisibility();
      }, 1500);
    } else {
      console.log("[Orb] Click detected → sparkle mode");
      if (window.refinzi && window.refinzi.orb && window.refinzi.orb.clicked) {
        window.refinzi.orb.clicked("preserve");
      }
    }
  }
  isDragging = false;
  wasHold = false;
  updateBubbleVisibility();
}

// ── Pointer Event Listeners on orbHit (the 60px hit target) ──

orbHitEl.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (window.refinzi && window.refinzi.orb && window.refinzi.orb.showContextMenu) {
    window.refinzi.orb.showContextMenu();
  }
});

orbHitEl.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return;
  e.preventDefault();
  startDrag(e.screenX, e.screenY, e.pointerId);
});

orbHitEl.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  moveDrag(e.screenX, e.screenY);
});

orbHitEl.addEventListener("pointerup", (e) => {
  if (e.pointerType === "touch") return;
  endDrag(e.pointerId);
});

orbHitEl.addEventListener("pointercancel", (e) => {
  endDrag(e.pointerId);
});

// ── Touch Event Listeners (for completeness) ──
let activeTouchId = null;

orbHitEl.addEventListener("touchstart", (e) => {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    activeTouchId = touch.identifier;
    startDrag(touch.screenX, touch.screenY);
    e.preventDefault();
  }
}, { passive: false });

orbHitEl.addEventListener("touchmove", (e) => {
  if (activeTouchId !== null) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId) {
        moveDrag(touch.screenX, touch.screenY);
        e.preventDefault();
        break;
      }
    }
  }
}, { passive: false });

orbHitEl.addEventListener("touchend", (e) => {
  if (activeTouchId !== null) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId) {
        endDrag();
        activeTouchId = null;
        e.preventDefault();
        break;
      }
    }
  }
}, { passive: false });

orbHitEl.addEventListener("touchcancel", () => {
  if (activeTouchId !== null) {
    endDrag();
    activeTouchId = null;
  }
});

// ── Drag & Drop Files / Texts ──
orbHitEl.addEventListener("dragenter", (e) => { e.preventDefault(); });
orbHitEl.addEventListener("dragleave", (e) => { e.preventDefault(); });
orbHitEl.addEventListener("dragover", (e) => { e.preventDefault(); });
orbHitEl.addEventListener("drop", (e) => { e.preventDefault(); });

// ── State Management ──
function showState(stateName) {
  readyCardEl.classList.add("hidden");
  processingCardEl.classList.add("hidden");
  errorCardEl.classList.add("hidden");

  if (stateName === "ready") {
    readyCardEl.classList.remove("hidden");
  } else if (stateName === "processing") {
    processingCardEl.classList.remove("hidden");
  } else if (stateName === "error") {
    errorCardEl.classList.remove("hidden");
  }
  
  appState = stateName;
  updateBubbleVisibility();
}

// ── Connect Main Process Pipeline Status Updates ──
if (window.refinzi && window.refinzi.orb) {
  if (window.refinzi.orb.onStatus) {
    window.refinzi.orb.onStatus((msg) => {
      console.log("[Orb] Status update:", msg);
      if (msg === "✅ Done") {
        showState("ready");
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
      console.log("[Orb] Response received");
      showState("ready");
    });
  }
}

// Initial start
showState("ready");
