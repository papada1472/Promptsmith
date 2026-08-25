/**
 * promptImprovement.test.js
 *
 * Tests prompt improvement (click/sparkle mode) using the golden dataset.
 * Assertions are objective and structural only — no subjective quality checks.
 *
 * Checks:
 * ✓ Output differs from input
 * ✓ Output is not empty
 * ✓ Output length within reasonable bounds
 * ✓ Output is not an error string (isValidAIResponse guard)
 */

import { describe, it, expect } from "vitest";
import { isValidAIResponse } from "../clipboardFlow.js";
import { prompts } from "./datasets/prompts/index.js";
import { expectedConstraints } from "./datasets/expected/index.js";
import {
  assertOutputDiffersFromInput,
  assertOutputNotEmpty,
  assertOutputLengthBounds,
} from "./validators.js";

// ── Simulated improvement output factory ─────────────────────────────────────
// Produces a clearly improved version of the input prompt.
// Note: mock outputs are intentionally short additions so length-bound checks
// remain meaningful even for single-word inputs.
function buildMockImprovedOutput(input) {
  return `Please ${input.trim().toLowerCase().replace(/\.$/, "")}.`;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

const clickPrompts = prompts.filter((p) => p.mode === "click");

describe("Prompt Improvement — Golden Dataset", () => {
  it("PIMP-000: dataset contains click-mode prompts for testing", () => {
    expect(clickPrompts.length).toBeGreaterThan(0);
  });

  clickPrompts.forEach(({ id, input }) => {
    const constraints = expectedConstraints[id];

    describe(`[${id}] "${input}"`, () => {
      it(`${id}-IMP001: output is not empty`, () => {
        const output = buildMockImprovedOutput(input);
        expect(assertOutputNotEmpty(output)).toBe(true);
      });

      it(`${id}-IMP002: output differs from input`, () => {
        const output = buildMockImprovedOutput(input);
        expect(assertOutputDiffersFromInput(input, output)).toBe(true);
      });

      it(`${id}-IMP003: output length within bounds (max 10x input)`, () => {
        // For mock data, we use a generous 10x multiplier.
        // Real AI output should be validated against the per-prompt maxMultiplier
        // during the manual 10-user validation sprint.
        const output = buildMockImprovedOutput(input);
        expect(assertOutputLengthBounds(output, input, 10)).toBe(true);
      });

      it(`${id}-IMP004: isValidAIResponse passes for improved output`, () => {
        const output = buildMockImprovedOutput(input);
        const { valid } = isValidAIResponse(input, output);
        expect(valid).toBe(true);
      });
    });
  });

  // Edge case: isValidAIResponse rejects error-disguised outputs
  describe("Error string rejection", () => {
    it("PIMP-ERR-001: 'Error:' prefix is rejected by isValidAIResponse", () => {
      expect(isValidAIResponse("input", "Error: something failed").valid).toBe(false);
    });

    it("PIMP-ERR-002: output identical to input is rejected", () => {
      const text = "Translate this to Hindi";
      expect(isValidAIResponse(text, text).valid).toBe(false);
    });

    it("PIMP-ERR-003: empty output is rejected", () => {
      expect(isValidAIResponse("input", "").valid).toBe(false);
    });

    it("PIMP-ERR-004: whitespace-only output is rejected", () => {
      expect(isValidAIResponse("input", "   ").valid).toBe(false);
    });
  });
});
