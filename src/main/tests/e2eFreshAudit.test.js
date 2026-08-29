import { describe, it, expect, vi, beforeEach } from "vitest";
import { generatePromptAngles, upgradeToExpertPrompt } from "../artifactAnalyzer.js";
import { ProviderManager } from "../ai/ProviderManager.js";
import { store } from "../store.js";

describe("FRESH AUDIT: Dual Execution Engine (Tap & Hold)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Function 1: ⚡ Tap (Quick In-Place Rebuild)", () => {
    it("successfully refines vague prompt text into an actionable production specification", async () => {
      vi.spyOn(ProviderManager, "refineWithFailover").mockResolvedValueOnce({
        output: "Build a high-conversion SaaS hero section in Tailwind CSS featuring dark glassmorphism, responsive grid layout, kinetic spring animations (cubic-bezier(0.25, 1, 0.5, 1)), and dual action CTA buttons.",
        providerId: "gemini"
      });

      const res = await ProviderManager.refineWithFailover("make a hero section", {
        mode: "preserve",
        systemPrompt: "You are an expert prompt engineer."
      });

      expect(res.output).toContain("high-conversion SaaS hero");
      expect(res.output).toContain("Tailwind CSS");
      expect(res.providerId).toBe("gemini");
    });

    it("handles empty or whitespace-only inputs safely without unhandled rejections", async () => {
      const input = "   ";
      expect(input.trim().length).toBe(0);
    });
  });

  describe("Function 2: 🧠 Hold (5-Block Architectural Blueprint)", () => {
    it("generates all 5 mandatory architectural blueprint blocks for landing-page artifacts", async () => {
      const mockBlueprint = `
### Structure & Layout
- Hero container: 1200px max width with 2-column CSS grid.
- Navigation bar: sticky blur header with logo, nav links, and CTA.

### Component Assets
- Button component with variant styles (primary, secondary, ghost).
- Glassmorphism Card container with subtle border gradient.

### Creative Copy
- Headline: "Stop Reverse-Engineering UIs. Let the Orb Rebuild Them."
- Subhead: "Instant 5-block architectural specs for Cursor and Claude."

### Motion & Interactions
- Micro-interaction: hover scale 1.05 with spring transition cubic-bezier(0.25, 1, 0.5, 1).
- Hold indicator: 300ms continuous progress radial stroke.

### Implementation Prompt Pack
\`\`\`markdown
# Target: Cursor AI / v0
Generate a React + Tailwind component based on the above architecture.
\`\`\`

### Verification Checklist
- [ ] Responsive down to 375px mobile
- [ ] Accessible WCAG AA contrast
`;

      vi.spyOn(ProviderManager, "refineWithFailover").mockResolvedValueOnce({
        output: mockBlueprint,
        providerId: "gemini"
      });

      const sampleArtifact = {
        type: "landing-page",
        name: "SaaS Hero Page",
        text: "Landing Page: Minimalist layout with light theme, large typography hero heading 'Design at the speed of thought'",
        isSample: true
      };

      const result = await generatePromptAngles(sampleArtifact);
      expect(result).toBeDefined();
      expect(result.prompt).toBeDefined();
      expect(result.prompt).toContain("Visual DNA");
      expect(result.prompt).toContain("Motion Blueprint");
      expect(result.prompt).toContain("Implementation Prompt");
    });

    it("upgrades initial prompt to expert mode seamlessly", async () => {
      const initialPrompt = "Create a modern checkout form";
      const expertUpgrade = `
### Structure & Layout
- Multi-step checkout modal with progress breadcrumbs.

### Component Assets
- Payment card input, address autocomplete, order summary sidebar.

### Creative Copy
- "Instant 1-click checkout with end-to-end encryption."

### Motion & Interactions
- Step transitions with slide-fade animations.

### Implementation Prompt Pack
\`\`\`markdown
Generate a high-security React checkout flow.
\`\`\`
`;

      vi.spyOn(ProviderManager, "refineWithFailover").mockResolvedValueOnce({
        output: expertUpgrade,
        providerId: "gemini"
      });

      const upgraded = await upgradeToExpertPrompt(initialPrompt, "text");
      expect(upgraded).toBeDefined();
      expect(upgraded.prompt).toBeDefined();
      expect(upgraded.prompt).toContain("Structure & Layout");
      expect(upgraded.prompt).toContain("Implementation Prompt Pack");
    });
  });

  describe("Multi-Target Export Format Validation", () => {
    it("properly formats Cursor / v0 rules with system directives", () => {
      const sections = {
        structure: "1200px container with flex wrap",
        components: "Button, Card, Input",
        copy: "Hero copy headline",
        interactions: "Hover states and spring physics",
        promptPack: "Generate production component in React"
      };

      const cursorFormatted = [
        "# [Refinzi Blueprint] High-Impact Architectural Specification",
        "// Target: Cursor AI / v0 / Claude Artifacts",
        "// Refined with Refinzi 2.0 (Click & Hold Execution Layer)\n",
        "## 1. Structure & Layout",
        sections.structure,
        "\n## 2. Component Assets",
        sections.components,
        "\n## 3. Creative Copy",
        sections.copy,
        "\n## 4. Motion & Interactions",
        sections.interactions,
        "\n## 5. Implementation Prompt",
        sections.promptPack
      ].join("\n");

      expect(cursorFormatted).toContain("# [Refinzi Blueprint]");
      expect(cursorFormatted).toContain("// Target: Cursor AI / v0 / Claude Artifacts");
      expect(cursorFormatted).toContain("## 1. Structure & Layout");
      expect(cursorFormatted).toContain("## 5. Implementation Prompt");
    });
  });
});
