<objective>
Design and implement a feature in this project that lets users import design systems or individual components by uploading HTML files generated externally, and then use those imported designs like normal within the existing artifact/library experience. Ensure that when users download code or HTML for an imported design, the downloaded file name reflects the design's name rather than the generic default.
</objective>

<context>
You are working in the `my-flash-ui-app` Vite + React 19 application.
The app currently generates artifacts (HTML designs/components) using Gemini, displays them via `ArtifactCard`, manages sessions in `index.tsx`, and stores items in a creative library using `LibraryItem`/`Artifact` types from `types.ts`.
There is an existing download flow in `index.tsx` (`handleDownload`) that currently uses a fixed filename like `flash-ui-export.html/.tsx`.
The library already supports saving artifacts as either `design-system` or `component` types via `handleSaveToLibrary` and loading them back with `loadFromLibrary`.
Before coding, review:
@AGENTS.md
@types.ts
@index.tsx
@components/ArtifactCard.tsx
@components/SideDrawer.tsx
@constants.ts
@utils.ts
@index.css
Also review `CLAUDE.md` or project-specific agent guidelines if present to align with local conventions.
</context>

<requirements>
1. Add a way for users to import design systems or components by uploading an HTML file (e.g., files exported from previous generations or external tools).
2. When a file is uploaded, parse and store it as an `Artifact` / `LibraryItem` so it can be:
   - saved into the existing creative library,
   - loaded into a new or existing `Session`,
   - displayed in the main artifact grid via `ArtifactCard`.
3. Allow the user to specify or confirm a human-readable design name when importing; default to the uploaded filename (without extension) if they don’t provide one.
4. Integrate the import UI into the existing UI chrome (e.g., top controls, library drawer, or a new drawer mode) rather than creating a disconnected screen.
5. Update the download behavior so that when the user downloads content from the drawer for a given design, the filename uses that design’s name (normalized to a safe filename) and the appropriate extension based on context (`.html`, `.tsx`, `.txt` for prompts), while keeping the MIME types correct.
6. Ensure imported designs can be marked as `design-system` or `component` (using the existing `LibraryItem.type` and `Artifact.isDesignSystem`) and that this is reflected wherever the UI currently distinguishes design systems.
7. Persist imported designs in the same storage mechanism already used for the Creative Library so they survive page refreshes.
8. Maintain compatibility with all existing flows: generating new artifacts with Gemini, converting to React, editing elements, saving to library, loading from library, and downloading.
</requirements>

<implementation>
1. Follow existing patterns in `index.tsx` for state management, library persistence, and artifact/session creation; do not introduce a new global state library.
2. Implement the upload/import UI as a composable component (for example, an import panel rendered inside `SideDrawer` when a new `mode` like `"import"` is active, or integrated into the library view) rather than scattering logic across unrelated components.
3. Reuse and extend existing types from `types.ts` instead of creating parallel types; if you add fields (e.g., a `sourceFilename` or explicit `displayName`), update all affected code paths that read/write these types.
4. For reading uploaded files, use the browser File API (e.g., `FileReader`) in a way that keeps the UI responsive and handles errors (invalid file, empty content) with user-friendly feedback.
5. For filename generation on download, derive a safe slug from the design name (e.g., lowercased, spaces replaced with `-`, removing unsafe characters) and append the correct extension, but still allow future customization if needed.
6. Keep file responsibilities narrow: UI components should focus on rendering and local interaction, while helper functions (e.g., for slugifying names or constructing `Artifact` / `LibraryItem` objects from uploaded files) live in `utils.ts` or a small new utility module.
7. Do not introduce new external dependencies; rely on the existing toolchain (React, TypeScript, Vite) and browser APIs.
8. Maintain and extend the existing styling approach in `index.css` using the project’s design tokens and class naming patterns; do not add inline styles.
</implementation>

<output>
Create or modify files with these relative paths:
- `./index.tsx` – Extend state and handlers to support importing HTML files as designs/components, wiring the import UI into existing controls or drawer modes, and update `handleDownload` to use design-based filenames.
- `./components/SideDrawer.tsx` – If needed, extend to support an import-specific mode or layout while preserving existing behavior for other modes.
- `./components/ArtifactCard.tsx` – Ensure imported designs render correctly; add minimal, non-intrusive affordances if necessary to distinguish design systems vs components.
- `./types.ts` – Add or adjust fields on `Artifact` / `LibraryItem` (e.g., design name vs source filename) as required by the feature.
- `./utils.ts` – Add helper(s) for slugifying design names and constructing artifacts/library items from uploaded files.
- `./index.css` – Add or tweak styles to support the new import UI and any visual distinctions, consistent with existing design tokens.
If additional small components are needed (e.g., `ImportDesignPanel`), create them under `./components/` with focused responsibilities.
</output>

<verification>
Before declaring the work complete, verify:
1. A user can select an HTML file, see a preview/name, choose whether it is a design system or component, and successfully import it.
2. Imported designs appear in the main artifact grid and in the Creative Library with the chosen name and correct type.
3. Loading an imported design from the library creates a new `Session` and renders artifacts as expected, including design-system-specific behavior if applicable.
4. Downloading HTML, React code, or prompts for an imported design produces a file whose name matches the design’s name (slugified) and has the appropriate extension.
5. Existing flows (generation, editing, saving to library, loading from library, downloading) still work as before for non-imported artifacts.
6. TypeScript compilation succeeds and the Vite dev server builds without errors.
</verification>

<success_criteria>
- Users can import HTML files as design systems or components and see them alongside AI-generated artifacts.
- Imported designs integrate seamlessly with the existing session, library, and editing flows without regressions.
- Downloaded files for imported designs have filenames based on the design name rather than a generic default.
- No new dependencies are added, and all TypeScript types remain consistent across the codebase.
</success_criteria>
