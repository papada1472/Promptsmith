/**
 * Artifact Detection V1
 *
 * Classifies clipboard text before pipeline execution.
 * Priority order with confidence scoring:
 *   1. URL        (high confidence)
 *   2. Email      (high confidence)
 *   3. Code       (heuristic scoring)
 *   4. Prompt     (heuristic scoring)
 *   5. Plain Text (fallback)
 *   6. LinkedIn   (heuristic scoring)
 *   7. X/Twitter  (heuristic scoring)
 *
 * If confidence < 80% for a type → skip to next priority.
 * If ALL types < 80% → plainText (always passes as fallback).
 */

const CONFIDENCE_THRESHOLD = 0.8;

// ── Individual classifiers ──────────────────────────────────────────────

function classifyUrl(text) {
  // URL: starts with http:// or https://
  if (/^https?:\/\//i.test(text.trim())) {
    return { type: "url", confidence: 1.0 };
  }
  // Also detect URLs that appear in the clipboard even if not trimmed start
  if (/https?:\/\/[^\s]+/.test(text.trim())) {
    return { type: "url", confidence: 0.95 };
  }
  return { type: "url", confidence: 0 };
}

function classifyEmail(text) {
  const trimmed = text.trim();
  // Full string is an email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { type: "email", confidence: 1.0 };
  }
  // Strong embedded email pattern (single line, contains email)
  if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(trimmed) && !trimmed.includes("\n")) {
    return { type: "email", confidence: 0.85 };
  }
  return { type: "email", confidence: 0 };
}

function classifyCode(text) {
  const trimmed = text.trim();
  if (!trimmed) return { type: "code", confidence: 0 };

  const lines = trimmed.split("\n");
  const lineCount = lines.length;

  // Short text is unlikely to be code
  if (lineCount < 2) return { type: "code", confidence: 0 };

  // Count code signals
  let signals = 0;
  let totalChecks = 0;

  // Code keywords (common across JS/TS/Python/Go/Rust/etc.)
  const codeKeywords = [
    "function", "const ", "let ", "var ", "import ", "export ",
    "class ", "def ", "return ", "if (", "else ", "for (", "while (",
    "switch ", "throw ", "try ", "catch ", "async ", "await ",
    "=>", "===", "!=", "!==", "||", "&&",
  ];
  const keywordHits = codeKeywords.filter(kw => trimmed.includes(kw)).length;
  signals += Math.min(keywordHits / 3, 1.0); // 3+ keywords = full signal
  totalChecks++;

  // Line-ending semicolons (JS/TS/C/C++/Java/Rust)
  const semicolonLines = lines.filter(l => l.trim().endsWith(";")).length;
  if (lineCount > 0) {
    const semiRatio = semicolonLines / lineCount;
    if (semiRatio > 0.3) signals += Math.min(semiRatio, 1.0);
    totalChecks++;
  }

  // Brace density (blocks)
  const openBraces = (trimmed.match(/{/g) || []).length;
  const closeBraces = (trimmed.match(/}/g) || []).length;
  if (openBraces > 0 && closeBraces > 0 && openBraces === closeBraces) {
    signals += Math.min(openBraces / 3, 1.0);
    totalChecks++;
  }

  // Indentation (tabs or 2/4 spaces before code lines)
  const indentedLines = lines.filter(l => /^(\t|  |    )/.test(l)).length;
  if (lineCount > 0) {
    const indentRatio = indentedLines / lineCount;
    if (indentRatio > 0.3) signals += Math.min(indentRatio, 1.0);
    totalChecks++;
  }

  // Multi-line string literals (template literals, triple quotes)
  if (/```/.test(trimmed) || trimmed.includes("`") || /"""/.test(trimmed) || /'''/.test(trimmed)) {
    signals += 0.5;
    totalChecks++;
  }

  // JSON or XML fences
  if (/^<[\w]+>/.test(trimmed) && /<\/[\w]+>$/.test(trimmed)) {
    signals += 0.8;
    totalChecks++;
  }
  try {
    JSON.parse(trimmed);
    signals += 0.8;
    totalChecks++;
  } catch (_) { /* not JSON */ }

  const confidence = totalChecks > 0 ? signals / totalChecks : 0;
  return { type: "code", confidence: Math.min(confidence, 1.0) };
}

function classifyPrompt(text) {
  const trimmed = text.trim();
  if (!trimmed) return { type: "prompt", confidence: 0 };

  const lines = trimmed.split("\n");
  let signals = 0;
  let totalChecks = 0;

  // Instructional verb starts (first word of lines)
  const instructionVerbs = [
    "Write", "Create", "Generate", "Explain", "Summarize", "Analyze",
    "Build", "Design", "List", "Draft", "Compose", "Describe", "Define",
    "Translate", "Rewrite", "Improve", "Optimize", "Refactor", "Debug",
    "Fix", "Add", "Remove", "Update", "Convert", "Compare", "Evaluate",
    "Outline", "Propose", "Recommend", "Identify", "Classify", "Extract",
    "Simulate", "Calculate", "Solve", "Prove", "Implement", "Configure",
    "Develop", "Review", "Critique", "Expand", "Simplify", "Clarify",
    "Paraphrase", "Summarise", "Organise", "Organize", "Format",
  ];
  const firstWords = lines.map(l => l.trim().split(/\s+/)[0]).filter(Boolean);
  const verbHits = firstWords.filter(w => instructionVerbs.includes(w)).length;
  if (lines.length > 0) {
    const verbRatio = verbHits / lines.length;
    if (verbRatio > 0.15) signals += Math.min(verbRatio, 1.0);
    totalChecks++;
  }

  // "Act as / You are / Your task / I want you to" patterns
  const rolePatterns = [
    /\bact\s+as\b/i, /\byou\s+are\b/i, /\byour\s+task\b/i,
    /\byour\s+goal\b/i, /\byour\s+job\b/i, /\byour\s+role\b/i,
    /\bi\s+want\s+you\s+to\b/i, /\bplease\s+/i, /\bi\s+need\s+you\s+to\b/i,
    /\byou\s+will\b/i, /\byou\s+should\b/i, /\byou\s+must\b/i,
    /\bimagine\s+(you|your)\b/i, /\byou'?re\s+an?\b/i,
    /\bacting\s+as\b/i, /\byou are an?\b/i,
  ];
  const roleHits = rolePatterns.filter(p => p.test(trimmed)).length;
  signals += Math.min(roleHits / 2, 1.0);
  totalChecks++;

  // Numbered/bulleted list structure (multi-step instructions)
  const hasList = /(\n\s*[-*]\s|\n\s*\d+[.)]\s)/.test("\n" + trimmed);
  if (hasList) {
    signals += 0.6;
    totalChecks++;
  }

  // Multi-paragraph structure (blank line separated blocks)
  const paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 2) {
    signals += Math.min((paragraphs.length - 1) / 3, 0.8);
    totalChecks++;
  }

  // Sentence ends with question mark (query-based prompts)
  if (/\?\s*$/.test(trimmed.trim())) {
    signals += 0.3;
    totalChecks++;
  }

  // Length heuristic: prompts tend to be moderate to long
  if (trimmed.length > 100 && trimmed.length < 5000) {
    signals += 0.2;
    totalChecks++;
  }

  // Context/format output instructions
  if (/output|result|format|response|answer|reply|explanation/i.test(trimmed)) {
    signals += 0.2;
    totalChecks++;
  }

  const confidence = totalChecks > 0 ? signals / totalChecks : 0;
  return { type: "prompt", confidence: Math.min(confidence, 1.0) };
}

function classifyPlainText(text) {
  // Plain text is the fallback — always returns 100%
  // It's the default when no higher-priority classifier reaches 80%
  return { type: "plainText", confidence: 1.0 };
}

function classifyLinkedIn(text) {
  const trimmed = text.trim();
  if (!trimmed) return { type: "linkedin", confidence: 0 };

  let signals = 0;
  let totalChecks = 0;

  // LinkedIn profile/post URLs
  if (/linkedin\.com\//i.test(trimmed)) {
    signals += 0.9;
    totalChecks++;
  }

  // "I'm excited to share / announce" patterns (common LinkedIn opener)
  if (/\bI'?m (excited|happy|thrilled|proud)\b/i.test(trimmed) &&
      /\b(share|announce|to share|to announce)\b/i.test(trimmed)) {
    signals += 0.8;
    totalChecks++;
  }

  // Hiring/recruitment signals
  if (/\b#hiring\b/i.test(trimmed) || /\b(we are|we're) (hiring|looking for)\b/i.test(trimmed)) {
    signals += 0.8;
    totalChecks++;
  }

  // Professional profile header patterns
  if (/\b\d+\+? years\b/i.test(trimmed) &&
      /\b(experience|expert|specialist|professional|engineer|developer|manager|director|founder|CEO|CTO)\b/i.test(trimmed)) {
    signals += 0.7;
    totalChecks++;
  }

  // Milestone announcements
  if (/\b(celebrat|milestone|anniversary|grateful|thankful)\b/i.test(trimmed) &&
      /\b(reach|accomplish|achieve|complete|cross)\b/i.test(trimmed)) {
    signals += 0.7;
    totalChecks++;
  }

  // "like" / "comment" / "repost" / "connect" engagement language
  if (/like|comment|repost|connect|follow/i.test(trimmed)) {
    signals += 0.3;
    totalChecks++;
  }

  // Professional "X • Y" or "X at Y" header pattern (looking for bullets in bio)
  if (/•/.test(trimmed) && /@/.test(trimmed)) {
    signals += 0.4;
    totalChecks++;
  }

  // Hashtags with professional/topic focus (not casual)
  const hashtags = trimmed.match(/#\w+/g) || [];
  if (hashtags.length >= 2) {
    signals += Math.min(hashtags.length / 5, 0.6);
    totalChecks++;
  }

  // Length: LinkedIn posts tend to be moderate length (100-2000 chars)
  if (trimmed.length > 100 && trimmed.length < 3000) {
    signals += 0.1;
    totalChecks++;
  }

  const confidence = totalChecks > 0 ? signals / totalChecks : 0;
  return { type: "linkedin", confidence: Math.min(confidence, 1.0) };
}

function classifyTwitter(text) {
  const trimmed = text.trim();
  if (!trimmed) return { type: "twitter", confidence: 0 };

  let signals = 0;
  let totalChecks = 0;

  // x.com or twitter.com URLs
  if (/\b(x\.com|twitter\.com)\//i.test(trimmed)) {
    signals += 0.9;
    totalChecks++;
  }

  // @username with hashtag patterns (social post style)
  const mentions = (trimmed.match(/@\w+/g) || []).length;
  const hashtags = (trimmed.match(/#\w+/g) || []).length;
  if (mentions >= 1 && hashtags >= 1) {
    signals += 0.6;
    totalChecks++;
  }
  if (mentions >= 1) {
    signals += Math.min(mentions / 3, 0.3);
    totalChecks++;
  }

  // RT / Retweet patterns
  if (/^RT\s+@/i.test(trimmed) || /retweet/i.test(trimmed)) {
    signals += 0.8;
    totalChecks++;
  }

  // Thread patterns (🧵, 1/n, "1/")
  if (/[🧵]/.test(trimmed) || /^\d+\/\d+/m.test(trimmed)) {
    signals += 0.8;
    totalChecks++;
  }

  // Short, constrained format (tweet character limit vibe)
  const lines = trimmed.split("\n").filter(l => l.trim());
  if (lines.length === 1 && trimmed.length <= 280) {
    signals += 0.5;
    totalChecks++;
  }

  // "via @" attribution
  if (/via\s+@\w+/i.test(trimmed)) {
    signals += 0.6;
    totalChecks++;
  }

  // Engagement/viral patterns
  if (/\b(likes?|retweets?|comments?|shares?|replies?|quote tweet)\b/i.test(trimmed)) {
    signals += 0.5;
    totalChecks++;
  }

  // Culture/casual signals versus professional (anti-LinkedIn)
  if (/\b(lmao|lol|fr|ngl|imo|smh|tbh|afk|pov|fomo)\b/i.test(trimmed)) {
    signals += 0.4;
    totalChecks++;
  }

  const confidence = totalChecks > 0 ? signals / totalChecks : 0;
  return { type: "twitter", confidence: Math.min(confidence, 1.0) };
}

// ── Main classifier ──────────────────────────────────────────────────

/**
 * Classify clipboard text content.
 *
 * @param {string} text - The raw clipboard text to classify.
 * @returns {{ type: string, confidence: number }}
 *
 * Priority order:
 *   1. URL
 *   2. Email
 *   3. Code
 *   4. Prompt
 *   5. Plain Text (fallback when nothing meets threshold)
 *   6. LinkedIn
 *   7. X/Twitter
 */
export function classifyClipboardContent(text) {
  if (!text || !text.trim()) {
    return { type: "plainText", confidence: 1.0 };
  }

  // Define the classification pipeline in priority order.
  // PlainText is handled specially — we only reach it if all others fail.
  const classifiers = [
    classifyUrl,
    classifyEmail,
    classifyCode,
    classifyPrompt,
    classifyLinkedIn,
    classifyTwitter,
  ];

  for (const classifier of classifiers) {
    const result = classifier(text);
    if (result.confidence >= CONFIDENCE_THRESHOLD) {
      return result;
    }
  }

  // Fallback: no type reached 80% confidence → plain text
  return { type: "plainText", confidence: 1.0 };
}