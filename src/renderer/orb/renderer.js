const HOLD_THRESHOLD_MS = 700;

console.log("[Refinezy][Orb] Renderer loaded");

// Import the classifier module (ESM) – must be before usage.
import { classifyArtifact } from "./artifactClassifier.js";

const orbEl = document.querySelector(".orb");
const sparkleEl = orbEl.querySelector(".sparkle");
const brainEl = orbEl.querySelector(".brain");
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

// Helper to send move command to main process
function sendMove(x, y) {
  if (window.refinezy && window.refinezy.orb && window.refinezy.orb.move) {
    window.refinezy.orb.move({ x, y });
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
    if (window.refinezy && window.refinezy.orb && window.refinezy.orb.clicked) {
      window.refinezy.orb.clicked("build");
    }
    hideActionCard();
  });

  understandBtn.addEventListener("click", () => {
    if (!lastClassification) return;
    currentSelection = { mode: "understand", artifactType: lastClassification.type };
    console.log("[Refinzi][Selection]", currentSelection);
    if (window.refinezy && window.refinezy.orb && window.refinezy.orb.clicked) {
      window.refinezy.orb.clicked("understand");
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

orbEl.addEventListener("pointerdown", async (e) => {
  wasHold = false;
  isDragging = false;
  // Record start positions
  dragStart = { x: e.screenX, y: e.screenY };
  // Ask main process for current orb position (fallback to stored values)
  // Since we don't have a getter, we rely on the stored position which is used on show.
  // For simplicity, we assume the orb is at the last known saved position.
  // The move will be relative to this start.
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
    if (window.refinezy && window.refinezy.orb && window.refinezy.orb.clicked) {
      window.refinezy.orb.clicked("expert");
    }
    // Keep the brain visible for 1500ms, then restore sparkle and hide brain.
    brainMorphTimer = setTimeout(() => {
      if (sparkleEl) sparkleEl.classList.remove("hidden");
      if (brainEl) brainEl.classList.remove("visible");
      brainMorphTimer = null;
    }, 1500);
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
    // Directly move orb to current cursor position (screen coordinates)
    const newX = e.screenX;
    const newY = e.screenY;
    sendMove(newX, newY);
  }
});

orbEl.addEventListener("pointerup", () => {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
  if (!wasHold && !isDragging) {
    console.log("[Orb] Click detected, notifying main process (preserve mode)");
    if (window.refinezy && window.refinezy.orb && window.refinezy.orb.clicked) {
      window.refinezy.orb.clicked("preserve");
    }
  }
  // Reset flags
  isDragging = false;
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
