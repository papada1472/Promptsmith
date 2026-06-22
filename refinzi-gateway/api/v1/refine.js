import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://refinzi.app',
    'X-Title': 'Refinzi Gateway'
  }
});

const MODELS = [
  'openai/gpt-oss-120b:free',
  'google/gemma-3-27b-it:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free'
];

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-refinzi-secret'
  );

  // Handle Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // const secret = req.headers['x-refinzi-secret'];
  // if (secret !== process.env.REFINZI_APP_SECRET) {
  //   return res.status(403).json({ error: 'Forbidden' });
  // }

  const { text, systemPrompt } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
  }

  const start = Date.now();
  
  for (const modelName of MODELS) {
    try {
      const { text: refinedText } = await generateText({
        model: openrouter(modelName),
        system: systemPrompt,
        prompt: text,
      });

      return res.status(200).json({
        success: true,
        refinedText,
        model: modelName,
        latencyMs: Date.now() - start
      });
    } catch (error) {
      console.error(`Model ${modelName} failed:`, error);
      continue;
    }
  }

  return res.status(500).json({ error: 'All models failed' });
}
