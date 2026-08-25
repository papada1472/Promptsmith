/**
 * recreationValidator.test.js
 *
 * Enforces the core Refinzi recreation promise:
 * - Required sections present in output
 * - Forbidden phrases absent from output
 */

import { describe, it, expect } from "vitest";
import { validateRecreationOutput } from "./validators.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_RECREATION = `
### Objective
Create a landing page for a SaaS product focused on user growth.

### Hero Strategy
Headline structure and CTA placement above the fold.

### Section Breakdown
Hero section, feature highlights, pricing table, and final CTA.

### Offer Structure
Annual billing options with a money-back guarantee.

### Trust Elements
Client logos and testimonials.

### Visual Hierarchy
Clear layout flow and design alignment.

### CTA Framework
Primary contrasting buttons.

### Build Prompt
1. Objective: Build a landing page.
2. Structure: 3-column feature layout.
3. Components: Pricing tables and cards.
4. Visual System: High-contrast theme.
5. Content Strategy: Growth copy.
6. Recreation Instructions: Apply responsive grids and styles.
`;

const MISSING_ALL_SECTIONS = `
Here is a high-level plan for building your landing page.
Start with a hero section and add some features.
`;

const FORBIDDEN_OUTPUT_ANALYZE = `
### Objective
Analyze this screenshot and recreate it.
### Hero Strategy
Based on the image provided, build a component.
### Section Breakdown
Study this screenshot closely.
### Offer Structure
Review this carefully based on the attached file.
### Trust Elements
Extract the details here.
`;

const FORBIDDEN_OUTPUT_PARTIAL = `
### Objective
Build a dashboard component.
### Hero Strategy
Based on the screenshot, the layout has three panels.
### Section Breakdown
Header, sidebar, and main content.
`;

const MISSING_ONE_SECTION = `
### Objective
Create a pricing table.
### Hero Strategy
Headline structure and CTA placement.
### Section Breakdown
Three tier layout.
### Offer Structure
Packaging details.
### Trust Elements
Client logos.
### Visual Hierarchy
Card components.
### CTA Framework
Pricing buttons.
### Build Prompt
1. Objective: Build a pricing page.
2. Structure: 3-column layout.
3. Components: Cards with features.
4. Visual System: Grid layout.
5. Content Strategy: SaaS copies.
`;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Recreation Validator", () => {
  describe("Valid outputs", () => {
    it("REC-VAL-001: valid recreation output passes all checks", () => {
      const { valid, forbidden, missing } = validateRecreationOutput(VALID_RECREATION);
      expect(valid).toBe(true);
      expect(forbidden).toHaveLength(0);
      expect(missing).toHaveLength(0);
    });

    it("REC-VAL-002: output with all required sections passes", () => {
      const { missing } = validateRecreationOutput(VALID_RECREATION);
      expect(missing).not.toContain("objective");
      expect(missing).not.toContain("hero strategy");
      expect(missing).not.toContain("section breakdown");
      expect(missing).not.toContain("offer structure");
      expect(missing).not.toContain("trust elements");
      expect(missing).not.toContain("visual hierarchy");
      expect(missing).not.toContain("cta framework");
      expect(missing).not.toContain("build prompt");
      expect(missing).not.toContain("structure");
      expect(missing).not.toContain("components");
      expect(missing).not.toContain("visual system");
      expect(missing).not.toContain("content strategy");
      expect(missing).not.toContain("recreation instructions");
    });
  });

  describe("Missing sections", () => {
    it("REC-VAL-003: output missing all required sections fails", () => {
      const { valid, missing } = validateRecreationOutput(MISSING_ALL_SECTIONS);
      expect(valid).toBe(false);
      expect(missing.length).toBeGreaterThan(0);
    });

    it("REC-VAL-004: output missing recreation instructions section is flagged", () => {
      const { missing } = validateRecreationOutput(MISSING_ONE_SECTION);
      expect(missing).toContain("recreation instructions");
    });

    it("REC-VAL-005: all required sections are checked", () => {
      const { missing } = validateRecreationOutput("empty output with nothing");
      expect(missing).toContain("objective");
      expect(missing).toContain("hero strategy");
      expect(missing).toContain("section breakdown");
      expect(missing).toContain("offer structure");
      expect(missing).toContain("trust elements");
      expect(missing).toContain("visual hierarchy");
      expect(missing).toContain("cta framework");
      expect(missing).toContain("build prompt");
      expect(missing).toContain("structure");
      expect(missing).toContain("components");
      expect(missing).toContain("visual system");
      expect(missing).toContain("content strategy");
      expect(missing).toContain("recreation instructions");
    });
  });

  describe("Forbidden phrases", () => {
    it("REC-VAL-006: 'analyze this' is forbidden", () => {
      const out = `### Objective\nAnalyze this design.\n### Hero Strategy\n...\n### Section Breakdown\n...`;
      const { forbidden } = validateRecreationOutput(out);
      expect(forbidden).toContain("analyze this");
    });

    it("REC-VAL-007: 'study this' is forbidden", () => {
      const out = `### Objective\nStudy this layout.\n### Hero Strategy\n...\n### Section Breakdown\n...`;
      const { forbidden } = validateRecreationOutput(out);
      expect(forbidden).toContain("study this");
    });

    it("REC-VAL-008: 'review this' is forbidden", () => {
      const out = `### Objective\nReview this page.\n### Hero Strategy\n...\n### Section Breakdown\n...`;
      const { forbidden } = validateRecreationOutput(out);
      expect(forbidden).toContain("review this");
    });

    it("REC-VAL-009: 'based on the image' is forbidden", () => {
      const { forbidden } = validateRecreationOutput(FORBIDDEN_OUTPUT_ANALYZE);
      expect(forbidden).toContain("based on the image");
    });

    it("REC-VAL-010: 'based on the screenshot' is forbidden", () => {
      const { forbidden } = validateRecreationOutput(FORBIDDEN_OUTPUT_PARTIAL);
      expect(forbidden).toContain("based on the screenshot");
    });

    it("REC-VAL-011: 'based on the attached' is forbidden", () => {
      const { forbidden } = validateRecreationOutput(FORBIDDEN_OUTPUT_ANALYZE);
      expect(forbidden).toContain("based on the attached");
    });

    it("REC-VAL-011_extract: 'extract' is forbidden", () => {
      const { forbidden } = validateRecreationOutput(FORBIDDEN_OUTPUT_ANALYZE);
      expect(forbidden).toContain("extract");
    });

    it("REC-VAL-012: output with ALL forbidden phrases reports all of them", () => {
      const { forbidden } = validateRecreationOutput(FORBIDDEN_OUTPUT_ANALYZE);
      expect(forbidden.length).toBeGreaterThan(0);
    });
  });

  describe("Edge cases", () => {
    it("REC-VAL-013: null output returns invalid result", () => {
      const { valid } = validateRecreationOutput(null);
      expect(valid).toBe(false);
    });

    it("REC-VAL-014: empty string output returns invalid result", () => {
      const { valid } = validateRecreationOutput("");
      expect(valid).toBe(false);
    });

    it("REC-VAL-015: forbidden phrase check is case-insensitive", () => {
      const out = `### Objective\nANALYZE THIS carefully\n### Hero Strategy\n...\n### Section Breakdown\n...`;
      const { forbidden } = validateRecreationOutput(out);
      expect(forbidden).toContain("analyze this");
    });
  });
});
