// Expected constraints dataset.
// Defines what a valid improved output must / must not contain per prompt ID.
// Used by promptImprovement and recreationValidator tests.

export const expectedConstraints = {
  // Click prompts — only structural checks
  P001: { mustNotEqual: true, maxMultiplier: 3 },
  P002: { mustNotEqual: true, maxMultiplier: 4 },
  P003: { mustNotEqual: true, maxMultiplier: 4 },
  P004: { mustNotEqual: true, maxMultiplier: 4 },
  P005: { mustNotEqual: true, maxMultiplier: 3 },
  P006: { mustNotEqual: true, maxMultiplier: 4 },
  P007: { mustNotEqual: true, maxMultiplier: 3 },
  P008: { mustNotEqual: true, maxMultiplier: 3 },
  P009: { mustNotEqual: true, maxMultiplier: 4 },
  P010: { mustNotEqual: true, maxMultiplier: 4 },
  P011: { mustNotEqual: true, maxMultiplier: 4 },
  P012: { mustNotEqual: true, maxMultiplier: 4 },
  P013: { mustNotEqual: true, maxMultiplier: 4 },
  P014: { mustNotEqual: true, maxMultiplier: 3 },
  P015: { mustNotEqual: true, maxMultiplier: 3 },
  // Hold prompts — recreation structural requirements
  P016: {
    requiredSections: [
      "objective",
      "hero strategy",
      "section breakdown",
      "offer structure",
      "trust elements",
      "visual hierarchy",
      "cta framework",
      "build prompt",
      "structure",
      "components",
      "visual system",
      "content strategy",
      "recreation instructions"
    ],
    forbiddenPhrases: [
      "analyze this",
      "study this",
      "review this",
      "based on the image",
      "based on the screenshot",
      "based on the attached",
      "extract"
    ],
  },
  P017: {
    requiredSections: [
      "objective",
      "hero strategy",
      "section breakdown",
      "offer structure",
      "trust elements",
      "visual hierarchy",
      "cta framework",
      "build prompt",
      "structure",
      "components",
      "visual system",
      "content strategy",
      "recreation instructions"
    ],
    forbiddenPhrases: [
      "analyze this",
      "study this",
      "review this",
      "based on the image",
      "based on the screenshot",
      "based on the attached",
      "extract"
    ],
  },
  P018: {
    requiredSections: [
      "objective",
      "hero strategy",
      "section breakdown",
      "offer structure",
      "trust elements",
      "visual hierarchy",
      "cta framework",
      "build prompt",
      "structure",
      "components",
      "visual system",
      "content strategy",
      "recreation instructions"
    ],
    forbiddenPhrases: [
      "analyze this",
      "study this",
      "review this",
      "based on the image",
      "based on the screenshot",
      "based on the attached",
      "extract"
    ],
  },
  P019: {
    requiredSections: [
      "objective",
      "hero strategy",
      "section breakdown",
      "offer structure",
      "trust elements",
      "visual hierarchy",
      "cta framework",
      "build prompt",
      "structure",
      "components",
      "visual system",
      "content strategy",
      "recreation instructions"
    ],
    forbiddenPhrases: [
      "analyze this",
      "study this",
      "review this",
      "based on the image",
      "based on the screenshot",
      "based on the attached",
      "extract"
    ],
  },
  P020: {
    requiredSections: [
      "objective",
      "hero strategy",
      "section breakdown",
      "offer structure",
      "trust elements",
      "visual hierarchy",
      "cta framework",
      "build prompt",
      "structure",
      "components",
      "visual system",
      "content strategy",
      "recreation instructions"
    ],
    forbiddenPhrases: [
      "analyze this",
      "study this",
      "review this",
      "based on the image",
      "based on the screenshot",
      "based on the attached",
      "extract"
    ],
  },
};
