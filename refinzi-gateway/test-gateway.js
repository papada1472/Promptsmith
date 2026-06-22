import handler from './api/v1/refine.js';

// Mock request and response objects
const mockReq = {
  method: 'POST',
  body: {
    text: 'Refine this sentence to sound more professional.',
    systemPrompt: 'You are a professional editor.',
    model: 'gemini-2.5-flash'
  }
};

const mockRes = {
  status: (code) => {
    console.log(`Response Status: ${code}`);
    return {
      json: (data) => console.log('Response JSON:', JSON.stringify(data, null, 2)),
      end: () => console.log('Response Ended')
    };
  },
  setHeader: (name, value) => {
    // console.log(`Header Set: ${name} = ${value}`);
  }
};

async function runTest() {
  console.log('Running test for refine.js handler...');
  try {
    await handler(mockReq, mockRes);
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

runTest();
