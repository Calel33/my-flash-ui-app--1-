<objective>
Fix the caret position behavior in the Expanded Prompt popup so that when a user opens the popup from the bottom inline input, the text cursor is placed at the END of the existing prompt text (ready to continue typing), not at the beginning. This improves usability for long prompts and prevents users from accidentally editing the start of their prompt.
</objective>

<context>
You are working in a React 19 + Vite app that renders a bottom inline textarea for prompt entry and an "Expanded Prompt" modal popup for focused multi-line editing.
The inline input and popup share the same `inputValue` state and are wired together in `./index.tsx` using `PromptPopup` from `./components/PromptPopup.tsx` and a `textarea` ref for the inline input.
The caret currently appears at the start of the text when the popup opens, which is frustrating when users want to append to an existing prompt.
Review these files to understand the current implementation and relationships:
- @index.tsx
- @components/PromptPopup.tsx
- @index.css (for any caret/selection related styles, though behavior should be driven by JS/React)
If present in the repo, also review @CLAUDE.md for any additional project conventions you must follow.
</context>

<requirements>
1. When the Expanded Prompt popup opens with existing text in its textarea, place the caret at the end of the text rather than the beginning.
2. Preserve existing behavior for focus management and keyboard shortcuts:
   - The popup should still auto-focus the textarea when opened.
   - Existing Escape key handling and send button behavior must continue to work.
3. Ensure that caret placement logic is robust across these scenarios:
   - Opening the popup from the inline input with non-empty text.
   - Re-opening the popup after closing it without sending.
   - Opening the popup while a generation is loading or has just completed (no crashes or visual glitches).
4. Do not introduce visible flicker, selection flashes, or layout jumps when the popup opens.
5. Follow the existing state and ref patterns in this codebase; do not add new global state or ad-hoc DOM queries outside React refs.
</requirements>

<implementation>
1. In `./components/PromptPopup.tsx`, enhance the `useEffect` that runs when `isOpen` changes so that after focusing the textarea you also move the cursor to the end of the current value.
   - Use the existing `textareaRef` and standard DOM APIs such as `setSelectionRange` or `selectionStart/selectionEnd` to position the caret.
   - Guard against `null` refs and ensure you only manipulate selection when the popup is open.
2. Make sure that caret placement happens after the textarea has the latest `value` from props.
   - If necessary, use `requestAnimationFrame` or a microtask (`queueMicrotask`) to run selection logic after React has flushed updates so the selection is applied to the current text.
3. Avoid changing the component API for `PromptPopup`; keep the `PromptPopupProps` interface the same so existing call sites in `index.tsx` still compile.
4. Do not change styling, tokens, or layout classes in `index.css` unless absolutely required for this behavior; this is primarily a behavior-level fix.
5. Keep the implementation minimal and aligned with current patterns; no new external dependencies should be introduced.
</implementation>

<output>
Update these files:
- `./components/PromptPopup.tsx` – Add or refine logic inside the `useEffect` (or a new effect if clearer) to set the textarea caret to the end of the text when `isOpen` becomes true, while preserving existing focus and Escape key behavior.

Do not modify other files unless you find a clear, direct need to support the caret positioning behavior that cannot be achieved within `PromptPopup`.
</output>

<verification>
Before declaring the task complete, verify the behavior manually by running the app in development mode:
- `npm run dev`

Then confirm all of the following in the browser:
1. Type a multi-line prompt in the bottom inline input, then trigger the Expanded Prompt popup (e.g., by typing until it opens or using the existing trigger).
   - The popup textarea should show the same text.
   - The caret should be placed at the END of the text so you can immediately continue typing.
2. Close the popup without sending, re-open it, and confirm the caret is still at the end of the existing text.
3. Send a prompt from the popup and confirm that:
   - The send behavior is unchanged.
   - There are no console errors related to selection or refs.

If any of these checks fail, iterate on the implementation until they pass.
</verification>

<success_criteria>
- The caret reliably appears at the end of the text in the Expanded Prompt popup textarea whenever it opens with existing content.
- All existing popup behaviors (focus, Escape handling, send button behavior, shared `inputValue` state) remain intact and unbroken.
- No new visual regressions, errors, or warnings are introduced in the console.
</success_criteria>
