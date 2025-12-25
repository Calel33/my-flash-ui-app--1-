<objective>
Implement two UX enhancements in this React/Vite app: (1) add a fullscreen viewing mode for generated artifacts so users can focus on a single artifact without surrounding chrome, and (2) change the bottom input bar behavior so that when the user text input wraps to a second line, the input and send button move into a focused popup module for easier multi-line editing. These changes improve readability, focus, and usability for longer prompts and detailed artifact inspection.
</objective>

<context>
The project is a React 19 + Vite app defined in `./package.json` with design-system token rules described in `./AGENTS.md` and `~/.factory/AGENTS.md`. Artifacts are currently rendered in a main content area, and there is a persistent bottom bar used for entering prompts/commands (see components under `./components` for the bottom bar and artifact viewer implementation). The design system forbids hard-coded styles and requires using existing tokens from the `design-system` folder.
@[./AGENTS.md]
@[./components]
@[./design-system]
</context>

<requirements>
1. Add a fullscreen mode for viewing a selected artifact:
   - Provide a clear UI control (e.g., icon/button) on each artifact card or within the artifact viewer to enter fullscreen mode.
   - When activated, the selected artifact should expand to occupy the primary viewport (overlay or layout take-over) while dimming or hiding non-essential UI (sidebars, other artifacts, bottom bar) without breaking routing or app state.
   - Include a visible control to exit fullscreen and return to the normal layout, restoring scroll position and prior artifact selection state when possible.
   - Ensure fullscreen respects the design-system tokens for colors, spacing, elevation, and typography; do not introduce inline styles or raw hex values.

2. Change bottom bar input behavior to use a popup module on multi-line input:
   - Detect when the user’s text input in the bottom bar wraps or would expand beyond one line (e.g., via `onInput` and `scrollHeight` or similar) while the user is typing.
   - When this threshold is crossed, open a focused popup module that contains the same text input (with multi-line support) and the existing send/submit button, keeping current text, cursor position, and any in-progress state.
   - The popup should visually detach from the bottom bar (e.g., centered or pinned near the bottom) while maintaining consistent styling via design tokens; the original bottom bar can collapse its input while the popup is open.
   - Closing the popup (via explicit close control or after sending) should sync the final text back to the bottom bar input state and restore the standard layout, without losing the last sent text in history if such behavior already exists.

3. Maintain accessibility and responsiveness:
   - Ensure fullscreen and popup modes are keyboard accessible (tab order, focus trap where appropriate, ESC or an explicit button to close) and expose appropriate ARIA attributes (e.g., `role="dialog"` for the popup, `aria-label`s for controls).
   - Define responsive behavior so both fullscreen and the popup module behave well on narrow viewports, following the layout and spacing patterns used elsewhere in the app.

4. Do not introduce new dependencies; reuse existing patterns and utilities already present in `./components` or related modules. Respect the no inline styles / tokens-only rule at all times.
</requirements>

<implementation>
1. Identify the artifact viewer and bottom bar components under `./components` (and any related hooks/utilities) and review their current props, state, and layout behavior before making changes.
2. For fullscreen artifacts:
   - Add state to track the currently fullscreen artifact and whether fullscreen mode is active.
   - Implement a fullscreen overlay or layout mode that uses existing design-system tokens (backgrounds, shadows, radii) and composes existing artifact rendering logic rather than duplicating it.
   - Wire up enter/exit controls, ensuring they preserve artifact data and selection while toggling the layout.
3. For the bottom bar multi-line popup:
   - Extend the input component to detect when content exceeds a single line and trigger a popup open event; make the threshold and behavior consistent and predictable.
   - Implement the popup module as a reusable component that wraps the input and send button, using tokens for spacing, elevation, backgrounds, and typography.
   - Ensure input state is shared between bottom bar and popup so users never lose text when the UI transitions between modes.
4. Follow existing state management patterns (e.g., local `useState`, context, or other state container already used in the app) and keep new logic co-located with the relevant components.
5. Avoid deleting existing behavior; extend or wrap current logic so previous flows still work when the popup is never triggered and fullscreen is not used.
</implementation>

<output>
Modify or create files with these guidelines:
- Update the artifact viewer component file(s) under `./components` to support entering and exiting fullscreen mode for a selected artifact.
- Update the bottom bar/input component file(s) under `./components` to detect multi-line input and trigger the popup module when the text exceeds one line.
- If necessary, add a focused popup module component under `./components` (e.g., `./components/PromptPopup.tsx`) that encapsulates the multi-line input + send button UI using design-system tokens.
</output>

<verification>
Before considering the task complete, manually verify:
- Selecting an artifact and using the fullscreen control expands it into a fullscreen or near-fullscreen view and allows exiting back to the normal layout without losing state.
- Typing a short, single-line prompt keeps interaction inside the bottom bar without opening the popup.
- Typing a longer prompt that wraps beyond one line consistently opens the popup, preserves the typed content, and allows sending from within the popup.
- Closing the popup (with or without sending) keeps the app in a valid state, with the bottom bar input reflecting the latest text as intended.
- Keyboard-only navigation can reach, activate, and exit both fullscreen mode and the popup module, and no focus is trapped unexpectedly.
</verification>

<success_criteria>
- A user can toggle fullscreen viewing for any artifact via an obvious control and return to the standard layout without losing artifact context.
- When the bottom input text exceeds one line, a popup module reliably appears, containing the input and send button, and seamlessly syncs text state with the bottom bar.
- All new UI respects the existing design system tokens and app-wide patterns, introduces no new dependencies, and maintains accessibility and responsive behavior.
</success_criteria>
