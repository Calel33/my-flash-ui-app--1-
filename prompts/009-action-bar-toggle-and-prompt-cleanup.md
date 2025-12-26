<objective>
Add toggle show/hide functionality for div.action-buttons and remove sent prompt text from displaying above the action buttons and in the input area after submission.
</objective>

<context>
You are working in a React 19 + Vite app (`my-flash-ui-app`) with strict design-system token rules.
The action bar (`.action-bar`) appears at the bottom when `focusedArtifactIndex !== null` and contains:
1. `.active-prompt-label` showing the sent prompt text
2. `.action-buttons` containing Grid View, Fullscreen, Edit, Extract, Agent Logic, and HTML/CSS buttons

Currently:
- Action buttons are always visible when the action bar is visible
- The sent prompt appears in `.active-prompt-label` (line 833 in index.tsx)
- The sent prompt also briefly shows in `.generating-prompt-text` during loading (line 942)

Read these files to understand current implementation:
@index.tsx (lines 830-945 contain action bar and input container)
@index.css (lines 454-512 contain action-bar and action-buttons styles)
</context>

<requirements>
1. Add a toggle button to show/hide the `.action-buttons` div while keeping the action bar visible
2. Remove the `.active-prompt-label` element completely so sent prompts don't appear above action buttons
3. Ensure the input box remains cleared after sending (already working via `setInputValue('')` on line 606)
4. The toggle state should persist during the session (use React state)
5. All styling must use design tokens from `index.css` (no hard-coded values)
</requirements>

<implementation>
1. In `./index.tsx`:
   - Add new state: `const [areActionsVisible, setAreActionsVisible] = useState(true);`
   - Remove the `<div className="active-prompt-label">{currentSession?.prompt}</div>` element (line 833)
   - Wrap `.action-buttons` in a conditional: `{areActionsVisible && (<div className="action-buttons">...</div>)}`
   - Add a toggle button inside `.action-bar` to control `areActionsVisible` state
   - Use an appropriate icon from `./components/Icons.tsx` (e.g., EyeIcon/EyeOffIcon pattern or ChevronUp/ChevronDown)
   
2. Toggle button requirements:
   - Position it logically (above or within action-bar, not inside action-buttons)
   - Use design tokens for styling (follow existing `.action-buttons button` pattern)
   - Clear visual indicator of expanded/collapsed state
   - Accessible: include `aria-label` and `aria-expanded` attributes

3. Preserve all existing functionality:
   - Grid View, Fullscreen, Edit, Extract, Agent Logic, HTML/CSS buttons work unchanged
   - Selector mode tip remains functional
   - Action bar visibility still controlled by `focusedArtifactIndex !== null`

4. Optional enhancement: Add smooth transition for action-buttons appear/disappear using CSS
   - Use `--transition-duration` and `--transition-easing` tokens
   - Animate opacity and/or max-height
</implementation>

<output>
Modify:
- `./index.tsx` – Add toggle state, remove `.active-prompt-label`, conditionally render `.action-buttons`, add toggle button
- `./index.css` – (Optional) Add transition styles for smooth show/hide animation if not already present
</output>

<verification>
Before declaring complete:
1. Action bar appears when an artifact is focused (existing behavior)
2. Toggle button is visible and clickable when action bar is visible
3. Clicking toggle shows/hides action-buttons div
4. `.active-prompt-label` no longer renders
5. Input box clears after sending prompt (already working)
6. All buttons in action-buttons work when visible
7. No hard-coded style values introduced
8. Accessible attributes present on toggle button
</verification>

<success_criteria>
- User can toggle action-buttons visibility via dedicated button
- Sent prompt text no longer appears above action buttons
- Input box remains clear after sending (confirmed working)
- All existing action bar functionality preserved
- Design tokens used exclusively for styling
</success_criteria>
