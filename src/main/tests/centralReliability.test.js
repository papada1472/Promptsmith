import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProviderManager } from "../ai/ProviderManager.js";
import { store } from "../store.js";
import { 
  isValidAIResponse, 
  validateRecreationOutput, 
  repairRefineOutput, 
  repairRecreationOutput, 
  repairJsonOutput 
} from "../outputValidator.js";

// Mock store calls inside the test
vi.mock("../store.js", () => {
  const data = new Map();
  return {
    store: {
      get: vi.fn((key, def) => data.has(key) ? data.get(key) : def),
      set: vi.fn((key, val) => data.set(key, val)),
      delete: vi.fn((key) => data.delete(key))
    }
  };
});

describe("Central Reliability & Output Repair Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Circuit Breaker State Machine", () => {
    it("starts in CLOSED state, moves to OPEN on consecutive failures, then HALF-OPEN after cooldown", () => {
      // 1. Initially healthy (CLOSED)
      expect(ProviderManager.isProviderHealthy("gemini")).toBe(true);

      // 2. Continuous failures trip circuit breaker to OPEN
      const err = new Error("Service Unavailable");
      ProviderManager.markProviderFailed("gemini", err);
      ProviderManager.markProviderFailed("gemini", err);
      ProviderManager.markProviderFailed("gemini", err);

      expect(ProviderManager.isProviderHealthy("gemini")).toBe(false);

      // 3. Success resets failure status and transitions to CLOSED
      ProviderManager.recordLatency("gemini", 120);
      expect(ProviderManager.isProviderHealthy("gemini")).toBe(true);
    });

    it("trips circuit breaker immediately on HTTP 429 (Rate Limit)", () => {
      expect(ProviderManager.isProviderHealthy("openrouter")).toBe(true);

      const rateLimitErr = new Error("Too Many Requests");
      rateLimitErr.status = 429;
      ProviderManager.markProviderFailed("openrouter", rateLimitErr);

      expect(ProviderManager.isProviderHealthy("openrouter")).toBe(false);

      // Reset
      ProviderManager.recordLatency("openrouter", 150);
      expect(ProviderManager.isProviderHealthy("openrouter")).toBe(true);
    });
  });

  describe("Deterministic Output Repair", () => {
    describe("Sparkle/Refine Mode Repair", () => {
      it("repairs empty or identical prompts with creative staging directive", () => {
        const input = "Translate this to French";
        const emptyOutput = "";
        
        // Validation fails
        expect(isValidAIResponse(input, emptyOutput).valid).toBe(false);

        // Repaired output passes validation
        const repaired = repairRefineOutput(input, emptyOutput, "AI response is empty");
        expect(isValidAIResponse(input, repaired).valid).toBe(true);
        expect(repaired.toLowerCase()).toContain("staged as a high-fidelity visual experience");
      });
    });

    describe("Recreation Mode Repair", () => {
      it("removes forbidden phrases and appends missing required sections", () => {
        const malformedRecreation = `
### Objective
Create a professional dashboard.
Based on the screenshot, we need three panels.
### Hero Strategy
Headline structure and CTA placement.
### Section Breakdown
Sidebar and grid layout.
`;
        // Validation fails because of forbidden phrase 'Based on the screenshot'
        // and missing sections (offer structure, trust elements, visual hierarchy, etc.)
        const checkResult = validateRecreationOutput(malformedRecreation);
        expect(checkResult.valid).toBe(false);
        expect(checkResult.forbidden).toContain("based on the screenshot");
        expect(checkResult.missing.length).toBeGreaterThan(0);

        // Repaired recreation passes validation
        const repaired = repairRecreationOutput(
          malformedRecreation, 
          checkResult.forbidden, 
          checkResult.missing
        );
        
        const finalCheck = validateRecreationOutput(repaired);
        expect(finalCheck.valid).toBe(true);
        expect(repaired).not.toContain("Based on the screenshot");
        expect(repaired).toContain("recreating the layout");
        expect(repaired).toContain("### Visual Hierarchy");
        expect(repaired).toContain("### Recreation Instructions");
      });
    });

    describe("Drop Mode JSON Parser Repair", () => {
      it("reconstructs valid JSON object structure from raw markdown section headers", () => {
        const rawMarkdownText = `
### Visual DNA
Liquid monochrome with responsive grids.

### Creative Concept
Acid Void
An interactive high-fidelity showcase.

### Scroll Story
- Entrance hook starts.
- Details follow.
- CTA closing.

### Motion Blueprint
Elastic grid reveals.

### Implementation Prompt
Build in Next.js and Tailwind.
`;
        const result = repairJsonOutput(rawMarkdownText, "default input");
        expect(result).toHaveProperty("visual_dna_echo");
        expect(result.visual_dna_echo).toContain("Liquid monochrome");
        expect(result.creative_concept).toContain("Acid Void");
        expect(result.scroll_story).toHaveLength(3);
        expect(result.scroll_story[0]).toBe("Entrance hook starts.");
        expect(result.motion_blueprint).toContain("Elastic grid reveals");
        expect(result.implementation_prompt).toContain("Build in Next.js and Tailwind");
      });
    });

    describe("Self-Healing Settings Recovery", () => {
      it("regenerates corrupt settings database parameters dynamically and tracks recovery state", async () => {
        const { metricsService } = await import("../services/metricsService.js");

        // Corrupt the history logs
        store.set("historyLogs", "invalid-corrupted-string-data");

        // Retrieving logs should self-heal and return empty logs list
        const logData = metricsService.getLogs();
        expect(logData.logs).toEqual([]);
        expect(store.get("metrics.settingsRecovered")).toBe(true);

        // Corrupt metrics object
        store.set("metrics", null);

        // Fetching stats should heal metrics structure
        const stats = metricsService.getStats();
        expect(stats.refinementsMade).toBe(0);
        expect(store.get("metrics.settingsRecovered")).toBe(true);
      });
    });
  });
});
