<objective>
Implement a clear, responsive loading indicator for long-running GLM-powered code generation in Flash UI so users always know when GLM is actively working and that the app is not frozen.
Explain that this specifically targets GLM flows, which can be slower than Gemini, and should make the "thinking" state visually obvious without being distracting.
</objective>

<context>
The app is a Vite + React 19 SPA with a provider-agnostic AI generation facade and dual providers (Gemini + GLM) wired through `ai/generate.ts` and `ai/glm.ts`.
The main UI and AI interactions (including `provider` selection, `isLoading` flags, and artifact rendering) live in the root React component.
Make the loading indicator feel consistent with the existing "Flash UI" aesthetic (dotted glow background, neon headers) and design-system tokens.
@index.tsx
@ai/generate.ts
@ai/glm.ts
@ai/providers.ts
@index.css
</context>

<requirements>
- Add a GLM-specific loading indicator that appears whenever a GLM-backed generation is in progress (HTML artifacts, React conversion, variations, styles, etc.).
- The indicator must be clearly visible in the main stage area (not just in the input field) and communicate that GLM is actively generating content.
- Reuse existing loading state where possible (e.g., `isLoading`, provider state) rather than introducing redundant flags; if new state is necessary, keep it minimal and scoped.
- Ensure the indicator distinguishes GLM from Gemini (e.g., subtle label like "GLM is generating" or a GLM-themed pulse), without hard-coding sensitive details or API keys.
- Preserve all existing behaviors when `provider === 'gemini'`; Gemini flows should continue using the current loading experience with no regressions.
</requirements>

<implementation>
1. Inspect the root React component in `index.tsx` to understand how `provider`, `isLoading`, and AI generation callbacks (Gemini + GLM via the facade in `ai/generate.ts`) are wired.
2. Identify where GLM-powered operations are triggered (e.g., via `streamHtmlArtifact`, `streamReactComponent`, `streamVariations`, or `glm*` helpers) and how they interact with the shared loading state.
3. Introduce a derived, provider-aware loading state or selector (e.g., `isGlmLoading = isLoading && provider === 'glm'`) that can drive the new indicator without duplicating logic.
4. In the main stage UI, render a visually distinct GLM loading indicator when `isGlmLoading` is true, such as a subtle animated dot trail or orbital spinner near the "ETHEREAL SKIN FOCUS" pane, using existing design tokens and CSS utilities instead of inline styles.
5. Ensure the indicator appears quickly when GLM requests start, stays visible throughout streaming (including long responses), and disappears reliably on completion or error.
6. Keep the implementation lightweight and composable (e.g., a small `GlmLoadingIndicator` component) so it can be reused near both the stage and input area if needed.
7. Do not introduce new dependencies; rely on existing React and CSS capabilities.
Explain *why* you choose a particular visual treatment (e.g., low-contrast pulsing vs. aggressive spinner) with respect to UX and the existing aesthetic.
</implementation>

<output>
Create or modify the following files:
- `./index.tsx` – Wire provider-aware GLM loading state (`isGlmLoading`) and render the GLM loading indicator in the main stage UI when GLM is generating.
- `./components/GlmLoadingIndicator.tsx` – (If appropriate) A small, reusable React component encapsulating the GLM loading visuals and accessibility attributes.
- `./index.css` – Add or adjust CSS classes for the GLM loading indicator using existing design tokens (no hard-coded colors, radii, or shadows).
</output>

<verification>
Before declaring the task complete, verify:
- Trigger a GLM-based generation (e.g., switch provider to `glm`, run a long HTML artifact generation) and confirm the loading indicator appears immediately and persists until completion.
- Switch back to `gemini` and confirm the GLM-specific indicator does *not* appear, and existing Gemini loading behaviors remain unchanged.
- Confirm that rapid consecutive GLM requests do not leave the indicator stuck on or off, and that error paths (e.g., GLM misconfiguration) do not cause crashes related to the indicator.
</verification>

<success_criteria>
- Users can clearly see when GLM is actively generating, even for long-running responses.
- The GLM loading indicator integrates cleanly with the existing Flash UI aesthetic and design tokens without introducing new visual inconsistencies.
- Gemini behavior is unchanged and continues to work without regressions.
- The implementation is simple, provider-aware, and reuse-friendly, with no new dependencies.
</success_criteria>
