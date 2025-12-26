<research_objective>
Investigate how to add a megaLLM-based provider to the existing `my-flash-ui-app` so users can choose megaLLM models in the UI while preserving all current Gemini, GLM, and OpenRouter functionality.
Produce a practical research guide plus an implementation cheat sheet that future engineers can follow to wire megaLLM into the app's existing multi-provider architecture.
For this complex integration, thoroughly explore multiple sources and consider various perspectives, prioritizing the official megaLLM documentation.
</research_objective>

<scope>
- Focus on integrating megaLLM models into a Vite + React 19 app that already supports Gemini (via `@google/genai`) and GLM (via an OpenAI-compatible client) through the unified provider facade in `./ai`, and is being extended for OpenRouter.
- Prioritize the official megaLLM docs, especially:
  - https://docs.megallm.io/en/home/introduction
- Map concepts and capabilities between the current Gemini/GLM/OpenRouter integrations and megaLLM (auth, base URLs, model selection, streaming behavior, rate limits, error handling, client configuration patterns).
- Describe how megaLLM could be introduced as an additional provider (e.g., extending the `ProviderId` union and `PROVIDER_CONFIG` / `MODELS` registries) rather than replacing existing providers.
- Do not change project files; this task is research and design only.
</scope>

<deliverables>
Write findings to `./research/megallm-provider-integration.md` with these sections:
- Overview of the megaLLM platform and key concepts relevant to this app (API surface, available model families, routing behavior if any, pricing/rate-limit considerations at a high level if available).
- Comparison of the current Gemini/GLM/OpenRouter integrations vs. megaLLM (how clients are constructed, how models are addressed, streaming APIs, auth patterns, environment configuration).
- Recommended integration architecture for adding megaLLM as an additional provider alongside Gemini, GLM, and OpenRouter, including:
  - How to represent megaLLM in the existing provider types (`ProviderId`, `ProviderModel`, `ProviderConfig`, and model registry structures).
  - How to initialize and configure a megaLLM client in this Vite/React environment, including safe handling of API keys, base URLs, and any required headers.
  - How to adapt the existing `ai/generate.ts` facade so each high-level generation flow (styles, HTML artifact streaming, React component streaming, snippet transforms, variations, etc.) can route to megaLLM-backed models when selected.
  - Strategies for handling provider-specific capabilities or limitations while keeping the public API of the facade consistent.
- An "Implementation Cheat Sheet" section with:
  - Pseudocode and short TypeScript/JavaScript snippets that mirror existing Gemini/GLM/OpenRouter flows, showing how equivalent megaLLM calls would look (including streaming where supported).
  - Example shapes of request/response objects, including how to pass provider/model identifiers, metadata, and any megaLLM-specific options.
  - A step-by-step checklist to go from today’s state (Gemini + GLM + OpenRouter) to a four-provider setup (Gemini + GLM + OpenRouter + megaLLM) without regressions, including incremental rollout tactics (feature flag/config switches, fallback behavior if megaLLM is misconfigured or unavailable).
</deliverables>

<evaluation_criteria>
- Clearly explains how megaLLM auth, base URLs, model naming, and streaming APIs (if available) work, with direct references back to the official docs and related pages linked from the introduction.
- Identifies all places in the current app where AI provider calls occur (e.g., `./ai/generate.ts`, `./ai/gemini.ts`, `./ai/glm.ts`, `./ai/openrouter.ts`) and describes how megaLLM could be plugged in with minimal duplication.
- Proposes an integration strategy that extends the existing provider registry and facade rather than introducing one-off code paths, keeping the UI’s provider/model selection logic coherent.
- Implementation cheat sheet is concrete enough that a mid-level engineer could implement the megaLLM provider with minimal additional research, following the snippets and checklist.
</evaluation_criteria>

<verification>
Before considering the research complete, verify that:
- All key questions about auth, model selection, streaming, error handling, and environment configuration for megaLLM are answered using credible sources (preferably the official megaLLM docs and linked references).
- The proposed architecture describes how to keep existing Gemini, GLM, and OpenRouter flows working unchanged while adding megaLLM as an option, including fallback behavior and configuration checks.
- The implementation cheat sheet covers both UI-level provider/model selection and low-level API call patterns for megaLLM, staying consistent with existing design-system and provider-facade constraints.
- `./research/megallm-provider-integration.md` is structured, readable, and directly actionable for implementation work.
</verification>
