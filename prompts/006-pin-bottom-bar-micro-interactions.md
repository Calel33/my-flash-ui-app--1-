<objective>
Implement enhanced layout controls and micro-interactions for the bottom prompt bar so users can pin it to the bottom (current behavior), left edge, or right edge of the viewport, as well as hide and show the bar, while preserving all existing functionality and overall visual aesthetic.
Explain that this improves flexibility for different workflows (e.g., side-by-side artifact viewing vs. focused prompt entry) without disrupting current users who prefer the default bottom placement.
</objective>

<context>
You are working in the `my-flash-ui-app` React 19 + Vite app defined in `./package.json` with strict design-system token rules described in `./AGENTS.md` and `~/.factory/AGENTS.md`.
The app renders a persistent bottom bar used for entering prompts/commands and controlling artifact generation; this bar currently lives at the bottom of the viewport and is wired up in `./index.tsx` and related components under `./components`.
The design system forbids hard-coded styles and requires using tokens from the `design-system` folder for colors, spacing, typography, radii, and shadows.
Before coding, review at least:
- @AGENTS.md
- @index.tsx
- @index.css
- @components
- @design-system
</context>

<requirements>
1. Add support for pinning the prompt bar to three positions: bottom (existing default), left edge, and right edge of the viewport.
2. Introduce a clear, accessible control that lets users switch the bar position between bottom/left/right without breaking existing keyboard or mouse workflows; default must remain the current bottom placement on first load.
3. Implement a hide/show affordance for the prompt bar (e.g., a collapse/expand handle or icon) that allows users to temporarily hide the UI chrome while keeping a subtle, discoverable control to bring it back.
4. Add tasteful micro-interactions for:
   - Transitioning between positions (bottom ↔ left ↔ right),
   - Hiding/showing the bar,
   using small, smooth animations that respect the existing design language and avoid jarring motion.
5. Ensure the bar remains fully usable (text entry, send actions, shortcuts, provider/model controls, etc.) in all pinned positions and after hide/show toggles, with no regressions to current behavior.
6. Persist the last chosen bar position and visibility state using the same persistence mechanisms already used in this project (e.g., local storage or existing settings state) so user preferences survive page refreshes.
7. Maintain responsiveness: on narrow/mobile viewports, ensure the pinned bar and its micro-interactions do not obscure critical content, and adjust layout (e.g., compact controls, vertical stacking) as needed while still honoring the pinned side.
8. Do not introduce new dependencies; rely on existing React, CSS, and design-system tokens only.
</requirements>

<implementation>
1. Follow existing state management patterns in `index.tsx` (and any related context/hooks) to track bar position (e.g., `"bottom" | "left" | "right"`) and visibility (e.g., `isBarHidden`), ensuring types are explicit and integrated with current app state.
2. Extend the bottom bar component(s) under `./components` so they can render in different pinned positions based on the new state; prefer composition and CSS layout changes over duplicating markup.
3. Implement micro-interactions using CSS transitions/animations driven by design-system tokens (for duration, easing, spacing) and classes defined in `./index.css` or appropriate component-level styles; avoid inline styles and hard-coded values.
4. Design the hide/show interaction so that:
   - Hiding the bar animates it out of view with a subtle motion (e.g., slide + fade) while leaving behind a small, clearly accessible handle or icon aligned with the pinned side.
   - Showing the bar animates it back into place in a way that feels responsive but not distracting.
5. Ensure all new controls are keyboard-accessible and screen-reader-friendly (focusable elements, appropriate `aria-*` attributes, and visible focus states using tokens), and do not interfere with existing shortcut behavior.
6. Persist preferences using existing storage utilities or patterns in this codebase; if you need to extend a helper (e.g., preference keys), update all affected call sites rather than creating parallel logic.
7. Preserve backwards compatibility: if stored preferences are absent or invalid, fall back gracefully to the current behavior (visible bottom bar with no position persistence).
</implementation>

<output>
Create or modify files with these guidelines:
- `./index.tsx` – Add and wire state for bar position and visibility, integrate persistence, and pass the necessary props into the bottom bar component(s).
- `./components` (e.g., `./components/PromptPopup.tsx` or whichever component currently renders the bottom bar) – Extend layout and controls to support pinning, hide/show behavior, and micro-interactions while preserving all existing functionality.
- `./index.css` – Define token-based utility classes or component styles for pinned positions, transitions, and micro-interactions with no hard-coded colors, spacing, or radii.
- `./design-system` – Only if absolutely necessary, extend design tokens (e.g., motion/transition tokens) rather than inlining new values.
</output>

<verification>
Before declaring the task complete, verify:
1. On first load, the prompt bar appears in its original bottom position and behaves exactly as before.
2. Changing the bar position between bottom/left/right updates the layout correctly, with smooth micro-interactions and no overlap that makes the app unusable at common viewport sizes.
3. Hiding the bar animates it away and leaves a visible, accessible control to show it again; showing it restores full functionality without layout glitches.
4. Refreshing the page preserves the last chosen pinned position and visibility state.
5. Keyboard navigation and screen readers can reach and operate the pin position and hide/show controls in all supported positions.
6. TypeScript compilation and the Vite dev build succeed with no new errors.
</verification>

<success_criteria>
- Users can pin the prompt bar to the bottom, left, or right edges and hide/show it without losing any existing capabilities.
- Micro-interactions make position changes and hide/show transitions feel smooth and responsive while staying aligned with the existing Flash UI aesthetic.
- Preferences persist across sessions, and existing users who never touch the new controls experience no regressions from current behavior.
</success_criteria>
