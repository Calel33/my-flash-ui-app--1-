<objective>
Add a dedicated "Comparison Mode" page where users can select multiple providers and models, submit one prompt, and view side‑by‑side results generated using the existing model/provider infrastructure and design system aesthetics.
</objective>

<context>
You are working in a React 19 + Vite app (`my-flash-ui-app`) that already supports:
- Single-provider selection via the `provider` state and `ProviderId` type in `index.tsx`
- Model selection via `MODELS`, `getDefaultModel`, `getComponentModels`, and `getDesignSystemModels` from `./ai/providers`
- Shared streaming/generation functions in `./ai/generate` (e.g., `streamHtmlArtifact`, `streamReactComponent`, `streamVariations`)
- A dark, glassy design system defined in `index.css` using CSS custom properties for colors, spacing, typography, transitions, and controls (e.g., `.provider-select-control`, `.provider-select`, `.model-select`)

Currently, the main UI uses a single selected provider and model for generation. The goal is to introduce a separate "Comparison Mode" experience (likely routed as its own React view or top‑level panel) where:
- The user can pick multiple (provider, model) combinations from the existing registry
- A single prompt is executed in parallel across the selected combinations
- Results are displayed in a visually consistent, side‑by‑side layout that matches the app's existing aesthetics (glass panels, subtle borders, nice typography, etc.)
- All styling continues to use existing design tokens from `index.css` (no new hard-coded colors or spacing)

Read these files for grounding:
- `@index.tsx`:
  - Provider/model state and localStorage persistence (`provider`, `componentModel`, `designSystemModel`, `concurrentGenerations`)
  - Generation flows using `streamHtmlArtifact`, `streamReactComponent`, and related helpers
  - Existing layout and controls for provider/model selection and concurrent generations
- `@index.css`:
  - Root design tokens and scales (`:root` variables for colors, spacing, typography, transitions)
  - Styles for provider/model select controls (`.provider-select-control`, `.provider-select`, `.model-select`, `.generation-count-control`)
  - Layout patterns for artifacts and panels (stacks, grids, floating input, etc.)
- `@ai/providers.ts`:
  - `MODELS` registry and `ProviderId`/model IDs
  - Any helpers that derive lists of models per provider

Use the existing design language and structure as the baseline for the new comparison page.
</context>

<requirements>
1. Create a dedicated Comparison Mode experience
   - Implement a new React view or top‑level UI surface (e.g., a dedicated page or a clearly distinct mode) for comparison.
   - Provide an obvious way from the main experience to enter and exit Comparison Mode (e.g., a button or menu entry in the existing UI chrome).
   - Ensure Comparison Mode uses the same global layout frame and background aesthetics as the main app.

2. Multi-provider + multi-model selection
   - Allow users to pick multiple combinations of providers and models from the existing `MODELS` registry.
   - Support at least:
     - Multiple models from a single provider (e.g., 3 Gemini models)
     - Multiple providers with one or more models each (e.g., Gemini + GLM + OpenRouter).
   - Use structured state to track selected combinations (e.g., an array of `{ providerId, modelId }` items).
   - Enforce reasonable limits (e.g., max 4–6 combinations) to keep the UI readable and streaming manageable.
   - Use the existing provider/model IDs and types (`ProviderId`, model IDs) without inventing new identifiers.

3. Prompt input and generation behavior
   - Provide a single prompt input in Comparison Mode (reusing patterns from the main input where appropriate).
   - When the user submits:
     - Trigger parallel generation across all selected (provider, model) combinations using the existing `ai/generate` facade functions.
     - Ensure calls reuse the same streaming and error‑handling behavior already present (including any fallback logic where appropriate).
   - Avoid duplicating low‑level generation logic; instead, factor any necessary helper(s) to orchestrate multiple parallel calls.

4. Result layout and UX
   - Display each provider/model's result in its own column or card within a responsive comparison grid.
   - Each column/card should include:
     - Provider name and model ID
     - Generation status (loading, completed, error) with appropriate messaging
     - The generated content (HTML/component result) rendered according to existing patterns
   - Handle empty or error states gracefully:
     - Show when a particular provider/model fails while others succeed
     - Keep the rest of the comparison view usable even if some streams fail
   - Provide a clear indicator of which combinations are active; allow users to remove or add combinations without leaving Comparison Mode.

5. Design system and styling constraints
   - All colors, spacing, typography, radii, and transitions MUST use existing CSS variables and design tokens in `index.css`.
   - Reuse existing control styles when possible:
     - Base `select` appearance for provider/model pickers
     - Button styles, focus rings, hover effects
     - Panel/card styles (glass background, borders, shadows)
   - Do NOT introduce any raw hex colors, pixel spacing, or custom fonts outside the token system.
   - If a needed token appears missing, design the structure first and document the missing tokens in comments or TODOs rather than adding new tokens yourself.

6. State management, persistence, and performance
   - Keep Comparison Mode state encapsulated and predictable; avoid leaking complexity into unrelated parts of the app.
   - Persist comparison configuration within the session where it improves UX (e.g., remember last selected combinations while the tab is open) using the same patterns as existing localStorage usage if appropriate.
   - Respect existing concurrency controls and avoid overwhelming the system when many combinations are selected (e.g., limit or batch parallel streams where needed).
   - Preserve all existing non-comparison functionality; the default single-provider experience should remain unchanged unless explicitly touched.

7. Accessibility and usability
   - Ensure all interactive elements in Comparison Mode (inputs, selectors, buttons) are keyboard-accessible and have appropriate ARIA attributes where necessary.
   - Provide clear text labels and/or tooltips for:
     - Entering/exiting Comparison Mode
     - Adding/removing comparison combinations
     - Understanding which provider/model a result belongs to
   - Maintain good contrast and legibility using the existing color tokens.
</requirements>

<implementation>
1. Architectural design
   - Identify the best place to introduce Comparison Mode:
     - Option A: A new top-level React component rendered by `index.tsx` that can be toggled from the primary UI.
     - Option B: A routed page if the app uses any routing pattern (only if it clearly fits current architecture).
   - Define a comparison-specific state structure, e.g.:
     - `const [comparisonConfigs, setComparisonConfigs] = useState<ComparisonConfig[]>(...)`
     - `type ComparisonConfig = { id: string; provider: ProviderId; modelId: ModelId }`
   - Ensure new types and helpers live alongside existing ones where they conceptually fit (e.g., next to other provider/model helpers).

2. Selection UI
   - Build a compact but clear selection area in Comparison Mode:
     - A control to add a new comparison slot (up to the max allowed).
     - For each slot:
       - A provider `select` using `ProviderId` values.
       - A model `select` filtered to the chosen provider, using the existing `MODELS` registry.
       - A remove/delete control to drop that slot.
   - Reuse styles from `.provider-select-control`, `.provider-select`, `.model-select`, and any existing button patterns; extend via additional classes only as needed, all powered by tokens.

3. Orchestration of parallel generation
   - Implement a function that, given the current prompt and `comparisonConfigs`, kicks off parallel generation using existing `ai/generate` streaming facades:
     - For each `ComparisonConfig`, call the relevant stream function with its provider/model.
     - Track loading/error/result state per config to render independently.
   - Integrate with existing loading state patterns so the user sees:
     - When Comparison Mode is actively generating
     - Per-config progress and failures
   - Ensure errors from one provider/model do not cancel or block others.

4. Comparison layout
   - Build a responsive grid layout using existing layout tokens:
     - On wide screens, show multiple columns side‑by‑side.
     - On smaller screens, gracefully stack or swipe/scroll results while still emphasizing comparison.
   - Each result panel should visually align with existing artifact cards and panels in the main view (borders, background, padding).
   - Keep typography and spacing consistent with current artifact content areas.

5. Navigation and safety
   - Add a clear entrypoint into Comparison Mode (e.g., a button that switches the main view into Comparison Mode).
   - Provide a clear way to exit Comparison Mode and return to the standard single-provider experience.
   - Ensure no breaking changes to current behaviors:
     - Existing sessions and artifacts behave as before when not in Comparison Mode.
     - Provider/model selection in the normal mode is unaffected by comparison configuration state.

6. Documentation and inline guidance
   - Add concise inline copy or helper text in the Comparison Mode UI explaining:
     - That the user can select multiple providers/models.
     - That one prompt will be run across all selected combinations.
   - Ensure any comments added in code are minimal, focused, and aligned with the codebase’s existing commenting style.
</implementation>

<output>
Modify or create:
- `./index.tsx` (or a closely related root/feature file) to:
  - Introduce Comparison Mode state and toggle(s).
  - Wire in a dedicated Comparison Mode view.
  - Orchestrate multi-provider/model generation using existing `ai/generate` functions.
- `./ai/providers.ts` and/or `./ai/generate.ts` only if necessary to:
  - Add small, focused helpers for model lookup or multi-stream orchestration (no breaking changes).
- `./index.css` to:
  - Add any new comparison-specific layout and component classes built entirely on existing design tokens and patterns.
Ensure all changes are incremental and preserve existing behavior outside of Comparison Mode.
</output>

<verification>
Before declaring this feature complete, verify:
1. Comparison Mode can be entered and exited from the main UI without reloading the app.
2. Users can add multiple comparison slots, choose different providers/models, and remove slots up to the configured limits.
3. Submitting a prompt with at least two configured combinations:
   - Triggers parallel generation for each provider/model.
   - Shows independent loading indicators per slot.
   - Renders results in side‑by‑side panels (or a responsive equivalent) with clear provider/model labels.
4. If one provider/model fails (e.g., network or provider error):
   - An error message is shown in that slot.
   - Other slots continue and render their results successfully.
5. All styles in Comparison Mode use only existing CSS tokens (no new hard-coded colors/spacing).
6. Keyboard navigation works for all Comparison Mode controls (entry/exit, slot add/remove, provider/model selects, submit).
7. Screen readers can identify Comparison Mode controls and understand which result belongs to which provider/model.
8. Existing single-provider flows and UI continue to function exactly as before when not in Comparison Mode.
</verification>

<success_criteria>
- A visually cohesive Comparison Mode page exists, aligned with the current app aesthetics and design system.
- Users can configure multiple provider/model combinations and run a single prompt across all of them in one action.
- Results are easy to compare across providers/models via a clear, responsive layout.
- The implementation reuses existing provider, model, and generation infrastructure without architectural regressions.
- No design system violations are introduced; all styling uses existing tokens and patterns.
- Existing non-comparison functionality remains stable and unchanged outside of the new mode.
</success_criteria>

