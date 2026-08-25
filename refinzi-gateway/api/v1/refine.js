import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import crypto from 'crypto';

const ALLOWED_MODELS = [
  'openrouter/free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'inclusionai/ling-3.0-flash:free',
  'cohere/north-mini-code:free',
  'gemini-2.0-flash',
  'gateway-default'
];

export const maxDuration = 60;

export default async function handler(req, res) {
  const requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'app://refinzi');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Authorization, x-api-key, x-beta-token, x-device-token'
  );

  // Handle Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Request Body Size Limit Check (Max 100KB)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 102400) {
    return res.status(413).json({ error: 'Payload too large. Maximum request size is 100KB.' });
  }

  const { text, systemPrompt, apiKey: bodyApiKey, model: requestedModel } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Missing or invalid text input' });
  }

  if (requestedModel && !ALLOWED_MODELS.includes(requestedModel)) {
    return res.status(400).json({ error: `Disallowed model requested: ${requestedModel}` });
  }

  const authHeader = req.headers['authorization'] || '';
  const headerApiKey = req.headers['x-api-key'] || (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '');
  const betaToken = req.headers['x-beta-token'] || req.headers['x-device-token'] || '';

  const userProvidedKey = bodyApiKey || headerApiKey;
  const expectedBetaSecret = process.env.REFINZI_BETA_SECRET || process.env.REFINZI_GATEWAY_SECRET;

  // Authorization Check: Must supply a user API key OR a valid beta session token if gateway secret is configured
  if (!userProvidedKey && expectedBetaSecret && betaToken !== expectedBetaSecret) {
    console.warn(`[Gateway][${requestId}] Unauthorized request rejected. Length: ${text.length}`);
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid beta token' });
  }

  const apiKey = userProvidedKey || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized: No valid provider API key configured' });
  }

  const start = Date.now();

  // Direct Gemini API if key starts with AIza/AQ. or process.env.GEMINI_API_KEY present
  const isGeminiFormat = apiKey && (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.') || (!apiKey.startsWith('sk-or-') && apiKey.length > 20));
  const geminiKey = isGeminiFormat ? apiKey : process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiKey
        },
        body: JSON.stringify({
          system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          contents: [{ parts: [{ text }] }]
        }),
        signal: AbortSignal.timeout(15000)
      });
      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const refinedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (refinedText) {
          console.log(`[Gateway][${requestId}] Direct Gemini success in ${Date.now() - start}ms`);
          return res.status(200).json({
            success: true,
            refinedText,
            model: 'gemini-2.0-flash',
            latencyMs: Date.now() - start,
            requestId
          });
        }
      }
    } catch (gErr) {
      console.error(`[Gateway][${requestId}] Direct Gemini failed:`, gErr?.message || gErr);
    }
  }

  // Fallback to OpenRouter
  const openRouterKey = (apiKey && !apiKey.startsWith('AIza')) ? apiKey : process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openRouterKey,
      headers: {
        'HTTP-Referer': 'https://refinzi.app',
        'X-Title': 'Refinzi Gateway'
      }
    });

    const targetModels = requestedModel && ALLOWED_MODELS.includes(requestedModel) ? [requestedModel] : ALLOWED_MODELS.filter(m => m.includes('/'));

    for (const modelName of targetModels) {
      try {
        const { text: refinedText } = await generateText({
          model: openrouter(modelName),
          system: systemPrompt,
          prompt: text,
          abortSignal: AbortSignal.timeout(15000)
        });

        if (refinedText) {
          console.log(`[Gateway][${requestId}] OpenRouter model ${modelName} success in ${Date.now() - start}ms`);
          return res.status(200).json({
            success: true,
            refinedText,
            model: modelName,
            latencyMs: Date.now() - start,
            requestId
          });
        }
      } catch (error) {
        console.error(`[Gateway][${requestId}] OpenRouter ${modelName} failed:`, error?.message || error);
        continue;
      }
    }
  }

  return res.status(500).json({ error: 'All gateway providers failed. Please verify API key.', requestId });
}

