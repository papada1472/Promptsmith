const url = 'https://refinzi-gateway-62411no95-papada1472-2736s-projects.vercel.app/api/v1/refine';
const payload = {
  text: "hello world",
  systemPrompt: "Improve the text"
};

async function runTest() {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`1. HTTP status: ${response.status} ${response.statusText}`);

    const rawText = await response.text();
    console.log(`2. Raw response body: ${rawText}`);

    try {
      const json = JSON.parse(rawText);
      console.log('3. Parsed JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('3. Parsed JSON: Failed to parse JSON');
    }
  } catch (error) {
    console.error('Error during request:', error);
  }
}

runTest();
