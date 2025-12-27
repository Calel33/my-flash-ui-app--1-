/**
 * Backend Proxy Server
 * Keeps API keys server-side and proxies requests to Gemini and GLM APIs.
 * Supports streaming via Server-Sent Events (SSE).
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

// Load environment variables from server/.env
config();

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
const ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4/';

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

    req.on('close', () => {
      // Client disconnected - cleanup handled by stream iteration ending
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (typeof text === 'string' && text) {
        sendSSEChunk(res, text);
      }
    }

    sendSSEDone(res);
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

    req.on('close', () => {
      // Client disconnected
    });

    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content ?? '';
      if (text) {
        sendSSEChunk(res, text);
      }
    }

    sendSSEDone(res);
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
// Start Server
// =============================================================================

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`  Gemini: ${GEMINI_API_KEY ? 'configured' : 'NOT configured'}`);
  console.log(`  GLM:    ${ZAI_API_KEY ? 'configured' : 'NOT configured'}`);
});
