import { buildEnvelope } from '../src/main/output/compiler.js';
import { optimizeEnvelope } from '../src/main/output/optimizer.js';
import { buildExecutionPlan } from '../src/main/output/promptEngineer.js';

const TEST_CASES = [
  'Write a text about shampoo',
  'How to calculate finance data',
  'Build GTM for London fintech startup',
  'Write YC application',
  'Fix Python recursion bug',
  'Mujhe London ke liye GTM banana hai',
  'Write advertisement for shampoo',
  'What is EBITDA',
  'Write funny caption for my son',
  'Help me write leave mail',
];

function runTests() {
  TEST_CASES.forEach((testCase) => {
    // 1. Compile raw input into an Envelope
    const { envelope } = buildEnvelope({ input: testCase });

    // 2. Run the deterministic optimizer
    const optimized = optimizeEnvelope(envelope);

    // 3. Generate execution plans for both modes
    const preservePlan = buildExecutionPlan(optimized, 'preserve');
    const expertPlan = buildExecutionPlan(optimized, 'expert');

    const detectedExpert = optimized.intentAnnotations?.expectedRole || 'expert_writer';

    console.log('\n================================================');
    console.log('INPUT:');
    console.log(testCase);

    console.log('\nDETECTED EXPERT:');
    console.log(detectedExpert);

    console.log('\nMODE:');
    console.log('PRESERVE');

    console.log('\nSYSTEM:');
    console.log(preservePlan.systemPrompt);

    console.log('\nUSER:');
    console.log(preservePlan.userPrompt);

    console.log('\n------------------------------------------------');

    console.log('\nMODE:');
    console.log('EXPERT');

    console.log('\nSYSTEM:');
    console.log(expertPlan.systemPrompt);

    console.log('\nUSER:');
    console.log(expertPlan.userPrompt);
  });

  console.log('\n================================================');
}

runTests();
