<objective>
Fix the duplicate "Ref A" and "Ref B" artifact creation when importing or loading design systems. Currently, when a user imports or loads a design system, the code creates three artifacts: the main design system plus two duplicate references (Ref A and Ref B), which clutters the UI and creates confusion.
</objective>

<context>
You are working in the `my-flash-ui-app` Vite + React 19 application.

The app supports importing design systems via HTML upload and loading them from the creative library. When a design system is imported or loaded, the code incorrectly creates duplicate reference artifacts.

**Problem locations identified:**

1. **Import flow** (`index.tsx` lines 573-577):
   - `handleImportDesign` function creates a session with three artifacts for design systems
   - Main artifact + two duplicates with "Ref A" and "Ref B" names

2. **Load from library flow** (`index.tsx` lines 620-622):
   - `loadFromLibrary` function also creates three artifacts for design systems
   - Same duplication pattern

Both functions check `type === 'design-system'` or `item.type === 'design-system'` and create unnecessary duplicates.

Before coding, review:
@AGENTS.md
@types.ts
@index.tsx
@components/ImportDesignPanel.tsx
@utils.ts
</context>

<requirements>
1. Remove the duplicate "Ref A" and "Ref B" artifact creation logic from both import and load flows
2. When importing a design system, create only ONE artifact (the main design system)
3. When loading a design system from library, create only ONE artifact (the main design system)
4. Preserve all existing functionality for component imports/loads (non design-system items)
5. Ensure the fix applies to both:
   - `handleImportDesign` callback in index.tsx
   - `loadFromLibrary` function in index.tsx
6. Maintain backward compatibility with existing sessions
7. Do not modify the ImportDesignPanel component or utils - the issue is only in the session creation logic
</requirements>

<implementation>
**Locate the duplicate creation logic:**

In `index.tsx`, find these two locations:

1. `handleImportDesign` function (~lines 566-578):
```typescript
artifacts: type === 'design-system'
    ? [artifact, { ...artifact, id: `${sessionId}_1`, styleName: 'Ref A' }, { ...artifact, id: `${sessionId}_2`, styleName: 'Ref B' }]
    : [artifact]
```

2. `loadFromLibrary` function (~lines 613-623):
```typescript
artifacts: item.type === 'design-system'
    ? [artifact, { ...artifact, id: `${sessionId}_1`, styleName: 'Ref A' }, { ...artifact, id: `${sessionId}_2`, styleName: 'Ref B' }]
    : [artifact]
```

**Solution:**
Remove the conditional duplicate creation. Always create a single-artifact array, regardless of design system or component type.

**Why this matters:**
- The duplicate refs were likely intended for design system variations or reference implementations
- However, they create visual clutter and confusion in the UI
- Users can generate variations using the existing "Variations" feature if needed
- Single artifact per import/load simplifies the UX and state management
</implementation>

<output>
Modify this file:
- `./index.tsx` – Remove duplicate artifact creation in `handleImportDesign` and `loadFromLibrary` functions. Change both ternary expressions to always return single-element arrays: `[artifact]`
</output>

<verification>
Before declaring complete, verify your work:

1. **Code inspection:**
   - Search for "Ref A" and "Ref B" in index.tsx - should find NO occurrences after fix
   - Both `handleImportDesign` and `loadFromLibrary` should create single-artifact arrays
   - Component imports should still work (they already used single artifacts)

2. **Manual testing:**
   - Import an HTML file as "Design System" type
   - Verify only ONE artifact appears in the grid (not three)
   - Save it to library
   - Load it from library
   - Verify only ONE artifact appears (not three)
   - Import an HTML file as "Component" type
   - Verify behavior unchanged (still single artifact)

3. **Edge cases:**
   - Existing sessions with "Ref A" and "Ref B" should still load (no backward compatibility breaks)
   - The fix should not affect session creation from AI generation (handleSendMessage)
</verification>

<success_criteria>
- No "Ref A" or "Ref B" artifacts created when importing design systems
- No "Ref A" or "Ref B" artifacts created when loading design systems from library
- Import and load flows create exactly ONE artifact for both design systems and components
- All existing functionality preserved (variations, edit, extract, save, etc.)
- Clean, minimal code change - only modify the artifact array creation logic
</success_criteria>
