'use strict';

/**
 * Refinzi Pipeline Stages
 *
 * Each stage is a pure function that transforms a partially-built Envelope.
 * The pipeline order:
 *
 *   Extract → Structure → Policy → Assemble
 *
 * No side effects.
 * No AI calls.
 * No provider assumptions.
 */

import { createEmpty } from './envelope.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Simple language detection.
 * Returns 'hinglish' or the language name based on script detection.
 *
 * @param {string} text
 * @returns {string}
 */
function detectLanguage(text) {
  if (!text || text.trim().length === 0) return 'unknown';

  // Check for Devanagari characters (Hindi)
  const hasDevanagari = /[\u0900-\u097F]/.test(text);

  // Check for common Hinglish patterns: English words + Hindi words in Latin script
  const hinglishMarkers = [
    /\b(?:hai|ho|hain|hoon|hona|karo|karna|karte|karta|karti|kar|raha|rahi|rahe|rahi|tha|the|thi|the|thhe|thhi)\b/i,
    /\b(?:nahi|nhi|mat|kyun|kyo|kaise|kya|kaun|kahan|kab|jitna|itna|utna|kitna)\b/i,
    /\b(?:mera|meri|mere|tera|teri|tere|apna|apni|apne|hum|tum|aap|log|sab)\b/i,
    /\b(?:chahta|chahti|chahte|chahiye|lagta|lagti|lagte|hoga|hog|hogi|honge)\b/i,
  ];

  const hasHinglishMarkers = hinglishMarkers.some((re) => re.test(text));

  if (hasDevanagari) return 'hindi';
  if (hasHinglishMarkers) return 'hinglish';

  return 'english';
}

/**
 * Checks if text contains mixed languages (e.g., Hinglish, Spanglish).
 *
 * @param {string} text
 * @returns {boolean}
 */
function hasMixedLanguage(text) {
  if (!text) return false;
  const hasLatin = /[a-zA-Z]/.test(text);
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hasCJK = /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text);
  const hasArabic = /[\u0600-\u06FF]/.test(text);

  const nonLatinCount = [hasDevanagari, hasCJK, hasArabic].filter(Boolean).length;
  return hasLatin && nonLatinCount > 0;
}

// ─── Known Output Patterns ─────────────────────────────────────────────────

const PATTERNS = [
  {
    name: 'YC Application',
    keywords: ['yc application', 'y combinator', 'ycombinator', 'apply to yc'],
    role: 'startup founder',
  },
  {
    name: 'LinkedIn Post',
    keywords: ['linkedin post', 'linkedin', 'professional post'],
    role: 'professional',
  },
  {
    name: 'Executive Summary',
    keywords: ['executive summary', 'exec summary'],
    role: 'executive',
  },
  {
    name: 'Email',
    keywords: ['email', 'draft an email', 'write an email', 'compose email'],
    role: 'professional',
  },
  {
    name: 'GTM Plan',
    keywords: ['gtm', 'go-to-market', 'go to market', 'gtm plan', 'market strategy'],
    role: 'growth lead',
  },
  {
    name: 'Investor Deck',
    keywords: ['investor deck', 'pitch deck', 'fundraising deck', 'investor presentation'],
    role: 'founder',
  },
  {
    name: 'Blog Post',
    keywords: ['blog', 'blog post', 'write a blog', 'article'],
    role: 'writer',
  },
  {
    name: 'Twitter Thread',
    keywords: ['twitter thread', 'tweet thread', 'twitter post', 'tweet storm', 'tweet', 'twitter'],
    role: 'creator',
  },
  {
    name: 'Product Requirements',
    keywords: ['prd', 'product requirements', 'spec', 'product spec', 'technical specification'],
    role: 'product manager',
  },
  {
    name: 'Technical Documentation',
    keywords: ['docs', 'documentation', 'technical doc', 'api docs', 'readme', 'guide'],
    role: 'engineer',
  },
  {
    name: 'Code Review',
    keywords: ['code review', 'review code', 'pr review', 'pull request review'],
    role: 'engineer',
  },
];

// ─── Stages ─────────────────────────────────────────────────────────────────

/**
 * Stage 1: Extract
 *
 * Preserve the original text exactly. Detect language characteristics.
 * Do NOT rewrite anything.
 *
 * @param {{ rawIntent: string, metadata: Object }} context
 * @returns {{ rawIntent: string, metadata: Object }}
 */
function extract(input, metadata) {
  const rawIntent = String(input);
  const lang = detectLanguage(rawIntent);
  const mixed = hasMixedLanguage(rawIntent);

  return {
    rawIntent,
    metadata: {
      ...metadata,
      _language: lang,
      _mixedLanguage: mixed,
    },
  };
}

/**
 * Stage 2: Structure
 *
 * Infer lightweight hints about the intended output form.
 * Uses keyword matching against known patterns.
 * Confidence is based on how many keywords matched.
 *
 * @param {{ rawIntent: string, metadata: Object }} context
 * @returns {{ structuredHints: { detectedRole: string|null, detectedOutput: string|null, confidence: number }}}
 */
function structure(context) {
  const text = context.rawIntent.toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const pattern of PATTERNS) {
    const score = pattern.keywords.reduce((acc, kw) => {
      return acc + (text.includes(kw) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern;
    }
  }

  if (!bestMatch || bestScore === 0) {
    return {
      structuredHints: {
        detectedRole: null,
        detectedOutput: null,
        confidence: 0,
      },
    };
  }

  const maxKeywords = bestMatch.keywords.length;
  const confidence = Math.min(bestScore / maxKeywords, 1);

  return {
    structuredHints: {
      detectedRole: bestMatch.role,
      detectedOutput: bestMatch.name,
      confidence: Math.round(confidence * 100) / 100,
    },
  };
}

/**
 * Stage 3: Policy
 *
 * Inject Refinzi philosophy constraints based on the mode.
 *
 * @param {string} mode - 'context' or 'expert'
 * @param {{ structuredHints: Object }} context
 * @returns {{ outputPolicy: Object, constraints: string[] }}
 */
function policy(mode, context) {
  const baseConstraints = [
    'Preserve original meaning',
    'Preserve original intent',
    'Preserve original personality',
    'Preserve original language',
    'Apply minimal modifications',
    'Never introduce new facts',
    'Never change the user objective',
    'Never add corporate language',
    'Never explain reasoning',
    'Never mention prompt engineering',
  ];

  const modeConstraints =
    mode === 'expert'
      ? [
          'Add domain-specific framing when confident',
          'Include output format expectations',
          'Add useful constraints silently',
        ]
      : [
          'Provide concise context for continuation',
          'Maintain original tone exactly',
        ];

  return {
    outputPolicy: {
      preserveLanguage: true,
      preservePersonality: true,
      preserveMeaning: true,
      minimalModification: true,
    },
    constraints: [...baseConstraints, ...modeConstraints],
  };
}

/**
 * Stage 4: Assemble
 *
 * Combine all stage outputs into one immutable Envelope.
 *
 * @param {Object} stageOutputs
 * @returns {Envelope}
 */
function assemble(stageOutputs) {
  const envelope = createEmpty();

  envelope.rawIntent = stageOutputs.extract.rawIntent;
  envelope.structuredHints = stageOutputs.structure.structuredHints;
  envelope.constraints = stageOutputs.policy.constraints;
  envelope.outputPolicy = stageOutputs.policy.outputPolicy;
  envelope.metadata = stageOutputs.extract.metadata;

  return envelope;
}

export {
  extract,
  structure,
  policy,
  assemble,
  detectLanguage,
  hasMixedLanguage,
};