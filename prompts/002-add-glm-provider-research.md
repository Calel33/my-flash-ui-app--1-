<research_objective>
Investigate how to add the z.ai GLM provider to the existing `my-flash-ui-app` so users can choose GLM models in the UI while preserving all current Gemini-based functionality.
Produce a practical research guide plus an implementation cheat sheet that future engineers can follow to wire GLM into the app.
</research_objective>

<scope>
- Focus on integrating z.ai GLM models into a Vite + React 19 app that currently uses `@google/genai` and `GoogleGenAI` in `index.tsx`.
- Prioritize the official z.ai docs:
  - https://docs.z.ai/guides/overview/quick-start
  - https://docs.z.ai/api-reference/introduction
- Map concepts and capabilities between the current Gemini integration and GLM (auth, model selection, streaming, rate limits, error handling).
- Do not change project files; this task is research and design only.
</scope>

<deliverables>
Write findings to `./research/glm-provider-integration.md` with these sections:
- Overview of z.ai GLM platform and key concepts relevant to this app.
- Comparison of the current Gemini integration vs. GLM (auth, models, streaming APIs, pricing/rate limits at a high level if available).
- Recommended integration architecture for adding GLM as an additional provider, not a replacement (users can choose provider + model).
- Detailed implementation plan covering:
  - Client initialization and auth for GLM in a Vite/React environment (including env var patterns and security considerations).
  - How to call GLM for the main artifact generation flows analogous to existing `GoogleGenAI` calls (single-shot and streaming).
  - How to represent provider + model choices in app state and pass them into generation functions without breaking existing behavior.
  - Error handling, timeouts, and safe fallbacks between providers.
- An "Implementation Cheat Sheet" section with:
  - Pseudocode and short TypeScript/JavaScript snippets that mirror existing `index.tsx` flows, showing how GLM calls would look.
  - Example shapes of request/response objects, including streaming handling.
  - Step-by-step checklist to go from today’s state (Gemini-only) to dual-provider (Gemini + GLM) without regressions.
</deliverables>

<evaluation_criteria>
- Explains clearly how GLM auth, model naming, and streaming APIs work, with direct references back to the provided docs.
- Identifies all places in the current app where AI provider calls occur and describes how GLM could be plugged in with minimal duplication.
- Provides a realistic, incremental rollout strategy (e.g., feature flag or config-based provider selection) that is compatible with the existing codebase.
- Implementation cheat sheet is concrete enough that a mid-level engineer could implement the integration with minimal additional research.
</evaluation_criteria>

<verification>
Before considering the research complete, verify that:
- All key questions about auth, model selection, streaming, error handling, and environment configuration for GLM are answered using credible sources (preferably the official z.ai docs above).
- The proposed architecture describes how to keep existing Gemini flows working unchanged while adding GLM as an option.
- The implementation cheat sheet covers both UI-level provider/model selection and low-level API call patterns.
- `./research/glm-provider-integration.md` is structured, readable, and directly actionable for implementation work.
</verification>
