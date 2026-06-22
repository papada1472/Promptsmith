const HOLD_THRESHOLD_MS = 700;

console.log("[Refinzi][Orb] Renderer loaded");

// Import the classifier module (ESM) – must be before usage.
import { classifyArtifact } from "./artifactClassifier.js";

const orbEl = document.querySelector(".orb");
const sparkleEl = orbEl.querySelector(".sparkle");
const brainEl = orbEl.querySelector(".brain");
const responseEl = document.querySelector(".orb-response");
let holdTimer = null;
let wasHold = false;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let orbStartPos = { x: 0, y: 0 };
// State for action card and selection
let actionCard = null;
let currentSelection = null;
let lastClassification = null;
// Timer controlling the brain-morph visibility window after Expert activation.
let brainMorphTimer = null;
let responseHideTimeout = null;

let moveRafId = null;
let pendingPos = null;
// Local mirror of the orb's window position — updated on drag end to stay in sync.
// Avoids the async IPC round-trip on every drag start.
let localOrbPos = { x: 0, y: 0 };

// Sync localOrbPos once on load so the first drag is correct
if (window.refinzi && window.refinzi.orb && window.refinzi.orb.getPosition) {
  window.refinzi.orb.getPosition().then(pos => { if (pos) localOrbPos = pos; });
}

// ── MOUSE CLICK-THROUGH LOGIC ──
// Ensure the window only captures mouse events when hovering the orb itself
orbEl.addEventListener("mouseenter", () => {
  if (window.refinzi && window.refinzi.orb && window.refinzi.orb.setIgnoreMouse) {
    window.refinzi.orb.setIgnoreMouse(false);
  }
});
orbEl.addEventListener("mouseleave", () => {
  // Only ignore mouse events if we're not currently dragging
  if (!isDragging && window.refinzi && window.refinzi.orb && window.refinzi.orb.setIgnoreMouse) {
    window.refinzi.orb.setIgnoreMouse(true);
  }
});

// Helper to send move command to main process.
// Uses RAF to coalesce rapid pointermove events into one IPC call per display frame.
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

// (Import removed – already imported at top of file)

/**
 * Show a temporary artifact icon inside the orb.
 * The icon is displayed for ~1 second, then the original sparkle is restored.
 */
function showArtifactIcon(type) {
  const iconMap = {
    url: "🌐",
    pdf: "📄",
    image: "🖼️",
    text: "📝",
  };
  const icon = iconMap[type] || "";
  if (!icon) return;

  // Hide the sparkle (and brain if visible) while showing the icon.
  if (sparkleEl) sparkleEl.classList.add("hidden");
  if (brainEl) brainEl.classList.remove("visible");

  const iconEl = document.createElement("span");
  iconEl.className = "artifact-icon";
  iconEl.textContent = icon;
  orbEl.appendChild(iconEl);

  // Remove after 1 second and restore sparkle.
  setTimeout(() => {
    if (orbEl.contains(iconEl)) {
      orbEl.removeChild(iconEl);
    }
    if (sparkleEl) sparkleEl.classList.remove("hidden");
  }, 1000);
}

/**
 * Create (if needed) and return the action card element.
 * The card contains two buttons: Build and Understand.
 */
function createActionCard() {
  if (actionCard) return actionCard;
  const card = document.createElement("div");
  card.className = "action-card";

  const buildBtn = document.createElement("button");
  buildBtn.className = "action-button";
  buildBtn.innerHTML = "🛠 Build";
  const understandBtn = document.createElement("button");
  understandBtn.className = "action-button";
  understandBtn.innerHTML = "📖 Understand";

  card.appendChild(buildBtn);
  card.appendChild(understandBtn);
  orbEl.appendChild(card);

  // Click handlers for the buttons
  buildBtn.addEventListener("click", () => {
    if (!lastClassification) return;
    currentSelection = { mode: "build", artifactType: lastClassification.type };
    console.log("[Refinzi][Selection]", currentSelection);
    if (window.refinzi && window.refinzi.orb && window.refinzi.orb.clicked) {
      window.refinzi.orb.clicked("build");
    }
    hideActionCard();
  });

  understandBtn.addEventListener("click", () => {
    if (!lastClassification) return;
    currentSelection = { mode: "understand", artifactType: lastClassification.type };
    console.log("[Refinzi][Selection]", currentSelection);
    if (window.refinzi && window.refinzi.orb && window.refinzi.orb.clicked) {
      window.refinzi.orb.clicked("understand");
    }
    hideActionCard();
  });

  actionCard = card;
  return card;
}

function showActionCard() {
  const card = createActionCard();
  card.style.display = "flex";
}

function hideActionCard() {
  if (actionCard) {
    actionCard.style.display = "none";
  }
}

orbEl.addEventListener("pointerdown", (e) => {
  wasHold = false;
  isDragging = false;
  // Clear any existing response notifications
  clearTimeout(responseHideTimeout);
  if (responseEl) responseEl.setAttribute("hidden", "");
  // Record start positions — use localOrbPos (no async IPC call = zero latency)
  dragStart = { x: e.screenX, y: e.screenY };
  orbStartPos = { x: localOrbPos.x, y: localOrbPos.y };
  // Capture the pointer so pointermove/pointerup fire even when moving outside the orb element.
  // This is what allows fast drags across the full screen without the orb losing track.
  orbEl.setPointerCapture(e.pointerId);
  // Start hold timer for expert mode
  holdTimer = setTimeout(() => {
    wasHold = true;
    console.log("[Orb] Expert mode armed, notifying main process");
    // Brain morph: hide sparkle, show brain immediately so expert activation is visually obvious.
    if (brainMorphTimer) {
      clearTimeout(brainMorphTimer);
      brainMorphTimer = null;
    }
    if (sparkleEl) sparkleEl.classList.add("hidden");
    if (brainEl) brainEl.classList.add("visible");
    // Start existing expert pipeline immediately (no AI/prompt logic changes).
    if (window.refinzi && window.refinzi.orb && window.refinzi.orb.clicked) {
      window.refinzi.orb.clicked("expert");
    }
  }, HOLD_THRESHOLD_MS);
});

// Listen for movement while pointer is down
orbEl.addEventListener("pointermove", (e) => {
  if (holdTimer) {
    // If movement exceeds a small threshold, cancel hold and start drag
    const dx = Math.abs(e.screenX - dragStart.x);
    const dy = Math.abs(e.screenY - dragStart.y);
    if (dx > 5 || dy > 5) {
      clearTimeout(holdTimer);
      holdTimer = null;
      wasHold = true; // prevent click handling
      isDragging = true;
    }
  }
  if (isDragging) {
    // Calculate new position relative to starting grab coordinates
    const dx = e.screenX - dragStart.x;
    const dy = e.screenY - dragStart.y;
    const newX = orbStartPos.x + dx;
    const newY = orbStartPos.y + dy;
    sendMove(newX, newY);
  }
});

orbEl.addEventListener("pointerup", (e) => {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
  // Release pointer capture
  if (orbEl.hasPointerCapture(e.pointerId)) {
    orbEl.releasePointerCapture(e.pointerId);
  }
  if (!wasHold && !isDragging) {
    console.log("[Orb] Click detected, notifying main process (preserve mode)");
    if (window.refinzi && window.refinzi.orb && window.refinzi.orb.clicked) {
      window.refinzi.orb.clicked("preserve");
    }
  }
  if (isDragging) {
    // Sync localOrbPos now that drag is complete
    if (window.refinzi && window.refinzi.orb) {
      if (window.refinzi.orb.dragEnd) window.refinzi.orb.dragEnd();
      // Refresh local position mirror after the window has been moved
      window.refinzi.orb.getPosition().then(pos => { if (pos) localOrbPos = pos; });
    }
  }
  // Reset flags
  isDragging = false;
  wasHold = false;
});

// Drag detection (files or other draggable items)
orbEl.addEventListener("dragenter", (e) => {
  e.preventDefault();
  // Show brain, hide sparkle
  if (sparkleEl) sparkleEl.classList.add("hidden");
  if (brainEl) brainEl.classList.add("visible");
});

orbEl.addEventListener("dragleave", (e) => {
  e.preventDefault();
  // Restore sparkle, hide brain
  if (sparkleEl) sparkleEl.classList.remove("hidden");
  if (brainEl) brainEl.classList.remove("visible");
});

orbEl.addEventListener("dragover", (e) => {
  // Required to keep drag events firing
  e.preventDefault();
});

// Handle drop events – classify the artifact and show an icon.
orbEl.addEventListener("drop", (e) => {
  // Prevent the browser's default handling (e.g., opening the file).
  e.preventDefault();
  // Classify the dropped payload using the centralized classifier.
  const result = classifyArtifact(e.dataTransfer);
  if (result && result.type) {
    // Store the classification for later use by the action card.
    lastClassification = result;
    // Show the appropriate icon inside the orb.
    showArtifactIcon(result.type);
    // Debug logging as required by the task.
    console.log(`[Refinzi][Artifact]\nType: ${result.type.toUpperCase()}`);
    // Show the action card with Build / Understand options.
    showActionCard();
  }
});

if (window.refinzi && window.refinzi.orb) {
  window.refinzi.orb.onStatus((msg) => {
    console.log("[Orb] Status event:", msg);
    clearTimeout(responseHideTimeout);
    
    if (msg === "✅ Done") {
      if (responseEl) responseEl.classList.remove("status-loading");
      return;
    }
    
    // Show status update
    if (responseEl) {
      responseEl.textContent = msg;
      responseEl.className = "orb-response status-loading";
      responseEl.removeAttribute("hidden");
    }
    if (sparkleEl) sparkleEl.classList.add("processing");
  });

  window.refinzi.orb.onResponse((msg) => {
    console.log("[Orb] Response event:", msg);
    clearTimeout(responseHideTimeout);
    if (sparkleEl) {
      sparkleEl.classList.remove("processing");
      sparkleEl.classList.remove("hidden");
    }
    if (brainEl) {
      brainEl.classList.remove("visible");
    }
    
    if (responseEl) {
      responseEl.classList.remove("status-loading");
      responseEl.textContent = msg;
      
      const isError = msg.includes("No API key") || 
                      msg.includes("Unable to process") || 
                      msg.includes("reached") || 
                      msg.includes("No selected text") || 
                      msg.includes("unexpected error");
                      
      if (isError) {
        responseEl.className = "orb-response status-error";
      } else {
        responseEl.className = "orb-response status-success";
      }
      responseEl.removeAttribute("hidden");
      
      // Hide after 4 seconds
      responseHideTimeout = setTimeout(() => {
        responseEl.setAttribute("hidden", "");
      }, 4000);
    }
  });
}
