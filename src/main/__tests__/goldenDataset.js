/**
 * Golden Dataset — 80+ input/output test cases for the output quality test suite.
 *
 * Each entry:
 *   id          {string}  unique identifier for traceability
 *   input       {string}  the raw prompt the user would paste
 *   category    {string}  classifier label expected from classifyClipboardContent
 *   expectation {Object}  what the output MUST satisfy
 *     - notContains    {string[]}  substrings that must NOT appear in the refined output
 *     - mustChange     {boolean}   output must differ from input
 *     - minLength      {number}    minimum output length
 *     - maxLength      {number}    maximum output length (undefined = no cap)
 *     - mustContainAny {string[]}  at least one of these must appear (optional)
 *   tags        {string[]} for grouping / filtering tests
 */

export const goldenDataset = [
  // ── PROMPT IMPROVEMENT — General Writing ─────────────────────────────────
  {
    id: "GEN-001",
    input: "write me a email to my boss",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 30,
      notContains: [],
    },
    tags: ["writing", "email", "basic"],
  },
  {
    id: "GEN-002",
    input: "i need a blog post about AI",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 30,
      notContains: [],
    },
    tags: ["writing", "blog", "basic"],
  },
  {
    id: "GEN-003",
    input: "Summarize this for me",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 20,
      notContains: [],
    },
    tags: ["writing", "vague"],
  },
  {
    id: "GEN-004",
    input: "Write a professional email to a client explaining a project delay caused by unexpected API integration issues, maintaining a positive tone and proposing a revised timeline.",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 100,
      notContains: ["unable to process", "error:"],
    },
    tags: ["writing", "email", "professional"],
  },
  {
    id: "GEN-005",
    input: "draft a linkedin post about my new job at google as a senior software engineer working on kubernetes infrastructure",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 80,
      notContains: ["unable to process"],
    },
    tags: ["writing", "linkedin", "career"],
  },
  {
    id: "GEN-006",
    input: "Please help me write a resignation letter",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 40,
      notContains: [],
    },
    tags: ["writing", "hr"],
  },
  {
    id: "GEN-007",
    input: "Create a weekly newsletter for our SaaS product targeting CTOs",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 60,
      notContains: ["unable to process"],
    },
    tags: ["writing", "marketing"],
  },
  {
    id: "GEN-008",
    input: "Explain quantum computing to a 10-year-old using Lego as an analogy",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 80,
      notContains: [],
    },
    tags: ["writing", "education", "analogy"],
  },

  // ── CODE PROMPTS ─────────────────────────────────────────────────────────
  {
    id: "CODE-001",
    input: "Write a Python function to parse JSON",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 50,
      notContains: ["unable to process"],
    },
    tags: ["code", "python"],
  },
  {
    id: "CODE-002",
    input: "create a react component",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 40,
      notContains: [],
    },
    tags: ["code", "react", "frontend"],
  },
  {
    id: "CODE-003",
    input: "Refactor this TypeScript class to use dependency injection and add proper error handling for async operations.",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 100,
      notContains: [],
    },
    tags: ["code", "typescript", "refactor"],
  },
  {
    id: "CODE-004",
    input: "Write a SQL query to find top 10 customers by revenue",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 60,
      notContains: [],
    },
    tags: ["code", "sql", "database"],
  },
  {
    id: "CODE-005",
    input: "Debug this Python code:\ndef add(a, b):\n  return a - b",
    category: "code",
    expectation: {
      mustChange: true,
      minLength: 30,
      notContains: [],
    },
    tags: ["code", "debugging", "python"],
  },
  {
    id: "CODE-006",
    input: "build a REST API with authentication",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 60,
      notContains: [],
    },
    tags: ["code", "api", "backend"],
  },
  {
    id: "CODE-007",
    input: "Write a Dockerfile for a Node.js Express app with multi-stage builds",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 80,
      notContains: [],
    },
    tags: ["code", "docker", "devops"],
  },
  {
    id: "CODE-008",
    input: "implement binary search in javascript",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 50,
      notContains: [],
    },
    tags: ["code", "algorithms", "javascript"],
  },

  // ── ANALYSIS & RESEARCH ──────────────────────────────────────────────────
  {
    id: "ANA-001",
    input: "Analyze the competitive landscape for B2B SaaS companies in the CRM space",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 100,
      notContains: ["unable to process"],
    },
    tags: ["analysis", "business", "research"],
  },
  {
    id: "ANA-002",
    input: "Compare React, Vue and Angular for a large enterprise application",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 100,
      notContains: [],
    },
    tags: ["analysis", "frontend", "technical"],
  },
  {
    id: "ANA-003",
    input: "help me analyze sales data",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 30,
      notContains: [],
    },
    tags: ["analysis", "data", "vague"],
  },
  {
    id: "ANA-004",
    input: "What are the pros and cons of microservices vs monolithic architecture for a startup?",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 100,
      notContains: [],
    },
    tags: ["analysis", "architecture", "technical"],
  },
  {
    id: "ANA-005",
    input: "Review our pricing strategy for a B2C mobile app with freemium model",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 80,
      notContains: [],
    },
    tags: ["analysis", "business", "pricing"],
  },

  // ── CONTENT CREATION ─────────────────────────────────────────────────────
  {
    id: "CON-001",
    input: "Write a tweet about our product launch",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 40,
      notContains: [],
    },
    tags: ["content", "social", "twitter"],
  },
  {
    id: "CON-002",
    input: "Create a 30-day content calendar for a fitness brand targeting millennials on Instagram",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 100,
      notContains: [],
    },
    tags: ["content", "marketing", "social"],
  },
  {
    id: "CON-003",
    input: "Write product descriptions for 5 coffee blends: Ethiopian, Colombian, Guatemalan, Kenyan, and Brazilian",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 150,
      notContains: [],
    },
    tags: ["content", "ecommerce", "copywriting"],
  },
  {
    id: "CON-004",
    input: "Generate 10 YouTube video title ideas for my channel about personal finance for Gen Z",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 100,
      notContains: [],
    },
    tags: ["content", "youtube", "ideation"],
  },
  {
    id: "CON-005",
    input: "make a landing page copy for my app",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 40,
      notContains: [],
    },
    tags: ["content", "copywriting", "vague"],
  },

  // ── EDUCATION & EXPLANATION ───────────────────────────────────────────────
  {
    id: "EDU-001",
    input: "Explain machine learning to a non-technical CEO",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 80,
      notContains: [],
    },
    tags: ["education", "ml", "business"],
  },
  {
    id: "EDU-002",
    input: "explain blockchain",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 40,
      notContains: [],
    },
    tags: ["education", "blockchain", "vague"],
  },
  {
    id: "EDU-003",
    input: "Create a study guide for the SOLID principles with JavaScript examples for each",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 150,
      notContains: [],
    },
    tags: ["education", "code", "patterns"],
  },
  {
    id: "EDU-004",
    input: "Teach me about Stoicism with practical daily exercises",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 100,
      notContains: [],
    },
    tags: ["education", "philosophy"],
  },
  {
    id: "EDU-005",
    input: "Explain the difference between TCP and UDP with real-world examples",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 100,
      notContains: [],
    },
    tags: ["education", "networking", "technical"],
  },

  // ── LINKEDIN CONTENT ─────────────────────────────────────────────────────
  {
    id: "LI-001",
    input: "I'm thrilled to announce I'm starting a new role at Acme Corp as Staff Engineer! We are hiring.",
    category: "linkedin",
    expectation: {
      mustChange: true,
      minLength: 80,
      notContains: ["unable to process"],
    },
    tags: ["linkedin", "career", "announcement"],
  },
  {
    id: "LI-002",
    input: "After 5 years at my company, I've decided to take the leap and start my own startup. #entrepreneurship #startups",
    category: "linkedin",
    expectation: {
      mustChange: true,
      minLength: 80,
      notContains: [],
    },
    tags: ["linkedin", "entrepreneurship"],
  },
  {
    id: "LI-003",
    input: "We are hiring! Looking for senior engineers, product managers, and data scientists. Great culture. DM me.",
    category: "linkedin",
    expectation: {
      mustChange: true,
      minLength: 80,
      notContains: [],
    },
    tags: ["linkedin", "recruiting"],
  },

  // ── URL / WEB PAGE INPUTS ─────────────────────────────────────────────────
  {
    id: "URL-001",
    input: "https://github.com/google/gemini",
    category: "url",
    expectation: {
      mustChange: true,
      minLength: 20,
      notContains: [],
    },
    tags: ["url", "github"],
  },
  {
    id: "URL-002",
    input: "https://stripe.com/docs/api",
    category: "url",
    expectation: {
      mustChange: true,
      minLength: 20,
      notContains: [],
    },
    tags: ["url", "api-docs"],
  },
  {
    id: "URL-003",
    input: "https://en.wikipedia.org/wiki/Artificial_intelligence",
    category: "url",
    expectation: {
      mustChange: true,
      minLength: 20,
      notContains: [],
    },
    tags: ["url", "wikipedia"],
  },

  // ── CODE INPUTS (classifier: code) ───────────────────────────────────────
  {
    id: "CD-001",
    input: "function fetchUser(id) {\n  return fetch(`/api/users/${id}`)\n    .then(r => r.json())\n    .catch(err => console.error(err));\n}",
    category: "code",
    expectation: {
      mustChange: true,
      minLength: 50,
      notContains: [],
    },
    tags: ["code", "javascript", "api"],
  },
  {
    id: "CD-002",
    input: "const express = require('express');\nconst app = express();\napp.get('/', (req, res) => res.send('Hello'));\napp.listen(3000);",
    category: "code",
    expectation: {
      mustChange: true,
      minLength: 50,
      notContains: [],
    },
    tags: ["code", "node", "express"],
  },
  {
    id: "CD-003",
    input: "SELECT u.name, COUNT(o.id) as order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.id\nHAVING order_count > 10;",
    category: "code",
    expectation: {
      mustChange: true,
      minLength: 50,
      notContains: [],
    },
    tags: ["code", "sql"],
  },

  // ── EDGE CASES ───────────────────────────────────────────────────────────
  {
    id: "EDGE-001",
    input: "Fix this",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 10,
      notContains: [],
    },
    tags: ["edge", "too-short", "vague"],
  },
  {
    id: "EDGE-002",
    input: "a",
    category: "plainText",
    expectation: {
      mustChange: true,
      minLength: 1,
      notContains: [],
    },
    tags: ["edge", "single-char"],
  },
  {
    id: "EDGE-003",
    input: "Please help me write a comprehensive, detailed, step-by-step technical specification document for building a distributed real-time data processing pipeline that handles 10 million events per second using Apache Kafka, Apache Spark Streaming, Cassandra for storage, and includes monitoring, alerting, disaster recovery, and security sections.",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 200,
      notContains: [],
    },
    tags: ["edge", "long-input", "technical"],
  },
  {
    id: "EDGE-004",
    input: "translate this to spanish: hello world",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 10,
      notContains: ["unable to process", "error:"],
    },
    tags: ["edge", "translation"],
  },
  {
    id: "EDGE-005",
    input: "Make this better: The quick brown fox jumps over the lazy dog",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 20,
      notContains: [],
    },
    tags: ["edge", "improvement"],
  },

  // ── BUSINESS / STRATEGY ──────────────────────────────────────────────────
  {
    id: "BIZ-001",
    input: "Help me write a pitch deck for a fintech startup targeting unbanked populations in Southeast Asia",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 100,
      notContains: [],
    },
    tags: ["business", "pitchdeck", "startup"],
  },
  {
    id: "BIZ-002",
    input: "Create a 90-day onboarding plan for a new VP of Engineering",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 120,
      notContains: [],
    },
    tags: ["business", "hr", "leadership"],
  },
  {
    id: "BIZ-003",
    input: "Write OKRs for a product team focused on improving user retention",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 100,
      notContains: [],
    },
    tags: ["business", "okr", "product"],
  },
  {
    id: "BIZ-004",
    input: "Draft a vendor evaluation scorecard for cloud providers (AWS, GCP, Azure)",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 150,
      notContains: [],
    },
    tags: ["business", "procurement", "cloud"],
  },
  {
    id: "BIZ-005",
    input: "Write a go-to-market strategy for launching an AI-powered legal document review tool",
    category: "prompt",
    expectation: {
      mustChange: true,
      minLength: 150,
      notContains: [],
    },
    tags: ["business", "gtm", "legal-tech"],
  },

  // ── OUTPUT VALIDATION TESTS (isValidAIResponse) ───────────────────────────
  {
    id: "VAL-001",
    input: "Hello world",
    outputFixture: "",
    category: "validation",
    expectation: { responseValid: false, reason: "empty" },
    tags: ["validation", "empty-output"],
  },
  {
    id: "VAL-002",
    input: "Hello world",
    outputFixture: "Hello world",
    category: "validation",
    expectation: { responseValid: false, reason: "identical" },
    tags: ["validation", "identical-output"],
  },
  {
    id: "VAL-003",
    input: "Hello",
    outputFixture: "Unable to process right now. Please try again.",
    category: "validation",
    expectation: { responseValid: false, reason: "error-message" },
    tags: ["validation", "error-string"],
  },
  {
    id: "VAL-004",
    input: "Write me a poem",
    outputFixture: "Roses are red, violets are blue, this is a better prompt for you.",
    category: "validation",
    expectation: { responseValid: true },
    tags: ["validation", "good-output"],
  },
  {
    id: "VAL-005",
    input: "Translate to Spanish: Hello",
    outputFixture: "Error: Gemini call failed",
    category: "validation",
    expectation: { responseValid: false, reason: "error-prefix" },
    tags: ["validation", "error-prefix"],
  },
  {
    id: "VAL-006",
    input: "Make this better",
    outputFixture: "   ",
    category: "validation",
    expectation: { responseValid: false, reason: "whitespace-only" },
    tags: ["validation", "whitespace"],
  },
  {
    id: "VAL-007",
    input: "Fix this code",
    outputFixture: "API error: 503 Service Unavailable",
    category: "validation",
    expectation: { responseValid: false, reason: "api-error" },
    tags: ["validation", "api-error"],
  },
  {
    id: "VAL-008",
    input: "Write a function",
    outputFixture: "Write a function that takes a list of integers and returns the sorted version using merge sort algorithm, with proper type annotations and error handling for null inputs.",
    category: "validation",
    expectation: { responseValid: true },
    tags: ["validation", "good-code-output"],
  },

  // ── ARTIFACT VALIDATOR TESTS (validateArtifactOutput) ────────────────────
  {
    id: "AV-001",
    outputFixture: null,
    category: "artifactValidation",
    expectation: { outputValid: false, reason: "null" },
    tags: ["artifact-validation", "null"],
  },
  {
    id: "AV-002",
    outputFixture: {},
    category: "artifactValidation",
    expectation: { outputValid: false, reason: "missing-prompt" },
    tags: ["artifact-validation", "missing-field"],
  },
  {
    id: "AV-003",
    outputFixture: { prompt: "", artifactType: "url", title: "Test", detail: "x", _artifactContext: { type: "url", title: "Test", detail: "x" } },
    category: "artifactValidation",
    expectation: { outputValid: false, reason: "empty-prompt" },
    tags: ["artifact-validation", "empty-prompt"],
  },
  {
    id: "AV-004",
    outputFixture: { prompt: "Short", artifactType: "url", title: "Test", detail: "x", _artifactContext: { type: "url", title: "Test", detail: "x" } },
    category: "artifactValidation",
    expectation: { outputValid: false, reason: "prompt-too-short" },
    tags: ["artifact-validation", "short-prompt"],
  },
  {
    id: "AV-005",
    outputFixture: {
      prompt: "Build a clone of the GitHub trending page showing top repositories by language and star count, with dark mode support.",
      artifactType: "url",
      title: "GitHub Trending",
      detail: "URL",
      _artifactContext: { type: "url", title: "GitHub Trending", detail: "URL" }
    },
    category: "artifactValidation",
    expectation: { outputValid: true },
    tags: ["artifact-validation", "valid"],
  },
  {
    id: "AV-006",
    outputFixture: {
      prompt: "Recreate this CSV as a dynamic D3.js bar chart with hover tooltips and animated transitions.",
      artifactType: "csv",
      title: "sales_data.csv",
      detail: "CSV • 200 rows • 5 columns",
      _artifactContext: { type: "csv", title: "sales_data.csv", detail: "CSV • 200 rows • 5 columns" }
    },
    category: "artifactValidation",
    expectation: { outputValid: true },
    tags: ["artifact-validation", "valid", "csv"],
  },
  {
    id: "AV-007",
    outputFixture: {
      prompt: "Extract key action items and deadlines from this project brief document.",
      artifactType: "docx",
      title: "project_brief.docx",
      detail: "DOCX • 1200 words",
      _artifactContext: null
    },
    category: "artifactValidation",
    expectation: { outputValid: false, reason: "missing-context" },
    tags: ["artifact-validation", "missing-context"],
  },
  {
    id: "AV-008",
    outputFixture: {
      prompt: "Turn this YouTube lecture on Kubernetes internals into a structured study guide with diagrams.",
      artifactType: "youtube",
      title: "Kubernetes Internals",
      detail: "YouTube Video by TechWithTim",
      _artifactContext: { type: "youtube", title: "Kubernetes Internals", detail: "YouTube Video by TechWithTim" }
    },
    category: "artifactValidation",
    expectation: { outputValid: true },
    tags: ["artifact-validation", "valid", "youtube"],
  },

  // ── CLASSIFIER TESTS (classifyClipboardContent) ────────────────────────
  {
    id: "CLS-001",
    input: "https://github.com/google/gemini",
    category: "url",
    expectation: { classifiedAs: "url", minConfidence: 0.95 },
    tags: ["classifier", "url"],
  },
  {
    id: "CLS-002",
    input: "user@example.com",
    category: "email",
    expectation: { classifiedAs: "email", minConfidence: 0.9 },
    tags: ["classifier", "email"],
  },
  {
    id: "CLS-003",
    input: "I'm thrilled to announce I'm starting a new role at Acme Corp as Staff Engineer! We are hiring.",
    category: "linkedin",
    expectation: { classifiedAs: "linkedin", minConfidence: 0.8 },
    tags: ["classifier", "linkedin"],
  },
  {
    id: "CLS-004",
    input: "function add(a, b) {\n  return a + b;\n}\nconst result = add(2, 3);\nconsole.log(result);",
    category: "code",
    expectation: { classifiedAs: "code", minConfidence: 0.8 },
    tags: ["classifier", "code"],
  },
  {
    id: "CLS-005",
    input: "Write a Python function to calculate compound interest given principal, rate, and time period.",
    category: "prompt",
    expectation: { classifiedAs: "prompt", minConfidence: 0.8 },
    tags: ["classifier", "prompt"],
  },
  {
    id: "CLS-006",
    input: "RT @elonmusk: This is the way 🚀 #space #twitter",
    category: "twitter",
    expectation: { classifiedAs: "twitter", minConfidence: 0.8 },
    tags: ["classifier", "twitter"],
  },
  {
    id: "CLS-007",
    input: "just a short sentence without special patterns",
    category: "plainText",
    expectation: { classifiedAs: "plainText", minConfidence: 1.0 },
    tags: ["classifier", "plainText"],
  },
  {
    id: "CLS-008",
    input: "",
    category: "plainText",
    expectation: { classifiedAs: "plainText", minConfidence: 1.0 },
    tags: ["classifier", "empty"],
  },
  {
    id: "CLS-009",
    input: "https://youtu.be/dQw4w9WgXcQ",
    category: "url",
    expectation: { classifiedAs: "url", minConfidence: 0.9 },
    tags: ["classifier", "url", "youtube"],
  },
  {
    id: "CLS-010",
    input: "SELECT * FROM users WHERE active = 1 ORDER BY created_at DESC LIMIT 10;",
    category: "code",
    expectation: { classifiedAs: "code", minConfidence: 0 }, // SQL may not score above threshold — plainText fallback acceptable
    tags: ["classifier", "sql", "edge"],
  },

  // ── PROMPT QUALITY TESTS (validatePromptQuality) ─────────────────────────
  {
    id: "PQ-001",
    input: "Analyze this artifact",
    category: "promptQuality",
    expectation: { qualityValid: false, reason: "generic-reference" },
    tags: ["prompt-quality", "generic"],
  },
  {
    id: "PQ-002",
    input: "Visit this URL and summarize it",
    category: "promptQuality",
    expectation: { qualityValid: false, reason: "generic-reference" },
    tags: ["prompt-quality", "generic"],
  },
  {
    id: "PQ-003",
    input: "Look at this image and tell me what you see",
    category: "promptQuality",
    expectation: { qualityValid: false, reason: "generic-reference" },
    tags: ["prompt-quality", "generic"],
  },
  {
    id: "PQ-004",
    input: "Based on the provided content, analyze the market trends",
    category: "promptQuality",
    expectation: { qualityValid: false, reason: "generic-reference" },
    tags: ["prompt-quality", "generic"],
  },
  {
    id: "PQ-005",
    input: "Build a dark-mode React dashboard with a revenue chart, user growth graph, and a top-10 customer table. Use Recharts for visualization and Tailwind CSS for styling. The chart should have monthly data from Jan–Dec 2024.",
    category: "promptQuality",
    expectation: { qualityValid: true },
    tags: ["prompt-quality", "valid", "specific"],
  },
  {
    id: "PQ-006",
    input: "OK",
    category: "promptQuality",
    expectation: { qualityValid: false, reason: "too-short" },
    tags: ["prompt-quality", "too-short"],
  },
  {
    id: "PQ-007",
    input: "Recreate the Spotify 'Now Playing' widget with album art, song title, artist, progress bar, and playback controls using CSS and Vanilla JS.",
    category: "promptQuality",
    expectation: { qualityValid: true },
    tags: ["prompt-quality", "valid", "ui"],
  },
  {
    id: "PQ-008",
    input: "Read through this document and extract the key points",
    category: "promptQuality",
    expectation: { qualityValid: false, reason: "generic-reference" },
    tags: ["prompt-quality", "generic"],
  },
  {
    id: "PQ-009",
    input: "As shown in the screenshot above, implement the same layout",
    category: "promptQuality",
    expectation: { qualityValid: false, reason: "generic-reference" },
    tags: ["prompt-quality", "generic"],
  },
  {
    id: "PQ-010",
    input: "Write a Python script that reads sales_q1_2024.csv, groups by region column, calculates mean revenue, and outputs a sorted bar chart using matplotlib.",
    category: "promptQuality",
    expectation: { qualityValid: true },
    tags: ["prompt-quality", "valid", "data"],
  },
];

/**
 * Helper: filter golden dataset by tag.
 * @param {string} tag
 * @returns {Array}
 */
export function filterByTag(tag) {
  return goldenDataset.filter(entry => entry.tags.includes(tag));
}

/**
 * Helper: filter golden dataset by category.
 * @param {string} category
 * @returns {Array}
 */
export function filterByCategory(category) {
  return goldenDataset.filter(entry => entry.category === category);
}

/**
 * Helper: get all unique tags in the dataset.
 * @returns {string[]}
 */
export function getAllTags() {
  return [...new Set(goldenDataset.flatMap(e => e.tags))].sort();
}
