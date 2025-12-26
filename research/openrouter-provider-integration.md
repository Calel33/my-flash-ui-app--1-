## Overview of OpenRouter for Flash UI

OpenRouter is a routing layer over 300+ language models exposed via a unified HTTP API and SDKs. For TypeScript, it offers two main integration surfaces:

- An **OpenAI-compatible API** at `https://openrouter.ai/api/v1`, which works with the standard `openai` Node SDK by overriding `baseURL` and `apiKey` (and optionally adding `defaultHeaders` such as `HTTP-Referer` and `X-Title`).
- A **first-party TypeScript SDK** (`@openrouter/sdk`) that provides type-safe wrappers like `client.chat.send(...)` for chat models plus helper functions for listing models, providers, and endpoints.

In `my-flash-ui-app`, you already have a dual-provider architecture:

- **Gemini** via `@google/genai` in `ai/gemini.ts`.
- **GLM** via the `openai` SDK in `ai/glmClient.ts` and `ai/glm.ts`, pointing at `https://api.z.ai/api/paas/v4/` with `dangerouslyAllowBrowser: true` for frontend usage.

OpenRouter can be introduced as a third provider that follows the same pattern as GLM: a small client wrapper, a set of provider-specific functions mirroring Gemini/GLM, and integration through the existing provider facade in `ai/generate.ts` and registries in `ai/providers.ts`.

Key OpenRouter concepts relevant to this app:

- **API keys** – Managed as `OPENROUTER_API_KEY` (or a Vite `VITE_OPENROUTER_API_KEY`) and passed to either `@openrouter/sdk` or `openai` with `baseURL: 'https://openrouter.ai/api/v1'`.
- **Model naming** – Models are addressed by provider-prefixed IDs like `openai/gpt-4o`, `meta-llama/llama-3.1-70b-instruct`, or `mistralai/mistral-large`. Your app’s `MODELS` registry will need to map user-friendly names to these IDs.
- **Streaming** – Both the OpenAI-compatible API and the `@openrouter/sdk` support streaming chat responses via async iterators, which matches the streaming patterns used today for Gemini and GLM.
- **Routing and limits** – OpenRouter applies rate limits and model-specific constraints; your existing `ai/errors.ts` normalization and fallback logic can be extended to treat OpenRouter errors consistently.

The goal is to integrate OpenRouter as another first-class provider so users can select it in the UI and run the same artifact generation flows against OpenRouter-backed models, without breaking existing Gemini/GLM behavior.

## Comparison: Gemini + GLM vs OpenRouter

### Client construction

- **Gemini (`ai/gemini.ts`)**
  - Uses `GoogleGenAI` from `@google/genai`.
  - API key pulled from `process.env.API_KEY`.
  - `getGeminiClient()` lazily constructs a singleton client; functions like `geminiGenerateStyles` and `geminiStreamHtmlArtifact` reuse it.

- **GLM (`ai/glmClient.ts`, `ai/glm.ts`)**
  - Uses `OpenAI` from `openai` with `baseURL: 'https://api.z.ai/api/paas/v4/'`.
  - API key is `import.meta.env.VITE_ZAI_API_KEY`.
  - `getGlmClient()` lazily constructs and caches a singleton client and exposes `isGlmConfigured()`.
  - `ai/glm.ts` exports a family of functions (`glmGenerateStyles`, `glmStreamHtmlArtifact`, `glmStreamReactComponent`, `glmStreamSnippetExtraction`, `glmStreamSnippetToReact`, `glmStreamVariations`) that mirror Gemini’s exports but call the GLM client instead.

- **OpenRouter (proposed)**
  - Two viable approaches:
    - **OpenAI-compatible**: reuse the `openai` SDK, configured with `baseURL: 'https://openrouter.ai/api/v1'` and an OpenRouter API key.
    - **Native SDK**: use `@openrouter/sdk` with `new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })`.
  - For consistency with GLM and simpler streaming integration, the OpenAI-compatible path is likely the best fit for this app.
  - A new `ai/openrouterClient.ts` can mirror `ai/glmClient.ts` but point at OpenRouter’s base URL and optionally set `defaultHeaders`.

### Auth and environment configuration

- Gemini uses `API_KEY` read from `process.env`.
- GLM uses `VITE_ZAI_API_KEY` read via `import.meta.env`.
- OpenRouter typically uses `OPENROUTER_API_KEY` (or an equivalent Vite env var). You should pick a naming convention consistent with existing providers, e.g. `VITE_OPENROUTER_API_KEY`.
- OpenRouter recommends adding optional headers:
  - `HTTP-Referer`: public URL of your app.
  - `X-Title`: human-readable app name.

These can be configured in the client wrapper so downstream code does not need to know about them.

### Models and selection

- `ai/providers.ts` defines:
  - `ProviderId = 'gemini' | 'glm'`.
  - `ProviderModel` / `MODELS` with Gemini and GLM entries.
  - `ProviderConfig` / `PROVIDER_CONFIG` with details like `envKey` and `isConfigured()`.
- Gemini models are named like `gemini-3-flash-preview` and `gemini-3-pro-preview`.
- GLM is represented by a single `glm-4.7` entry for now.
- OpenRouter models will be strings like `openai/gpt-4o`, `meta-llama/llama-3.1-8b-instruct`, etc., which you should store in `MODELS` as `id` values while exposing user-friendly `name` and `description` fields.

### Streaming and error handling

- Gemini streaming uses `ai.models.generateContentStream(...)` and yields `chunk.text`.
- GLM streaming uses `glmClient.chat.completions.create(..., { stream: true })` and an `iterateStream` helper that yields `chunk.choices[0]?.delta?.content`.
- OpenRouter streaming via the OpenAI-compatible API looks nearly identical to GLM’s streaming: async iterator over chunks with `choices[].delta.content`.
- `ai/errors.ts` provides `normalizeError`, `AIProviderError`, and `shouldAttemptFallback`, currently tailored to GLM→Gemini fallback on transient errors.

For OpenRouter, you can reuse the same normalization and add provider-specific rules (e.g., whether to attempt fallback to Gemini or GLM on certain error codes).

## Recommended Integration Architecture

The existing architecture already treats providers as pluggable backends behind a common facade. OpenRouter should be integrated by extending that facade, not by adding ad hoc code paths.

### 1. Extend provider and model registries

- Update `ai/providers.ts` to introduce OpenRouter types and config:
  - Extend `ProviderId` to include `'openrouter'`.
  - Add one or more OpenRouter model entries to `MODELS`, e.g.:
    - `openai/gpt-4o` for high-quality design reasoning.
    - A faster model (e.g., a Mistral or LLaMA variant) for interactive flows.
  - Add a new `ProviderConfig` entry for OpenRouter that specifies:
    - `id: 'openrouter'`.
    - `envKey: 'VITE_OPENROUTER_API_KEY'` (or similar).
    - `isConfigured: () => Boolean(import.meta.env.VITE_OPENROUTER_API_KEY)`.

This keeps provider discovery and configuration logic centralized.

### 2. Introduce an OpenRouter client wrapper

- Add `ai/openrouterClient.ts` to encapsulate client construction:
  - Read the API key from `import.meta.env.VITE_OPENROUTER_API_KEY`.
  - Use `OpenAI` from `openai` with `baseURL: 'https://openrouter.ai/api/v1'`.
  - Optionally set `defaultHeaders` with `HTTP-Referer` and `X-Title`.
  - Expose `isOpenRouterConfigured()` and `getOpenRouterClient()` functions similar to the GLM client.

This avoids duplicating configuration across multiple call sites.

### 3. Implement OpenRouter-specific operations

- Create `ai/openrouter.ts` that mirrors `ai/glm.ts`:
  - Export functions with the same signatures as the Gemini/GLM ones:
    - `openRouterGenerateStyles(options: GenerateStylesOptions)`.
    - `openRouterStreamHtmlArtifact(options: StreamHtmlArtifactOptions)`.
    - `openRouterStreamReactComponent(options: StreamReactComponentOptions)`.
    - `openRouterStreamSnippetExtraction(options: StreamSnippetExtractionOptions)`.
    - `openRouterStreamSnippetToReact(options: StreamSnippetToReactOptions)`.
    - `openRouterStreamVariations(options: StreamVariationsOptions)`.
  - Internally:
    - Use the OpenRouter client to call `chat.completions.create(...)` with `model` set to the chosen OpenRouter model ID.
    - Adopt the same system/user prompt patterns currently used for Gemini/GLM so behavior remains consistent across providers.
    - Provide an `iterateStream` helper for streaming, analogous to the GLM implementation.

By keeping signatures identical, `ai/generate.ts` can swap providers with minimal branching.

### 4. Route through the provider facade (`ai/generate.ts`)

The `ai/generate.ts` module is the provider-agnostic entry point. It currently:

- Accepts a `{ provider: ProviderId, ... }` option.
- Chooses the right implementation (`glm*` vs `gemini*`) based on `provider`.
- Wraps calls in `withTimeout` and normalizes errors.
- Implements GLM→Gemini fallback on transient failures.

To add OpenRouter:

- Extend the conditional routing so that, for each high-level function, there are three branches: Gemini, GLM, and OpenRouter.
- Decide on fallback behavior:
  - e.g., Only fallback from OpenRouter to Gemini on transient errors.
  - Reuse `AIProviderError` and `normalizeError` for consistent messaging.
- Ensure that all call sites pass `provider` and `modelId` explicitly so new options appear in the UI without breaking existing flows.

### 5. UI and state integration

On the UI side (not implemented in this research task), the model/provider selection mechanisms should:

- Use `MODELS` from `ai/providers.ts` to populate available options.
- Allow the user to select OpenRouter as a provider and choose among its models.
- Pass `provider: 'openrouter'` and the chosen model ID into the generation functions.

Because the app already supports provider selection between Gemini and GLM, OpenRouter should be added as another entry rather than a separate code path.

## Implementation Cheat Sheet

This section provides concrete snippets and a checklist for going from a Gemini + GLM setup to a three-provider configuration that includes OpenRouter.

### A. Minimal OpenRouter client setup (OpenAI-compatible)

```ts
// ai/openrouterClient.ts
import OpenAI from 'openai';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

let openRouterClientInstance: OpenAI | null = null;

export function isOpenRouterConfigured(): boolean {
  return Boolean(OPENROUTER_API_KEY);
}

export function getOpenRouterClient(): OpenAI {
  if (!OPENROUTER_API_KEY) {
    throw new Error('VITE_OPENROUTER_API_KEY is not configured for OpenRouter provider.');
  }

  if (!openRouterClientInstance) {
    openRouterClientInstance = new OpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Flash UI App',
      },
      dangerouslyAllowBrowser: true,
    });
  }

  return openRouterClientInstance;
}
```

### B. Provider registry and state

```ts
// ai/providers.ts
export type ProviderId = 'gemini' | 'glm' | 'openrouter';

export const MODELS: ProviderModel[] = [
  // Existing Gemini and GLM models...
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (OpenRouter)',
    description: 'General-purpose high-quality model via OpenRouter.',
    provider: 'openrouter',
    kind: 'design',
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B (OpenRouter)',
    description: 'Fast, smaller model suitable for interactive flows.',
    provider: 'openrouter',
    kind: 'component',
  },
];

export const PROVIDER_CONFIG: Record<ProviderId, ProviderConfig> = {
  // Existing gemini + glm entries...
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'OpenRouter multi-model routing API.',
    envKey: 'VITE_OPENROUTER_API_KEY',
    isConfigured: () => Boolean(import.meta.env.VITE_OPENROUTER_API_KEY),
  },
};
```

### C. OpenRouter provider implementation

```ts
// ai/openrouter.ts
import { getOpenRouterClient } from './openrouterClient';
import type OpenAI from 'openai';
import type {
  GenerateStylesOptions,
  StreamHtmlArtifactOptions,
  StreamReactComponentOptions,
  StreamSnippetExtractionOptions,
  StreamSnippetToReactOptions,
  StreamVariationsOptions,
} from './gemini';

const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o';

async function* iterateStream(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): AsyncGenerator<string, void, unknown> {
  for await (const chunk of stream) {
    const text = chunk.choices?.[0]?.delta?.content ?? '';
    if (text) yield text;
  }
}

export async function openRouterGenerateStyles(
  options: GenerateStylesOptions
): Promise<string[]> {
  const { prompt, isDesignSystemMode = false, modelId = DEFAULT_OPENROUTER_MODEL } = options;
  const client = getOpenRouterClient();

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

export async function* openRouterStreamHtmlArtifact(
  options: StreamHtmlArtifactOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, modelId = DEFAULT_OPENROUTER_MODEL } = options;
  const client = getOpenRouterClient();

  const stream = await client.chat.completions.create({
    model: modelId,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  yield* iterateStream(stream);
}

// Additional functions (stream React components, snippet extraction, etc.) follow
// the same pattern but with different system/user prompts.
```

### D. Facade routing and fallbacks

```ts
// ai/generate.ts (conceptual)
import { ProviderId } from './providers';
import {
  geminiGenerateStyles,
  geminiStreamHtmlArtifact,
  // ...other gemini functions
} from './gemini';
import {
  glmGenerateStyles,
  glmStreamHtmlArtifact,
  // ...other glm functions
} from './glm';
import {
  openRouterGenerateStyles,
  openRouterStreamHtmlArtifact,
  // ...other openrouter functions
} from './openrouter';
import { normalizeError, shouldAttemptFallback, withTimeout, DEFAULT_REQUEST_TIMEOUT_MS } from './errors';

export async function generateStylesWithProvider({ provider, ...rest }: GenerateStylesOptions & { provider: ProviderId }) {
  try {
    const fn =
      provider === 'openrouter'
        ? openRouterGenerateStyles
        : provider === 'glm'
        ? glmGenerateStyles
        : geminiGenerateStyles;

    return await withTimeout(fn(rest), DEFAULT_REQUEST_TIMEOUT_MS, provider);
  } catch (error) {
    const normalized = normalizeError(error, provider);
    // Optional: configure OpenRouter→Gemini fallback similar to GLM→Gemini.
    throw normalized;
  }
}
```

### E. Checklist: Gemini + GLM → + OpenRouter

1. **Add environment variable**
   - Define `VITE_OPENROUTER_API_KEY` in `.env.local` and wire it into your deployment environment.
   - Ensure it is not committed to source control.

2. **Create the OpenRouter client module**
   - Add `ai/openrouterClient.ts` following the pattern above.
   - Verify that `isOpenRouterConfigured()` behaves correctly when the key is missing.

3. **Extend provider registry**
   - Update `ProviderId` to include `'openrouter'`.
   - Add OpenRouter entries to `MODELS` with appropriate `id`, `name`, `description`, and `kind`.
   - Add an `openrouter` entry to `PROVIDER_CONFIG` with `envKey` and `isConfigured()`.

4. **Implement OpenRouter-specific operations**
   - Create `ai/openrouter.ts` with functions mirroring Gemini/GLM.
   - Reuse existing prompt patterns for style generation, HTML artifacts, React components, and variations.

5. **Wire OpenRouter into the facade**
   - Update `ai/generate.ts` to route based on `provider === 'openrouter'` in all high-level flows.
   - Decide on whether to add fallback behavior (e.g., OpenRouter→Gemini on transient errors) and implement it via `AIProviderError` and `shouldAttemptFallback`.

6. **Update UI selection (later implementation task)**
   - Extend provider/model selection controls to surface OpenRouter and its models using the `MODELS` registry.
   - Ensure `provider` and `modelId` are passed through to generation functions.

7. **Test end-to-end**
   - With `VITE_OPENROUTER_API_KEY` set, verify that:
     - Style generation, HTML artifact streaming, React component streaming, and variation flows work with OpenRouter.
     - Errors from OpenRouter are normalized and surfaced correctly to the UI.
     - Existing Gemini and GLM flows still behave as before.

By following this plan, you can introduce OpenRouter as a third provider with minimal duplication and a consistent developer experience across all AI backends in the app.
