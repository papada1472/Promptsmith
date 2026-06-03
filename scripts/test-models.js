#!/usr/bin/env node

/**
 * Diagnostic script to test which Gemini models work with the configured API key.
 * 
 * Usage: node scripts/test-models.js <API_KEY>
 *   OR: npm run test-models -- <API_KEY>
 *   OR: GEMINI_API_KEY=<API_KEY> node scripts/test-models.js
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODELS_TO_TEST = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
  "gemini-2.5-flash"
];

const TEST_PROMPT = "Reply with OK";

/**
 * Get API key from command-line argument or environment variable
 */
function getApiKey() {
  // Check command-line argument
  if (process.argv.length > 2) {
    const apiKey = process.argv[2];
    if (apiKey && apiKey.trim()) {
      return apiKey;
    }
  }
  
  // Check environment variable
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  
  return null;
}

/**
 * Test a single model
 */
async function testModel(client, modelName) {
  try {
    const model = client.getGenerativeModel({ model: modelName });
    await model.generateContent(TEST_PROMPT);
    return { success: true, error: null };
  } catch (e) {
    const error = e?.message || String(e);
    return { success: false, error };
  }
}

/**
 * Main function
 */
async function main() {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error("Error: No API key provided.");
    console.error("Usage: node scripts/test-models.js <API_KEY>");
    console.error("   OR: GEMINI_API_KEY=<API_KEY> node scripts/test-models.js");
    process.exit(1);
  }
  
  const client = new GoogleGenerativeAI(apiKey);
  const results = [];
  
  console.log("Testing Gemini Models\n");
  console.log("=".repeat(50));
  
  for (const model of MODELS_TO_TEST) {
    const result = await testModel(client, model);
    results.push({ model, ...result });
    
    console.log(`Model: ${model}`);
    console.log(`Status: ${result.success ? "SUCCESS" : "FAILED"}`);
    if (!result.success) {
      console.log(`Error: ${result.error}`);
    }
    console.log();
  }
  
  console.log("=".repeat(50));
  
  const firstWorking = results.find(r => r.success);
  if (firstWorking) {
    console.log(`\nFirst Working Model: ${firstWorking.model}`);
  } else {
    console.log("\nFirst Working Model: None");
  }
  
  process.exit(firstWorking ? 0 : 1);
}

main().catch((e) => {
  console.error("Error:", e?.message || e);
  process.exit(1);
});
