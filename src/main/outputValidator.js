import { createLogger } from "./logger.js";

const log = createLogger("OutputValidator");

/**
 * outputValidator.js
 *
 * Pure function for validating AI responses and performing deterministic repairs.
 * No native dependencies — safe to import in any environment.
 */

const FORBIDDEN_PHRASES = [
  "analyze this",
  "study this",
  "review this",
  "based on the image",
  "based on the screenshot",
  "based on the attached",
  "extract",
];

const REQUIRED_SECTIONS = [
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
  "recreation instructions",
];

const REEL_REQUIRED_SECTIONS = [
  "hook",
  "audience",
  "story structure",
  "scene breakdown",
  "editing cadence",
  "text overlays",
  "music direction",
  "cta",
  "recreation prompt",
  "objective",
  "structure",
  "components",
  "visual system",
  "content strategy",
  "recreation instructions",
];

/**
 * Validates the AI response to verify it is not empty, identical to input,
 * or an error string, preventing loss of the user's prompt.
 * @param {string} input - The original prompt text.
 * @param {string} output - The AI generated prompt text.
 * @returns {{ valid: boolean, reason?: string }}
 */
export function isValidAIResponse(input, output) {
  if (!output || typeof output !== "string" || !output.trim()) {
    return { valid: false, reason: "AI response is empty" };
  }
  if (output.trim() === input.trim()) {
    return { valid: false, reason: "AI response is identical to input" };
  }

  const lower = output.trim().toLowerCase();
  if (
    lower.includes("unable to process right now") ||
    lower.includes("unexpected error occurred") ||
    lower.includes("daily refinement quota reached") ||
    lower.includes("no api key configured") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("quota exceeded") ||
    lower.includes("model is overloaded") ||
    lower.includes("capacity temporarily unavailable") ||
    lower.includes("blocked by safety filtering") ||
    lower.includes("content policy violation") ||
    lower.startsWith("error:") ||
    lower.startsWith("api error:") ||
    lower.startsWith("failed:") ||
    lower.startsWith("timeout:") ||
    lower === "error" ||
    lower === "failed"
  ) {
    return { valid: false, reason: "AI response is an error message" };
  }

  return { valid: true };
}

/**
 * Validates recreation output for forbidden and required sections.
 * @param {string} output
 * @returns {{ valid: boolean, forbidden: string[], missing: string[] }}
 */
export function validateRecreationOutput(output) {
  if (!output || typeof output !== "string") {
    return { valid: false, forbidden: [], missing: REQUIRED_SECTIONS.slice() };
  }
  const lower = output.toLowerCase();
  const isReel = lower.includes("hook") || lower.includes("recreation prompt");
  const required = isReel ? REEL_REQUIRED_SECTIONS : REQUIRED_SECTIONS;
  const foundForbidden = FORBIDDEN_PHRASES.filter((p) => lower.includes(p));
  const missingSections = required.filter((s) => !lower.includes(s));
  return {
    valid: foundForbidden.length === 0 && missingSections.length === 0,
    forbidden: foundForbidden,
    missing: missingSections,
  };
}

/**
 * Repares Sparkle/Refine mode responses if validation fails.
 * Construct a beautiful cinematicCreative director design layout.
 */
export function repairRefineOutput(input, output, reason) {
  log.info(`[OutputRepair] Repairing Sparkle/Refine output due to: ${reason}`);
  let cleanedInput = (input || "").trim();
  if (!cleanedInput) {
    cleanedInput = "cinematic creative direction";
  }

  // Construct a premium design concept block
  const repaired = `Cinematic Concept: ${cleanedInput.toUpperCase()}

Staged as a high-fidelity visual experience with premium motion physics, immersive art direction, and elegant typography. Designed to feel unexpected, specific, and cinematic. Output structured with absolute styling precision, high contrast, and refined typography.`;

  log.info("[OutputRepair] Replaced invalid output with repaired creative prompt.");
  return repaired;
}

/**
 * Repair recreation output by replacing forbidden phrases and adding missing sections.
 */
export function repairRecreationOutput(output, forbidden, missing) {
  log.info(`[OutputRepair] Repairing Recreation output. Forbidden count: ${forbidden.length}, Missing count: ${missing.length}`);
  let repaired = output || "";

  // 1. Replace forbidden phrases case-insensitively with creative synonyms
  const forbiddenReplacements = {
    "analyze this": "recreate this design",
    "study this": "recreate this",
    "review this": "adapt this",
    "based on the image": "recreating the visual style",
    "based on the screenshot": "recreating the layout",
    "based on the attached": "recreating the theme",
    "extract": "incorporate"
  };

  for (const phrase of forbidden) {
    const replacement = forbiddenReplacements[phrase.toLowerCase()] || "adapt";
    const regex = new RegExp(phrase, "gi");
    repaired = repaired.replace(regex, replacement);
  }

  // 2. Append missing required sections deterministically using high-quality templates
  const sectionContent = {
    "objective": "Recreate the high-fidelity user interface with absolute visual parity and strict adherence to structural constraints.",
    "hero strategy": "Establish a strong visual entry path using bold layout hierarchy and stark typographic contrast.",
    "section breakdown": "Hero Section, Feature Showcases, Interactive Panels, CTA Zones, and Footer.",
    "offer structure": "Premium high-value packaging structured to drive interaction and conversion.",
    "trust elements": "Sophisticated grid alignment, micro-animations, and clean, minimal borders.",
    "visual hierarchy": "Optimal spacing, razor-sharp alignment, and high-contrast styling systems.",
    "cta framework": "Prominent, contrasting action triggers positioned strategically across the page.",
    "build prompt": "Rebuild the page in React and Tailwind with high-fidelity components.",
    "structure": "Responsive grid-based design optimized for multi-device layout fluidity.",
    "components": "Polished visual elements, modular structures, and state transitions.",
    "visual system": "Monochrome dark theme with stark primary accent colors.",
    "content strategy": "High-impact editorial copy and refined content spacing.",
    "recreation instructions": "Implement responsive grids, fluid typography, and smooth transitions.",
    "hook": "Unconventional cinematic visual entry designed to capture attention in the first 2 seconds.",
    "audience": "Creative professionals, design directors, and front-end developers.",
    "story structure": "3-stage narrative: hook, value showcase, and call-to-action.",
    "scene breakdown": "Scene 1: Rapid visual hook. Scene 2: Detailed feature showcase. Scene 3: Actionable closing.",
    "editing cadence": "Rhythmic, high-tempo transitions synchronized with micro-beats.",
    "text overlays": "Bold, stark uppercase sans-serif text aligned perfectly with screen borders.",
    "music direction": "Atmospheric, deep electronic synth with subtle bass drops.",
    "cta": "Engaging prompt triggering user comments or clicks.",
    "recreation prompt": "A ready-to-run execution command specifying all visual and motion parameters."
  };

  for (const section of missing) {
    const title = section.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const content = sectionContent[section] || "Implement high-fidelity structural components and smooth motion curves.";
    repaired += `\n\n### ${title}\n${content}`;
  }

  log.info("[OutputRepair] Recreation output repaired successfully.");
  return repaired;
}

/**
 * Repairs a malformed or non-JSON string into the expected JSON object of Drop mode.
 */
export function repairJsonOutput(text, inputPrompt) {
  log.info("[OutputRepair] Attempting to parse and repair JSON response...");
  const fields = {
    visual_dna_echo: "",
    creative_concept: "",
    scroll_story: [],
    motion_blueprint: "",
    implementation_prompt: ""
  };

  const getSection = (heading) => {
    const regex = new RegExp(`###\\s*${heading}[\\s\\S]*?(?=###|$)`, "i");
    const match = text.match(regex);
    if (match) {
      return match[0].replace(new RegExp(`###\\s*${heading}`, "i"), "").trim();
    }
    return "";
  };

  fields.visual_dna_echo = getSection("Visual DNA");
  fields.creative_concept = getSection("Creative Concept");
  const storyText = getSection("Scroll Story");
  if (storyText) {
    fields.scroll_story = storyText.split(/\n+/).map(line => line.replace(/^-\s*/, "").trim()).filter(Boolean);
  }
  fields.motion_blueprint = getSection("Motion Blueprint");
  fields.implementation_prompt = getSection("Implementation Prompt");

  // Fallbacks if sections were completely missing or empty
  if (!fields.visual_dna_echo) {
    fields.visual_dna_echo = "Echoing and integrating the provided Visual DNA into a compelling narrative context.";
  }
  if (!fields.creative_concept) {
    fields.creative_concept = "Cinematic Concept\nA high-fidelity creative concept based on the theme.";
  }
  if (fields.scroll_story.length === 0) {
    fields.scroll_story = [
      "The visual narrative starts with a bold hook.",
      "Transition into detailed product characteristics.",
      "Concluding with a highly contrasting action trigger."
    ];
  }
  if (!fields.motion_blueprint) {
    fields.motion_blueprint = "Interactive entry animations, smooth fluid luxury transition curves, and tactile hover feedback.";
  }
  if (!fields.implementation_prompt) {
    fields.implementation_prompt = inputPrompt || "Implement the creative concept with a high-fidelity visual system.";
  }

  log.info("[OutputRepair] Reconstructed JSON object from text headers successfully.");
  return fields;
}