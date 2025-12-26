<research_objective>
Investigate how to add an OpenRouter-based provider to the existing `my-flash-ui-app` so users can choose OpenRouter models in the UI while preserving all current Gemini and GLM functionality.
Produce a practical research guide plus an implementation cheat sheet that future engineers can follow to wire OpenRouter into the app's existing multi-provider architecture.
For this complex integration, thoroughly explore multiple sources and consider various perspectives, prioritizing the official OpenRouter TypeScript SDK documentation.
</research_objective>

<scope>
- Focus on integrating OpenRouter models into a Vite + React 19 app that already supports Gemini (via `@google/genai`) and GLM (via an OpenAI-compatible client) through the unified provider facade in `./ai`.
- Prioritize the official OpenRouter docs, especially:
  - https://openrouter.ai/docs/sdks/typescript/overview
- Map concepts and capabilities between the current Gemini/GLM integrations and OpenRouter (auth, base URLs, model selection, streaming behavior, rate limits, error handling, client configuration patterns).
- Describe how OpenRouter could be introduced as an additional provider (e.g., extending the `ProviderId` union and `PROVIDER_CONFIG` / `MODELS` registries) rather than replacing existing providers.
- Do not change project files; this task is research and design only.
</scope>

<deliverables>
Write findings to `./research/openrouter-provider-integration.md` with these sections:
- Overview of the OpenRouter platform and key concepts relevant to this app (OpenAI-compatible surface, routing to multiple underlying models, model catalogs, pricing/rate-limit considerations at a high level if available).
- Comparison of the current Gemini/GLM integrations vs. OpenRouter (how clients are constructed, how models are addressed, streaming APIs, auth patterns, environment configuration).
- Recommended integration architecture for adding OpenRouter as an additional provider alongside Gemini and GLM, including:
  - How to represent OpenRouter in the existing provider types (`ProviderId`, `ProviderModel`, `ProviderConfig`, and model registry structures).
  - How to initialize and configure an OpenRouter TypeScript client in this Vite/React environment, including safe handling of API keys and base URLs.
  - How to adapt the existing `ai/generate.ts` facade so each high-level generation flow (styles, HTML artifact streaming, React component streaming, snippet transforms, variations, etc.) can route to OpenRouter-backed models when selected.
  - Strategies for handling provider-specific capabilities or limitations while keeping the public API of the facade consistent.
- An "Implementation Cheat Sheet" section with:
  - Pseudocode and short TypeScript/JavaScript snippets that mirror existing Gemini/GLM flows, showing how equivalent OpenRouter calls would look (including streaming where supported).
  - Example shapes of request/response objects, including how to pass provider/model identifiers, metadata, and any OpenRouter-specific options.
  - A step-by-step checklist to go from today’s state (Gemini + GLM) to a three-provider setup (Gemini + GLM + OpenRouter) without regressions, including incremental rollout tactics (feature flag/config switches, fallback behavior if OpenRouter is misconfigured or unavailable).
</deliverables>

<evaluation_criteria>
- Clearly explains how OpenRouter auth, base URLs, model naming, and streaming APIs work, with direct references back to the official docs (especially the TypeScript SDK overview).
- Identifies all places in the current app where AI provider calls occur (e.g., `./ai/generate.ts`, `./ai/gemini.ts`, `./ai/glm.ts`) and describes how OpenRouter could be plugged in with minimal duplication.
- Proposes an integration strategy that extends the existing provider registry and facade rather than introducing one-off code paths, keeping the UI’s provider/model selection logic coherent.
- Implementation cheat sheet is concrete enough that a mid-level engineer could implement the OpenRouter provider with minimal additional research, following the snippets and checklist.
</evaluation_criteria>

<verification>
Before considering the research complete, verify that:
- All key questions about auth, model selection, streaming, error handling, and environment configuration for OpenRouter are answered using credible sources (preferably the official OpenRouter docs and linked references).
- The proposed architecture describes how to keep existing Gemini and GLM flows working unchanged while adding OpenRouter as an option, including fallback behavior and configuration checks.
- The implementation cheat sheet covers both UI-level provider/model selection and low-level API call patterns for OpenRouter, staying consistent with existing design-system and provider-facade constraints.
- `./research/openrouter-provider-integration.md` is structured, readable, and directly actionable for implementation work.
</verification>
