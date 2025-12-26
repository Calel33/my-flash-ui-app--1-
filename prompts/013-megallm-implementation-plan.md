<objective>
Create a detailed, phased implementation plan to add the MegaLLM provider to `my-flash-ui-app` so users can select MegaLLM-backed models alongside existing Gemini, GLM, and OpenRouter options, while preserving all current functionality.
The plan must build directly on the recommendations and checklist in `./research/megallm-provider-integration.md` and be realistic for a mid-level engineer to execute.
</objective>

<context>
The project is a React 19 + Vite app defined in `./package.json` with a strict design-system token policy enforced via `./AGENTS.md` and `~/.factory/AGENTS.md`.
AI generation currently uses a multi-provider architecture:
- Gemini via `@google/genai` wrapped in `./ai/gemini.ts`.
- GLM via the `openai` SDK wrapped in `./ai/glmClient.ts` and `./ai/glm.ts`.
- OpenRouter via the `openai` SDK wrapped in `./ai/openrouterClient.ts` and `./ai/openrouter.ts`.
The provider/model registry and provider-agnostic facade live in `./ai/providers.ts` and `./ai/generate.ts`, with cross-provider error handling in `./ai/errors.ts`.
You have an existing research doc, `./research/megallm-provider-integration.md`, which analyzes MegaLLM and proposes a target architecture and implementation cheat sheet.
Before planning, carefully review:
- @./AGENTS.md
- @./research/megallm-provider-integration.md
- @./ai/providers.ts
- @./ai/generate.ts
- @./ai/gemini.ts
- @./ai/glm.ts
- @./ai/glmClient.ts
- @./ai/openrouter.ts
- @./ai/openrouterClient.ts
</context>

<requirements>
1. Thoroughly analyze `./research/megallm-provider-integration.md` and treat it as the primary source of truth for architectural direction; reference its sections explicitly in your plan (e.g., "As described in Recommended Integration Architecture → Step 1..." or "See Implementation Cheat Sheet → A. Minimal MegaLLM client setup").
2. Produce a phased implementation plan that covers at minimum:
   - Environment and configuration setup for MegaLLM (env vars such as `VITE_MEGALLM_API_KEY`, secrets handling, base URLs, headers) based on the Authentication and API Reference guidance in the MegaLLM docs as summarized in the research.
   - Creation of a MegaLLM client module (e.g., `ai/megallmClient.ts`) mirroring `ai/glmClient.ts` / `ai/openrouterClient.ts` but targeting `https://ai.megallm.io/v1`.
   - Extension of `ProviderId`, `MODELS`, and `PROVIDER_CONFIG` in `ai/providers.ts` for MegaLLM models, using example model IDs and kinds from the research doc.
   - Implementation of MegaLLM-specific operations in a new `ai/megallm.ts` module mirroring Gemini/GLM/OpenRouter functions (non-streaming and streaming flows).
   - Updates to the provider-agnostic facade in `ai/generate.ts` to route calls based on `provider`, including any MegaLLM-specific fallback strategy and error normalization.
   - UI/state updates (e.g., provider + model selection) needed to expose MegaLLM in the interface without breaking existing behavior or design-system constraints.
   - Testing, validation, and rollout (feature flags/config toggles, logging/observability, error handling, dark launch vs full launch).
3. For each phase, break work into concrete, ordered tasks with:
   - A short description of the change.
   - Files/modules likely to be touched (by path).
   - Dependencies on earlier steps and any relevant preconditions (e.g., env vars configured, feature flag created).
4. Explicitly incorporate constraints from `AGENTS.md` (design tokens only, no hard-coded styles, no code deletion, maintain backwards compatibility, vertical-slice architecture) into the plan, explaining why they matter for this integration.
5. Include recommendations for how to sequence work to minimize risk (e.g., wiring MegaLLM behind feature flags, enabling it in non-production first, and having clear rollback switches).
</requirements>

<implementation>
Deeply consider the existing multi-provider architecture when drafting the plan:
- Use `./research/megallm-provider-integration.md` as a checklist and cross-reference it so every major recommendation there (including its Implementation Cheat Sheet and the "Gemini + GLM + OpenRouter → + MegaLLM" checklist) is mapped to one or more implementation tasks.
- Favor reusing patterns already used for GLM and OpenRouter (lazy client construction, shared streaming helpers, error normalization via `ai/errors.ts`) instead of inventing new abstractions.
- Maintain the vertical-slice and component-first principles described in `AGENTS.md` when planning any UI changes (e.g., provider/model selectors).
- When describing env vars and configuration, note where sensitive values should live (e.g., `.env.local`, server-only contexts) and avoid any suggestion of hard-coding secrets.
- Explain the rationale for key steps (e.g., why the provider registry and model selection must be extended before wiring façade routing, or why aligning error handling across providers is critical when adding another external backend).
</implementation>

<output>
Create a single implementation-planning document at:
- `./research/megallm-implementation-plan.md` – A markdown file that:
  - Summarizes goals and assumptions.
  - Organizes the work into phases and tasks as described above.
  - Explicitly references sections from `./research/megallm-provider-integration.md` where applicable.
  - Includes a final "Readiness checklist" that an engineer can use to confirm the MegaLLM implementation is complete, safe to roll out, and does not regress existing Gemini/GLM/OpenRouter flows.
</output>

<verification>
Before considering the planning complete, verify that:
- Every major recommendation in `./research/megallm-provider-integration.md` (including its Implementation Cheat Sheet and checklist) is reflected in at least one concrete task or phase.
- The plan identifies all core modules that must change (`ai/providers.ts`, `ai/generate.ts`, `ai/megallmClient.ts`/`ai/megallm.ts`, relevant UI files) and there are no obvious gaps.
- Backwards compatibility and design-system constraints from `AGENTS.md` are explicitly addressed, including provider configuration checks and safe handling of missing API keys.
- The rollout and testing strategy would allow enabling MegaLLM safely without disrupting existing Gemini, GLM, or OpenRouter flows.
</verification>

<success_criteria>
- The resulting `./research/megallm-implementation-plan.md` is clear, phased, and directly actionable by a mid-level engineer.
- The plan is tightly aligned with, and explicitly references, `./research/megallm-provider-integration.md`.
- All key technical areas are covered: configuration, client construction, provider registry, facade routing, UI integration, error handling, testing, and rollout.
- The plan minimizes risk by sequencing changes sensibly and respecting project-wide constraints and design-system rules.
</success_criteria>
