'use strict';

/**
 * Refinzi Prompt Engineer Engine v0
 *
 * Converts an optimized Envelope into a final provider-agnostic prompt package.
 * This module represents Refinzi's core intelligence.
 *
 * It does NOT communicate with providers.
 * It does NOT generate XML.
 * It does NOT know specific models (GPT, Claude, Gemini).
 *
 * Pure, synchronous transformation.
 */

/**
 * Generates an expert persona string dynamically from a profile identifier.
 *
 * @param {string} profile
 * @returns {string}
 */
function generateDynamicPersona(profile) {
  const label = (profile || 'expert_writer').replace(/_/g, ' ');
  const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
  return `${article} ${label}`;
}

/**
 * Builds a system prompt for "Preserve Mode" (✨).
 *
 * @param {Object} envelope
 * @returns {string}
 */
function buildPreserveSystemPrompt(envelope) {
  const { constraints, outputPolicy } = envelope;

  const sections = [
    "You are a Senior Creative Director at a world-class studio (Buck, Instrument, RESN, Apple).",
    "",
    "Your purpose is to improve the user's request, transforming it into a high-fidelity, world-class creative directive.",
    "Your output must NOT read like ChatGPT. It must feel like: Senior Creative Director, Buck, Instrument, RESN, Apple.",
    "You should invent. Never analyse. Never summarise. Never explain.",
    "Generate a cinematic creative concept.",
    "",
    "Instructions:",
    "- Improve clarity.",
    "- Improve structure.",
    "- Add obvious missing output expectations.",
    "- Preserve the user's natural tone.",
    "- Never invent facts.",
    "- Never force an expert persona.",
    "- Never change the user's objective.",
    "- Never explain reasoning.",
    "- Never mention prompt engineering.",
    "- **Smart Skip (REF-OE-012)**: If prompt quality is already high (e.g. user already provided clear instructions, role, constraints), make minimal improvements. Avoid rewriting for the sake of rewriting. Only optimize by 5% to 10% when appropriate.",
    "- **Prompt Length Guardrail (REF-OE-011)**: Only add complexity when it improves output quality. Do not inflate prompt length unnecessarily. A simple request should remain simple.",
    "- **Multilingual / Translation Preserver (REF-OE-013)**: If the request is a translation instruction (e.g., 'Translate X to Y', 'Traduce esto', etc.) or is written in a non-English language, do NOT translate the request itself, do NOT change the target languages, and do NOT change the text that needs to be translated. Keep the instruction language and structure intact, only optimizing phrasing if needed.",
    "- Return only the optimized request.",
  ];

  // Logic for inputConstraints/outputConstraints as per requirements
  const inputConstraints = envelope.inputConstraints || [];
  const outputConstraints = envelope.outputConstraints || [];
  const allConstraints = [...(constraints || []), ...inputConstraints, ...outputConstraints];

  if (allConstraints.length > 0) {
    sections.push('', 'Constraints:');
    allConstraints.forEach((c) => sections.push(`- ${c}`));
  }

  if (outputPolicy) {
    sections.push('', 'Refinzi Policy:');
    if (outputPolicy.preserveLanguage) sections.push('- Preserve original language exactly.');
    if (outputPolicy.preservePersonality) sections.push('- Maintain the original tone and personality.');
    if (outputPolicy.minimalModification) sections.push('- Apply minimal modifications to the core intent.');
  }

  return sections.join('\n').trim();
}

/**
 * Builds a system prompt for "Expert Mode" (Hold ✨).
 *
 * @param {Object} envelope
 * @returns {string}
 */
function buildExpertSystemPrompt(envelope) {
  const { intentAnnotations, constraints, outputPolicy } = envelope;
  const profile = intentAnnotations?.expectedRole || 'expert_writer';
  const persona = generateDynamicPersona(profile);

  const sections = [
    `You are a Senior Creative Director at a world-class studio (Buck, Instrument, RESN, Apple), acting as ${persona}.`,
    "",
    "Your purpose is to silently engineer the strongest possible AI request before execution.",
    "Upgrade the user's prompt to a production-ready, implementation-grade version.",
    "Your output must NOT read like ChatGPT. It must feel like: Senior Creative Director, Buck, Instrument, RESN, Apple.",
    "You should invent. Never analyse. Never summarise. Never explain.",
    "Generate a cinematic creative concept.",
    "",
    "Instructions:",
    "- Adopt the provided persona to frame the prompt.",
    "- Add domain-specific framing, edge cases, and structure.",
    "- Infer the optimal output format.",
    "- Specify execution constraints.",
    "",
    "Preserve:",
    "- original meaning,",
    "- original objective.",
    "",
    "Never:",
    "- expose internal reasoning,",
    "- mention prompt engineering,",
    "- explain optimization steps,",
    "- invent facts,",
    "- change the user's actual goal.",
    "",
    "Guidelines:",
    "- **Smart Skip (REF-OE-012)**: If prompt quality is already high (e.g. user already provided clear instructions, role, constraints), make minimal improvements. Avoid rewriting for the sake of rewriting.",
    "- **Multilingual / Translation Preserver (REF-OE-013)**: If the request is a translation instruction or written in a non-English language, you must preserve the original language and target language of the instruction. Do not translate the user's input text or instructions into English unless explicitly requested.",
    "",
    "Return only the final optimized request.",
  ];

  // Logic for inputConstraints/outputConstraints as per requirements
  const inputConstraints = envelope.inputConstraints || [];
  const outputConstraints = envelope.outputConstraints || [];
  const allConstraints = [...(constraints || []), ...inputConstraints, ...outputConstraints];

  if (allConstraints.length > 0) {
    sections.push('', 'Professional Constraints:');
    allConstraints.forEach((c) => sections.push(`- ${c}`));
  }

  const expectations = intentAnnotations?.expectations;
  if (expectations && Object.keys(expectations).length > 0) {
    sections.push('', 'Output Expectations:');
    for (const [key, value] of Object.entries(expectations)) {
      sections.push(`- ${key}: ${value}`);
    }
  }

  if (outputPolicy) {
    sections.push('', 'Policy:');
    if (outputPolicy.preserveLanguage) sections.push('- Maintain original language.');
    if (outputPolicy.preserveMeaning) sections.push('- Do not change the underlying objective.');
  }

  return sections.join('\n').trim();
}

/**
 * Converts an optimized Envelope into a final provider-agnostic prompt package.
 *
 * @param {Object} envelope - The optimized Refinzi Envelope
 * @param {"preserve"|"expert"} mode - The execution mode
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildExecutionPlan(envelope, mode) {
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('buildExecutionPlan: envelope must be a valid object');
  }

  let userPrompt = envelope.rawIntent || '';
  let systemPrompt = '';

  const hints = [];
  if (envelope.intentAnnotations?.outputType) {
    hints.push(`Detected output type: ${envelope.intentAnnotations.outputType}`);
  }
  if (envelope.intentAnnotations?.expectedRole) {
    hints.push(`Suggested expert role: ${envelope.intentAnnotations.expectedRole}`);
  }
  if (Object.keys(envelope.intentAnnotations?.expectations || {}).length > 0) {
    hints.push(`Output expectations: ${JSON.stringify(envelope.intentAnnotations.expectations)}`);
  }

  if (mode === 'expert') {
    systemPrompt = buildExpertSystemPrompt(envelope);
  } else if (mode === 'preserve') {
    systemPrompt = buildPreserveSystemPrompt(envelope);
  } else {
    throw new Error(`buildExecutionPlan: unknown execution mode: ${mode}`);
  }

  if (hints.length > 0) {
    systemPrompt = systemPrompt + '\n\nRefinzi Context:\n' + hints.map(h => `- ${h}`).join('\n');
  }

  return {
    systemPrompt,
    userPrompt,
  };
}
