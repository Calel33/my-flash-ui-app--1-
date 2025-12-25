## GLM Provider Diff Stack Plan

This diff stack plan is derived from:
- `research/glm-provider-integration.md`
- `research/glm-provider-implementation-plan.md`

It is organized for Graphite-style stacked diffs.

---

### Stack 1 – Env & Client Bootstrap

- **D1 – GLM env vars**  
  Add GLM env vars (`ZAI_API_KEY` / `VITE_ZAI_API_KEY`) and optional proxy contract stub.  
  **Refs:** `research/glm-provider-integration.md` → "Client initialization and auth for GLM", "Overview of z.ai GLM for Flash UI".

- **D2 – glmClient**  
  Create `ai/glmClient.ts` using the OpenAI-compatible client and `baseURL=https://api.z.ai/api/paas/v4/`.  
  **Refs:** `research/glm-provider-integration.md` → "Client construction (frontend, OpenAI-compatible)", "Minimal GLM client setup (OpenAI-compatible)".

- **D3 – GLM smoke test**  
  Add a minimal dev script/test that calls `glm-4.7` once to verify configuration (no UI wiring).  
  **Refs:** same as D1–D2.

---

### Stack 2 – Provider Types & Model Registry

- **D4 – Provider types**  
  Introduce `ProviderId` and `ProviderModel` in `ai/providers.ts`.  
  **Refs:** `research/glm-provider-integration.md` → "Recommended Dual-Provider Architecture" (Core building blocks), "Provider registry and state".

- **D5 – MODELS / PROVIDER_CONFIG**  
  Build unified `MODELS` / `PROVIDER_CONFIG` including existing Gemini models and `glm-4.7`.  
  **Refs:** same as D4.

- **D6 – Model helpers + index.tsx switch**  
  Add helpers to filter models by provider/kind and switch `index.tsx` to use them (still Gemini-only behavior).  
  **Refs:** `research/glm-provider-integration.md` → "Representing provider + model in app state".

---

### Stack 3 – Gemini Behind Provider Facade

- **D7 – ProviderApi + facade**  
  Define `ProviderApi` interface and facade functions (`generateStyles`, `streamHtmlArtifact`, `streamReactComponent`) in `ai/generate.ts`.  
  **Refs:** `research/glm-provider-integration.md` → "Provider-agnostic generation APIs", "Implementation Cheat Sheet – C. Provider-agnostic generation facade".

- **D8 – GeminiProviderApi module**  
  Implement `GeminiProviderApi` in `ai/gemini.ts` by moving all `GoogleGenAI` logic out of `index.tsx` unchanged.  
  **Refs:** `research/glm-provider-integration.md` → "Current Gemini Integration in `my-flash-ui-app`", "Provider-agnostic generation APIs".

- **D9 – index.tsx via facade**  
  Update `index.tsx` to call the facade with `provider: 'gemini'` so behavior is identical but routed through the abstraction.  
  **Refs:** `research/glm-provider-integration.md` → "Recommended Dual-Provider Architecture".

---

### Stack 4 – GLM Provider Implementation

- **D10 – glmGenerateStyles**  
  Implement `glmGenerateStyles` using `glmClient.chat.completions.create` (non-streaming) as in the style-directions example.  
  **Refs:** `research/glm-provider-integration.md` → "GLM chat and streaming patterns – Non-streaming example (style directions)".

- **D11 – GLM streaming helpers**  
  Implement `glmStreamHtmlArtifact` and a React-conversion streaming helper mirroring the HTML/React examples.  
  **Refs:** `research/glm-provider-integration.md` → "GLM chat and streaming patterns – Streaming example (HTML artifact)", "Detailed Implementation Plan – GLM chat and streaming patterns".

- **D12 – Register GlmProviderApi**  
  Register `GlmProviderApi` with the facade (`generateStyles`, `streamHtmlArtifact`, `streamReactComponent`) and add dev-only checks for GLM response shape.  
  **Refs:** same as D10–D11 plus "Implementation Cheat Sheet – A/B/C".

---

### Stack 5 – UI Provider & Model Selection

- **D13 – provider state + toggle**  
  Add `provider: ProviderId` state and a simple provider toggle control in `index.tsx`, default `'gemini'`.  
  **Refs:** `research/glm-provider-integration.md` → "Representing provider + model in app state".

- **D14 – provider-aware models in UI**  
  Wire model dropdowns to `MODELS` filtered by `provider`; confirm Gemini UX is unchanged when `provider === 'gemini'`.  
  **Refs:** same section + "Implementation Cheat Sheet – B. Provider registry and state".

- **D15 – Enable GLM path**  
  Enable provider=`glm` path in the UI and verify basic GLM flows (design system mode, component mode, React conversion).  
  **Refs:** `research/glm-provider-integration.md` → "Implementation Cheat Sheet – E. Step-by-step rollout checklist", "Recommended Dual-Provider Architecture".

---

### Stack 6 – Error Handling, Fallbacks & Verification

- **D16 – Error/timeout normalization**  
  Implement normalized error and timeout handling in the facade for both providers.  
  **Refs:** `research/glm-provider-integration.md` → "Error handling, timeouts, and fallbacks".

- **D17 – Optional GLM→Gemini fallback**  
  Optionally add feature-flagged GLM→Gemini fallback logic on transient GLM failures (`429`, `5xx`).  
  **Refs:** same section.

- **D18 – End-to-end verification**  
  Execute the "Step-by-step rollout checklist" for provider=`gemini` (regression) and provider=`glm` (new behavior), fixing any issues.  
  **Refs:** `research/glm-provider-integration.md` → "Implementation Cheat Sheet – E. Step-by-step rollout checklist"; `research/glm-provider-implementation-plan.md` → "Implementation Checklist", "Task List".
