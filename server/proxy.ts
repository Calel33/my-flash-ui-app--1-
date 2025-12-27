/**
 * Backend Proxy Server
 * Keeps API keys server-side and proxies requests to Gemini and GLM APIs.
 * Supports streaming via Server-Sent Events (SSE).
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { OpenRouter } from '@openrouter/sdk';
import type { Message } from '@openrouter/sdk';

// Load environment variables from server/.env with explicit path
// Use override: true to ensure .env values take precedence over system env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');
console.log('[DEBUG] Loading .env from:', envPath);
const result = config({ path: envPath, override: true });
console.log('[DEBUG] dotenv result:', result.error ? `ERROR: ${result.error.message}` : 'SUCCESS');

// Check if there's a system env var overriding
console.log('[DEBUG] process.env.OPENROUTER_API_KEY after override:', process.env.OPENROUTER_API_KEY?.slice(0, 15) || 'undefined');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

// =============================================================================
// API Key Validation
// =============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ZAI_API_KEY = process.env.ZAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4/';
const HTTP_REFERER = process.env.HTTP_REFERER || 'http://localhost:3000';

// Debug: Log API key presence (not the actual key for security)
console.log('[DEBUG] OPENROUTER_API_KEY loaded:', OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.slice(0, 10)}...` : 'NOT FOUND');

function validateGeminiKey(_req: Request, res: Response, next: NextFunction): void {
  if (!GEMINI_API_KEY) {
    res.status(503).json({ error: 'Gemini API key not configured' });
    return;
  }
  next();
}

function validateGlmKey(_req: Request, res: Response, next: NextFunction): void {
  if (!ZAI_API_KEY) {
    res.status(503).json({ error: 'GLM API key not configured' });
    return;
  }
  next();
}

function validateOpenRouterKey(_req: Request, res: Response, next: NextFunction): void {
  if (!OPENROUTER_API_KEY) {
    res.status(503).json({ error: 'OpenRouter API key not configured' });
    return;
  }
  next();
}

// =============================================================================
// Lazy-initialized Clients
// =============================================================================

let geminiClient: GoogleGenAI | null = null;
let glmClient: OpenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient && GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return geminiClient!;
}

function getGlmClient(): OpenAI {
  if (!glmClient && ZAI_API_KEY) {
    glmClient = new OpenAI({
      apiKey: ZAI_API_KEY,
      baseURL: ZAI_BASE_URL,
    });
  }
  return glmClient!;
}

let openrouterClient: OpenRouter | null = null;

function getOpenRouterClient(): OpenRouter {
  if (!openrouterClient && OPENROUTER_API_KEY) {
    openrouterClient = new OpenRouter({
      apiKey: OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': HTTP_REFERER,
        'X-Title': 'Flash UI App',
      },
    });
  }
  return openrouterClient!;
}

// =============================================================================
// SSE Helpers
// =============================================================================

function setupSSE(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

function sendSSEChunk(res: Response, data: string): void {
  res.write(`data: ${JSON.stringify({ chunk: data })}\n\n`);
}

function sendSSEDone(res: Response): void {
  res.write('data: [DONE]\n\n');
  res.end();
}

function sendSSEError(res: Response, error: string): void {
  res.write(`data: ${JSON.stringify({ error })}\n\n`);
  res.end();
}

// =============================================================================
// Health Check
// =============================================================================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    gemini: Boolean(GEMINI_API_KEY),
    glm: Boolean(ZAI_API_KEY),
    openrouter: Boolean(OPENROUTER_API_KEY),
  });
});

// =============================================================================
// Gemini Endpoints
// =============================================================================

interface GeminiGenerateRequest {
  model: string;
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  config?: Record<string, unknown>;
}

// POST /api/gemini/generate - Non-streaming generation
app.post('/api/gemini/generate', validateGeminiKey, async (req: Request, res: Response) => {
  try {
    const { model, contents, config } = req.body as GeminiGenerateRequest;

    if (!model || !contents) {
      res.status(400).json({ error: 'Missing required fields: model, contents' });
      return;
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    res.json({ text: response.text ?? '' });
  } catch (error) {
    console.error('Gemini generate error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// POST /api/gemini/stream - Streaming generation (SSE)
app.post('/api/gemini/stream', validateGeminiKey, async (req: Request, res: Response) => {
  try {
    const { model, contents, config } = req.body as GeminiGenerateRequest;

    if (!model || !contents) {
      res.status(400).json({ error: 'Missing required fields: model, contents' });
      return;
    }

    setupSSE(res);

    const ai = getGeminiClient();
    const stream = await ai.models.generateContentStream({
      model,
      contents,
      config,
    });

    let aborted = false;
    req.on('close', () => {
      aborted = true;
    });

    for await (const chunk of stream) {
      if (aborted) break;
      const text = chunk.text;
      if (typeof text === 'string' && text) {
        sendSSEChunk(res, text);
      }
    }

    if (!aborted) {
      sendSSEDone(res);
    }
  } catch (error) {
    console.error('Gemini stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream content' });
    } else {
      sendSSEError(res, 'Stream interrupted');
    }
  }
});

// =============================================================================
// GLM Endpoints
// =============================================================================

interface GlmChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
}

// POST /api/glm/chat - Non-streaming chat completion
app.post('/api/glm/chat', validateGlmKey, async (req: Request, res: Response) => {
  try {
    const { model, messages, temperature = 0.9 } = req.body as GlmChatRequest;

    if (!model || !messages) {
      res.status(400).json({ error: 'Missing required fields: model, messages' });
      return;
    }

    const client = getGlmClient();
    const completion = await client.chat.completions.create({
      model,
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature,
      stream: false,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    res.json({ content });
  } catch (error) {
    console.error('GLM chat error:', error);
    res.status(500).json({ error: 'Failed to complete chat' });
  }
});

// POST /api/glm/stream - Streaming chat completion (SSE)
app.post('/api/glm/stream', validateGlmKey, async (req: Request, res: Response) => {
  try {
    const { model, messages, temperature = 0.9 } = req.body as GlmChatRequest;

    if (!model || !messages) {
      res.status(400).json({ error: 'Missing required fields: model, messages' });
      return;
    }

    setupSSE(res);

    const client = getGlmClient();
    const stream = await client.chat.completions.create({
      model,
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature,
      stream: true,
    });

    let aborted = false;
    req.on('close', () => {
      aborted = true;
    });

    for await (const chunk of stream) {
      if (aborted) break;
      const text = chunk.choices?.[0]?.delta?.content ?? '';
      if (text) {
        sendSSEChunk(res, text);
      }
    }

    if (!aborted) {
      sendSSEDone(res);
    }
  } catch (error) {
    console.error('GLM stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream chat' });
    } else {
      sendSSEError(res, 'Stream interrupted');
    }
  }
});

// =============================================================================
// OpenRouter Endpoints
// =============================================================================

interface OpenRouterChatRequest {
  model: string;
  messages: Message[];
  temperature?: number;
}

// POST /api/openrouter/chat - Non-streaming chat completion
app.post('/api/openrouter/chat', validateOpenRouterKey, async (req: Request, res: Response) => {
  try {
    const { model, messages, temperature = 0.9 } = req.body as OpenRouterChatRequest;

    if (!model || !messages) {
      res.status(400).json({ error: 'Missing required fields: model, messages' });
      return;
    }

    const client = getOpenRouterClient();
    const response = await client.chat.send({
      model,
      messages,
      temperature,
      stream: false,
    });

    const content = response.choices[0]?.message?.content ?? '';
    res.json({ content });
  } catch (error) {
    console.error('OpenRouter chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to complete chat';
    res.status(500).json({ error: errorMessage });
  }
});

// POST /api/openrouter/stream - Streaming chat completion (SSE)
app.post('/api/openrouter/stream', validateOpenRouterKey, async (req: Request, res: Response) => {
  try {
    const { model, messages, temperature = 0.9 } = req.body as OpenRouterChatRequest;

    if (!model || !messages) {
      res.status(400).json({ error: 'Missing required fields: model, messages' });
      return;
    }

    setupSSE(res);

    const client = getOpenRouterClient();
    const stream = await client.chat.send({
      model,
      messages,
      temperature,
      stream: true,
    });

    let aborted = false;
    req.on('close', () => {
      aborted = true;
    });

    for await (const chunk of stream) {
      if (aborted) break;
      const text = chunk.choices?.[0]?.delta?.content ?? '';
      if (text) {
        sendSSEChunk(res, text);
      }
    }

    if (!aborted) {
      sendSSEDone(res);
    }
  } catch (error) {
    console.error('OpenRouter stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream chat' });
    } else {
      sendSSEError(res, 'Stream interrupted');
    }
  }
});

// =============================================================================
// Start Server
// =============================================================================

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`  Gemini:     ${GEMINI_API_KEY ? 'configured' : 'NOT configured'}`);
  console.log(`  GLM:        ${ZAI_API_KEY ? 'configured' : 'NOT configured'}`);
  console.log(`  OpenRouter: ${OPENROUTER_API_KEY ? 'configured' : 'NOT configured'}`);
});
