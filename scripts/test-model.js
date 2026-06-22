#!/usr/bin/env node

/**
 * Diagnostic script to test which Gemini models are available
 * and work with the configured API key.
 * 
 * Usage: node scripts/test-model.js
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

const MODELS_TO_TEST = [
  "gemini-3.5-flash",
  "gemini-2.5-flash", 
  "gemini-2.0-flash",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-flash-latest"
];

const TEST_PROMPT = "Say hello in one word.";

/**
 * Generate the same encryption key as GeminiProvider
 * (derived from the app's user data path)
 */
function getEncryptionKey() {
  try {
    const userDataPath = path.join(os.homedir(), "AppData", "Roaming", "Refinzi");
    const key = crypto.createHash("sha256").update(userDataPath).digest("hex");
    console.log("[test-model] Encryption key generated from:", userDataPath);
    return key;
  } catch (e) {
    console.error("[test-model] Failed to generate encryption key:", e?.message || e);
    return undefined;
  }
}

/**
 * Get the API key from command-line argument or environment variable
 */
function getApiKey() {
  // Check command-line argument: node test-model.js <API_KEY>
  if (process.argv.length > 2) {
    const apiKey = process.argv[2];
    if (apiKey && apiKey.startsWith("AQ.")) {
      console.log("[test-model] API key provided via command-line argument (length:", apiKey.length, ")");
      return apiKey;
    }
  }
  
  // Check environment variable
  if (process.env.GEMINI_API_KEY) {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("[test-model] API key loaded from GEMINI_API_KEY environment variable (length:", apiKey.length, ")");
    return apiKey;
  }
  
  return null;
}

/**
 * Test a single model
 */
async function testModel(client, modelName) {
  try {
    console.log(`\n[test-model] Testing model: ${modelName}`);
    
    const model = client.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(TEST_PROMPT);
    const text = result?.response?.text?.();
    
    if (text && text.trim()) {
      console.log(`[test-model] ✓ SUCCESS - ${modelName}`);
      console.log(`[test-model]   Response: "${text.trim()}"`);
      return true;
    } else {
      console.log(`[test-model] ✗ FAILED - ${modelName} (empty response)`);
      return false;
    }
  } catch (e) {
    const errorMsg = e?.message || String(e);
    console.log(`[test-model] ✗ FAILED - ${modelName}`);
    console.log(`[test-model]   Error: ${errorMsg}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log("[test-model] Refinzi Gemini Model Diagnostic");
  console.log("[test-model] =====================================\n");
  
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error("[test-model] Could not find Gemini API key.");
    console.error("[test-model] Usage: node scripts/test-model.js <API_KEY>");
    console.error("[test-model]   OR: GEMINI_API_KEY=<API_KEY> node scripts/test-model.js");
    console.error("[test-model] ");
    console.error("[test-model] Alternatively, run the Refinzi app, save your API key in Settings,");
    console.error("[test-model] then add a helper in src/main/main.js to expose it.");
    process.exit(1);
  }
  
  console.log("[test-model] API key loaded (length:", apiKey.length, ")\n");
  
  const client = new GoogleGenerativeAI(apiKey);
  
  let firstWorking = null;
  
  for (const model of MODELS_TO_TEST) {
    const success = await testModel(client, model);
    if (success && !firstWorking) {
      firstWorking = model;
    }
  }
  
  console.log("\n[test-model] =====================================");
  if (firstWorking) {
    console.log(`[test-model] ✓ First working model: ${firstWorking}`);
    console.log(`[test-model] Update src/main/ai/GeminiProvider.js:`);
    console.log(`[test-model]   this.modelName = "${firstWorking}";`);
  } else {
    console.log("[test-model] ✗ No working models found.");
    console.log("[test-model] Check your API key or account permissions.");
  }
  console.log("[test-model] =====================================\n");
  
  process.exit(firstWorking ? 0 : 1);
}

main().catch((e) => {
  console.error("[test-model] Unexpected error:", e?.message || e);
  process.exit(1);
});
