<objective>
Create a detailed, phased implementation plan to add the OpenRouter provider to `my-flash-ui-app` so users can select OpenRouter models alongside existing Gemini and GLM options, while preserving all current functionality.
The plan must build directly on the recommendations and checklist in `./research/openrouter-provider-integration.md` and be realistic for a mid-level engineer to execute.
</objective>

<context>
The project is a React 19 + Vite app defined in `./package.json` with a strict design-system token policy enforced via `./AGENTS.md` and `~/.factory/AGENTS.md`.
AI generation currently uses a dual-provider architecture:
- Gemini via `@google/genai` wrapped in `./ai/gemini.ts`.
- GLM via the `openai` SDK wrapped in `./ai/glmClient.ts` and `./ai/glm.ts`.
The provider/model registry and provider-agnostic facade live in `./ai/providers.ts` and `./ai/generate.ts`, with cross-provider error handling in `./ai/errors.ts`.
You have an existing research doc, `./research/openrouter-provider-integration.md`, which analyzes OpenRouter and proposes a target architecture and implementation cheat sheet.
Before planning, carefully review:
- @./AGENTS.md
- @./research/openrouter-provider-integration.md
- @./ai/providers.ts
- @./ai/generate.ts
- @./ai/gemini.ts
- @./ai/glm.ts
- @./ai/glmClient.ts
</context>

<requirements>
1. Thoroughly analyze `./research/openrouter-provider-integration.md` and treat it as the primary source of truth for architectural direction; reference its sections explicitly in your plan (e.g., "As described in Recommended Integration Architecture → Step 1...").
2. Produce a phased implementation plan that covers at minimum:
   - Environment and configuration setup for OpenRouter (env vars, secrets handling, base URLs, headers).
   - Creation of an OpenRouter client module mirroring `ai/glmClient.ts`.
   - Extension of `ProviderId`, `MODELS`, and `PROVIDER_CONFIG` in `ai/providers.ts` for OpenRouter models.
   - Implementation of OpenRouter-specific operations in a new `ai/openrouter.ts` module mirroring Gemini/GLM functions.
   - Updates to the provider-agnostic facade in `ai/generate.ts` to route calls based on `provider`, including any OpenRouter-specific fallback strategy.
   - UI/state updates (e.g., provider + model selection) needed to expose OpenRouter in the interface without breaking existing behavior.
   - Testing, validation, and rollout (feature flags/config toggles, error handling, logging).
3. For each phase, break work into concrete, ordered tasks with:
   - A short description.
   - Files/modules likely to be touched (by path).
   - Dependencies on earlier steps.
4. Explicitly incorporate constraints from `AGENTS.md` (design tokens only, no hard-coded styles, no code deletion, maintain backwards compatibility) into the plan, explaining why they matter for this integration.
5. Include recommendations for how to sequence work to minimize risk (e.g., wiring OpenRouter behind feature flags, keeping it dark-launched until validated).
</requirements>

<implementation>
Deeply consider the existing provider architecture when drafting the plan:
- Use `./research/openrouter-provider-integration.md` as a checklist and cross-reference it so every major recommendation there is mapped to one or more implementation tasks.
- Favor reusing patterns already used for GLM and Gemini (lazy client construction, streaming helpers, error normalization) instead of inventing new abstractions.
- Maintain the vertical-slice and component-first principles described in `AGENTS.md` when planning UI changes.
- When describing env vars and configuration, note where sensitive values should live (e.g., `.env.local`, server-only contexts) and avoid any suggestion of hard-coding secrets.
Go beyond a superficial list by explaining the rationale for key steps (e.g., why the provider registry must be extended first, or why error normalization is critical when adding another external provider).
</implementation>

<output>
Create a single implementation-planning document at:
- `./research/openrouter-implementation-plan.md` – A markdown file that:
  - Summarizes goals and assumptions.
  - Organizes the work into phases and tasks as described above.
  - Explicitly references sections from `./research/openrouter-provider-integration.md` where applicable.
  - Includes a final "Readiness checklist" that an engineer can use to confirm the implementation is complete and safe to roll out.
</output>

<verification>
Before considering the planning complete, verify that:
- Every major recommendation in `./research/openrouter-provider-integration.md` (including its Implementation Cheat Sheet and checklist) is reflected in at least one concrete task or phase.
- The plan identifies all core modules that must change (`ai/providers.ts`, `ai/generate.ts`, `ai/openrouterClient.ts`/`ai/openrouter.ts`, relevant UI files) and there are no obvious gaps.
- Backwards compatibility and design-system constraints from `AGENTS.md` are explicitly addressed.
- The rollout and testing strategy would allow enabling OpenRouter safely without disrupting existing Gemini/GLM flows.
</verification>

<success_criteria>
- The resulting `./research/openrouter-implementation-plan.md` is clear, phased, and directly actionable by a mid-level engineer.
- The plan is tightly aligned with, and explicitly references, `./research/openrouter-provider-integration.md`.
- All key technical areas are covered: configuration, client construction, provider registry, facade routing, UI integration, error handling, testing, and rollout.
- The plan minimizes risk by sequencing changes sensibly and respecting project-wide constraints.
</success_criteria>
