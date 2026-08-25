'use strict';

/**
 * Refinzi Output Optimizer v0
 *
 * Deterministic enrichment pass for a Refinzi Envelope.
 *
 * Infers output type, expert role, and lightweight expectations
 * using keyword matching and lookup dictionaries.
 *
 * No AI calls.
 * No XML.
 * No provider logic.
 * No external dependencies.
 *
 * This is a pure, synchronous enrichment layer.
 */

// ─── Deep freeze helper ─────────────────────────────────────────────────────

function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return Object.freeze(obj);
}

// ─── Output Type Patterns ───────────────────────────────────────────────────

const OUTPUT_PATTERNS = {
  email: {
    keywords: ['email', 'draft an email', 'write an email', 'compose email', 'send an email'],
    expectations: { concise: true, clarity: 'high' },
  },
  linkedin_post: {
    keywords: [
      'linkedin post',
      'linkedin',
      'linkedin update',
      'professional post',
      'linkedin content',
    ],
    expectations: { engagement: true, concise: true },
  },
  tweet: {
    keywords: [
      'tweet',
      'twitter',
      'twitter thread',
      'tweet thread',
      'tweet storm',
      'twitter post',
    ],
    expectations: { concise: true, engagement: true },
  },
  yc_application: {
    keywords: [
      'yc application',
      'y combinator',
      'ycombinator',
      'apply to yc',
      'y combinator application',
    ],
    expectations: { structure: 'high', clarity: 'high', compelling: true },
  },
  investor_deck: {
    keywords: [
      'investor deck',
      'pitch deck',
      'fundraising deck',
      'investor presentation',
      'deck',
    ],
    expectations: { structure: 'high', persuasive: true, concise: true },
  },
  prd: {
    keywords: [
      'prd',
      'product requirements',
      'product spec',
      'product requirements document',
      'technical specification',
    ],
    expectations: { structure: 'very_high', clarity: 'high', completeness: 'high' },
  },
  strategy_document: {
    keywords: [
      'strategy',
      'gtm',
      'go-to-market',
      'go to market',
      'gtm plan',
      'market strategy',
      'strategic plan',
    ],
    expectations: { actionability: true, structure: 'high' },
  },
  summary: {
    keywords: [
      'summarize',
      'summary',
      'tl;dr',
      'tldr',
      'executive summary',
      'exec summary',
      'key points',
      'recap',
    ],
    expectations: { concise: true, completeness: 'high' },
  },
  bullet_list: {
    keywords: [
      'bullet',
      'bullet points',
      'list',
      'checklist',
      'enumerate',
      'items',
      'numbered list',
    ],
    expectations: { scannable: true, concise: true },
  },
  table: {
    keywords: ['table', 'spreadsheet', 'grid', 'tabular', 'compare', 'comparison'],
    expectations: { structure: 'very_high', scannable: true },
  },
};

// ─── Role Patterns ──────────────────────────────────────────────────────────

const ROLE_PATTERNS = {
  copywriter: {
    keywords: [
      'copy',
      'ad copy',
      'marketing copy',
      'landing page',
      'sales page',
      'cta',
      'headline',
      'tagline',
    ],
  },
  product_manager: {
    keywords: [
      'prd',
      'product requirements',
      'product spec',
      'user story',
      'feature',
      'product roadmap',
      'backlog',
    ],
  },
  strategy_consultant: {
    keywords: [
      'strategy',
      'gtm',
      'go-to-market',
      'market analysis',
      'competitive analysis',
      'frameworks',
      'strategic',
    ],
  },
  startup_founder: {
    keywords: [
      'yc',
      'y combinator',
      'startup',
      'fundraising',
      'investor deck',
      'pitch',
      'seed',
      'series a',
    ],
  },
  software_engineer: {
    keywords: [
      'code review',
      'pr review',
      'pull request',
      'technical docs',
      'architecture',
      'api',
      'refactor',
      'debug',
    ],
  },
  marketing_lead: {
    keywords: [
      'marketing',
      'campaign',
      'linkedin post',
      'social media',
      'content strategy',
      'brand',
      'messaging',
      'outreach',
    ],
  },
};

// ─── Detection ──────────────────────────────────────────────────────────────

/**
 * Detect the most likely output type from raw text.
 *
 * @param {string} rawIntent
 * @returns {{ outputType: string|null, expectations: Object, matchScore: number }}
 */
function detectOutput(rawIntent) {
  const text = rawIntent.toLowerCase();
  let bestType = null;
  let bestExpectations = {};
  let bestScore = 0;

  for (const [type, pattern] of Object.entries(OUTPUT_PATTERNS)) {
    const score = pattern.keywords.reduce((acc, kw) => {
      return acc + (text.includes(kw) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestType = type;
      bestExpectations = pattern.expectations;
    }
  }

  if (!bestType || bestScore === 0) {
    return { outputType: null, expectations: {}, matchScore: 0 };
  }

  // Confidence: 1 match = 0.5, 2 matches = 0.8, 3+ = 1.0
  const confidence = bestScore === 1 ? 0.5 : bestScore === 2 ? 0.8 : 1.0;

  return {
    outputType: bestType,
    expectations: bestExpectations,
    matchScore: confidence,
  };
}

/**
 * Detect the most likely expert role from raw text.
 *
 * @param {string} rawIntent
 * @returns {{ role: string|null, matchScore: number }}
 */
function detectRole(rawIntent) {
  const text = rawIntent.toLowerCase();
  let bestRole = null;
  let bestScore = 0;

  for (const [role, pattern] of Object.entries(ROLE_PATTERNS)) {
    const score = pattern.keywords.reduce((acc, kw) => {
      return acc + (text.includes(kw) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestRole = role;
    }
  }

  if (!bestRole || bestScore === 0) {
    return { role: null, matchScore: 0 };
  }

  // Confidence: 1 match = 0.5, 2 matches = 0.8, 3+ = 1.0
  const confidence = bestScore === 1 ? 0.5 : bestScore === 2 ? 0.8 : 1.0;

  return {
    role: bestRole,
    matchScore: confidence,
  };
}

/**
 * Calculate overall confidence from individual match scores.
 *
 * @param {number} outputScore
 * @param {number} roleScore
 * @returns {number}
 */
function calculateConfidence(outputScore, roleScore) {
  const confidence = outputScore * 0.6 + roleScore * 0.4;
  return Math.round(Math.min(confidence, 1) * 100) / 100;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Enrich an existing Refinzi Envelope with lightweight structural intelligence.
 *
 * This is a deterministic optimization pass. It does NOT:
 *   - Call any AI model
 *   - Modify rawIntent
 *   - Add new facts
 *   - Generate XML or JSON payloads
 *
 * If confidence < 0.40, the envelope is returned nearly unchanged
 * (only extensions.optimizer is added for traceability).
 *
 * @param {Object} envelope - An existing frozen Refinzi Envelope
 * @returns {Object} A new frozen Envelope with enrichment
 *
 * @example
 *   const optimized = optimizeEnvelope(envelope);
 *   // optimized.intentAnnotations.outputType === "linkedin_post"
 *   // optimized.intentAnnotations.expectedRole === "marketing_lead"
 */
export function optimizeEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('optimizeEnvelope: envelope must be a valid object');
  }

  const rawIntent = envelope.rawIntent || '';

  // ── Detect ────────────────────────────────────────────────────────────
  const outputResult = detectOutput(rawIntent);
  const roleResult = detectRole(rawIntent);
  const confidence = calculateConfidence(outputResult.matchScore, roleResult.matchScore);

  // ── Build enriched intent annotations ─────────────────────────────────
  const intentAnnotations = {
    outputType: null,
    expectedRole: null,
    confidence,
    expectations: {},
  };

  if (confidence >= 0.4) {
    intentAnnotations.outputType = outputResult.outputType;
    intentAnnotations.expectedRole = roleResult.role;
    intentAnnotations.expectations = { ...outputResult.expectations };
  }

  // ── Build extensions ──────────────────────────────────────────────────
  const extensions = {
    optimizer: {
      version: 1,
      outputMatchScore: outputResult.matchScore,
      roleMatchScore: roleResult.matchScore,
    },
  };

  // ── Assemble new envelope (never mutate the original) ─────────────────
  const enriched = {
    schemaVersion: envelope.schemaVersion,
    compilerVersion: envelope.compilerVersion,
    envelopeId: envelope.envelopeId,
    createdAt: envelope.createdAt,
    locale: envelope.locale,
    rawIntent: envelope.rawIntent,
    structuredHints: {
      detectedRole: envelope.structuredHints?.detectedRole ?? null,
      detectedOutput: envelope.structuredHints?.detectedOutput ?? null,
      confidence: envelope.structuredHints?.confidence ?? 0,
    },
    intentAnnotations,
    constraints: envelope.constraints ? [...envelope.constraints] : [],
    inputConstraints: envelope.inputConstraints ? [...envelope.inputConstraints] : [],
    outputConstraints: envelope.outputConstraints ? [...envelope.outputConstraints] : [],
    outputPolicy: envelope.outputPolicy ? { ...envelope.outputPolicy } : {},
    metadata: envelope.metadata ? { ...envelope.metadata } : {},
    extensions,
  };

  return deepFreeze(enriched);
}