import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import crypto from 'crypto';

const ALLOWED_MODELS = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'deepseek/deepseek-chat',
  'deepseek/deepseek-r1:free',
  'deepseek-v4-flash',
  'deepseek-v4-pro',
  'deepseek-v4-flash-vision-exp',
  'deepseek-chat',
  'deepseek-reasoner',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gateway-default'
];

// Gateway-issued tokens (vck_ prefix) indicate use of server-side API keys
const isGatewayToken = (key) => typeof key === 'string' && key.startsWith('vck_');

export const maxDuration = 60;

export default async function handler(req, res) {
  const requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
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

  // Gateway-issued tokens (vck_ prefix) are treated as "use server keys" — pass auth but don't forward key upstream
  const isGatewayIssuedToken = isGatewayToken(userProvidedKey);

  // Authorization Check: Must supply a user API key OR a gateway token OR a valid beta session token
  if (!userProvidedKey && expectedBetaSecret && betaToken !== expectedBetaSecret) {
    console.warn(`[Gateway][${requestId}] Unauthorized request rejected. Length: ${text.length}`);
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid beta token' });
  }

  // Gateway-issued tokens use server-side keys only; user-provided keys are forwarded upstream
  const upstreamApiKey = isGatewayIssuedToken ? null : userProvidedKey;
  const apiKey = upstreamApiKey || process.env.GEMINI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized: No valid provider API key configured on gateway' });
  }

  const start = Date.now();

  // 1. Direct Gemini API
  const isGeminiFormat = apiKey && (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.'));
  const geminiKey = isGeminiFormat ? apiKey : process.env.GEMINI_API_KEY;
  if (geminiKey && (!requestedModel || requestedModel.startsWith('gemini') || requestedModel === 'gateway-default')) {
    const geminiModels = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3.7-flash'];
    for (const gModel of geminiModels) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': geminiKey
          },
          body: JSON.stringify({
            system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
            contents: [{ parts: [{ text }] }]
          }),
          signal: AbortSignal.timeout(12000)
        });
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const refinedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (refinedText) {
            console.log(`[Gateway][${requestId}] Direct Gemini (${gModel}) success in ${Date.now() - start}ms`);
            return res.status(200).json({
              success: true,
              refinedText,
              model: gModel,
              latencyMs: Date.now() - start,
              requestId
            });
          }
        } else {
          const errText = await geminiRes.text().catch(() => '');
          console.warn(`[Gateway][${requestId}] Direct Gemini (${gModel}) HTTP ${geminiRes.status}: ${errText.slice(0, 120)}`);
        }
      } catch (gErr) {
        console.error(`[Gateway][${requestId}] Direct Gemini (${gModel}) failed:`, gErr?.message || gErr);
      }
    }
  }

  // 2. Direct DeepSeek API
  const isDeepSeekTarget = requestedModel?.includes('deepseek') || (apiKey && apiKey.startsWith('sk-') && !apiKey.startsWith('sk-or-'));
  const deepSeekKey = isDeepSeekTarget && apiKey ? apiKey : process.env.DEEPSEEK_API_KEY;
  if (deepSeekKey) {
    const dsModel = (requestedModel === 'deepseek-reasoner' || requestedModel?.includes('r1')) ? 'deepseek-reasoner' : 'deepseek-chat';
    try {
      const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepSeekKey}`
        },
        body: JSON.stringify({
          model: dsModel,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: text }
          ],
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(12000)
      });
      if (dsRes.ok) {
        const dsData = await dsRes.json();
        const refinedText = dsData.choices?.[0]?.message?.content;
        if (refinedText) {
          console.log(`[Gateway][${requestId}] Direct DeepSeek (${dsModel}) success in ${Date.now() - start}ms`);
          return res.status(200).json({
            success: true,
            refinedText,
            model: dsModel,
            latencyMs: Date.now() - start,
            requestId
          });
        }
      }
    } catch (dsErr) {
      console.error(`[Gateway][${requestId}] Direct DeepSeek failed:`, dsErr?.message || dsErr);
    }
  }

  // 3. Fallback to OpenRouter
  const isOpenRouterKey = apiKey && apiKey.startsWith('sk-or-');
  const openRouterKey = isOpenRouterKey ? apiKey : process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openRouterKey,
      headers: {
        'HTTP-Referer': 'https://refinzi.app',
        'X-Title': 'Refinzi Gateway'
      }
    });

    const DEFAULT_MODEL_ORDER = [
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemma-2-9b-it:free',
      'qwen/qwen-2.5-coder-32b-instruct:free',
      'deepseek/deepseek-r1:free',
      'mistralai/mistral-7b-instruct:free',
      'openrouter/free'
    ];

    const targetModels = (requestedModel && ALLOWED_MODELS.includes(requestedModel) && requestedModel !== 'gateway-default')
      ? [requestedModel]
      : DEFAULT_MODEL_ORDER;

    for (const modelName of targetModels) {
      try {
        const { text: refinedText } = await generateText({
          model: openrouter(modelName),
          system: systemPrompt,
          prompt: text,
          abortSignal: AbortSignal.timeout(10000)
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

  return res.status(500).json({
    error: {
      message: 'All gateway providers failed. Please check your Gemini, DeepSeek, or OpenRouter API key in Refinzi Settings.'
    },
    requestId
  });
}

