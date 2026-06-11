'use strict';

/**
 * Refinzi Intent Compiler
 *
 * Public API for converting raw human intent into a structured
 * Refinzi Envelope (provider-agnostic internal representation).
 *
 * Pipeline:
 *   User Input → Extract → Structure → Policy → Assemble → Envelope
 *
 * Future adapters will consume the Envelope and produce
 * provider-specific formats outside of this module.
 *
 * No XML.
 * No provider logic.
 * No AI calls.
 */

import { extract, structure, policy, assemble } from './stages.js';
import { isValid, freeze } from './envelope.js';

/**
 * @typedef {"context"|"expert"} BuildMode
 */

/**
 * @typedef {Object} BuildOptions
 * @property {string} input  - Raw user-selected text
 * @property {Object} [metadata] - Reserved for future context injection (not processed in v0)
 */

/**
 * @typedef {Object} BuildResult
 * @property {Object} envelope - The immutable Refinzi Envelope
 */

/**
 * Compiles raw user intent into a structured Refinzi Envelope.
 *
 * This is the only public entry point for the Output Intelligence Engine.
 *
 * @param {BuildOptions} opts
 * @param {string} opts.input - The raw user-selected text
 * @param {Object} [opts.metadata={}] - Reserved for future use (not processed yet)
 * @returns {BuildResult}
 *
 * @example
 *   const { envelope } = buildEnvelope({ input: 'Help me write a YC application' });
 *   // envelope.rawIntent === 'Help me write a YC application'
 *   // envelope.structuredHints.detectedOutput === 'YC Application'
 */
function buildEnvelope({ input, metadata = {} }) {
  // ── Stage 1: Extract ──────────────────────────────────────────────────
  const extractResult = extract(input, metadata);

  // ── Stage 2: Structure ────────────────────────────────────────────────
  const structureResult = structure(extractResult);

  // ── Stage 3: Policy ────────────────────────────────────────────────────
  // Default to 'context' mode for v0. 'expert' mode will be exposed
  // once the adapter layer is built.
  const mode = 'context';
  const policyResult = policy(mode, { structuredHints: structureResult.structuredHints });

  // ── Stage 4: Assemble ─────────────────────────────────────────────────
  const envelope = assemble({
    extract: extractResult,
    structure: structureResult,
    policy: policyResult,
  });

  // ── Validate and freeze ───────────────────────────────────────────────
  if (!isValid(envelope)) {
    throw new Error('Refinzi Envelope assembly failed validation');
  }

  return {
    envelope: freeze(envelope),
  };
}

export { buildEnvelope };