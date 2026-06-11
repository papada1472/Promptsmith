import { mouse, keyboard, Key } from "@nut-tree-fork/nut-js";
import { clipboard } from "electron";
import { showOrb, hideOrb } from "./orbWindow.js";

let lastMousePos = { x: 0, y: 0 };
let isDetecting = false;
let lastSelection = "";

async function performSilentCopy() {
  await keyboard.pressKey(Key.LeftControl);
  await keyboard.pressKey(Key.C);
  await keyboard.releaseKey(Key.C);
  await keyboard.releaseKey(Key.LeftControl);
}

export function startSelectionDetection() {
  console.log("[Refinezy][SelectionDetector] Starting selection detection loop...");
  
  setInterval(async () => {
    if (isDetecting) return;
    isDetecting = true;

    try {
      const currentPos = await mouse.getPosition();
      const moved = Math.abs(currentPos.x - lastMousePos.x) > 2 || Math.abs(currentPos.y - lastMousePos.y) > 2;
      
      if (moved) {
        lastMousePos = currentPos;
        isDetecting = false;
        return;
      }

      // Mouse is stationary. Check for selection.
      const before = clipboard.readText();
      const sentinel = `__REFINE_DETECTOR_${Date.now()}__`;
      clipboard.writeText(sentinel);

      await performSilentCopy();
      
      // Short wait for clipboard to update
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const after = clipboard.readText();

      if (after !== sentinel && after.trim().length > 0) {
        // Selection found
        if (after !== lastSelection) {
          console.log("[Refinezy][SelectionDetector] Selection detected, showing orb");
          lastSelection = after;
          showOrb(currentPos.x, currentPos.y);
        }
      } else {
        // No selection
        if (lastSelection !== "") {
          console.log("[Refinezy][SelectionDetector] Selection cleared, hiding orb");
          hideOrb();
          lastSelection = "";
        }
      }

      // Restore clipboard if it was the sentinel
      if (after === sentinel) {
        clipboard.writeText(before);
      }
    } catch (err) {
      // Silent fail
    } finally {
      isDetecting = false;
    }
  }, 800);
}
