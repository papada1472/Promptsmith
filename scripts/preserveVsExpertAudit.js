/**
 * Preserve vs Expert Quality Audit
 *
 * Runs 20 test cases through both Preserve and Expert modes via the real
 * Gemini API, logs comparisons, scores outputs, and produces a report.
 *
 * Usage:
 *   set GEMINI_API_KEY=your_key_here && node scripts/preserveVsExpertAudit.js
 */

import { GoogleGenAI } from "@google/genai";
import { buildEnvelope } from "../src/main/output/compiler.js";
import { optimizeEnvelope } from "../src/main/output/optimizer.js";
import { buildExecutionPlan } from "../src/main/output/promptEngineer.js";
import fs from "fs";
import path from "path";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("ERROR: Set GEMINI_API_KEY environment variable");
  process.exit(1);
}

const MODEL = "gemini-2.5-flash";
const OUTPUT_DIR = path.resolve("scripts/audit_results");

// ── Test Cases ────────────────────────────────────────────────────────────

const SHORT_CASES = [
  "Midjourney prompt for a cyberpunk panda delivery rider",
  "Write an email requesting leave for tomorrow",
  "GTM strategy for wealth management startup",
  "LinkedIn post about AI replacing repetitive work",
  "Explain quantum computing to a 10-year-old",
  "Product requirements for a fitness tracking app",
  "Startup idea for AI-powered hiring platform",
  "Improve this sales outreach message",
  "Create a PRD for a note-taking application",
  "Refactor this JavaScript function for readability",
];

const MEDIUM_CASES = [
  `Hi [Name],

I hope this email finds you well. I'm writing to follow up on our conversation last week about the analytics dashboard project. We discussed implementing real-time data visualization, and I wanted to share some initial thoughts.

I believe we should prioritize the user engagement metrics first, then layer in revenue tracking. Our team can have a prototype ready in two weeks if we get the green light by Friday.

Let me know if you'd like to schedule a quick call to discuss further.

Best,
Alex`,

  `We have a bug in the payment processing system where users occasionally get charged twice for the same transaction. It seems to happen when there's a network timeout during the confirmation step. The payment goes through on Stripe's end, but our system doesn't receive the webhook confirmation, so it retries. We need to implement idempotency keys and add better webhook retry logic. This is affecting roughly 2% of transactions and is our highest priority ticket right now.`,

  `I've been using your product for the past three months and overall I'm happy with it. However, there are a few things that could be better. The export feature only supports CSV but we really need Excel export for our weekly reports. Also, the search functionality is quite slow when we have more than 10,000 records. Sometimes it takes 30 seconds to return results. The mobile app crashes frequently on Android. I'd love to see these improvements in the next release. Thanks for listening.`,

  `Project Update - Q3 Planning

Completed this sprint: User authentication flow, database schema migration, and API endpoint documentation. Blocked: Third-party integration waiting on their API access. Risks: Team member on leave next week might delay the reporting module. Next sprint priorities: Complete the reporting dashboard, start working on notification system, and begin QA for the auth flow. Need design team to finalize mockups for the settings page by Wednesday.`,

  `Weekly Team Meeting - June 10

Attendees: Product, Engineering, Design, Marketing

Agenda:
1. Product demo - new onboarding flow (15 min)
2. Engineering update - API performance improvements (10 min)
3. Design review - updated dashboard mockups (15 min)
4. Marketing - launch campaign timeline (10 min)
5. Open discussion - any blockers or concerns (15 min)

Please come prepared with your updates. Marketing will present the Q3 campaign strategy. Engineering will share the latest latency metrics after the database optimization.`,
];

const LONG_CASES = [
  `Why AI Won't Replace Developers (But Will Change Everything)

I've been thinking a lot about the discourse around AI replacing software engineers. Having worked in tech for over a decade, I've seen multiple "this changes everything" moments - from cloud computing to microservices to containers. Each time, the doomsayers predicted the end of traditional development work. Each time, they were wrong.

Here's what actually happens: the tools get better, the bar gets higher, and the work gets more interesting. When AWS launched, people said infrastructure engineers would disappear. Instead, DevOps was born and infrastructure became more strategic. When React came out, people said backend developers couldn't keep up. Instead, full-stack development became the norm.

AI is the same story. It's not going to replace developers - it's going to make us more powerful. The engineers who thrive will be the ones who learn to leverage AI as their force multiplier. They'll write better code faster, catch bugs earlier, and spend less time on boilerplate.

The real opportunity isn't in fighting AI or fearing it. It's in figuring out how to use it to amplify your skills. The best developers in 2026 won't be the ones who can type the fastest or remember the most syntax. They'll be the ones who can ask the right questions and guide AI tools effectively.

So stop worrying about being replaced and start learning how to build with AI. Your future self will thank you.`,

  `Product Requirements Document - Note-Taking Application

1. Executive Summary
We are building a cross-platform note-taking application focused on developers and power users. The core differentiator is markdown-native editing with real-time collaboration, code snippet execution, and AI-powered organization.

2. Target Users
Primary: Software developers who need a note-taking tool that supports code blocks, syntax highlighting, and technical documentation.
Secondary: Students and researchers who need organization features and collaboration.

3. Key Features
- Markdown editor with live preview and syntax highlighting for 50+ languages
- Folder-based organization with tags and full-text search
- Real-time collaboration with cursor presence awareness
- Code snippet execution environment (sandboxed)
- AI auto-tagging and smart search
- Export to PDF, HTML, and Markdown
- Cross-platform (Web, Mac, Windows, Linux, iOS, Android)

4. Technical Requirements
- Offline-first architecture with sync when online
- End-to-end encryption for private notes
- CRDT-based conflict resolution for collaboration
- Sub-second search across 10,000+ notes
- Plugin system for extensibility

5. Success Metrics
- 100,000 active users in first 6 months
- 4.5+ star rating on app stores
- < 100ms search latency
- 99.9% uptime for sync service

6. Timeline
Phase 1 (Months 1-3): Core editor, offline mode, basic sync
Phase 2 (Months 4-6): Collaboration, code execution, AI features
Phase 3 (Months 7-9): Mobile apps, plugins, enterprise features`,

  `Startup Pitch: AI-Powered Hiring Platform

Problem: The hiring process is broken. Companies spend an average of 42 days to fill a position, reviewing hundreds of resumes manually. Recruiters spend 70% of their time screening candidates, not interviewing them. Meanwhile, 85% of qualified candidates are overlooked because their resume didn't include the right keywords.

Solution: An AI-powered hiring platform that automatically screens, ranks, and matches candidates to roles using contextual understanding rather than keyword matching. Our NLP engine reads resumes the way a human would - understanding experience, skills, and potential rather than just matching words.

How it works:
1. Companies post roles and our AI analyzes the actual requirements
2. Candidates submit their resume once and our system builds a comprehensive skill profile
3. The matching engine considers experience level, skill depth, culture fit indicators, and growth potential
4. Recruiters get a ranked shortlist with AI-generated candidate summaries and interview question suggestions

Traction: We've onboarded 50 companies in beta, processed 10,000+ resumes, and reduced time-to-hire by 60%. Our NPS score is 72.

Team: Two ex-FAANG engineers and a former HR tech executive. We previously built the recruitment system used by a top-5 tech company.

Ask: Raising $2M seed round to expand our engineering team and build out the enterprise features needed for our pipeline of 200+ interested companies.`,

  `Strategic Plan: Go-to-Market Strategy for Wealth Management Startup

Market Overview:
The wealth management software market is $15B and growing at 12% CAGR. Current incumbents (Addepar, SEI, Envestnet) are legacy platforms built 15+ years ago. Modern RIAs and wealth managers are frustrated with outdated UX, limited mobile capabilities, and slow innovation.

Our Differentiation:
- Modern, API-first architecture
- AI-powered portfolio optimization and rebalancing
- Client-facing mobile app with real-time reporting
- Fractional cost compared to incumbents
- Integration with 100+ brokerages and custodians via unified API

Target Segments (Year 1):
1. Independent RIAs with $100M-$1B AUM (TAM: 3,000 firms)
2. Multi-family offices with $500M-$5B AUM (TAM: 500 firms)
3. Boutique wealth managers at large institutions (TAM: 200 firms)

Go-to-Market Channels:
- Direct sales team (3 enterprise AEs focused on Segments 1 and 2)
- Partnerships with custody providers (Schwab, Fidelity, Pershing)
- Content marketing: whitepapers, webinars, industry conferences
- Free tier for solo advisors under $100M AUM (land and expand strategy)

Revenue Model:
- Base platform: $1,000/month per advisor
- AI-powered features: $500/month add-on
- AUM-based pricing for enterprise: 0.01% of AUM (capped at $5K/month)
- Implementation fee: $5,000 one-time

Key Milestones:
- Q1: Beta launch with 20 design partners
- Q2: Full launch, target 50 paid customers
- Q3: Partnership with first major custodian
- Q4: Reach $500K ARR, raise Series A`,

  `Customer Support Case: Urgent Payment Issue

Customer: Sarah Johnson
Account: Premium Business Plan (since 2019)
Priority: Critical
Ticket ID: SUP-44231

Description: Customer reports that her team has been unable to process payments for the past 6 hours. The payment gateway shows "processing" but transactions never complete. Approximately 47 orders worth $12,500 are stuck in limbo. Customers are complaining on social media, and Sarah estimates she's losing $2,000/hour in revenue.

What we've found so far:
- Payment gateway (Stripe) shows no errors on their end
- Our webhook endpoint hasn't received callbacks in 8 hours
- Database connection pool was maxed out due to a recent code deployment
- Fixed the connection pool issue but payments still stuck
- Manual payment retry also fails with generic "service unavailable" error
- Logs show a deadlock in the transaction processing queue
- Current workaround: Process payments manually via Stripe dashboard (team of 3 working on this)

Customer's emotional state: Frustrated and anxious. This is her busiest season and she's worried about long-term reputation damage. She's been a loyal customer for 5 years and mentioned she's "reconsidering" our platform.

Required action: Need immediate fix to unblock payments, then root cause analysis and plan to prevent recurrence. Customer needs a public status update and clear timeline. Should escalate to engineering lead and provide customer with SLA for resolution.

Additional context: This is our third payment-related incident this quarter. Previous incidents were resolved within 2 hours. This one is taking much longer because the deadlock issue is complex and our senior engineer is on leave.`,
];

const TEST_CASES = [
  ...SHORT_CASES.map((c) => ({ text: c, length: "short", index: SHORT_CASES.indexOf(c) + 1 })),
  ...MEDIUM_CASES.map((c) => ({ text: c, length: "medium", index: MEDIUM_CASES.indexOf(c) + 1 })),
  ...LONG_CASES.map((c) => ({ text: c, length: "long", index: LONG_CASES.indexOf(c) + 1 })),
];

// ── Helpers ───────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run a single test case through the pipeline + AI.
 */
async function runTestCase(client, testCase) {
  const { text, length, index } = testCase;
  const inputLength = text.length;

  // Pipeline: buildEnvelope → optimizeEnvelope → buildExecutionPlan
  const { envelope } = buildEnvelope({ input: text });
  const optimized = optimizeEnvelope(envelope);

  const result = {
    id: `${length}_${index}`,
    length,
    inputLength,
    input: text,
    preserve: { output: null, systemPrompt: null, outputLength: null, error: null },
    expert: { output: null, systemPrompt: null, outputLength: null, error: null },
  };

  // Run both modes
  for (const mode of ["preserve", "expert"]) {
    const { systemPrompt, userPrompt } = buildExecutionPlan(optimized, mode);
    result[mode].systemPrompt = systemPrompt;

    try {
      const response = await client.models.generateContent({
        model: MODEL,
        contents: `${systemPrompt}\n\nInstruction:\n${userPrompt}`,
      });
      const outputText = response?.text || "";
      result[mode].output = outputText;
      result[mode].outputLength = outputText.length;
    } catch (e) {
      result[mode].error = e?.message || String(e);
      result[mode].output = null;
      result[mode].outputLength = null;
    }
  }

  // Log comparison
  console.log(`\n[Comparison]`);
  console.log(`Input Length: ${result.inputLength}`);
  console.log(`Preserve Length: ${result.preserve.outputLength ?? "ERROR"}`);
  console.log(`Expert Length: ${result.expert.outputLength ?? "ERROR"}`);

  return result;
}

// ── Scoring ──────────────────────────────────────────────────────────────

function scoreOutput(text) {
  if (!text) return { clarity: 0, specificity: 0, structure: 0, actionability: 0 };

  let clarity = 3; // baseline
  let specificity = 3;
  let structure = 3;
  let actionability = 3;

  // Clarity signals
  if (text.length > 50) clarity += 0.5;
  if (!text.includes("...") && text.length > 30) clarity += 0.5;
  if (text.split(".").length > 3) clarity += 0.5; // multiple sentences
  if (text.split("\n").length > 2) clarity += 0.5; // paragraph breaks

  // Specificity signals
  const specifics = (text.match(/\d+/g) || []).length;
  if (specifics >= 3) specificity += 1;
  else if (specifics >= 1) specificity += 0.5;
  if (/example|specifically|for instance|such as/i.test(text)) specificity += 0.5;
  if (/should|could|would|must|will/i.test(text)) specificity += 0.5;

  // Structure signals
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length >= 5) structure += 1;
  else if (lines.length >= 3) structure += 0.5;
  if (/^[-*]|\d+[.)]/m.test(text)) structure += 1; // bullet points
  if (/^#{1,3}\s|^[A-Z][^a-z]*\n[-=]+$/m.test(text)) structure += 1; // headers
  if (text.includes("|") && text.includes("-")) structure += 0.5; // tables

  // Actionability signals
  if (/^you (can|should|could|need to|must)/im.test(text)) actionability += 0.5;
  if (/steps?|how to|guide|template|framework|checklist/i.test(text)) actionability += 1;
  if (/first|second|next|then|finally|step \d/i.test(text)) actionability += 1;
  if (/recommend|suggest|propose|best practice/i.test(text)) actionability += 0.5;

  // Clamp to 1-5
  const clamp = (v) => Math.max(1, Math.min(5, Math.round(v)));
  return {
    clarity: clamp(clarity),
    specificity: clamp(specificity),
    structure: clamp(structure),
    actionability: clamp(actionability),
  };
}

function scoreComparison(preserveScores, expertScores) {
  const metrics = ["clarity", "specificity", "structure", "actionability"];
  let expertWins = 0;
  let preserveWins = 0;
  let ties = 0;

  for (const metric of metrics) {
    if (expertScores[metric] > preserveScores[metric]) expertWins++;
    else if (preserveScores[metric] > expertScores[metric]) preserveWins++;
    else ties++;
  }

  return { expertWins, preserveWins, ties, metrics };
}

// ── Report Generation ────────────────────────────────────────────────────

function generateReport(results) {
  const lines = [];
  lines.push("# Preserve vs Expert Quality Audit Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total Test Cases: ${results.length}`);
  lines.push(`Model: ${MODEL}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");

  let expertClearWins = 0;
  let preserveSufficient = 0;
  let nearlyIdentical = 0;

  for (const r of results) {
    const preserveScores = scoreOutput(r.preserve.output);
    const expertScores = scoreOutput(r.expert.output);
    const comp = scoreComparison(preserveScores, expertScores);
    r.scores = { preserve: preserveScores, expert: expertScores, comparison: comp };

    if (comp.expertWins >= 3) {
      expertClearWins++;
    } else if (comp.preserveWins >= 3) {
      preserveSufficient++;
    } else {
      nearlyIdentical++;
    }
  }

  const winRate = ((expertClearWins / results.length) * 100).toFixed(1);
  lines.push(`Expert Clear Wins: ${expertClearWins}/${results.length} (${winRate}%)`);
  lines.push(`Preserve Sufficient: ${preserveSufficient}/${results.length}`);
  lines.push(`Nearly Identical: ${nearlyIdentical}/${results.length}`);
  lines.push("");
  lines.push(`**Threshold: 70% (${Math.ceil(results.length * 0.7)}/${results.length})**`);
  lines.push(`**Expert meets threshold: ${expertClearWins >= Math.ceil(results.length * 0.7) ? "YES ✅" : "NO ❌ - Redesign required"}**`);
  lines.push("");

  // By length breakdown
  lines.push("## Breakdown by Input Length");
  lines.push("");
  for (const len of ["short", "medium", "long"]) {
    const subset = results.filter((r) => r.length === len);
    const wins = subset.filter((r) => r.scores.comparison.expertWins >= 3).length;
    lines.push(`### ${len.charAt(0).toUpperCase() + len.slice(1)} (${subset.length} cases)`);
    lines.push(`- Expert wins: ${wins}/${subset.length} (${((wins / subset.length) * 100).toFixed(1)}%)`);
    lines.push("");
  }

  // Where Expert wins clearly
  lines.push("## Where Expert Wins Clearly");
  lines.push("");
  const expertWins = results.filter((r) => r.scores.comparison.expertWins >= 3);
  if (expertWins.length === 0) {
    lines.push("No cases where Expert clearly wins.");
  } else {
    for (const r of expertWins) {
      const preserveScore = Object.values(r.scores.preserve).reduce((a, b) => a + b, 0);
      const expertScore = Object.values(r.scores.expert).reduce((a, b) => a + b, 0);
      lines.push(`**Case ${r.id}** (${r.length}, ${r.inputLength} chars)`);
      lines.push(`Input: "${r.input.substring(0, 80)}..."`);
      lines.push(`Preserve total score: ${preserveScore}/20 | Expert total score: ${expertScore}/20`);
      lines.push(`Clarity: P=${r.scores.preserve.clarity} E=${r.scores.expert.clarity} | Specificity: P=${r.scores.preserve.specificity} E=${r.scores.expert.specificity} | Structure: P=${r.scores.preserve.structure} E=${r.scores.expert.structure} | Actionability: P=${r.scores.preserve.actionability} E=${r.scores.expert.actionability}`);
      lines.push("");
    }
  }

  // Where Preserve is sufficient
  lines.push("## Where Preserve Is Sufficient");
  lines.push("");
  const preserveWins = results.filter((r) => r.scores.comparison.preserveWins >= 3);
  if (preserveWins.length === 0) {
    lines.push("No cases where Preserve clearly wins over Expert.");
  } else {
    for (const r of preserveWins) {
      lines.push(`**Case ${r.id}** (${r.length}, ${r.inputLength} chars)`);
      lines.push(`Input: "${r.input.substring(0, 80)}..."`);
      lines.push(`Preserve: C=${r.scores.preserve.clarity} S=${r.scores.preserve.specificity} St=${r.scores.preserve.structure} A=${r.scores.preserve.actionability}`);
      lines.push(`Expert:    C=${r.scores.expert.clarity} S=${r.scores.expert.specificity} St=${r.scores.expert.structure} A=${r.scores.expert.actionability}`);
      lines.push("");
    }
  }

  // Where nearly identical
  lines.push("## Where Outputs Are Nearly Identical");
  lines.push("");
  const identical = results.filter((r) => r.scores.comparison.expertWins < 3 && r.scores.comparison.preserveWins < 3);
  if (identical.length === 0) {
    lines.push("No cases with nearly identical outputs.");
  } else {
    for (const r of identical) {
      lines.push(`**Case ${r.id}** (${r.length}, ${r.inputLength} chars)`);
      lines.push(`Input: "${r.input.substring(0, 80)}..."`);
      lines.push(`Preserve: ${JSON.stringify(r.scores.preserve)}`);
      lines.push(`Expert:    ${JSON.stringify(r.scores.expert)}`);
      lines.push("");
    }
  }

  // Detailed results table
  lines.push("## Detailed Results");
  lines.push("");
  lines.push("| Case | Length | Input Len | P Len | E Len | P Score | E Score | Winner |");
  lines.push("|------|--------|-----------|-------|-------|---------|---------|--------|");
  for (const r of results) {
    const pTotal = Object.values(r.scores.preserve).reduce((a, b) => a + b, 0);
    const eTotal = Object.values(r.scores.expert).reduce((a, b) => a + b, 0);
    const winner = pTotal > eTotal ? "Preserve" : eTotal > pTotal ? "Expert" : "Tie";
    const pLen = r.preserve.outputLength ?? "ERR";
    const eLen = r.expert.outputLength ?? "ERR";
    lines.push(`| ${r.id} | ${r.length} | ${r.inputLength} | ${pLen} | ${eLen} | ${pTotal} | ${eTotal} | ${winner} |`);
  }

  lines.push("");
  lines.push("---");
  lines.push(`Report generated by Preserve vs Expert Quality Audit V1`);

  return lines.join("\n");
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("PRESERVE vs EXPERT QUALITY AUDIT");
  console.log("=".repeat(60));
  console.log(`Model: ${MODEL}`);
  console.log(`Test cases: ${TEST_CASES.length} (${SHORT_CASES.length} short, ${MEDIUM_CASES.length} medium, ${LONG_CASES.length} long)`);
  console.log("=".repeat(60));

  const client = new GoogleGenAI({ apiKey: API_KEY });
  const results = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    console.log(`\n--- Test ${i + 1}/${TEST_CASES.length} (${testCase.length}) ---`);
    console.log(`Input: "${testCase.text.substring(0, 60)}..."`);

    const result = await runTestCase(client, testCase);
    results.push(result);

    // Rate limiting: brief pause between cases
    if (i < TEST_CASES.length - 1) await sleep(1000);
  }

  // Generate report
  console.log("\n" + "=".repeat(60));
  console.log("GENERATING REPORT");
  console.log("=".repeat(60));

  const report = generateReport(results);

  // Save results JSON
  const saveResults = results.map((r) => ({
    id: r.id,
    length: r.length,
    inputLength: r.inputLength,
    input: r.input,
    preserve: { output: r.preserve.output, outputLength: r.preserve.outputLength, error: r.preserve.error },
    expert: { output: r.expert.output, outputLength: r.expert.outputLength, error: r.expert.error },
    scores: r.scores,
  }));

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  fs.writeFileSync(path.join(OUTPUT_DIR, "results.json"), JSON.stringify(saveResults, null, 2), "utf-8");
  fs.writeFileSync(path.join(OUTPUT_DIR, "report.md"), report, "utf-8");

  console.log("\nSaved to scripts/audit_results/");
  console.log("- results.json (structured data)");
  console.log("- report.md (human-readable report)");

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  const wins = results.filter((r) => {
    const p = Object.values(r.scores.preserve).reduce((a, b) => a + b, 0);
    const e = Object.values(r.scores.expert).reduce((a, b) => a + b, 0);
    return e > p && r.scores.comparison.expertWins >= 3;
  }).length;

  const rate = ((wins / results.length) * 100).toFixed(1);
  console.log(`Expert clear wins: ${wins}/${results.length} (${rate}%)`);
  console.log(`Threshold: 70%`);
  console.log(`Result: ${wins >= Math.ceil(results.length * 0.7) ? "PASS ✅" : "FAIL ❌ - Redesign needed"}`);
  console.log("=".repeat(60));
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});