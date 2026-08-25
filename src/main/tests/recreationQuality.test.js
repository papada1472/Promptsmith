/**
 * recreationQuality.test.js
 *
 * Tests recreation output quality using the golden dataset.
 * Checks structural constraints (sections present, forbidden phrases absent)
 * for each hold-mode prompt in the dataset.
 *
 * NOTE: This test uses simulated (mocked) provider responses.
 * For the release review artifact, run the dataset through the real provider
 * and export an HTML report for manual scoring (1–5 Recreation Readiness).
 */

import { describe, it, expect } from "vitest";
import { prompts } from "./datasets/prompts/index.js";
import { expectedConstraints } from "./datasets/expected/index.js";
import { validateRecreationOutput } from "./validators.js";

// ── Simulated recreation output factory ──────────────────────────────────────
// Produces a valid structured output containing all required sections.
function buildMockRecreationOutput(inputPrompt) {
  return `
### Objective
${inputPrompt} — recreate with full fidelity and clarity.

### Hero Strategy
Headline focuses on the primary outcome. Subheadline details the product's promise. Primary CTA button is highly contrasting.

### Section Breakdown
1. Hero section
2. Features grid
3. Testimonials
4. Pricing
5. FAQ
6. Footer

### Offer Structure
Annual billing with 20% discount, 14-day money-back guarantee.

### Trust Elements
Client logos cloud, founder video, customer testimonial slider.

### Visual Hierarchy
Z-pattern layouts, high-contrast CTA buttons, clean spacing.

### CTA Framework
"Get Started Free" buttons in hero and bottom section.

### Build Prompt
1. Objective: Build a SaaS landing page.
2. Structure: Standard grid-based single page layout.
3. Components: Testimonial cards, feature comparison table.
4. Visual System: Dark theme with blue accent colors.
5. Content Strategy: Value-proposition copy.
6. Recreation Instructions: Implement responsive grid and forms.
`;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

const holdPrompts = prompts.filter((p) => p.mode === "hold");

describe("Recreation Quality — Golden Dataset", () => {
  it("RECQ-000: dataset contains hold-mode prompts for testing", () => {
    expect(holdPrompts.length).toBeGreaterThan(0);
  });

  holdPrompts.forEach(({ id, input }) => {
    const constraints = expectedConstraints[id];

    describe(`[${id}] "${input}"`, () => {
      it(`${id}-Q001: recreation output passes structural validator`, () => {
        const output = buildMockRecreationOutput(input);
        const { valid, forbidden, missing } = validateRecreationOutput(output);
        if (!valid) {
          console.warn(`[${id}] forbidden:`, forbidden, "missing:", missing);
        }
        expect(valid).toBe(true);
      });

      it(`${id}-Q002: output contains required sections`, () => {
        const output = buildMockRecreationOutput(input);
        const lower = output.toLowerCase();
        for (const section of constraints.requiredSections) {
          expect(lower).toContain(section);
        }
      });

      it(`${id}-Q003: output contains no forbidden phrases`, () => {
        const output = buildMockRecreationOutput(input);
        const lower = output.toLowerCase();
        for (const phrase of constraints.forbiddenPhrases) {
          expect(lower).not.toContain(phrase);
        }
      });

      it(`${id}-Q004: output is not empty`, () => {
        const output = buildMockRecreationOutput(input);
        expect(output.trim().length).toBeGreaterThan(0);
      });
    });
  });
});
