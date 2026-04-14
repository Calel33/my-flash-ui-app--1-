# Live Editing Removal Plan

## Task Contract

| TYPE | TARGET | GOAL | DONE-WHEN |
|---|---|---|---|
| DECIDE | Live editing feature surface | Define a safe removal plan for live editing while preserving extract mode | Plan identifies exact files, order of changes, risks, and verification steps |

## Scope

- Remove only live element editing.
- Keep snippet extraction and all normal artifact/session flows.
- Preserve focused-artifact selection and iframe-based extract behavior.

## Planned Changes

1. Remove the user entrypoint
   - Delete the `Edit Element` action from `components/ActionBar.tsx`.
   - Keep the `Extract` action unchanged.

2. Simplify root app state
   - In `index.tsx`, remove:
     - `editingElement`
     - `isElementEditorOpen`
   - Remove `useElementEditor(...)` usage.
   - Remove the mounted `<ElementEditor />` modal.

3. Simplify iframe selection flow
   - Refactor `hooks/useIframeSelection.ts` so it only supports extract mode.
   - Remove edit-specific dependencies:
     - `setEditingElement`
     - `setIsElementEditorOpen`
   - Keep the `ELEMENT_SELECTED` handling for extract only.

4. Remove edit implementation files
   - Delete `hooks/useElementEditor.ts` once no longer referenced.
   - Delete `components/ElementEditor.tsx` once no longer referenced.

5. Update shared selector typing
   - Replace `selectorMode: 'edit' | 'extract' | false` with `selectorMode: 'extract' | false` where used.
   - Update any related prop types in:
     - `components/ActionBar.tsx`
     - `components/SessionGrid.tsx`
     - `index.tsx`
     - `hooks/useIframeSelection.ts`
     - `hooks/useSnippetConversion.ts` if needed

6. Clean up tests
   - Remove `tests/element-editor.smoke.test.tsx`.
   - Update any tests or snapshots that assume edit mode exists.
   - Keep or add a smoke check confirming extract mode still works if coverage is thin.

7. Verify no dead references remain
   - Check imports/usages for:
     - `ElementEditor`
     - `useElementEditor`
     - `editingElement`
     - `isElementEditorOpen`
     - `'edit'` selector mode branch
   - Confirm no UI copy still mentions editing.

8. Verify behavior after removal
   - Focus an artifact and confirm action bar still appears correctly.
   - Confirm `Extract` still enters selector mode.
   - Confirm clicking an element still triggers extraction flow.
   - Confirm normal generation, fullscreen, save-to-library, and code view still work.

9. Optional cleanup
   - If any CSS is editor-only, remove it after code removal.
   - Leave shared selector styles in place if extract mode still uses them.

## Risks

- Main risk: breaking extract mode by over-removing shared `selectorMode` logic.
- Low risk: artifact rendering/session persistence, because live editing is fairly isolated.
- Medium risk: leaving dead imports, types, or tests behind.

## Recommended Execution Order

1. Remove action bar edit button.
2. Remove app-level editor state and modal.
3. Refactor `useIframeSelection` to extract-only.
4. Narrow selector mode types.
5. Delete editor hook/component.
6. Update tests.
7. Run verification.

## Verification Checklist

1. No `Edit Element` button in the action bar.
2. No mounted editor modal.
3. Extract mode still selectable.
4. Element click still extracts snippet correctly.
5. No TypeScript or import errors.
6. Existing artifact interactions still work.
