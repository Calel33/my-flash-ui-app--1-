<objective>
Add a dedicated Comparison Mode page where users can select multiple providers and models, submit one prompt, and view side‑by‑side results using the existing provider/model infrastructure and design system aesthetics.
</objective>

<context>
React 19 + Vite app. Existing single-provider flow in @index.tsx with provider/model state, generation orchestration, and UI layout. Provider/model registry and helpers live in @ai/providers.ts; streaming facades in @ai/generate.ts; preferences/persistence in @hooks/usePreferences.ts; generation hooks in @hooks/useArtifactGeneration.ts and @hooks/useVariations.ts. Design system tokens and control styles in @index.css (glassy dark theme, selects/buttons). Review @components/ (AppShell, PromptBar, SessionGrid, DrawerContent, ElementEditor, etc.) to mirror interaction patterns and avoid regressions. Follow project conventions in @CLAUDE.md if present.
</context>

<requirements>
- Provide a Comparison Mode UI reachable from the main experience without breaking existing flows (toggle or tab is fine). Exiting Comparison Mode should restore the regular view untouched.
- Allow users to configure multiple comparison slots (array of { id, provider, modelId }); limit to 4–6 slots; include add/remove controls.
- For each slot: provider select (ProviderId values) and model select filtered to that provider using MODELS/getComponentModels/getDesignSystemModels; defaults should come from existing helpers.
- Single prompt input for Comparison Mode; submitting triggers parallel generation across all configured slots using existing streaming helpers (no new low-level API calls).
- Track per-slot status (idle/loading/success/error) and results independently; one slot failing must not block others. Show clear provider/model labels and concise error messages per slot.
- Render results in a responsive, side-by-side layout that fits the current glassy aesthetic (cards/panels with borders, spacing, typography tokens). No new hard-coded colors/spacing; only use existing CSS variables/classes.
- Preserve existing behaviors: normal generation flow remains unchanged; no breaking changes to provider/model persistence or hooks.
- Keep code modular: consider a dedicated ComparisonMode component plus small helpers/hooks as needed; keep new types near related provider/model helpers.
</requirements>

<implementation>
1. State & types: add comparisonConfigs state (array of { id: string; provider: ProviderId; modelId: string }) with add/remove/update helpers; enforce max slots. Seed first slot from current provider/default model.
2. UI: build a Comparison Mode surface (new component or routed view) with:
   - Toggle/entry control from the main UI (reuse existing button/link styles).
   - Slot list with provider select, model select (filtered), remove button; add-slot control that respects max limit.
   - Prompt input bar reused/adapted from existing input patterns, wired to comparison submission.
3. Orchestration: implement a compare handler that, given the prompt + configs, kicks off parallel streams via ai/generate facades (e.g., streamHtmlArtifact/streamReactComponent as appropriate). Maintain per-slot { status, error, content } state; reuse existing error/loading patterns.
4. Rendering: show results grid/cards labeled with provider/model; include loading states and error messages per slot; ensure responsive columns collapse gracefully on narrow widths.
5. Styling: extend index.css with comparison-specific classes that compose existing tokens (colors, spacing, radius, shadows); reuse .provider-select-control/.provider-select/.model-select patterns.
6. Guardrails: block submission when no prompt or no slots; clamp slot count; avoid duplicate low-level logic—prefer shared helper(s) for kicking off per-slot streams.
</implementation>

<output>
Create/modify files:
- `./index.tsx` — introduce Comparison Mode state/toggle, mount the Comparison Mode view, and keep existing flows intact.
- `./components/ComparisonMode.tsx` (or similar) — encapsulate comparison UI, slot management, submission handler, and rendering.
- `./index.css` — add comparison-specific layout/utility classes built on existing tokens; no new hard-coded values.
- `./ai/providers.ts` or `./ai/generate.ts` — only if needed for small helpers (e.g., model lookup); avoid breaking existing exports.
</output>

<verification>
- Enter/exit Comparison Mode without reload; normal mode remains unchanged.
- Add/remove slots up to the limit; selections persist during the session and reflect provider/model defaults.
- Submitting a prompt with 2+ slots triggers parallel generation; each slot shows its own loading state and renders output.
- A failure in one slot surfaces an inline error while others continue to completion.
- Layout stays readable on desktop and mobile (responsive columns) and matches design-system styling; no new tokens introduced.
</verification>

<success_criteria>
- A cohesive Comparison Mode exists with clear entry/exit and responsive side-by-side results.
- Users can configure multiple provider/model combos using existing registries and run one prompt across all of them in parallel.
- Per-slot loading, results, and errors render independently without cross-slot failures.
- All styling uses existing design tokens/patterns; existing non-comparison flows behave exactly as before.
</success_criteria>
