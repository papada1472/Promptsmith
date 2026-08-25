// Prompt dataset — real prompts used in golden dataset tests.
// Each entry: { id, input, mode }
// mode: "click" = sparkle/improve, "hold" = recreation

export const prompts = [
  // ── Click (Improve) prompts ───────────────────────────────────────────────
  { id: "P001", input: "Translate this to Hindi", mode: "click" },
  { id: "P002", input: "Write a LinkedIn post", mode: "click" },
  { id: "P003", input: "Summarize this document", mode: "click" },
  { id: "P004", input: "Create a GTM strategy", mode: "click" },
  { id: "P005", input: "Generate SQL query", mode: "click" },
  { id: "P006", input: "Write email to recruiter", mode: "click" },
  { id: "P007", input: "make this shorter", mode: "click" },
  { id: "P008", input: "fix grammar", mode: "click" },
  { id: "P009", input: "write a product description for my app", mode: "click" },
  { id: "P010", input: "explain machine learning to a child", mode: "click" },
  { id: "P011", input: "create an interview question list", mode: "click" },
  { id: "P012", input: "help me negotiate salary", mode: "click" },
  { id: "P013", input: "write a cold outreach message", mode: "click" },
  { id: "P014", input: "proofread this paragraph", mode: "click" },
  { id: "P015", input: "suggest a name for my startup", mode: "click" },
  // ── Hold (Recreation) prompts ─────────────────────────────────────────────
  { id: "P016", input: "I need a landing page for my SaaS product", mode: "hold" },
  { id: "P017", input: "Build me a dashboard component with dark mode", mode: "hold" },
  { id: "P018", input: "Create a React form with validation", mode: "hold" },
  { id: "P019", input: "Design a pricing table with 3 tiers", mode: "hold" },
  { id: "P020", input: "Make a hero section with CTA button", mode: "hold" },
];
