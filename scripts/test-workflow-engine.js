
/**
 * Workflow Prediction Engine Validation Script (Standalone)
 * 
 * This script verifies the behavior of analyzeArtifact in isolation by mocking
 * its dependencies (store, ProviderManager).
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// --- MOCKS ---

const mockStore = {
  get: (key, defaultValue) => {
    const values = {
      activeProvider: 'gateway',
      activeModel: 'gateway-default',
      geminiApiKey: process.argv[2],
      openRouterApiKey: '',
    };
    return values[key] !== undefined ? values[key] : defaultValue;
  },
  set: () => {}
};

// We can't easily import artifactAnalyzer because it imports store.js which imports electron.
// Instead, we will read the file and evaluate it in a sandbox or simply 
// use a "test-shim" that provides the necessary exports.
// 
// Since we want to test the actual logic in the file, we'll use a trick:
// We'll rewrite the imports in the file temporarily or use a different strategy.
// 
// BETTER STRATEGY: Since we are validating a feature that is already implemented, 
// and we have the code, we can create a "TestableAnalyzer" that is just a copy
// of the logic but without the electron-store dependency.

async function runTest(testName, payload, expectedWorkflow, analyzer) {
  console.log(`
--- Test: ${testName} ---`);
  console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);
  
  try {
    const result = await analyzer(payload);
    
    console.log(`Predicted: ${result.workflowPrediction} (Conf: ${result.confidence})`);
    console.log(`Prompt: ${result.generatedPrompt}`);
    
    if (expectedWorkflow && result.workflowPrediction !== expectedWorkflow) {
      console.warn(`⚠️ Warning: Expected ${expectedWorkflow}, but got ${result.workflowPrediction}`);
    } else if (expectedWorkflow) {
      console.log(`✅ Success: Correctly predicted ${expectedWorkflow}`);
    }
    
    return result;
  } catch (e) {
    console.error(`❌ Error during test: ${e.message}`);
    if (e.stack) console.error(e.stack);
  }
}

async function main() {
  const apiKey = process.argv[2];
  if (!apiKey) {
    console.error("Error: No API key provided.");
    console.error("Usage: node scripts/test-workflow-engine.js <API_KEY>");
    process.exit(1);
  }

  // To test the actual logic, we will create a temporary file that is the analyzer 
  // but with the store import replaced by our mock.
  const analyzerPath = path.join(process.cwd(), 'src/main/artifactAnalyzer.js');
  const analyzerContent = fs.readFileSync(analyzerPath, 'utf8');
  
  // Replace the store import with a mock
  const patchedContent = analyzerContent
    .replace(/import { store } from ".\/store\.js";/g, 'const store = { get: (k, d) => { const v = { activeProvider: "gemini", activeModel: "gemini-2.5-flash", geminiApiKey: "' + apiKey + '", openRouterApiKey: "" }; return v[k] !== undefined ? v[k] : d; }, set: () => {} };')
    .replace(/import { ProviderManager } from ".\/ai\/ProviderManager\.js";/g, 'import { ProviderManager } from "../src/main/ai/ProviderManager.js";')
    .replace(/import { store } from ".\/store\.js";/g, ''); // safety cleanup

  const tmpAnalyzerPath = path.join(process.cwd(), 'scripts/tmp_analyzer.js');
  fs.writeFileSync(tmpAnalyzerPath, patchedContent);

  try {
    const { analyzeArtifact } = await import(pathToFileURL(tmpAnalyzerPath).href);
    
    console.log("Starting Workflow Prediction Engine Validation...\n");
    console.log("=".repeat(60));

    const testCases = [
      {
        name: "Competitor Website",
        payload: {
          type: "url",
          text: "https://advisorcopilot.io"
        },
        expected: "competitor_research"
      },
      {
        name: "YouTube Video",
        payload: {
          type: "youtube",
          text: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        },
        expected: "learning_notes"
      },
      {
        name: "Generic Text Snippet",
        payload: {
          type: "text",
          text: "I need to create a marketing strategy for a new AI-powered fitness app that targets Gen Z users in urban areas."
        },
        expected: "startup_strategy"
      },
      {
        name: "CSV Data Analysis",
        payload: {
          type: "csv",
          path: "test_data.csv" // We'll create this file
        },
        expected: "data_analysis"
      }
    ];

    // Create dummy CSV for testing
    fs.writeFileSync("test_data.csv", "Date,Sales,Region\n2023-01-01,100,North\n2023-01-02,150,South\n2023-01-03,120,East");

    for (const tc of testCases) {
      await runTest(tc.name, tc.payload, tc.expected, analyzeArtifact);
    }

    // Cleanup
    if (fs.existsSync("test_data.csv")) {
      fs.unlinkSync("test_data.csv");
    }
    } finally {
    if (fs.existsSync(tmpAnalyzerPath)) {
      fs.unlinkSync(tmpAnalyzerPath);
    }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Validation Complete.");
    }

    main().catch(console.error);
