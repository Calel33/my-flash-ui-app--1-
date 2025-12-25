## Overview of z.ai GLM for Flash UI

z.ai provides GLM-series large language models (e.g. `glm-4.7`) over a standard HTTP API at `https://api.z.ai/api/paas/v4`, with an optional Coding endpoint `https://api.z.ai/api/coding/paas/v4` for code-focused workloads. Auth is handled via an API key passed as a Bearer token in the `Authorization` header, and the platform exposes both native SDKs (Python/Java) and an OpenAI-compatible surface for Python/Node/Java that can be configured by pointing the OpenAI client at the z.ai base URL with a Z.AI API key. For this app, the OpenAI-compatible Node SDK is the most ergonomic choice because it matches the existing pattern of creating a client once and then issuing chat completions with streaming support.


## Current Gemini Integration in `my-flash-ui-app`

The app is a Vite + React 19 SPA that imports `GoogleGenAI` from `@google/genai` in `index.tsx` and uses it directly in several UI callbacks. Key characteristics:

- **Client construction**: In multiple callbacks, it does `const apiKey = process.env.API_KEY; const ai = new GoogleGenAI({ apiKey });` and throws if the key is missing.
- **Models**: A local `AVAILABLE_MODELS` constant defines Gemini models used in the UI, e.g. `gemini-3-flash-preview` and `gemini-3-pro-preview`, and handlers select between them (`componentModel`, `designSystemModel`).
- **Streaming HTML generation**: For design generation and HTML/React conversion flows, it calls `ai.models.generateContentStream({ model, contents, config })` and iterates `for await (const chunk of responseStream)`; each chunk’s `text` is appended, cleaned of code fences, and written into React state.
- **Non-streaming calls**: For style/direction generation (JSON array of style names), it uses `ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { role: 'user', parts: [{ text }] } })`, then parses `styleResponse.text` to extract JSON.
- **Usage points** (all in `index.tsx`):
  - Initial single-snippet HTML-to-HTML transformation for the “Port snippet to Flash UI stage”.
  - `handlePortSnippetToReact`: HTML/CSS → React component conversion (streaming, model = `componentModel`).
  - `handleGenerateVariations`: generate 3 conceptual variations of an artifact via streaming JSON-like output.
  - Main `handleSendMessage` and inner `generateArtifact` pipeline: chat-like request → generate style directions (non-streaming) → generate multiple artifacts per style via streaming HTML.

There is **no explicit provider abstraction today**: the UI and business logic assume a single provider (Gemini) and reference Gemini model IDs directly in handlers.


## Gemini vs GLM: Concept Mapping

This section maps the existing Gemini usage to GLM concepts from the z.ai docs.

- **Auth**
  - *Gemini*: API key read from `process.env.API_KEY` and passed into `new GoogleGenAI({ apiKey })`. In the built bundle, this becomes an inlined string; there is no backend proxy in the current app.
  - *GLM*: API key created and managed in the Z.AI console, then sent as `Authorization: Bearer YOUR_API_KEY` in HTTP headers. In Node/TS, the OpenAI-compatible client is configured as:
    - `new OpenAI({ apiKey: process.env.ZAI_API_KEY, baseURL: 'https://api.z.ai/api/paas/v4/' })`.
  - *Implication*: For parity with existing behavior, the simplest path is another environment variable for the GLM key (or reuse the same key name if Gemini is migrated) and direct usage in the client constructor. A more secure architecture would route GLM calls through a backend proxy.

- **Endpoints**
  - *Gemini*: Uses `@google/genai` SDK which hides raw endpoints; models are referenced by ID (`gemini-3-flash-preview`, `gemini-3-pro-preview`).
  - *GLM*: Default API base URL `https://api.z.ai/api/paas/v4`, plus an optional coding endpoint `https://api.z.ai/api/coding/paas/v4` for dev tooling scenarios. Chat completions are via `/chat/completions` and accept OpenAI-style payloads.

- **Model naming and capabilities**
  - *Gemini*: `gemini-3-flash-preview` (faster, higher rate limits) and `gemini-3-pro-preview` (more capable, lower rate limits), configured via `AVAILABLE_MODELS` and internal state.
  - *GLM*: GLM family models (e.g. `glm-4.7`, `glm-4.6V` for multimodal). For this app, `glm-4.7` is the closest analogue to the “flagship” model; a lighter/cheaper GLM variant can be introduced later if needed.
  - *Implication*: Model IDs should become data in a provider-agnostic model registry, e.g. `Provider = 'gemini' | 'glm'`, each with its own list of `{ id, name, description, capabilities }`.

- **Request format**
  - *Gemini*: Uses `generateContent` / `generateContentStream` with a `contents` array of `{ role, parts: [{ text }] }` and optional `config` (e.g. `thinkingConfig`).
  - *GLM*: Uses OpenAI-style `chat.completions.create({ model, messages: [{ role, content }], stream?: boolean, temperature?, max_tokens?, thinking? })`.
  - *Mapping*: The prompt building logic in this app can be reused verbatim; only the wrapper that formats messages and sends them needs to branch by provider.

- **Streaming**
  - *Gemini*: `generateContentStream` returns an async iterable; each chunk exposes `text` and the app appends text into a buffer, cleans code fences, and writes to state.
  - *GLM*: When `stream: true` is set, the `/chat/completions` API returns a stream; using the OpenAI JS SDK, you receive an async iterator where each chunk exposes `choices[0].delta.content` and optionally reasoning deltas for GLM reasoning models.
  - *Implication*: The app’s existing `for await` loops can be adapted to a provider-agnostic streaming helper that yields normalized text chunks.

- **Errors, rate limits, pricing**
  - *Gemini*: Errors are caught and surfaced in UI as basic error messages; rate-limit behavior is implicit (no custom handling).
  - *GLM*: z.ai documents standard HTTP error behavior plus the GLM Coding Plan (higher usage, lower cost) but does not fix exact numeric limits in the quick-start. The integration guide should treat rate limiting abstractly (e.g. `429` → backoff, fallback provider) rather than hard-coding values.


## Recommended Dual-Provider Architecture

Goal: add GLM as an additional provider while keeping all Gemini flows intact and minimizing duplication.

**Key design principles**

- Introduce a **provider abstraction** that isolates provider-specific concerns (auth, base URL, request formatting, streaming parsing) from the rest of the React UI.
- Treat *provider* and *model* as first-class pieces of app state, but default to the current Gemini setup so existing behavior is unchanged until explicitly switched.
- Keep all prompt construction logic in one place so both providers share prompt templates and output expectations.

**Core building blocks**

- `ProviderId` union: `type ProviderId = 'gemini' | 'glm';`.
- `ModelOption`: `{ id: string; name: string; description: string; provider: ProviderId; kind: 'design' | 'component' | 'system'; }`.
- `PROVIDER_CONFIG` registry that describes auth/env vars and model lists per provider:
  - `gemini`: existing `AVAILABLE_MODELS`, plus metadata for design-system vs component usage.
  - `glm`: GLM entries like `{ id: 'glm-4.7', name: 'GLM 4.7', description: 'Flagship GLM for UI generation', provider: 'glm', kind: 'component' }`.
- A provider-agnostic **AI client facade** module, e.g. `aiClient.ts`, exporting high-level functions:
  - `createHtmlArtifactStream({ provider, modelId, prompt })` → async iterator of text chunks.
  - `createReactComponentStream({ provider, modelId, html })` → text stream of TSX.
  - `createStyleDirections({ provider, prompt })` → non-streaming call returning an array of strings.

The React layer (`index.tsx`) would call these facades instead of using `GoogleGenAI` directly; the facade decides whether to call Gemini or GLM clients.


## Detailed Implementation Plan

### 1. Client initialization and auth for GLM

- **Env vars**
  - Introduce `ZAI_API_KEY` (or `VITE_ZAI_API_KEY` if kept purely client-side) as the GLM secret.
  - In a more secure rollout, expose a `VITE_API_PROXY_URL` and route GLM requests via a server-side proxy that injects the key and performs rate limiting; the guide should call this out as the preferred long-term design.

- **Client construction (frontend, OpenAI-compatible)**

```ts
// ai/glmClient.ts
import OpenAI from 'openai';

const glmClient = new OpenAI({
  apiKey: import.meta.env.VITE_ZAI_API_KEY, // or process.env.ZAI_API_KEY in a Node layer
  baseURL: 'https://api.z.ai/api/paas/v4/',
});

export { glmClient };
```

- **Security considerations**
  - Avoid shipping the raw GLM key to browsers where possible; prefer a backend (Node server, serverless function, or Vite dev proxy) that holds `ZAI_API_KEY` and exposes a thin `/api/glm/chat` endpoint.
  - If mirroring current Gemini behavior (key inlined at build), make it explicit in docs that this is acceptable only for low-risk usage and should be revisited before production.


### 2. Provider-agnostic generation APIs

Design a small interface that both Gemini and GLM implementations satisfy:

```ts
type GenerationKind = 'style-directions' | 'artifact-html' | 'artifact-react';

interface ProviderApi {
  id: ProviderId;
  generateStyles(prompt: string): Promise<string[]>;
  streamHtmlArtifact(args: { prompt: string; modelId: string }): AsyncIterable<string>;
  streamReactComponent(args: { html: string; modelId: string }): AsyncIterable<string>;
}
```

- Implement `GeminiProviderApi` using existing `GoogleGenAI` calls (refactor current code into a module without changing behavior).
- Implement `GlmProviderApi` using the OpenAI-compatible GLM client.
- A `getProviderApi(providerId)` helper returns the correct implementation.


### 3. GLM chat and streaming patterns

Using the OpenAI-compatible Node SDK from the docs:

- **Non-streaming example (style directions)**

```ts
import { glmClient } from './glmClient';

export async function glmGenerateStyles(prompt: string): Promise<string[]> {
  const completion = await glmClient.chat.completions.create({
    model: 'glm-4.7',
    messages: [
      { role: 'system', content: 'You are a UI design director returning ONLY JSON arrays of style names.' },
      { role: 'user', content: prompt },
    ],
    stream: false,
  });

  const raw = completion.choices[0]?.message?.content ?? '[]';
  const match = raw.match(/\[[\s\S]*\]/);
  return match ? JSON.parse(match[0]) : [];
}
```

- **Streaming example (HTML artifact)**

```ts
export async function* glmStreamHtmlArtifact(prompt: string, modelId = 'glm-4.7') {
  const stream = await glmClient.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: 'You output ONLY raw HTML+CSS without markdown or explanations.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta;
    const text = delta?.content ?? '';
    if (text) yield text;
  }
}
```

These helpers mirror the existing Gemini `for await` flow and can be dropped into the same React callbacks with minimal changes once the provider abstraction is in place.


### 4. Representing provider + model in app state

- **State shape**
  - Add `provider: ProviderId` state at the top level (default `'gemini'`).
  - Derive `availableModels` from `PROVIDER_CONFIG[provider]` and expose them via a dropdown in the UI.
  - Keep separate selections if desired, e.g. `selectedComponentModel`, `selectedDesignSystemModel`, each tied to the current provider.

- **Plumbing into handlers**
  - Update generation callbacks (`handleSendMessage`, `generateArtifact`, `handlePortSnippetToReact`, `handleGenerateVariations`) to call the provider-agnostic APIs with explicit `provider` and `modelId`.
  - Ensure default behavior uses the same Gemini IDs as today when `provider === 'gemini'` and the user has not changed anything.


### 5. Error handling, timeouts, and fallbacks

- **Error normalization**
  - Wrap provider-specific errors (SDK exceptions, HTTP `4xx/5xx`) into a standard shape: `{ code?: string; status?: number; provider: ProviderId; message: string }`.
  - Log the raw error (in dev tools / console) but surface only user-friendly messages in the UI.

- **Timeouts**
  - For streaming calls, layer a timeout wrapper around the async iterator: if no chunks arrive within N seconds, abort the request and mark the artifact as errored.
  - For non-streaming calls, use `Promise.race` against a timeout promise or configure SDK-level timeouts if available.

- **Fallback strategy**
  - Optional: if GLM returns a transient error (network issue, `5xx`) or `429` and Gemini is available, the facade can retry once with Gemini using the same prompt and similar model capabilities.
  - Document this as a feature-flagged behavior so it can be disabled if cost or consistency is a concern.


## Implementation Cheat Sheet

This section gives concrete snippets and a step-by-step checklist to go from Gemini-only to dual-provider.

### A. Minimal GLM client setup (OpenAI-compatible)

```ts
// ai/glmClient.ts
import OpenAI from 'openai';

export const glmClient = new OpenAI({
  apiKey: process.env.ZAI_API_KEY, // or import.meta.env.VITE_ZAI_API_KEY in Vite
  baseURL: 'https://api.z.ai/api/paas/v4/',
});
```

### B. Provider registry and state

```ts
// ai/providers.ts
export type ProviderId = 'gemini' | 'glm';

export interface ProviderModel {
  id: string;
  name: string;
  description: string;
  provider: ProviderId;
  kind: 'design' | 'component' | 'system';
}

export const MODELS: ProviderModel[] = [
  { id: 'gemini-3-flash-preview', name: 'Flash (Faster)', description: 'Higher rate limits, good for components', provider: 'gemini', kind: 'component' },
  { id: 'gemini-3-pro-preview', name: 'Pro (Smarter)', description: 'Lower rate limits, better for complex systems', provider: 'gemini', kind: 'component' },
  { id: 'glm-4.7', name: 'GLM 4.7', description: 'Flagship GLM for UI + layout generation', provider: 'glm', kind: 'component' },
];
```

In `index.tsx`, derive:

```ts
const [provider, setProvider] = useState<ProviderId>('gemini');
const availableComponentModels = MODELS.filter(m => m.provider === provider && m.kind === 'component');
```

### C. Provider-agnostic generation facade

```ts
// ai/generate.ts
import { ProviderId } from './providers';
import { glmGenerateStyles, glmStreamHtmlArtifact } from './glm';
import { geminiGenerateStyles, geminiStreamHtmlArtifact } from './gemini';

export async function generateStyles(provider: ProviderId, prompt: string) {
  return provider === 'glm' ? glmGenerateStyles(prompt) : geminiGenerateStyles(prompt);
}

export function streamHtmlArtifact(provider: ProviderId, args: { prompt: string; modelId: string }) {
  return provider === 'glm' ? glmStreamHtmlArtifact(args.prompt, args.modelId) : geminiStreamHtmlArtifact(args.prompt, args.modelId);
}
```

### D. Wiring into existing flows (example)

Replace the direct Gemini usage in `handleSendMessage`/`generateArtifact` with the facade:

```ts
// inside generateArtifact
const stream = streamHtmlArtifact(provider, { prompt: finalPrompt, modelId: isDesignSystemMode ? designSystemModel : componentModel });

let accumulated = '';
for await (const chunk of stream) {
  accumulated += chunk;
  const clean = accumulated.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '');
  // update artifact HTML in state
}
```

Similarly, use `generateStyles(provider, stylePrompt)` instead of calling `ai.models.generateContent` directly.

### E. Step-by-step rollout checklist

1. **Prep environment**
   - Obtain a Z.AI API key and store it as `ZAI_API_KEY` (server-side) or `VITE_ZAI_API_KEY` (client-side, mirroring current Gemini behavior).
   - If adding a backend proxy, create a minimal `/api/glm/chat` endpoint that wraps `glmClient.chat.completions.create`.

2. **Introduce provider types and registry**
   - Add `ProviderId` and `MODELS` registry without changing any UI behavior.
   - Default provider to `'gemini'` and ensure the existing Gemini models remain the default selection.

3. **Refactor Gemini calls behind a facade**
   - Extract current `GoogleGenAI` usage into a `gemini` module implementing `ProviderApi`.
   - Update `index.tsx` to call the facade but keep `provider` hard-coded to `'gemini'` for now.

4. **Implement GLM provider**
   - Add `glmClient` and implement `GlmProviderApi` using `chat.completions.create` (non-streaming for styles, streaming for artifacts/components) following the official docs.
   - Write small tests or manual scripts to validate GLM responses (shape, streaming behavior) before wiring into the UI.

5. **Enable provider selection in UI**
   - Add a simple provider toggle (e.g. dropdown or segmented control) at the top of the UI, bound to `provider` state.
   - When `provider === 'glm'`, ensure GLM models appear in the model dropdown and the facade routes calls appropriately.

6. **Add error handling and optional fallback**
   - Normalize errors in the facade, surface concise messages, and log detailed errors in dev.
   - Optionally, on GLM errors, attempt a single fallback call to Gemini and mark the artifact accordingly.

7. **Verify no regressions**
   - Run through all existing flows (design system mode, component mode, snippet import, React conversion, variations) with provider = `gemini` and confirm behavior is unchanged.
   - Repeat key flows with provider = `glm`, validating streaming behavior, generated HTML/React quality, and UI responsiveness.

This guide should give future engineers a clear, incremental path to bringing GLM into `my-flash-ui-app` alongside Gemini without disrupting current usage, while leaving room for a more secure backend-mediated deployment when needed.
