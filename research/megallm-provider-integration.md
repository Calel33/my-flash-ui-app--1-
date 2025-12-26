## Overview of MegaLLM for Flash UI

MegaLLM is a "super-API" that exposes 70+ models (including GPT-5, Claude, Gemini, and others) behind a single unified interface.
Instead of integrating with OpenAI, Anthropic, Google, and other providers separately, you call one API and select models via a `model` string, with MegaLLM handling routing, billing, and fallbacks.

For this app, the important properties from the docs are:

- **Unified OpenAI-style API surface**  
  - OpenAI-compatible base URL: `https://ai.megallm.io/v1` (JavaScript `baseURL`, Python `base_url`).  
  - Anthropic-style base URL: `https://ai.megallm.io` when using Claude/Anthropic SDKs.  
  - Core chat endpoint is OpenAI-compatible: `POST https://ai.megallm.io/v1/chat/completions`.

- **Authentication model**  
  - API keys are created from the MegaLLM dashboard and typically start with `sk-mega-`.  
  - Recommended auth is an HTTP header `Authorization: Bearer YOUR_API_KEY`.  
  - Anthropic-compatible format also supports `x-api-key: YOUR_API_KEY` plus `anthropic-version`.  
  - Official docs recommend keeping keys in environment variables such as `MEGALLM_API_KEY`.

- **Model catalog and naming**  
  - Models are referenced by plain IDs like `gpt-4`, `gpt-5`, `claude-3.7-sonnet`, `claude-opus-4-1-20250805`, etc.  
  - The API reference exposes a `GET /models` endpoint that returns all available models with capabilities, pricing, and context windows.

- **Streaming capabilities**  
  - Supports Server-Sent Events (SSE) streaming with the same pattern as OpenAI: `stream: true` plus an SSE response stream where each `data:` line is a JSON chunk.  
  - Works for both OpenAI-style chat completions and Anthropic-style messages endpoints.  
  - Docs show JavaScript examples using `for await (const chunk of stream)` and browser `fetch` + readable streams.

- **Advanced features**  
  - Function calling and tools over chat completions.  
  - Automatic fallbacks and routing (at the platform level) so that if a model or provider is unavailable, MegaLLM can transparently route to others depending on configuration.  
  - Rate limits defined per plan tier (Basic, Pro, Enterprise) for requests/minute, tokens/minute, and concurrency.

In `my-flash-ui-app`, MegaLLM can be treated as another OpenAI-compatible backend similar to GLM and OpenRouter, but with a broader model catalog and platform-managed fallbacks.


## Current Provider Architecture (Gemini, GLM, OpenRouter)

The app already implements a multi-provider architecture under `./ai`:

- **Gemini** (`ai/gemini.ts`)  
  - Uses `GoogleGenAI` from `@google/genai`.  
  - API key read from `process.env.API_KEY`.  
  - Exposes provider-specific functions such as `geminiGenerateStyles`, `geminiStreamHtmlArtifact`, `geminiStreamReactComponent`, `geminiStreamSnippetExtraction`, `geminiStreamSnippetToReact`, and `geminiStreamVariations`.  
  - Streaming is handled with `ai.models.generateContentStream`, yielding `chunk.text`.

- **GLM** (`ai/glmClient.ts`, `ai/glm.ts`)  
  - `ai/glmClient.ts` wraps the `openai` SDK, using `baseURL: 'https://api.z.ai/api/paas/v4/'` and an API key from `import.meta.env.VITE_ZAI_API_KEY`.  
  - Exposes `isGlmConfigured()` and a cached `getGlmClient()` instance, configured with `dangerouslyAllowBrowser: true` to allow frontend usage.  
  - `ai/glm.ts` exports the same function surface as Gemini (`glmGenerateStyles`, `glmStreamHtmlArtifact`, `glmStreamReactComponent`, etc.).  
  - Streaming uses a shared `iterateStream` helper that pulls `chunk.choices[0]?.delta?.content` out of the OpenAI-style stream.

- **OpenRouter** (`ai/openrouterClient.ts`, `ai/openrouter.ts`)  
  - `ai/openrouterClient.ts` wraps the `openai` SDK with `baseURL: 'https://openrouter.ai/api/v1'`, an API key from `import.meta.env.VITE_OPENROUTER_API_KEY`, optional `defaultHeaders` (`HTTP-Referer`, `X-Title`), and `dangerouslyAllowBrowser: true`.  
  - `ai/openrouter.ts` mirrors the GLM implementation with functions like `openRouterGenerateStyles`, `openRouterStreamHtmlArtifact`, `openRouterStreamReactComponent`, `openRouterStreamSnippetExtraction`, `openRouterStreamSnippetToReact`, and `openRouterStreamVariations`.  
  - Uses an `iterateStream` helper identical in spirit to the GLM version.

- **Provider registry and facade**  
  - `ai/providers.ts` defines:
    - `ProviderId = 'gemini' | 'glm' | 'openrouter'`.  
    - A `MODELS` array where each entry has `id`, `name`, `description`, `provider`, and `kind` (`'design' | 'component' | 'system'`).  
    - `PROVIDER_CONFIG: Record<ProviderId, ProviderConfig>` with `envKey` and `isConfigured()` for each provider.  
  - `ai/generate.ts` is the provider-agnostic facade that:  
    - Accepts options including `provider: ProviderId`.  
    - Selects provider-specific functions via small `select*` helpers and `switch (provider)` statements.  
    - Wraps calls in `withTimeout` and normalizes errors via `normalizeError` from `ai/errors.ts`.  
    - Implements GLM→Gemini (and OpenRouter→Gemini) fallback for transient failures when Gemini is configured.

Taken together, the pattern is:

1. A **client module** that owns base URL, API key, and low-level SDK configuration.  
2. A **provider implementation module** that exports functions matching the Gemini/GLM/OpenRouter signatures and hides SDK details.  
3. A **central provider/model registry** (`MODELS`, `PROVIDER_CONFIG`) for discovery and configuration checks.  
4. A **facade** (`ai/generate.ts`) that routes high-level generation flows based on `provider` and `modelId`.

MegaLLM should fit into this pattern as a fourth provider.


## Comparison: Existing Providers vs MegaLLM

### Client construction

- **Gemini**  
  - SDK: `@google/genai` (`GoogleGenAI`).  
  - Base URL: handled internally by Google client.  
  - Auth: `API_KEY` environment variable (server-side style).  
  - Streaming: SDK-specific `generateContentStream`.

- **GLM**  
  - SDK: `openai` (OpenAI-compatible).  
  - Base URL: `https://api.z.ai/api/paas/v4/`.  
  - Auth: `VITE_ZAI_API_KEY` via `import.meta.env`.  
  - Streaming: OpenAI chat completions with `stream: true`.

- **OpenRouter**  
  - SDK: `openai` (OpenAI-compatible).  
  - Base URL: `https://openrouter.ai/api/v1`.  
  - Auth: `VITE_OPENROUTER_API_KEY` via `import.meta.env`, plus optional headers.  
  - Streaming: OpenAI chat completions with `stream: true` and SSE.

- **MegaLLM (from docs)**  
  - SDKs: compatible with existing OpenAI and Anthropic SDKs; no special client required.  
  - OpenAI-format base URL: `https://ai.megallm.io/v1`.  
  - Anthropic-format base URL: `https://ai.megallm.io` for Claude-style messages.  
  - Auth: same `Authorization: Bearer $MEGALLM_API_KEY` header or `x-api-key` header as documented in the Authentication and API Reference pages.  
  - Streaming: identical to OpenAI: `stream: true` and SSE event stream.

From an implementation perspective, MegaLLM aligns very closely with GLM and OpenRouter: a single `openai` client configured with a different base URL and API key.

### Auth and environment configuration

- Gemini: `process.env.API_KEY` (server-side or Node-style env).  
- GLM: `import.meta.env.VITE_ZAI_API_KEY` (Vite-friendly).  
- OpenRouter: `import.meta.env.VITE_OPENROUTER_API_KEY` with optional `HTTP-Referer` and `X-Title` headers.  
- MegaLLM docs recommend:
  - Storing keys in `MEGALLM_API_KEY` environment variable.  
  - Using it with `Authorization: Bearer YOUR_API_KEY` or `x-api-key: YOUR_API_KEY`.  

For this app, a consistent pattern would be:

- Add `VITE_MEGALLM_API_KEY` in `.env.local`.  
- In the MegaLLM client module, read `import.meta.env.VITE_MEGALLM_API_KEY`.  
- Use the bearer token header configured by the `openai` SDK when constructing the client.

### Model selection and catalog

- Gemini models are currently fixed IDs (`gemini-3-flash-preview`, `gemini-3-pro-preview`) in `MODELS`.  
- GLM uses a default `glm-4.7` model.  
- OpenRouter adds models like `openai/gpt-4o` and `meta-llama/llama-3.1-8b-instruct`.  
- MegaLLM exposes:
  - A models endpoint to list all 70+ models.  
  - Model IDs such as `gpt-4`, `gpt-5`, `claude-3.7-sonnet`, and `claude-opus-4-1-20250805` as shown in the introduction examples.

For Flash UI, you can treat MegaLLM as:

- A **design-oriented provider** for high-reasoning models like `gpt-5` or `claude-opus-4-1-20250805`.  
- A **component/interaction provider** for faster models like `gpt-4` or `gpt-4o` (if exposed) for interactive flows.

The exact model choice can be finalized during implementation by consulting MegaLLM's Models Catalog, but the architecture should assume that MegaLLM's model IDs are provider-agnostic strings stored in `MODELS`.

### Streaming semantics

MegaLLM streaming is intentionally aligned with OpenAI's:

- Request: `stream: true` in the request body to `/v1/chat/completions`.  
- Response: SSE with `data:` lines, each containing a JSON chunk matching `chat.completion.chunk` shape.  
- Chunk structure: `choices[0].delta.role` followed by incremental `choices[0].delta.content` tokens, then a final chunk with `finish_reason`, then `data: [DONE]`.

This is effectively identical to the GLM and OpenRouter streaming patterns in this app, so the existing `iterateStream` helpers can be reused (or copied with minimal changes) for MegaLLM.

### Error handling and rate limits

MegaLLM docs define:

- Auth errors: `401` (Unauthorized) and `403` (Forbidden) with recommended checks.  
- Rate limits: per plan tier (e.g., Basic 60 RPS and 90K TPM).  
- Streaming guidance: implement reconnection and retry logic for interrupted streams.

In Flash UI, `ai/errors.ts` already normalizes provider errors and integrates with `shouldAttemptFallback` to drive GLM/OpenRouter→Gemini fallbacks.
A MegaLLM integration should:

- Normalize MegaLLM errors using the same `AIProviderError` shape.  
- Decide whether MegaLLM participates in the same fallback strategy (e.g., fallback to Gemini on transient MegaLLM errors).  
- Respect MegaLLM rate limits by keeping concurrency and request frequency within the documented tiers.


## Recommended Integration Architecture for MegaLLM

The recommended approach is to introduce MegaLLM as a fourth provider that mirrors the GLM/OpenRouter pattern and plugs into the existing facade without bespoke code paths.

### 1. Extend provider and model registries

In `ai/providers.ts`:

- Update `ProviderId` to include MegaLLM:

```ts
export type ProviderId = 'gemini' | 'glm' | 'openrouter' | 'megallm';
```

- Add MegaLLM models to `MODELS` using IDs from the MegaLLM docs:

```ts
export const MODELS: ProviderModel[] = [
  // Existing Gemini, GLM, OpenRouter models...
  {
    id: 'gpt-5',
    name: 'GPT-5 (MegaLLM)',
    description: 'Flagship reasoning model via MegaLLM.',
    provider: 'megallm',
    kind: 'design',
  },
  {
    id: 'gpt-4',
    name: 'GPT-4 (MegaLLM)',
    description: 'High-quality general model for UI/component flows.',
    provider: 'megallm',
    kind: 'component',
  },
];
```

- Add a MegaLLM entry to `PROVIDER_CONFIG`:

```ts
export const PROVIDER_CONFIG: Record<ProviderId, ProviderConfig> = {
  // Existing entries...
  megallm: {
    id: 'megallm',
    name: 'MegaLLM',
    description: 'Unified multi-provider API via MegaLLM.',
    envKey: 'VITE_MEGALLM_API_KEY',
    isConfigured: () => Boolean(import.meta.env.VITE_MEGALLM_API_KEY),
  },
};
```

This keeps model discovery and configuration checks centralized and consistent.

### 2. Introduce a MegaLLM client wrapper

Create `ai/megallmClient.ts` that mirrors `ai/glmClient.ts` / `ai/openrouterClient.ts` but points at MegaLLM's base URL:

```ts
// ai/megallmClient.ts
import OpenAI from 'openai';

const MEGALLM_API_KEY = import.meta.env.VITE_MEGALLM_API_KEY;
const MEGALLM_BASE_URL = 'https://ai.megallm.io/v1';

let megaClientInstance: OpenAI | null = null;

export function isMegaLLMConfigured(): boolean {
  return Boolean(MEGALLM_API_KEY);
}

export function getMegaLLMClient(): OpenAI {
  if (!MEGALLM_API_KEY) {
    throw new Error('VITE_MEGALLM_API_KEY is not configured for MegaLLM provider.');
  }

  if (!megaClientInstance) {
    megaClientInstance = new OpenAI({
      apiKey: MEGALLM_API_KEY,
      baseURL: MEGALLM_BASE_URL,
      // Match GLM/OpenRouter pattern for browser usage if needed:
      dangerouslyAllowBrowser: true,
    });
  }

  return megaClientInstance;
}
```

This follows MegaLLM's official OpenAI SDK examples while fitting the existing client-wrapper pattern.

### 3. Implement MegaLLM provider operations

Add a new module `ai/megallm.ts` that mirrors the function surface of `ai/gemini.ts`, `ai/glm.ts`, and `ai/openrouter.ts`:

```ts
// ai/megallm.ts
import type OpenAI from 'openai';
import { getMegaLLMClient, isMegaLLMConfigured } from './megallmClient';
import type {
  GenerateStylesOptions,
  StreamHtmlArtifactOptions,
  StreamReactComponentOptions,
  StreamSnippetExtractionOptions,
  StreamSnippetToReactOptions,
  StreamVariationsOptions,
} from './gemini';

export { isMegaLLMConfigured };

const DEFAULT_MEGALLM_MODEL = 'gpt-5';

async function* iterateStream(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): AsyncGenerator<string, void, unknown> {
  for await (const chunk of stream) {
    const text = chunk.choices?.[0]?.delta?.content ?? '';
    if (text) {
      yield text;
    }
  }
}

export async function megaGenerateStyles(
  options: GenerateStylesOptions
): Promise<string[]> {
  const { prompt, isDesignSystemMode = false, modelId = DEFAULT_MEGALLM_MODEL } = options;
  const client = getMegaLLMClient();

  const systemPrompt =
    'You are a UI design director returning ONLY JSON arrays of style names. No explanations, no markdown, just the raw JSON array.';

  const userPrompt = isDesignSystemMode
    ? `Generate 3 distinct Brand Personalities for: "${prompt}". Return ONLY a raw JSON array of 3 names.`
    : `Generate 3 distinct design directions for: "${prompt}". Return ONLY a raw JSON array of 3 names.`;

  const response = await client.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content ?? '[]';
  return JSON.parse(text);
}

export async function* megaStreamHtmlArtifact(
  options: StreamHtmlArtifactOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, modelId = DEFAULT_MEGALLM_MODEL } = options;
  const client = getMegaLLMClient();

  const systemPrompt =
    'You output ONLY raw HTML+CSS without markdown code fences or explanations. Start directly with <!DOCTYPE html> or <html>.';

  const stream = await client.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    stream: true,
  });

  yield* iterateStream(stream);
}

// Similar functions can be defined for:
// - megaStreamReactComponent
// - megaStreamSnippetExtraction
// - megaStreamSnippetToReact
// - megaStreamVariations
// mirroring GLM/OpenRouter but using the MegaLLM client.
```

These snippets closely follow both MegaLLM's streaming examples and the existing GLM/OpenRouter implementations.

### 4. Wire MegaLLM into the facade

Update `ai/generate.ts` to route requests through MegaLLM when `provider === 'megallm'`.
For example, for styles generation:

```ts
// ai/generate.ts (conceptual excerpt)
import { megaGenerateStyles, megaStreamHtmlArtifact, /* ... */ } from './megallm';

function selectGenerateStylesFn(provider: ProviderId) {
  switch (provider) {
    case 'megallm':
      return megaGenerateStyles;
    case 'openrouter':
      return openRouterGenerateStyles;
    case 'glm':
      return glmGenerateStyles;
    default:
      return geminiGenerateStyles;
  }
}

function selectStreamHtmlArtifactFn(provider: ProviderId) {
  switch (provider) {
    case 'megallm':
      return megaStreamHtmlArtifact;
    case 'openrouter':
      return openRouterStreamHtmlArtifact;
    case 'glm':
      return glmStreamHtmlArtifact;
    default:
      return geminiStreamHtmlArtifact;
  }
}
```

Error normalization and fallback can be handled via the existing `normalizeError` and `shouldAttemptFallback` helpers:

- If MegaLLM errors with a transient condition (e.g., HTTP 429 or temporary provider outage), treat that as a candidate for fallback.  
- Decide whether MegaLLM should fall back to Gemini, GLM, or OpenRouter; the simplest initial strategy is `megallm → gemini` fallback for critical flows.


## Implementation Cheat Sheet

This section provides concrete snippets and a step-by-step checklist to go from the current three-provider setup (Gemini + GLM + OpenRouter) to a four-provider configuration including MegaLLM.

### A. Minimal MegaLLM client setup

**Goal:** Configure an OpenAI-compatible MegaLLM client that matches existing GLM/OpenRouter patterns.

```ts
// ai/megallmClient.ts
import OpenAI from 'openai';

const MEGALLM_API_KEY = import.meta.env.VITE_MEGALLM_API_KEY;
const MEGALLM_BASE_URL = 'https://ai.megallm.io/v1';

let megaClientInstance: OpenAI | null = null;

export function isMegaLLMConfigured(): boolean {
  return Boolean(MEGALLM_API_KEY);
}

export function getMegaLLMClient(): OpenAI {
  if (!MEGALLM_API_KEY) {
    throw new Error('VITE_MEGALLM_API_KEY is not configured for MegaLLM provider.');
  }

  if (!megaClientInstance) {
    megaClientInstance = new OpenAI({
      apiKey: MEGALLM_API_KEY,
      baseURL: MEGALLM_BASE_URL,
      dangerouslyAllowBrowser: true,
    });
  }

  return megaClientInstance;
}
```

This is directly aligned with MegaLLM's API reference examples for JS (`baseURL: 'https://ai.megallm.io/v1'`) and the existing GLM/OpenRouter clients.

### B. Provider registry and configuration

**Goal:** Expose MegaLLM models and configuration alongside existing providers.

```ts
// ai/providers.ts
export type ProviderId = 'gemini' | 'glm' | 'openrouter' | 'megallm';

export const MODELS: ProviderModel[] = [
  // Existing models...
  {
    id: 'gpt-5',
    name: 'GPT-5 (MegaLLM)',
    description: 'High-reasoning model via MegaLLM.',
    provider: 'megallm',
    kind: 'design',
  },
  {
    id: 'gpt-4',
    name: 'GPT-4 (MegaLLM)',
    description: 'General-purpose model for interactive flows.',
    provider: 'megallm',
    kind: 'component',
  },
];

export const PROVIDER_CONFIG: Record<ProviderId, ProviderConfig> = {
  // Existing entries...
  megallm: {
    id: 'megallm',
    name: 'MegaLLM',
    description: 'Multi-provider routing via MegaLLM.',
    envKey: 'VITE_MEGALLM_API_KEY',
    isConfigured: () => Boolean(import.meta.env.VITE_MEGALLM_API_KEY),
  },
};
```

This ensures UI provider/model selectors automatically include MegaLLM once wired.

### C. MegaLLM operations mirroring GLM/OpenRouter

**Goal:** Implement MegaLLM functions with signatures identical to existing providers so `ai/generate.ts` can route without special cases.

```ts
// ai/megallm.ts (simplified)
import type OpenAI from 'openai';
import { getMegaLLMClient, isMegaLLMConfigured } from './megallmClient';
import type {
  GenerateStylesOptions,
  StreamHtmlArtifactOptions,
  StreamReactComponentOptions,
  StreamSnippetExtractionOptions,
  StreamSnippetToReactOptions,
  StreamVariationsOptions,
} from './gemini';

export { isMegaLLMConfigured };

const DEFAULT_MEGALLM_MODEL = 'gpt-5';

async function* iterateStream(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): AsyncGenerator<string, void, unknown> {
  for await (const chunk of stream) {
    const text = chunk.choices?.[0]?.delta?.content ?? '';
    if (text) yield text;
  }
}

export async function megaGenerateStyles(
  options: GenerateStylesOptions
): Promise<string[]> {
  const { prompt, isDesignSystemMode = false, modelId = DEFAULT_MEGALLM_MODEL } = options;
  const client = getMegaLLMClient();

  const systemPrompt = 'You are a UI design director returning ONLY JSON arrays of style names.';

  const userPrompt = isDesignSystemMode
    ? `Generate 3 distinct Brand Personalities for: "${prompt}". Return ONLY a raw JSON array of 3 names.`
    : `Generate 3 distinct design directions for: "${prompt}". Return ONLY a raw JSON array of 3 names.`;

  const response = await client.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content ?? '[]';
  return JSON.parse(text);
}

export async function* megaStreamHtmlArtifact(
  options: StreamHtmlArtifactOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, modelId = DEFAULT_MEGALLM_MODEL } = options;
  const client = getMegaLLMClient();

  const systemPrompt =
    'You output ONLY raw HTML+CSS without markdown code fences or explanations. Start directly with <!DOCTYPE html> or <html>.';

  const stream = await client.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    stream: true,
  });

  yield* iterateStream(stream);
}

// Additional functions mirror GLM/OpenRouter for components, snippets, and variations.
```

This uses MegaLLM's documented streaming format (`stream: true` and `for await (const chunk of stream)`) and matches the GLM/OpenRouter structure.

### D. Facade routing and fallback strategy

**Goal:** Integrate MegaLLM into `ai/generate.ts` with minimal branching and clear fallback rules.

Conceptually, for each high-level facade function:

```ts
function selectStreamVariationsFn(provider: ProviderId) {
  switch (provider) {
    case 'megallm':
      return megaStreamVariations;
    case 'openrouter':
      return openRouterStreamVariations;
    case 'glm':
      return glmStreamVariations;
    default:
      return geminiStreamVariations;
  }
}
```

For error handling, reuse `normalizeError` and `shouldAttemptFallback` from `ai/errors.ts`:

- Treat MegaLLM rate limits (429) and transient network issues as retry/fallback candidates.  
- Optionally implement `megallm → gemini` or `megallm → glm` fallback for critical flows (e.g., style generation) while keeping MegaLLM as the primary provider when configured.

### E. UI and state integration

While not part of this research task's implementation, the UI should:

- Read `MODELS` and `PROVIDER_CONFIG` to build provider/model selection controls.  
- Surface MegaLLM as a selectable provider alongside Gemini, GLM, and OpenRouter.  
- Disable MegaLLM options if `isMegaLLMConfigured()` is false.  
- Pass `provider: 'megallm'` and the selected MegaLLM model ID into the facade functions.

Because provider selection is already in place for GLM and OpenRouter, MegaLLM should be added as a first-class option rather than a special-case toggle.


## Step-by-Step Checklist: Gemini + GLM + OpenRouter → + MegaLLM

1. **Environment and configuration**  
   - Add `VITE_MEGALLM_API_KEY` to `.env.local` and deployment secrets.  
   - Confirm keys are never committed to source control.  
   - Optionally add a small check or health probe that ensures MegaLLM auth works in non-production environments.

2. **Client module**  
   - Implement `ai/megallmClient.ts` as described above.  
   - Verify `isMegaLLMConfigured()` returns `false` when the key is missing and `true` when present.

3. **Provider registry updates**  
   - Extend `ProviderId` to include `'megallm'`.  
   - Add at least one design-oriented and one component-oriented MegaLLM model to `MODELS`.  
   - Add a `megallm` entry to `PROVIDER_CONFIG` with `envKey: 'VITE_MEGALLM_API_KEY'` and a correct `isConfigured()` implementation.

4. **MegaLLM provider module**  
   - Create `ai/megallm.ts` with functions mirroring `ai/glm.ts` / `ai/openrouter.ts`.  
   - Reuse system/user prompt templates from existing providers to keep behavior consistent across providers.  
   - Implement streaming with `stream: true` and an `iterateStream` helper as in the Streaming docs.

5. **Facade integration**  
   - Update selector helpers in `ai/generate.ts` (`selectGenerateStylesFn`, `selectStreamHtmlArtifactFn`, `selectStreamReactComponentFn`, etc.) to handle `'megallm'`.  
   - Decide on and implement MegaLLM fallback behavior using `normalizeError` and `shouldAttemptFallback`.

6. **UI wiring**  
   - Extend model/provider selection UI to include MegaLLM models.  
   - Ensure state flows correctly pass `provider` and `modelId` to all facade entry points.  
   - Implement UX affordances for "provider not configured" states.

7. **Testing and validation**  
   - With `VITE_MEGALLM_API_KEY` set, run the main flows (styles, HTML artifact streaming, React component streaming, snippet extraction, snippet-to-React, variations) using MegaLLM models.  
   - Verify streaming behavior and latency match expectations.  
   - Intentionally hit rate limits in a non-production environment (if possible) to ensure errors are normalized and surfaced cleanly.  
   - Confirm that disabling MegaLLM (removing the API key) cleanly hides it from the UI and avoids runtime errors.

Following this plan, MegaLLM becomes a fourth provider integrated through the existing provider facade, preserving all existing Gemini/GLM/OpenRouter functionality while giving users access to a broader, vendor-agnostic model catalog.
