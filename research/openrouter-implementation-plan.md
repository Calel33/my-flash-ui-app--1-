## OpenRouter Provider Implementation Plan

This plan describes how to add OpenRouter as a third AI provider in `my-flash-ui-app`, alongside the existing Gemini and GLM providers, while preserving current behavior. It is derived directly from `./research/openrouter-provider-integration.md`, especially **“Recommended Integration Architecture”** and **“Implementation Cheat Sheet”**, and is intended for a mid-level engineer.

Key goals:
- Allow users to select OpenRouter as a provider and choose from OpenRouter models.
- Reuse the existing provider architecture (`ai/providers.ts`, `ai/generate.ts`, `ai/errors.ts`, `ai/gemini.ts`, `ai/glm.ts`, `ai/glmClient.ts`).
- Respect constraints from `AGENTS.md` (no code deletion, design tokens only, backwards compatible, vertical-slice/component-first).

Assumptions:
- The research in `./research/openrouter-provider-integration.md` is up to date.
- OpenRouter will initially be used via the OpenAI-compatible API (`openai` SDK) as recommended in **“Comparison: Gemini + GLM vs OpenRouter”**.

---

## Phase 0 – Alignment & Preconditions

**Goal:** Ensure the engineer understands the existing architecture and the OpenRouter design before touching code.

Tasks:
1. **Review architecture & constraints**  
   - Read `./AGENTS.md` and `~/.factory/AGENTS.md` to internalize rules (design tokens only, no hard-coded styles, no code deletion, backwards compatibility, vertical slices).  
   - Skim `./ai/gemini.ts`, `./ai/glmClient.ts`, `./ai/glm.ts`, `./ai/providers.ts`, `./ai/generate.ts`, `./ai/errors.ts` to understand how providers are wired today (lazy client creation, streaming helpers, error normalization).  

2. **Study OpenRouter research**  
   - Thoroughly read `./research/openrouter-provider-integration.md`, focusing on:  
     - **Overview of OpenRouter for Flash UI** (API surface, model naming, streaming).  
     - **Comparison: Gemini + GLM vs OpenRouter** (client construction, auth, streaming).  
     - **Recommended Integration Architecture** (steps 1–5).  
     - **Implementation Cheat Sheet** and the **“Gemini + GLM → + OpenRouter” checklist**.  
   - Note every recommended step so you can map it to concrete tasks below.

Dependencies: none.

---

## Phase 1 – Environment & Configuration Setup

**Goal:** Configure environment variables and base URLs for OpenRouter without leaking secrets.

Tasks:
1. **Define OpenRouter API key env var**  
   - Add `VITE_OPENROUTER_API_KEY` to `.env.local` (or the appropriate environment file) as recommended in **“Implementation Cheat Sheet → A. Minimal OpenRouter client setup”**.  
   - Ensure `.env.local` is already git-ignored (verify in `.gitignore`).  
   - Coordinate with deployment environments to supply the same variable securely.

2. **Decide on base URL & headers**  
   - Use `OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'` as described in **“OpenAI-compatible integration”**.  
   - Plan to include optional headers `HTTP-Referer` and `X-Title` in the client, using non-sensitive values (e.g., public site URL and app name).  

3. **Document env usage in code (not README)**  
   - When implementing the OpenRouter client module in later phases, reference `VITE_OPENROUTER_API_KEY` and `OPENROUTER_BASE_URL` only through `import.meta.env` so secrets never appear in source.  

Dependencies: Phase 0.

---

## Phase 2 – OpenRouter Client Module

**Goal:** Create a dedicated OpenRouter client module mirroring `ai/glmClient.ts`.

Files: `ai/openrouterClient.ts` (new).

Tasks:
1. **Create client wrapper**  
   - Implement `ai/openrouterClient.ts` as described in **“Recommended Integration Architecture → 2. Introduce an OpenRouter client wrapper”** and **“Implementation Cheat Sheet → A. Minimal OpenRouter client setup”**:  
     - Import `OpenAI` from `openai`.  
     - Read `VITE_OPENROUTER_API_KEY` from `import.meta.env`.  
     - Configure `baseURL: 'https://openrouter.ai/api/v1'`.  
     - Set `dangerouslyAllowBrowser: true` (mirroring GLM) if the client is used in the browser.  
     - Optionally set `defaultHeaders` with `HTTP-Referer` and `X-Title`.  

2. **Expose helper functions**  
   - Export:  
     - `isOpenRouterConfigured(): boolean` – returns `Boolean(VITE_OPENROUTER_API_KEY)`.  
     - `getOpenRouterClient(): OpenAI` – lazy-initializes a singleton; throws a clear error if the key is missing (similar to `getGlmClient`).  

3. **Validate behavior**  
   - Temporarily log or unit-test `isOpenRouterConfigured()` in a dev-only context to confirm it responds correctly to env changes.  

Dependencies: Phase 1 (env var decisions).

---

## Phase 3 – Provider Registry Extension

**Goal:** Extend the provider/model registries so OpenRouter appears as a first-class provider.

Files: `ai/providers.ts`.

Tasks:
1. **Extend `ProviderId`**  
   - Update `ProviderId` from `'gemini' | 'glm'` to include `'openrouter'` as suggested under **“Recommended Integration Architecture → 1. Extend provider and model registries”**.  

2. **Add OpenRouter models to `MODELS`**  
   - Add at least two entries to `MODELS`:  
     - Design-focused model, e.g., `id: 'openai/gpt-4o'`, `kind: 'design'`.  
     - Fast interaction model, e.g., `id: 'meta-llama/llama-3.1-8b-instruct'`, `kind: 'component'`.  
   - Ensure `name` and `description` fields explain how each model should be used in the app, following examples in the GLM and Gemini entries.  

3. **Extend `PROVIDER_CONFIG`**  
   - Add an `openrouter` entry to `PROVIDER_CONFIG` with:  
     - `id: 'openrouter'`.  
     - `name: 'OpenRouter'`.  
     - `description` summarizing OpenRouter’s role.  
     - `envKey: 'VITE_OPENROUTER_API_KEY'`.  
     - `isConfigured: () => Boolean(import.meta.env.VITE_OPENROUTER_API_KEY)`.  

4. **Ensure helpers work with new provider**  
   - Verify that utility functions (`getComponentModels`, `getDesignSystemModels`, `getModelById`, `getDefaultModel`, `getConfiguredProviders`) work correctly when `provider === 'openrouter'`.  

Dependencies: Phases 0–2.

---

## Phase 4 – OpenRouter Provider Operations

**Goal:** Implement OpenRouter-specific generation functions that mirror Gemini/GLM signatures.

Files: `ai/openrouter.ts` (new), `ai/openrouterClient.ts` (from Phase 2).

Tasks:
1. **Define function surface**  
   - In `ai/openrouter.ts`, export functions whose signatures match the Gemini/GLM ones, as recommended in **“Recommended Integration Architecture → 3. Implement OpenRouter-specific operations”**:  
     - `openRouterGenerateStyles(options: GenerateStylesOptions)`.
     - `openRouterStreamHtmlArtifact(options: StreamHtmlArtifactOptions)`.
     - `openRouterStreamReactComponent(options: StreamReactComponentOptions)`.
     - `openRouterStreamSnippetExtraction(options: StreamSnippetExtractionOptions)`.
     - `openRouterStreamSnippetToReact(options: StreamSnippetToReactOptions)`.
     - `openRouterStreamVariations(options: StreamVariationsOptions)`.  

2. **Reuse client and streaming patterns**  
   - Use `getOpenRouterClient()` from `ai/openrouterClient.ts`.  
   - Implement an `iterateStream` helper for async streaming, identical in behavior to GLM’s helper but scoped to this module.  
   - For each function, reuse the system/user prompt patterns from Gemini/GLM so responses have compatible shapes and semantics (per **“Comparison: Gemini + GLM vs OpenRouter”** and **“Implementation Cheat Sheet → C. OpenRouter provider implementation”**).  

3. **Handle JSON parsing and errors locally**  
   - For non-streaming JSON responses (e.g., style arrays), parse the returned text with `JSON.parse` and surface parse errors through the provider facade’s normalization logic (see Phase 5).  

Dependencies: Phases 2–3.

---

## Phase 5 – Provider Facade Routing & Error Handling

**Goal:** Wire OpenRouter into the provider-agnostic facade in `ai/generate.ts` and extend error normalization as needed.

Files: `ai/generate.ts`, `ai/errors.ts` (optional changes).

Tasks:
1. **Route calls by provider**  
   - In `ai/generate.ts`, update each high-level function (styles, HTML streaming, React component streaming, snippet operations, variations) to branch on three providers instead of two, following the pattern in **“Implementation Cheat Sheet → D. Facade routing and fallbacks”**:  
     - `provider === 'openrouter'` → call `openRouter*` functions.  
     - `provider === 'glm'` → call `glm*` functions.  
     - else → call `gemini*` functions.  
   - Continue using `withTimeout` and `DEFAULT_REQUEST_TIMEOUT_MS` for all providers.

2. **Decide and implement fallback behavior**  
   - Based on **“Recommended Integration Architecture → 4. Route through the provider facade”**, decide whether to implement fallback from OpenRouter to Gemini (similar to existing GLM→Gemini fallback) on transient errors.  
   - If enabled:  
     - Extend `shouldAttemptFallback` and any related logic to optionally consider `provider === 'openrouter'`.  
     - Ensure fallbacks are gated behind feature flags (e.g., reuse `VITE_ENABLE_PROVIDER_FALLBACK`) and documented in comments.

3. **Verify error normalization compatibility**  
   - Confirm that `normalizeError(error, 'openrouter')` produces reasonable `ProviderError` instances based on OpenRouter’s error formats (as described in **“Overview of OpenRouter for Flash UI”**).  
   - Adjust status/code extraction helpers if needed to handle OpenRouter-specific fields.

Dependencies: Phases 2–4.

---

## Phase 6 – UI & State Integration

**Goal:** Expose OpenRouter as a provider option in the UI without breaking existing flows.

Files (likely): `index.tsx`, relevant provider/model selection components under `./components` (e.g., any model picker or settings panels).

Tasks:
1. **Identify provider/model selection UI**  
   - Locate where the app currently selects provider and model (e.g., logic using `ProviderId`, `MODELS`, `getConfiguredProviders`, or similar, as hinted in `research/glm-provider-integration.md`).  

2. **Extend provider selection**  
   - Ensure OpenRouter appears as an option only when `isProviderConfigured('openrouter')` is true.  
   - Keep layout and styling consistent with existing UI, strictly using design tokens (no hard-coded colors, spacing, or typography) in accordance with `AGENTS.md`.

3. **Extend model selection**  
   - Populate model dropdowns/controls from `MODELS`/`getDefaultModel`, including new OpenRouter models.  
   - Ensure the selected `provider` and `modelId` are passed down to the generation functions in `ai/generate.ts`.

4. **Preserve backwards compatibility**  
   - Default to the current provider/model when OpenRouter is not configured.  
   - Avoid removing or renaming existing provider options.

Dependencies: Phases 3–5.

---

## Phase 7 – Testing, Validation & Rollout

**Goal:** Validate behavior across providers and roll out OpenRouter safely.

Files: tests (if present), any manual test scripts or docs.

Tasks:
1. **Local verification**  
   - With `VITE_OPENROUTER_API_KEY` set:  
     - Run dev server; confirm OpenRouter appears as a provider when configured.  
     - Manually test all key flows (style generation, artifact streaming, React component generation, snippet operations, variations) using OpenRouter.  
     - Check browser/network logs for correct base URL and headers (`https://openrouter.ai/api/v1`, `HTTP-Referer`, `X-Title`).

2. **Cross-provider regression checks**  
   - Repeat core flows with Gemini and GLM to ensure no regressions (per **“Readiness checklist”** from the research doc).  
   - Verify that error messages remain clear and consistent across providers.

3. **Feature flag / staged rollout**  
   - If desired, gate OpenRouter usage behind a config flag (e.g., `VITE_ENABLE_OPENROUTER`) so it can be dark-launched and tested internally first, as suggested in **“recommended integration architecture”** around rollout strategy.  
   - Plan a staged rollout: internal testing → beta users → full rollout.

4. **Monitoring & logging**  
   - Add or verify existing logging around provider selection and error handling to quickly identify OpenRouter-specific issues in production.

Dependencies: Phases 1–6.

---

## Readiness Checklist

Use this checklist to confirm the implementation is complete and safe to roll out, mapping back to `./research/openrouter-provider-integration.md`:

- [ ] **Env & config** – `VITE_OPENROUTER_API_KEY` is configured in all environments; OpenRouter requests use `https://openrouter.ai/api/v1` and optional headers as per **Overview** and **Auth** sections.  
- [ ] **Client module** – `ai/openrouterClient.ts` exists, mirrors `ai/glmClient.ts`, and implements `isOpenRouterConfigured` / `getOpenRouterClient` correctly (see **Implementation Cheat Sheet → A**).  
- [ ] **Registry updates** – `ProviderId` includes `'openrouter'`; `MODELS` contains at least two OpenRouter models; `PROVIDER_CONFIG` has an `openrouter` entry (see **Recommended Integration Architecture → Step 1**).  
- [ ] **Provider operations** – `ai/openrouter.ts` defines all required `openRouter*` functions with prompts aligned to existing Gemini/GLM behavior (see **Recommended Integration Architecture → Step 3** and **Implementation Cheat Sheet → C**).  
- [ ] **Facade routing** – `ai/generate.ts` routes all high-level flows based on `provider`, including `openrouter`, and uses `withTimeout` plus `normalizeError` for all providers (see **Recommended Integration Architecture → Step 4**).  
- [ ] **Error handling & fallback** – OpenRouter errors are normalized correctly; any fallback behavior (if enabled) is deliberate, flag-controlled, and tested.  
- [ ] **UI integration** – Provider/model selection UI exposes OpenRouter only when configured, uses design tokens exclusively, and passes `provider`/`modelId` through to `ai/generate.ts`.  
- [ ] **Backwards compatibility** – Existing Gemini and GLM flows behave exactly as before when OpenRouter is disabled or enabled.  
- [ ] **Testing & rollout** – Manual (and automated, if present) tests cover all providers; rollout plan (flags, staged enablement, monitoring) is in place as per the research doc’s checklist.
