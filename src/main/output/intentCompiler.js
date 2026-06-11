/**
 * Intent Compiler – foundational layer for the Output Engine.
 *
 * This module defines a lightweight internal representation of a user
 * intent and provides a function to compile raw input into that shape.
 *
 * The implementation is intentionally simple: it extracts the raw
 * surface text and populates placeholder values for the remaining fields.
 * Logging is performed for each property so that developers can verify the
 * compiler is being invoked without affecting any downstream behaviour.
 */

/**
 * @typedef {Object} IntentCompilation
 * @property {string} surface   – the raw user input (unchanged)
 * @property {string} intent    – placeholder intent (empty string for now)
 * @property {string} say       – placeholder for what the system should say (empty string)
 * @property {string} think     – placeholder for internal reasoning (empty string)
 */

/**
 * Compile a raw input string into the IntentCompilation structure.
 *
 * The function logs each field using a consistent `[IntentCompiler]` prefix.
 *
 * @param {string} input – raw user‑selected text
 * @returns {IntentCompilation}
 */
export function compileIntent(input) {
  const surface = String(input);
  const intent = ""; // placeholder – empty string for now
  const say = "";   // placeholder – empty string
  const think = ""; // placeholder – empty string

  // Logging – each property on its own line for easy grep/debugging
  console.log(`[IntentCompiler] surface: ${surface}`);
  console.log(`[IntentCompiler] intent: ${intent}`);
  console.log(`[IntentCompiler] say: ${say}`);
  console.log(`[IntentCompiler] think: ${think}`);

  return { surface, intent, say, think };
}
