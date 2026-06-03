#!/usr/bin/env node

/**
 * Script to list available Gemini models
 * Usage: node scripts/list-models.js <API_KEY>
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.argv[2];

if (!apiKey) {
  console.error("Usage: node scripts/list-models.js <API_KEY>");
  process.exit(1);
}

const client = new GoogleGenerativeAI(apiKey);

console.log("[list-models] Fetching available models...\n");

try {
  const models = await client.getGenerativeModel({ model: "models/list" });
  // Actually, the SDK doesn't expose listModels directly, so let's try an alternative approach
  
  // Try common model names
  const commonModels = [
    "gemini-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.0-pro",
    "gemini-pro-vision"
  ];
  
  console.log("[list-models] Testing common model names:\n");
  
  for (const modelName of commonModels) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("test");
      console.log(`✓ ${modelName} - SUCCESS`);
    } catch (e) {
      const error = e?.message || String(e);
      if (error.includes("404")) {
        console.log(`✗ ${modelName} - Not Found (404)`);
      } else if (error.includes("429")) {
        console.log(`⚠ ${modelName} - Quota Exceeded (429)`);
      } else if (error.includes("403")) {
        console.log(`✗ ${modelName} - Forbidden (403)`);
      } else {
        console.log(`✗ ${modelName} - ${error.split("[")[0].trim()}`);
      }
    }
  }
} catch (e) {
  console.error("[list-models] Error:", e?.message || e);
}
