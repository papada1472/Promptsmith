'use strict';

/**
 * Refinzi Envelope — Internal Representation of User Intent
 *
 * This is the permanent internal contract of Refinzi.
 * It is provider-agnostic, model-agnostic, and format-agnostic.
 *
 * No XML.
 * No provider logic.
 * No serialization.
 *
 * Future adapters will consume this object and transform it
 * into provider-specific formats (GPT XML, Claude Markdown, Gemini JSON, etc.).
 */

export const SCHEMA_VERSION = 1;

/**
 * @typedef {Object} StructuredHints
 * @property {string|null} detectedRole
 * @property {string|null} detectedOutput
 * @property {number} confidence - 0..1
 */

/**
 * @typedef {Object} OutputPolicy
 * @property {boolean} preserveLanguage
 * @property {boolean} preservePersonality
 * @property {boolean} preserveMeaning
 * @property {boolean} minimalModification
 */

/**
 * @typedef {Object} Envelope
 * @property {number} schemaVersion
 * @property {string} rawIntent
 * @property {StructuredHints} structuredHints
 * @property {string[]} constraints
 * @property {OutputPolicy} outputPolicy
 * @property {Object} metadata
 */

/**
 * Creates a new Refinzi Envelope with default values.
 *
 * @returns {Envelope}
 */
export function createEmpty() {
  return {
    schemaVersion: SCHEMA_VERSION,
    rawIntent: '',
    structuredHints: {
      detectedRole: null,
      detectedOutput: null,
      confidence: 0,
    },
    constraints: [],
    outputPolicy: {
      preserveLanguage: true,
      preservePersonality: true,
      preserveMeaning: true,
      minimalModification: true,
    },
    metadata: {},
  };
}

/**
 * Validates that an object conforms to the Envelope shape.
 *
 * @param {*} obj
 * @returns {boolean}
 */
export function isValid(envelope) {
  if (!envelope || typeof envelope !== 'object') return false;
  if (envelope.schemaVersion !== SCHEMA_VERSION) return false;
  if (typeof envelope.rawIntent !== 'string') return false;
  if (typeof envelope.structuredHints !== 'object') return false;
  if (typeof envelope.structuredHints.confidence !== 'number') return false;
  if (!Array.isArray(envelope.constraints)) return false;
  if (typeof envelope.outputPolicy !== 'object') return false;
  if (typeof envelope.outputPolicy.preserveLanguage !== 'boolean') return false;
  if (typeof envelope.outputPolicy.preservePersonality !== 'boolean') return false;
  if (typeof envelope.outputPolicy.preserveMeaning !== 'boolean') return false;
  if (typeof envelope.outputPolicy.minimalModification !== 'boolean') return false;

  return true;
}

/**
 * Freezes an Envelope so it becomes immutable.
 *
 * @param {Envelope} envelope
 * @returns {Envelope}
 */
export function freeze(envelope) {
  return Object.freeze({
    schemaVersion: envelope.schemaVersion,
    rawIntent: envelope.rawIntent,
    structuredHints: Object.freeze({ ...envelope.structuredHints }),
    constraints: Object.freeze([...envelope.constraints]),
    outputPolicy: Object.freeze({ ...envelope.outputPolicy }),
    metadata: Object.freeze({ ...envelope.metadata }),
  });
}