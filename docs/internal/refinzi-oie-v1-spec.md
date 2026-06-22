# Refinzi — OIE V1 Technical Implementation Spec

> **Purpose**: Hand to the coder. Everything needed to build the Output Intelligence Engine.
> **Stack**: TypeScript, Node.js (or Electron main process), Claude API (`claude-sonnet-4-6`)

---

## File Structure

```
oie/
├── types.ts                     # All interfaces and enums
├── pipeline.ts                  # Main orchestrator (entry point)
│
├── classifier/
│   ├── intent.ts               # Intent detection — 8 categories
│   └── subtype.ts              # Per-intent subtype classification
│
├── lenses/
│   ├── index.ts                # Lens registry + selector
│   ├── strategy.ts             # Strategy lens dimensions
│   ├── writing.ts              # Writing lens dimensions
│   ├── coding.ts               # Coding lens dimensions
│   ├── image.ts                # Image lens dimensions
│   ├── video.ts                # Video lens dimensions
│   ├── audio.ts                # Audio lens dimensions
│   ├── research.ts             # Research lens dimensions
│   └── learning.ts             # Learning lens dimensions
│
├── templates/
│   ├── sparkle.ts              # 4-section Sparkle template
│   ├── expert.ts               # 5-section Expert template
│   └── renderer.ts             # Section builder utility
│
├── enhancer/
│   ├── prompts.ts              # System prompt factory
│   ├── sparkle.ts              # Claude API call — Sparkle mode
│   └── expert.ts               # Claude API call — Expert mode
│
├── governor/
│   ├── length.ts               # Word count enforcer
│   └── compression.ts          # Conditional compression pass
│
└── validator/
    ├── scorer.ts               # Quality heuristic scorer (0–100)
    └── schema.ts               # Output schema validator
```

---

## 1. types.ts — All Interfaces

```typescript
export type OIEMode = 'sparkle' | 'expert';

export type Intent =
  | 'writing'
  | 'strategy'
  | 'coding'
  | 'image'
  | 'video'
  | 'audio'
  | 'learning'
  | 'research';

export type Subtype =
  // writing
  | 'linkedin' | 'email' | 'blog' | 'newsletter' | 'social_post'
  // strategy
  | 'gtm' | 'fundraising' | 'market_research' | 'business_plan' | 'competitive_analysis'
  // coding
  | 'frontend' | 'backend' | 'debugging' | 'architecture' | 'documentation'
  // image
  | 'logo' | 'ui' | 'marketing' | 'illustration' | 'product_render'
  // video
  | 'ad' | 'cinematic' | 'social_media' | 'tutorial'
  // audio
  | 'music' | 'podcast' | 'voiceover'
  // research
  | 'market' | 'competitor' | 'academic' | 'product'
  // learning
  | 'concept' | 'howto' | 'comparison' | 'deep_dive'
  | 'unknown';

export interface OIEInput {
  prompt: string;
  mode: OIEMode;
}

export interface ClassificationResult {
  intent: Intent;
  subtype: Subtype;
  confidence: number; // 0–100
  usedFallback: boolean;
}

export interface LengthResult {
  count: number;
  withinBounds: boolean;
  overage: number; // 0 if within bounds
  target: number;
  hardMax: number;
}

export interface QualityScore {
  specificity: number;    // 0–20
  context: number;        // 0–20
  constraints: number;    // 0–20
  outputStructure: number;// 0–20
  completeness: number;   // 0–20
  total: number;          // 0–100
}

export interface BadgeConfig {
  category: string;   // e.g. "Strategy → GTM"
  mode: string;       // e.g. "Sparkle"
  label: string;      // e.g. "Prompt Improved" | "Thinking Enhanced"
}

export interface OIEResult {
  original: string;
  enhanced: string;
  mode: OIEMode;
  intent: Intent;
  subtype: Subtype;
  wordCount: number;
  score: {
    before: QualityScore;
    after: QualityScore;
  };
  badge: BadgeConfig;
  meta: {
    usedFallbackClassifier: boolean;
    compressionApplied: boolean;
    processingMs: number;
  };
}
```

---

## 2. classifier/intent.ts

```typescript
import { Intent } from '../types';

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  strategy: [
    'strategy', 'gtm', 'go-to-market', 'market entry', 'fundrais',
    'business plan', 'competitive', 'roadmap', 'launch plan', 'market research',
    'positioning', 'pricing strategy', 'growth strategy', 'expansion',
  ],
  writing: [
    'write', 'draft', 'linkedin post', 'email', 'newsletter', 'blog',
    'article', 'social post', 'copy', 'caption', 'thread', 'content',
    'rewrite', 'edit', 'proofread',
  ],
  coding: [
    'code', 'build', 'implement', 'function', 'component', 'api',
    'debug', 'fix bug', 'refactor', 'typescript', 'javascript', 'python',
    'backend', 'frontend', 'database', 'script', 'deploy',
  ],
  image: [
    'image', 'logo', 'design', 'illustration', 'render', 'visual',
    'midjourney', 'dall-e', 'stable diffusion', 'ui design', 'mockup',
    'poster', 'banner', 'graphic',
  ],
  video: [
    'video', 'film', 'ad', 'reel', 'short', 'cinematic', 'animate',
    'shot', 'scene', 'storyboard', 'tutorial video',
  ],
  audio: [
    'music', 'song', 'podcast', 'audio', 'voiceover', 'soundtrack',
    'beat', 'track', 'melody', 'jingle',
  ],
  learning: [
    'explain', 'teach', 'learn', 'understand', 'how does', 'what is',
    'course', 'lesson', 'study guide', 'tutorial', 'eli5',
  ],
  research: [
    'research', 'analyze', 'report', 'findings', 'data', 'study',
    'investigate', 'survey', 'insights', 'deep dive', 'landscape',
  ],
};

// Confidence threshold below which Claude API fallback is used
const FALLBACK_THRESHOLD = 70;

export function detectIntent(prompt: string): {
  intent: Intent;
  confidence: number;
  usedFallback: boolean;
} {
  const lower = prompt.toLowerCase();
  const scores: Partial<Record<Intent, number>> = {};

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const matches = keywords.filter(kw => lower.includes(kw)).length;
    scores[intent as Intent] = Math.round((matches / keywords.length) * 100);
  }

  // Find highest score
  let bestIntent: Intent = 'strategy';
  let bestScore = 0;
  for (const [intent, score] of Object.entries(scores)) {
    if ((score ?? 0) > bestScore) {
      bestScore = score ?? 0;
      bestIntent = intent as Intent;
    }
  }

  // If confidence is too low, caller should use Claude API fallback
  const usedFallback = bestScore < FALLBACK_THRESHOLD;
  return { intent: bestIntent, confidence: bestScore, usedFallback };
}
```

---

## 3. classifier/subtype.ts

```typescript
import { Intent, Subtype } from '../types';

type SubtypeMap = Record<Intent, Record<string, string[]>>;

const SUBTYPE_KEYWORDS: SubtypeMap = {
  strategy: {
    gtm: ['gtm', 'go-to-market', 'launch', 'market entry', 'sales strategy'],
    fundraising: ['fundrais', 'investor', 'pitch', 'seed', 'series a', 'vc'],
    market_research: ['market research', 'tam', 'sam', 'som', 'customer research'],
    business_plan: ['business plan', 'business model', 'revenue model', 'unit economics'],
    competitive_analysis: ['competitive', 'competitor', 'landscape', 'swot'],
  },
  writing: {
    linkedin: ['linkedin', 'professional post', 'thought leadership'],
    email: ['email', 'cold email', 'outreach', 'follow up'],
    blog: ['blog post', 'article', 'long-form'],
    newsletter: ['newsletter', 'weekly update', 'digest'],
    social_post: ['tweet', 'instagram', 'facebook', 'social media', 'caption', 'thread'],
  },
  coding: {
    frontend: ['react', 'vue', 'component', 'css', 'ui', 'html'],
    backend: ['api', 'server', 'database', 'node', 'python', 'endpoint'],
    debugging: ['debug', 'fix', 'error', 'bug', 'not working', 'issue'],
    architecture: ['architecture', 'system design', 'scalable', 'microservice'],
    documentation: ['docs', 'readme', 'documentation', 'comment', 'jsdoc'],
  },
  image: {
    logo: ['logo', 'brand mark', 'icon'],
    ui: ['ui', 'interface', 'screen', 'app design', 'wireframe'],
    marketing: ['banner', 'ad creative', 'poster', 'marketing'],
    illustration: ['illustration', 'character', 'scene', 'artwork'],
    product_render: ['product', 'render', '3d', 'mockup'],
  },
  video: {
    ad: ['ad', 'advertisement', 'commercial'],
    cinematic: ['cinematic', 'film', 'movie', 'scene'],
    social_media: ['reel', 'short', 'tiktok', 'youtube short'],
    tutorial: ['tutorial', 'how-to', 'explainer', 'walkthrough'],
  },
  audio: {
    music: ['music', 'song', 'track', 'beat', 'melody', 'composition'],
    podcast: ['podcast', 'episode', 'interview', 'show'],
    voiceover: ['voiceover', 'narration', 'voice', 'script'],
  },
  research: {
    market: ['market', 'industry', 'sector', 'tam'],
    competitor: ['competitor', 'competitive', 'rival'],
    academic: ['academic', 'paper', 'literature', 'study', 'research paper'],
    product: ['product research', 'user research', 'ux research', 'discovery'],
  },
  learning: {
    concept: ['explain', 'what is', 'define', 'concept'],
    howto: ['how to', 'how do', 'step by step', 'guide'],
    comparison: ['vs', 'compare', 'difference', 'versus'],
    deep_dive: ['deep dive', 'comprehensive', 'detailed', 'in-depth'],
  },
};

export function detectSubtype(prompt: string, intent: Intent): Subtype {
  const lower = prompt.toLowerCase();
  const subtypeMap = SUBTYPE_KEYWORDS[intent];
  if (!subtypeMap) return 'unknown';

  let bestSubtype: Subtype = 'unknown';
  let bestScore = 0;

  for (const [subtype, keywords] of Object.entries(subtypeMap)) {
    const matches = keywords.filter(kw => lower.includes(kw)).length;
    if (matches > bestScore) {
      bestScore = matches;
      bestSubtype = subtype as Subtype;
    }
  }

  return bestSubtype;
}
```

---

## 4. lenses/index.ts — Lens Registry

```typescript
import { Intent } from '../types';

export interface LensConfig {
  intent: Intent;
  dimensions: string[];
}

// Import individual lenses
import { STRATEGY_LENS } from './strategy';
import { WRITING_LENS } from './writing';
import { CODING_LENS } from './coding';
import { IMAGE_LENS } from './image';
import { VIDEO_LENS } from './video';
import { AUDIO_LENS } from './audio';
import { RESEARCH_LENS } from './research';
import { LEARNING_LENS } from './learning';

const LENS_REGISTRY: Record<Intent, string[]> = {
  strategy: STRATEGY_LENS,
  writing: WRITING_LENS,
  coding: CODING_LENS,
  image: IMAGE_LENS,
  video: VIDEO_LENS,
  audio: AUDIO_LENS,
  research: RESEARCH_LENS,
  learning: LEARNING_LENS,
};

export function getLens(intent: Intent): string[] {
  return LENS_REGISTRY[intent] ?? STRATEGY_LENS;
}

export function formatLensContext(dimensions: string[]): string {
  return dimensions.map(d => `• ${d}`).join('\n');
}
```

### Example Lens Files

```typescript
// lenses/strategy.ts
export const STRATEGY_LENS = [
  'Underlying assumptions — what is taken for granted that may not be true?',
  'Key tradeoffs — what is being sacrificed by choosing this approach?',
  'Execution risks — what are the top 3 ways this fails?',
  'Alternatives — what other approaches exist and why were they rejected?',
  'Success metrics — how will success be measured at 30/90/180 days?',
  'Resource requirements — what people, capital, or time constraints apply?',
  'Market timing — why now, and what changes if timing shifts?',
];

// lenses/writing.ts
export const WRITING_LENS = [
  'Target audience — who exactly is reading this, and what do they already know?',
  'Tone and voice — formal/casual, warm/authoritative, first/third person?',
  'Structure — hook, body, CTA; or problem/solution/proof?',
  'Concrete examples — what specific examples or data points should be included?',
  'Call to action — what should the reader do or feel after reading?',
];

// lenses/coding.ts
export const CODING_LENS = [
  'Functional requirements — what must the code do, precisely?',
  'Edge cases — what inputs or states should be handled explicitly?',
  'Error handling — how should failures and invalid states be surfaced?',
  'Testing — what test cases should be written alongside the code?',
  'Maintainability — what naming, structure, or documentation constraints apply?',
  'Performance and scale — are there latency, memory, or throughput constraints?',
];

// lenses/image.ts
export const IMAGE_LENS = [
  'Visual style — photorealistic, illustrative, minimal, maximalist, editorial?',
  'Composition — rule of thirds, centered, asymmetric, full bleed?',
  'Lighting — natural, studio, dramatic, soft, golden hour?',
  'Color palette — specified hex values, mood-based, brand colors?',
  'Mood and emotion — what feeling should the image evoke?',
  'Aspect ratio and resolution — 1:1, 16:9, 4:5, 9:16?',
  'Camera angle — eye level, aerial, worm\'s eye, close-up?',
];

// lenses/research.ts
export const RESEARCH_LENS = [
  'Assumptions — what biases or priors might distort the research?',
  'Data sources — primary vs secondary, proprietary vs public, credibility?',
  'Methodology — qualitative vs quantitative, sample size, time period?',
  'Known risks to validity — confounders, survivorship bias, selection bias?',
  'Conclusions format — executive summary, detailed findings, or raw data?',
];
```

---

## 5. enhancer/prompts.ts — System Prompt Factory

```typescript
import { Intent, OIEMode, Subtype } from '../types';
import { getLens, formatLensContext } from '../lenses';

export function buildSystemPrompt(
  intent: Intent,
  subtype: Subtype,
  mode: OIEMode
): string {
  if (mode === 'sparkle') {
    return buildSparklePrompt(intent, subtype);
  }
  return buildExpertPrompt(intent, subtype);
}

function buildSparklePrompt(intent: Intent, subtype: Subtype): string {
  return `You are a prompt engineer. Your ONLY job is to rewrite the user's prompt into a clearer, better-structured version.

Mode: SPARKLE — "Say It Better"
Intent: ${intent}
Subtype: ${subtype}

DO:     clarify · structure · improve wording · add missing requirements
NOT DO: challenge assumptions · change direction · add strategic critique

OUTPUT — use these exact section headers, no others:

Goal:
[What the user wants to achieve — specific and measurable]

Context:
[Relevant background, constraints, and audience]

Requirements:
[Specific criteria, constraints, and non-negotiables]

Output Format:
[Format, length, structure, and tone of the expected response]

WORD COUNT: Target 120 words. Minimum 80. Hard maximum 180. Never exceed 180.
Remove all filler, fluff, and redundancy. Maximum signal density.`;
}

function buildExpertPrompt(intent: Intent, subtype: Subtype): string {
  const lens = getLens(intent);
  const lensContext = formatLensContext(lens);

  return `You are a strategic thinking partner and prompt engineer. Enhance the user's prompt by surfacing blind spots and injecting expert-level thinking depth.

Mode: EXPERT — "Think Better"
Intent: ${intent}
Subtype: ${subtype}

EXPERT LENS — use these as the basis for Key Considerations (do not reproduce labels verbatim):
${lensContext}

DO:     identify unstated assumptions · surface risks · inject tradeoffs
        challenge framing where wrong · add success criteria
NOT DO: reproduce lens labels literally · add generic off-topic advice

OUTPUT — use these exact section headers, no others:

Objective:
[Clear, specific, measurable goal]

Key Considerations:
[Critical thinking: assumptions, risks, alternatives, tradeoffs — specific to this prompt]

Requirements:
[Specific constraints, context, and non-negotiables]

Deliverables:
[Concrete expected outputs and format]

Output Format:
[Format, structure, and tone specification]

WORD COUNT: Target 250 words. Minimum 150. Hard maximum 350. Never exceed 350.
Remove all fluff and redundancy. Maximum signal density.`;
}
```

---

## 6. governor/length.ts

```typescript
import { OIEMode } from '../types';

const MODE_TARGETS: Record<OIEMode, { target: number; min: number; hardMax: number }> = {
  sparkle: { target: 120, min: 80, hardMax: 180 },
  expert:  { target: 250, min: 150, hardMax: 350 },
};

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function checkLength(text: string, mode: OIEMode) {
  const { target, min, hardMax } = MODE_TARGETS[mode];
  const count = countWords(text);
  const overage = Math.max(0, count - hardMax);
  return {
    count,
    withinBounds: count >= min && count <= hardMax,
    overage,
    target,
    hardMax,
  };
}
```

---

## 7. validator/scorer.ts — Quality Heuristic Scorer

```typescript
// Scores 0–100 across 5 dimensions × 20 points each.
// All local. No API cost.

export interface ScoreBreakdown {
  specificity: number;
  context: number;
  constraints: number;
  outputStructure: number;
  completeness: number;
  total: number;
}

const SECTION_HEADERS = {
  sparkle: ['Goal:', 'Context:', 'Requirements:', 'Output Format:'],
  expert: ['Objective:', 'Key Considerations:', 'Requirements:', 'Deliverables:', 'Output Format:'],
};

export function scorePrompt(
  text: string,
  mode: 'sparkle' | 'expert' = 'sparkle'
): ScoreBreakdown {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;

  // 1. Specificity — does it name a concrete goal with measurable outcome?
  const specificitySignals = [
    /\b\d+\b/.test(text),              // contains numbers
    /\b(target|goal|achieve|deliver)\b/i.test(text),
    /\b(for|audience|by|within)\b/i.test(text),
    words > 50,
  ];
  const specificity = Math.round((specificitySignals.filter(Boolean).length / specificitySignals.length) * 20);

  // 2. Context — does it include relevant background?
  const contextSignals = [
    /\b(context|background|currently|situation|about)\b/i.test(text),
    /\b(company|product|industry|market|team)\b/i.test(text),
    words > 70,
  ];
  const context = Math.round((contextSignals.filter(Boolean).length / contextSignals.length) * 20);

  // 3. Constraints — are requirements and constraints explicit?
  const constraintSignals = [
    /\b(requirement|constraint|must|should|limit|within)\b/i.test(text),
    /\b(not|avoid|exclude|without)\b/i.test(text),
    /\b(tone|format|length|style)\b/i.test(text),
  ];
  const constraints = Math.round((constraintSignals.filter(Boolean).length / constraintSignals.length) * 20);

  // 4. Output structure — is output format explicitly defined?
  const structureSignals = [
    /\b(format|structure|output|deliverable|return)\b/i.test(text),
    /\b(bullet|list|table|paragraph|section)\b/i.test(text),
    /output format:/i.test(text),
  ];
  const outputStructure = Math.round((structureSignals.filter(Boolean).length / structureSignals.length) * 20);

  // 5. Completeness — are all required sections present?
  const headers = SECTION_HEADERS[mode];
  const presentHeaders = headers.filter(h => text.includes(h)).length;
  const completeness = Math.round((presentHeaders / headers.length) * 20);

  const total = specificity + context + constraints + outputStructure + completeness;

  return { specificity, context, constraints, outputStructure, completeness, total };
}
```

---

## 8. pipeline.ts — Main Orchestrator

```typescript
import { OIEInput, OIEResult, ClassificationResult } from './types';
import { detectIntent } from './classifier/intent';
import { detectSubtype } from './classifier/subtype';
import { buildSystemPrompt } from './enhancer/prompts';
import { callClaude } from './enhancer/sparkle'; // or expert.ts
import { checkLength } from './governor/length';
import { compressionPass } from './governor/compression';
import { scorePrompt } from './validator/scorer';
import { validateResult } from './validator/schema';

export async function process(input: OIEInput): Promise<OIEResult> {
  const startMs = Date.now();
  const { prompt, mode } = input;

  // Step 1 + 2: Classify
  const { intent, confidence, usedFallback } = detectIntent(prompt);
  const subtype = detectSubtype(prompt, intent);

  // Step 3 + 4: Lens + Template (injected into system prompt)
  const systemPrompt = buildSystemPrompt(intent, subtype, mode);

  // Step 5: Enhance
  let enhanced = await callClaude(prompt, systemPrompt);

  // Step 6: Length check
  const lengthResult = checkLength(enhanced, mode);

  // Step 7: Compression (conditional)
  let compressionApplied = false;
  if (lengthResult.overage > 0) {
    enhanced = await compressionPass(enhanced, lengthResult.hardMax);
    compressionApplied = true;
  }

  // Step 8: Quality score
  const scoreBefore = scorePrompt(prompt, mode);
  const scoreAfter = scorePrompt(enhanced, mode);

  const result: OIEResult = {
    original: prompt,
    enhanced,
    mode,
    intent,
    subtype,
    wordCount: checkLength(enhanced, mode).count,
    score: { before: scoreBefore, after: scoreAfter },
    badge: buildBadge(intent, subtype, mode),
    meta: {
      usedFallbackClassifier: usedFallback,
      compressionApplied,
      processingMs: Date.now() - startMs,
    },
  };

  // Step 9: Validate
  validateResult(result);

  // Step 10: Return
  return result;
}

function buildBadge(intent: string, subtype: string, mode: string) {
  const category = `${capitalize(intent)} → ${subtype.replace('_', ' ').toUpperCase()}`;
  const label = mode === 'sparkle' ? 'Prompt Improved' : 'Thinking Enhanced';
  return { category, mode: capitalize(mode), label };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
```

---

## 9. Test Dataset Structure (100 prompts)

```typescript
// tests/dataset.ts
// 100 prompts across 8 intents (~12-13 per intent)

export const TEST_DATASET = [
  // ── STRATEGY (13) ──
  { id: 's01', intent: 'strategy', subtype: 'gtm', prompt: 'Create GTM strategy for London' },
  { id: 's02', intent: 'strategy', subtype: 'fundraising', prompt: 'Help me pitch to VCs' },
  { id: 's03', intent: 'strategy', subtype: 'competitive_analysis', prompt: 'Analyze our competitors in the fintech space' },
  // ...

  // ── WRITING (13) ──
  { id: 'w01', intent: 'writing', subtype: 'linkedin', prompt: 'Write a linkedin post about AI' },
  { id: 'w02', intent: 'writing', subtype: 'email', prompt: 'Cold email to startup founders' },
  // ...

  // ── CODING (12) ──
  { id: 'c01', intent: 'coding', subtype: 'frontend', prompt: 'Build a react dropdown component' },
  // ...
  
  // ... (continue for image, video, audio, learning, research)
];

// tests/eval.ts
export async function evaluateDataset() {
  const results = [];
  for (const item of TEST_DATASET) {
    const sparkle = await oie.process({ prompt: item.prompt, mode: 'sparkle' });
    const expert  = await oie.process({ prompt: item.prompt, mode: 'expert' });

    results.push({
      id: item.id,
      intent: item.intent,
      subtype: item.subtype,
      original: { words: countWords(item.prompt) },
      sparkle: {
        words: sparkle.wordCount,
        withinBounds: sparkle.wordCount >= 80 && sparkle.wordCount <= 180,
        scoreGain: sparkle.score.after.total - sparkle.score.before.total,
      },
      expert: {
        words: expert.wordCount,
        withinBounds: expert.wordCount >= 150 && expert.wordCount <= 350,
        scoreGain: expert.score.after.total - expert.score.before.total,
      },
    });
  }
  return results;
}
```

---

## 10. Claude API Call Pattern

```typescript
// enhancer/sparkle.ts (and expert.ts mirrors this)
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

export async function callClaude(
  userPrompt: string,
  systemPrompt: string
): Promise<string> {
  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content
    ?.filter((b: any) => b.type === 'text')
    ?.map((b: any) => b.text)
    ?.join('') ?? '';

  if (!text) throw new Error('Empty response from Claude API');
  return text.trim();
}
```

---

## 11. Word Count Targets (Quick Reference)

| Mode    | Min  | Target | Hard Max | Absolute Max |
|---------|------|--------|----------|--------------|
| Sparkle | 80w  | 120w   | 180w     | 180w         |
| Expert  | 150w | 250w   | 350w     | 350w (400 never) |

---

## 12. Success Criteria Checklist

Before shipping OIE V1, verify:

- [ ] `detectIntent()` correctly classifies 90%+ of 100 test prompts without Claude fallback
- [ ] Sparkle output: 95%+ of prompts within 80–180 words
- [ ] Expert output: 95%+ of prompts within 150–350 words
- [ ] All Sparkle outputs contain exactly 4 section headers
- [ ] All Expert outputs contain exactly 5 section headers
- [ ] Quality score increases on 90%+ of prompts (after > before)
- [ ] Sparkle mode never challenges assumptions or adds strategic critique
- [ ] Expert mode always surfaces at least 2 of: assumptions, risks, alternatives, tradeoffs
- [ ] Compression pass fires on < 15% of runs (indicates system prompts are well-calibrated)
- [ ] Average processing time < 3 seconds per call
- [ ] Badge correctly reflects intent + subtype + mode on 100% of runs

---

## Key Invariants — Never Break These

1. **OIE never generates answers.** Output is always a prompt, not a response to the prompt.
2. **Template headers are non-negotiable.** Sparkle = 4 headers. Expert = 5 headers. Always.
3. **Lens dimensions never appear in output.** They guide the system prompt, not the result.
4. **Sparkle never challenges assumptions.** That is Expert's job exclusively.
5. **Word count hard maxes are hard.** If output exceeds them, run compression. Never return over-limit output.
6. **Quality score is internal only in V1.** Do not surface before/after scores in UI yet.

---

*Built for Refinzi OIE V1 — Prompt Intelligence Layer*
