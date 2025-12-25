## GLM Provider Implementation Plan

Source: `research/glm-provider-integration.md`

This plan turns the research guide into concrete steps to add z.ai GLM as a second provider alongside Gemini.

---

## Phases (with Research References)

1. **Phase 1 – Env & Client Setup**  
   - Based on: "Client initialization and auth for GLM" and "Overview of z.ai GLM for Flash UI".

2. **Phase 2 – Provider Abstraction & Model Registry**  
   - Based on: "Recommended Dual-Provider Architecture" and "Provider registry and state".

3. **Phase 3 – Refactor Gemini Behind Facade**  
   - Based on: "Provider-agnostic generation APIs" and the Gemini usage analysis in "Current Gemini Integration in `my-flash-ui-app`".

4. **Phase 4 – Implement GLM Provider & Streaming**  
   - Based on: "GLM chat and streaming patterns".

5. **Phase 5 – UI Provider/Model Selection**  
   - Based on: "Representing provider + model in app state".

6. **Phase 6 – Error Handling, Fallbacks & Verification**  
   - Based on: "Error handling, timeouts, and fallbacks" and "Step-by-step rollout checklist" in the Implementation Cheat Sheet.

---

## Implementation Checklist

- [ ] **Env & Client**
  - [ ] Add GLM env vars (`ZAI_API_KEY` and/or `VITE_ZAI_API_KEY`) and verify they are wired into the build/runtime.
  - [ ] Optionally design a backend proxy contract (`/api/glm/chat`) as described in the research security notes.
  - [ ] Implement `ai/glmClient.ts` using the OpenAI-compatible SDK and `baseURL=https://api.z.ai/api/paas/v4/`.

- [ ] **Types & Registry**
  - [ ] Define `ProviderId = 'gemini' | 'glm'` and `ProviderModel` as in the "Provider registry and state" section.
  - [ ] Create a unified `MODELS` (or `PROVIDER_CONFIG`) structure including existing Gemini models and `glm-4.7`.
  - [ ] Add helpers to filter models by provider and kind (`'design' | 'component' | 'system'`).

- [ ] **Gemini Refactor**
  - [ ] Extract all `GoogleGenAI` usage from `index.tsx` into `ai/gemini.ts`, implementing the `ProviderApi` interface.
  - [ ] Replace direct `new GoogleGenAI` calls in `index.tsx` with calls to a provider-agnostic facade, keeping provider hard-coded to `'gemini'` initially.
  - [ ] Ensure behavior (prompts, models, streaming parsing) remains identical after refactor.

- [ ] **GLM Provider Implementation**
  - [ ] Implement `glmGenerateStyles` using `glmClient.chat.completions.create` exactly as in the non-streaming example.
  - [ ] Implement `glmStreamHtmlArtifact` and a React-conversion streaming function mirroring the existing Gemini flows.
  - [ ] Plug GLM functions into the facade (`generateStyles`, `streamHtmlArtifact`, `streamReactComponent`).

- [ ] **UI Integration**
  - [ ] Add `provider: ProviderId` React state at the top level, default `'gemini'`.
  - [ ] Add a provider toggle control in the UI; when `provider === 'glm'`, show GLM models from the registry.
  - [ ] Wire model dropdowns to the provider-aware `MODELS`/`PROVIDER_CONFIG` data.

- [ ] **Reliability & Rollout**
  - [ ] Implement error normalization and timeout handling around both Gemini and GLM calls.
  - [ ] Optionally add GLM→Gemini fallback behavior on transient GLM failures (`429`, `5xx`) as a feature-flagged option.
  - [ ] Follow the research "Step-by-step rollout checklist" to regression-test all flows for both providers.

---

## Task List (Engineering Tasks)

### T1 – Environment & Plumbing

- **T1.1** – Add env variables (`ZAI_API_KEY`, `VITE_ZAI_API_KEY`) and document how they are configured in local/dev/prod.  
  _Ref: "Client initialization and auth for GLM"._
- **T1.2** – Implement `ai/glmClient.ts` using the OpenAI-compatible client, matching the code in the research doc.  
  _Ref: "Minimal GLM client setup (OpenAI-compatible)"._
- **T1.3 (optional)** – Design a backend proxy for GLM (Node or serverless) that holds the real key and exposes `/api/glm/chat`.

### T2 – Core Types & Model Registry

- **T2.1** – Create `ai/providers.ts` with `ProviderId`, `ProviderModel`, and `MODELS` as described in the "Provider registry and state" section.
- **T2.2** – Add helpers to filter models by provider and kind; use them in `index.tsx` instead of hard-coded Gemini lists.

### T3 – Gemini Facade Refactor

- **T3.1** – Implement `ProviderApi` interface from the research doc (`generateStyles`, `streamHtmlArtifact`, `streamReactComponent`).
- **T3.2** – Implement `GeminiProviderApi` in `ai/gemini.ts` by moving logic from `index.tsx` (no behavioral changes).
- **T3.3** – Introduce a facade module (e.g. `ai/generate.ts`) exporting provider-agnostic functions and update `index.tsx` to use them with provider fixed to `'gemini'`.

### T4 – GLM Provider Implementation

- **T4.1** – Implement `glmGenerateStyles` using the non-streaming GLM example from the research doc.
- **T4.2** – Implement `glmStreamHtmlArtifact` and a React-component streaming helper using the streaming example.
- **T4.3** – Register `GlmProviderApi` with the facade (`getProviderApi`, `generateStyles`, `streamHtmlArtifact`, `streamReactComponent`).
- **T4.4** – Add small dev-only scripts or tests to validate GLM responses (shape, streaming behavior) before UI wiring.

### T5 – UI Provider & Model Selection

- **T5.1** – Add `provider` state in `index.tsx` and a minimal provider toggle UI control.  
  _Ref: "Representing provider + model in app state"._
- **T5.2** – Connect existing model dropdowns to `MODELS` filtered by current provider.
- **T5.3** – Ensure default provider is `'gemini'` and that initial UX is unchanged.

### T6 – Error Handling, Fallbacks & Verification

- **T6.1** – Implement error normalization and timeout behavior as outlined in "Error handling, timeouts, and fallbacks".
- **T6.2** – Implement optional GLM→Gemini fallback flow (feature-flagged) for transient GLM errors.
- **T6.3** – Execute the research "Step-by-step rollout checklist" end-to-end, confirming no regressions with provider=`gemini` and validating key paths with provider=`glm`.

---

## Quick Links into Research

- Architecture & abstractions: see **"Recommended Dual-Provider Architecture"** in `research/glm-provider-integration.md`.
- GLM auth and client examples: see **"Overview of z.ai GLM for Flash UI"** and **"Client initialization and auth for GLM"**.
- Streaming and non-streaming GLM patterns: see **"GLM chat and streaming patterns"**.
- State, provider/model selection, and rollout steps: see **"Representing provider + model in app state"** and **"Implementation Cheat Sheet"**.
