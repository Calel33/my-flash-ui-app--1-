# OpenRouter Provider Integration Research

**Generated**: 2025-12-27  
**Status**: Research Complete  
**Sources**: OpenRouter Official Docs, Exa Code Search, Existing Codebase Analysis

---

## 1. Executive Summary

OpenRouter provides unified access to 300+ AI models through a single API. This integration adds OpenRouter as a third provider alongside Gemini and GLM.

### Recommended Approach
**Use `@openrouter/sdk` (Native SDK)** over OpenAI-compatible API for:
- Full type safety and IDE autocomplete
- Auto-generated from OpenAPI specs (always current)
- Actionable error messages with model-specific guidance
- Native streaming support with typed chunks

### Estimated Effort
- **Backend Proxy**: 2-3 hours (new endpoints + client setup)
- **Frontend Client**: 1-2 hours (mirrors GLM pattern)
- **Provider Registry**: 30 mins (types + config)
- **Testing**: 1-2 hours

---

## 2. SDK Comparison

| Feature | `@openrouter/sdk` | OpenAI-compatible |
|---------|-------------------|-------------------|
| **Type Safety** | Full (auto-generated) | Manual types needed |
| **Streaming** | Native `for await` | Standard SSE |
| **Error Messages** | Actionable & specific | Generic |
| **Bundle Size** | ~50KB | Uses existing `openai` |
| **Model Updates** | Automatic via SDK | Manual updates |
| **Recommendation** | ✅ **Use this** | Alternative option |

### OpenAI-Compatible Alternative
If preferring consistency with GLM (which uses OpenAI SDK):
```typescript
import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://your-app.com',
    'X-Title': 'Your App Name',
  },
});
```

---

## 3. Implementation Cheat Sheet

### 3.1 Backend Proxy Updates (`server/proxy.ts`)

#### Install SDK
```bash
cd server && npm install @openrouter/sdk
```

#### Add to server/proxy.ts

```typescript
// =============================================================================
// Import OpenRouter SDK
// =============================================================================
import OpenRouter from '@openrouter/sdk';

// =============================================================================
// OpenRouter Configuration
// =============================================================================

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

function validateOpenRouterKey(_req: Request, res: Response, next: NextFunction): void {
  if (!OPENROUTER_API_KEY) {
    res.status(503).json({ error: 'OpenRouter API key not configured' });
    return;
  }
  next();
}

// =============================================================================
// Lazy-initialized OpenRouter Client
// =============================================================================

let openrouterClient: OpenRouter | null = null;

function getOpenRouterClient(): OpenRouter {
  if (!openrouterClient && OPENROUTER_API_KEY) {
    openrouterClient = new OpenRouter({
      apiKey: OPENROUTER_API_KEY,
    });
  }
  return openrouterClient!;
}

// =============================================================================
// OpenRouter Endpoints
// =============================================================================

interface OpenRouterChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
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
      messages: messages as any,
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
      messages: messages as any,
      temperature,
      stream: true,
    });

    let aborted = false;
    req.on('close', () => {
      aborted = true;
    });

    for await (const chunk of stream) {
      if (aborted) break;
      
      // Check for errors in chunk
      if ('error' in chunk) {
        sendSSEError(res, chunk.error.message);
        return;
      }
      
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
// Update Health Check
// =============================================================================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    gemini: Boolean(GEMINI_API_KEY),
    glm: Boolean(ZAI_API_KEY),
    openrouter: Boolean(OPENROUTER_API_KEY),
  });
});
```

---

### 3.2 Frontend Client (`ai/openrouter.ts`)

Create new file: `ai/openrouter.ts`

```typescript
/**
 * OpenRouter Provider Implementation
 * Routes requests through backend proxy for secure API access.
 */

import { parseSSEStream } from './sseParser';
import type {
  GenerateStylesOptions,
  StreamHtmlArtifactOptions,
  StreamReactComponentOptions,
  StreamSnippetExtractionOptions,
  StreamSnippetToReactOptions,
  StreamVariationsOptions,
} from './gemini';

const PROXY_BASE = '/api/openrouter';

// Default OpenRouter model
const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-3.5-sonnet';

/**
 * Check if OpenRouter is configured by calling the health endpoint.
 */
export async function checkOpenRouterConfigured(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    return data.openrouter === true;
  } catch {
    return false;
  }
}

/**
 * @deprecated Use checkOpenRouterConfigured() for accurate async check.
 */
export function isOpenRouterConfigured(): boolean {
  if (import.meta.env.DEV) {
    console.warn(
      '[DEPRECATED] isOpenRouterConfigured() always returns true. ' +
      'Use checkOpenRouterConfigured() for accurate async check.'
    );
  }
  return true;
}

export interface OpenRouterChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
}

/**
 * Make non-streaming chat request via proxy.
 */
export async function openrouterChatFromProxy(request: OpenRouterChatRequest): Promise<string> {
  const response = await fetch(`${PROXY_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Proxy request failed');
  }

  const data = await response.json();
  return data.content ?? '';
}

/**
 * Stream SSE response from OpenRouter proxy endpoint.
 */
export async function* openrouterStreamFromProxy(
  request: OpenRouterChatRequest
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${PROXY_BASE}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Proxy request failed');
  }

  yield* parseSSEStream(response);
}

// ============================================================================
// Style Generation (Non-streaming)
// ============================================================================

/**
 * Generate style directions using OpenRouter (non-streaming).
 */
export async function openrouterGenerateStyles(options: GenerateStylesOptions): Promise<string[]> {
  const { prompt, isDesignSystemMode = false } = options;

  const systemPrompt = 'You are a UI design director returning ONLY JSON arrays of style names. No explanations, no markdown, just the raw JSON array.';

  const userPrompt = isDesignSystemMode
    ? `Generate 3 distinct Brand Personalities for: "${prompt}". Return ONLY a raw JSON array of 3 names.`
    : `Generate 3 distinct design directions for: "${prompt}". Return ONLY a raw JSON array of 3 names.`;

  const raw = await openrouterChatFromProxy({
    model: DEFAULT_OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  let generatedStyles = ['Style A', 'Style B', 'Style C'];
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
        generatedStyles = parsed;
      }
    }
  } catch {
    // Fall back to defaults if parsing fails
  }

  return generatedStyles;
}

// ============================================================================
// HTML Artifact Streaming
// ============================================================================

/**
 * Stream HTML artifact generation using OpenRouter.
 */
export async function* openrouterStreamHtmlArtifact(
  options: StreamHtmlArtifactOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, modelId = DEFAULT_OPENROUTER_MODEL } = options;

  const systemPrompt = 'You output ONLY raw HTML+CSS without markdown code fences or explanations. Start directly with <!DOCTYPE html> or <html>.';

  yield* openrouterStreamFromProxy({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
  });
}

// ============================================================================
// React Component Streaming
// ============================================================================

/**
 * Stream React component conversion using OpenRouter.
 */
export async function* openrouterStreamReactComponent(
  options: StreamReactComponentOptions
): AsyncGenerator<string, void, unknown> {
  const { html, modelId = DEFAULT_OPENROUTER_MODEL } = options;

  const systemPrompt = 'You are an expert React developer. Output ONLY the React component code without markdown code fences. No explanations.';

  const userPrompt = `Convert the following high-fidelity HTML/CSS component into a production-ready React component. Return ONLY the code. No markdown.\n\nHTML:\n${html}`;

  yield* openrouterStreamFromProxy({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });
}

// ============================================================================
// Snippet Extraction Streaming
// ============================================================================

/**
 * Stream snippet extraction using OpenRouter.
 */
export async function* openrouterStreamSnippetExtraction(
  options: StreamSnippetExtractionOptions
): AsyncGenerator<string, void, unknown> {
  const { snippetHtml, documentHtml } = options;

  const systemPrompt = 'You extract HTML elements into standalone files. Output ONLY raw HTML without markdown code fences.';

  const userPrompt = `
I have a full HTML/CSS document and I've selected a specific element from it. 
Your task is to extract this element and ALL its required CSS/JS into a clean, standalone HTML file.

**SELECTED ELEMENT:**
${snippetHtml}

**ORIGINAL DOCUMENT CONTEXT:**
${documentHtml}

**REQUIREMENTS:**
1. Return a single, valid HTML file containing the selected HTML and necessary <style> tags.
2. Use a modern, clean approach.
3. Return ONLY the code. No markdown.
`.trim();

  yield* openrouterStreamFromProxy({
    model: DEFAULT_OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });
}

// ============================================================================
// Snippet to React Conversion Streaming
// ============================================================================

/**
 * Stream snippet to React conversion using OpenRouter.
 */
export async function* openrouterStreamSnippetToReact(
  options: StreamSnippetToReactOptions
): AsyncGenerator<string, void, unknown> {
  const { snippetHtml, modelId = DEFAULT_OPENROUTER_MODEL } = options;

  const systemPrompt = 'You are an expert React developer. Output ONLY the React component code without markdown code fences. No explanations.';

  const userPrompt = `
Convert the following isolated HTML/CSS snippet into a clean, production-ready React functional component.
1. Use functional structure.
2. Include ALL necessary styles within a scoped <style> tag.
3. Name the component 'Component'.
4. Return ONLY the React code. No markdown.

Snippet:
${snippetHtml}
`.trim();

  yield* openrouterStreamFromProxy({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });
}

// ============================================================================
// Variations Generation Streaming
// ============================================================================

/**
 * Stream variations generation using OpenRouter.
 */
export async function* openrouterStreamVariations(
  options: StreamVariationsOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, temperature = 1.2 } = options;

  const systemPrompt = 'You are a creative UI designer. Output ONLY valid JSON without markdown code fences.';

  const userPrompt = `
Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${prompt}".
Required JSON Format: { "name": "Name", "html": "..." }
`.trim();

  yield* openrouterStreamFromProxy({
    model: DEFAULT_OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
  });
}
```

---

### 3.3 Provider Registry Updates (`ai/providers.ts`)

```typescript
// Update ProviderId type
export type ProviderId = 'gemini' | 'glm' | 'openrouter';

// Add to MODELS array
export const MODELS: ProviderModel[] = [
  // ... existing Gemini and GLM models ...
  
  // OpenRouter models (popular selections)
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Best balance of intelligence and speed',
    provider: 'openrouter',
    kind: 'design',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI flagship multimodal model',
    provider: 'openrouter',
    kind: 'design',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    description: 'Fast and capable Google model',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    description: 'Open-source high performance',
    provider: 'openrouter',
    kind: 'component',
  },
];

// Add to PROVIDER_CONFIG
export const PROVIDER_CONFIG: Record<ProviderId, ProviderConfig> = {
  // ... existing gemini and glm ...
  
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: '300+ AI models via unified API',
    envKey: 'OPENROUTER_API_KEY',
    isConfigured: () => true, // Check via /api/health at runtime
  },
};
```

---

### 3.4 Facade Updates (`ai/generate.ts`)

```typescript
// Add imports
import {
  openrouterGenerateStyles,
  openrouterStreamHtmlArtifact,
  openrouterStreamReactComponent,
  openrouterStreamSnippetExtraction,
  openrouterStreamSnippetToReact,
  openrouterStreamVariations,
} from './openrouter';

// Update generateStyles function
export async function generateStyles(options: FacadeGenerateStylesOptions): Promise<string[]> {
  const { provider, ...rest } = options;

  try {
    let generateFn;
    switch (provider) {
      case 'openrouter':
        generateFn = openrouterGenerateStyles;
        break;
      case 'glm':
        generateFn = glmGenerateStyles;
        break;
      default:
        generateFn = geminiGenerateStyles;
    }
    return await withTimeout(generateFn(rest), DEFAULT_REQUEST_TIMEOUT_MS, provider);
  } catch (error) {
    // ... existing error handling with fallback logic ...
  }
}

// Update all streaming functions similarly with openrouter case:
// - streamHtmlArtifact
// - streamReactComponent
// - streamSnippetExtraction
// - streamSnippetToReact
// - streamVariations
```

---

### 3.5 Environment Setup

#### `server/.env`
```bash
# Existing keys
GEMINI_API_KEY=your_gemini_key
ZAI_API_KEY=your_zai_key

# Add OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key_here
```

#### `server/.env.example`
```bash
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Z.AI GLM API Key
ZAI_API_KEY=your_zai_api_key_here

# OpenRouter API Key (get from https://openrouter.ai/settings/keys)
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key_here
```

---

## 4. Security Considerations

### API Key Handling
- ✅ Store keys ONLY in `server/.env` (already in .gitignore)
- ✅ Never expose to frontend - proxy pattern maintains security
- ✅ Validate key presence before processing requests

### Request Headers (Optional but Recommended)
```typescript
// In OpenRouter client initialization
const client = new OpenRouter({
  apiKey: OPENROUTER_API_KEY,
  // These headers help with:
  // 1. App attribution on OpenRouter dashboard
  // 2. Ranking visibility on openrouter.ai
  // Optional but recommended:
  defaultHeaders: {
    'HTTP-Referer': 'https://your-app-domain.com',
    'X-Title': 'My Flash UI App',
  },
});
```

### Rate Limiting
- OpenRouter has per-model rate limits
- Consider implementing request queuing for high-traffic scenarios
- Monitor via `/api/v1/generation?id=<generation_id>` for usage stats

### Cost Tracking
- Query generation stats after completion:
```typescript
const stats = await fetch(`https://openrouter.ai/api/v1/generation?id=${generationId}`, {
  headers: { Authorization: `Bearer ${apiKey}` }
});
```

### Input Validation
- Validate `model` against allowed model list
- Sanitize `messages` content (already handled by proxy pattern)
- Set reasonable `max_tokens` limits

---

## 5. Model Selection Strategy

### Option A: Static Model List (Recommended for MVP)
Pre-define popular models in `providers.ts` as shown in section 3.3.

**Pros**: Simple, predictable, no additional API calls  
**Cons**: Manual updates needed for new models

### Option B: Dynamic Model Fetching
```typescript
// Fetch available models from OpenRouter
async function fetchOpenRouterModels() {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` }
  });
  const data = await response.json();
  return data.data; // Array of model objects
}
```

**Model Object Structure**:
```typescript
interface OpenRouterModel {
  id: string;                    // e.g., "openai/gpt-4o"
  name: string;                  // e.g., "GPT-4o"
  context_length: number;        // e.g., 128000
  pricing: {
    prompt: string;              // Cost per token (string for precision)
    completion: string;
  };
  architecture: {
    modality: string;            // e.g., "text->text"
    input_modalities: string[];
    output_modalities: string[];
  };
  top_provider: {
    is_moderated: boolean;
    max_completion_tokens: number;
  };
}
```

### Recommended Initial Models
| Model ID | Use Case | Cost Tier |
|----------|----------|-----------|
| `anthropic/claude-3.5-sonnet` | Design & complex | Medium |
| `openai/gpt-4o` | General purpose | Medium |
| `google/gemini-2.0-flash-001` | Fast components | Low |
| `meta-llama/llama-3.3-70b-instruct` | Open-source option | Low |
| `deepseek/deepseek-chat` | Cost-effective | Very Low |

---

## 6. Error Handling

### OpenRouter Error Codes
| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request format |
| 401 | Invalid API key | Verify key |
| 402 | Insufficient credits | Add credits |
| 403 | Content flagged | Moderate input |
| 408 | Timeout | Retry with backoff |
| 429 | Rate limited | Implement backoff |
| 502 | Model down | Try fallback model |
| 503 | No provider available | Try different model |

### Mapping to AIProviderError
```typescript
// In ai/errors.ts - add openrouter to normalizeError
export function normalizeError(error: unknown, provider: ProviderId): AIProviderError {
  // ... existing logic ...
  
  // OpenRouter-specific error handling
  if (provider === 'openrouter') {
    const err = error as any;
    if (err?.error?.code === 402) {
      return new AIProviderError({
        code: 'INSUFFICIENT_CREDITS',
        status: 402,
        provider,
        message: 'OpenRouter account has insufficient credits',
        isTransient: false,
      });
    }
  }
  
  // ... rest of normalization ...
}
```

### Fallback Behavior
OpenRouter can be added as a fallback option or receive fallbacks:
```typescript
// In ai/errors.ts
export function shouldAttemptFallback(error: AIProviderError): boolean {
  if (!ENABLE_FALLBACK) return false;
  
  // Fallback from GLM or OpenRouter to Gemini
  if (error.provider === 'glm' || error.provider === 'openrouter') {
    return error.isTransient;
  }
  
  return false;
}
```

---

## 7. Testing Plan

### Health Check Verification
```bash
# After starting server
curl http://localhost:3001/api/health
# Expected: {"status":"ok","gemini":true,"glm":true,"openrouter":true}
```

### Non-Streaming Test
```bash
curl -X POST http://localhost:3001/api/openrouter/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Streaming Test
```bash
curl -X POST http://localhost:3001/api/openrouter/stream \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Count to 5"}]
  }'
```

### Error Scenarios
1. **Invalid API key**: Remove OPENROUTER_API_KEY, expect 503
2. **Invalid model**: Use non-existent model ID, expect 400
3. **Rate limit**: Make rapid requests, verify 429 handling
4. **Connection abort**: Cancel mid-stream, verify cleanup

### Frontend Integration Test
1. Select OpenRouter provider in UI
2. Generate styles - verify non-streaming works
3. Generate HTML artifact - verify streaming works
4. Check fallback when OpenRouter fails

---

## 8. Migration Checklist

### Backend Setup
- [ ] `cd server && npm install @openrouter/sdk`
- [ ] Add `OPENROUTER_API_KEY` to `server/.env`
- [ ] Update `server/.env.example` with placeholder
- [ ] Add OpenRouter endpoints to `server/proxy.ts`
- [ ] Update `/api/health` to include `openrouter` status
- [ ] Test endpoints with curl

### Frontend Setup
- [ ] Create `ai/openrouter.ts` with all generation functions
- [ ] Update `ai/providers.ts` with ProviderId and models
- [ ] Update `ai/generate.ts` facade with openrouter cases
- [ ] Optionally update `ai/errors.ts` for OpenRouter-specific errors

### Testing
- [ ] Verify health check shows openrouter: true
- [ ] Test non-streaming chat endpoint
- [ ] Test streaming endpoint
- [ ] Test from frontend UI
- [ ] Verify error handling (invalid key, rate limit)

### Documentation
- [ ] Update README if needed
- [ ] Update REPO_MAP.md with new files

---

## References

- [OpenRouter TypeScript SDK](https://openrouter.ai/docs/sdks/typescript)
- [OpenRouter API Reference](https://openrouter.ai/docs/api/reference/overview)
- [OpenRouter Streaming](https://openrouter.ai/docs/api/reference/streaming)
- [OpenRouter Error Handling](https://openrouter.ai/docs/api/reference/errors)
- [OpenRouter Models List](https://openrouter.ai/api/v1/models)
- [Get API Key](https://openrouter.ai/settings/keys)
