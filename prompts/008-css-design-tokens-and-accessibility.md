<objective>
Refactor CSS to use design system tokens for all hard-coded values and add proper accessibility support for motion-sensitive users. This improves maintainability, consistency, and ensures the app respects user preferences for reduced motion.
</objective>

<context>
You are working in the `my-flash-ui-app` Vite + React 19 application.

The app currently has some CSS hard-coded values that violate the design system token-only rule from AGENTS.md. Additionally, hover transforms like `transform: scale(1.05)` are applied without respecting `prefers-reduced-motion`, which can be jarring for users with motion sensitivity.

**Current Design Token Structure:**
The app already uses CSS variables in `:root` for core design tokens:
- Colors: `--app-bg`, `--text-primary`, `--border-color`, `--glass-border`, etc.
- Transitions: `--transition-duration`, `--transition-easing`
- Layout: `--bar-width-vertical`

**Problem Areas:**

1. **Missing tokens for:**
   - Spacing values (padding: 10px 20px, gap: 8px, etc.)
   - Border radius (border-radius: 12px, 999px)
   - Background opacity overlays (rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.15))
   - Shadows (box-shadow values)
   - Motion/scale effects

2. **Accessibility Issues:**
   - Line 613: `.open-popup-button:hover` has `transform: scale(1.05)` without motion check
   - Line 2217: `.bar-reveal-handle:hover` has `transform: scale(1.05)` without motion check

Before coding, review:
@AGENTS.md
@index.css (specifically :root and the problem areas)
</context>

<requirements>
1. **Add comprehensive design tokens to :root** following existing patterns:
   - Spacing scale: --spacing-xs, --spacing-sm, --spacing-md, --spacing-lg, --spacing-xl
   - Border radius: --radius-sm, --radius-md, --radius-lg, --radius-pill
   - Glass/overlay colors: --glass-overlay-subtle, --glass-overlay-medium, --glass-overlay-strong
   - Shadows: --shadow-sm, --shadow-md, --shadow-lg
   - Motion: --scale-hover (for consistent hover scale value)

2. **Replace ALL hard-coded values** with tokens:
   - All `padding` values should use spacing tokens
   - All `gap` values should use spacing tokens
   - All `border-radius` values should use radius tokens
   - All `rgba(255, 255, 255, ...)` values should use glass overlay tokens
   - All `box-shadow` values should use shadow tokens
   - All hover scale values should use --scale-hover

3. **Add prefers-reduced-motion support:**
   - Wrap ALL `transform: scale()` hover effects in `@media (prefers-reduced-motion: no-preference)`
   - Keep other hover effects (background, opacity changes) outside the motion query
   - Ensure users with motion preferences still get visual feedback

4. **Maintain existing aesthetics:**
   - Token values should match current hard-coded values exactly
   - No visual changes to the UI
   - Preserve all existing class names and selectors

5. **Follow existing patterns:**
   - Use the same naming convention as existing tokens (kebab-case, descriptive)
   - Place new tokens logically within :root
   - Keep comments for token sections
</requirements>

<implementation>
**Step 1: Define New Design Tokens**

Add to `:root` (around line 5-24):

```css
:root {
    /* ... existing tokens ... */

    /* Spacing Scale */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 12px;
    --spacing-lg: 16px;
    --spacing-xl: 20px;
    --spacing-2xl: 24px;

    /* Border Radius */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-pill: 999px;

    /* Glass Overlays - White overlays on dark backgrounds */
    --glass-overlay-subtle: rgba(255, 255, 255, 0.05);
    --glass-overlay-medium: rgba(255, 255, 255, 0.1);
    --glass-overlay-strong: rgba(255, 255, 255, 0.15);

    /* Shadows */
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);

    /* Motion */
    --scale-hover: 1.05;
}
```

**Step 2: Find and Replace Hard-Coded Values**

Search patterns to replace:
- `padding: 10px 20px` → `padding: var(--spacing-md) var(--spacing-xl)`
- `padding: 10px 16px` → `padding: var(--spacing-md) var(--spacing-lg)`
- `padding: 12px` → `padding: var(--spacing-md)`
- `padding: 8px` → `padding: var(--spacing-sm)`
- `gap: 8px` → `gap: var(--spacing-sm)`
- `border-radius: 12px` → `border-radius: var(--radius-md)`
- `border-radius: 999px` → `border-radius: var(--radius-pill)`
- `rgba(255, 255, 255, 0.05)` → `var(--glass-overlay-subtle)`
- `rgba(255, 255, 255, 0.1)` → `var(--glass-overlay-medium)`
- `rgba(255, 255, 255, 0.15)` → `var(--glass-overlay-strong)`
- `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4)` → `box-shadow: var(--shadow-md)`

**Step 3: Add Motion Accessibility**

For each hover effect with `transform: scale(1.05)`, refactor like this:

**Before:**
```css
.open-popup-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
}
```

**After:**
```css
.open-popup-button:hover:not(:disabled) {
    background: var(--glass-overlay-medium);
}

@media (prefers-reduced-motion: no-preference) {
    .open-popup-button:hover:not(:disabled) {
        transform: scale(var(--scale-hover));
    }
}
```

**Key Locations:**
- Line ~579-619: `.open-popup-button` and related styles
- Line ~2215-2218: `.bar-reveal-handle:hover`

**Step 4: Systematic Replacement**

Go through index.css section by section and replace:
1. All spacing values (padding, margin, gap)
2. All border-radius values  
3. All rgba(255, 255, 255, ...) overlay colors
4. All box-shadow values
5. All transform: scale() effects (with motion query)

**Why this matters:**
- **Maintainability**: Changing spacing/colors becomes a single-line edit in :root
- **Consistency**: All similar values are guaranteed to match
- **Accessibility**: Users with vestibular disorders or motion sensitivity get a better experience
- **Compliance**: Follows AGENTS.md strict "token-only" rule
</implementation>

<output>
Modify this file:
- `./index.css` – Add comprehensive design tokens to :root, replace all hard-coded values with tokens, and wrap motion effects in prefers-reduced-motion queries
</output>

<verification>
Before declaring complete, verify your work:

1. **Code inspection:**
   - Search for `rgba(255, 255, 255,` in index.css - should find ZERO occurrences (all replaced with tokens)
   - Search for `padding: \d+px` - should find minimal occurrences (all replaced with tokens)
   - Search for `border-radius: \d+px` - should find minimal occurrences (all replaced with tokens)
   - Search for `transform: scale` - all occurrences should be wrapped in `@media (prefers-reduced-motion: no-preference)`
   - Verify :root has complete token sets for spacing, radius, glass-overlays, shadows, motion

2. **Visual testing:**
   - Run `npm run dev`
   - Verify UI looks IDENTICAL to before (no visual changes)
   - Check button hovers, reveals, tooltips all work
   - Test with browser DevTools: Emulate CSS media `prefers-reduced-motion: reduce`
   - Verify hover effects still show visual feedback (color changes) but NO scaling/transforms

3. **Token verification:**
   - All new tokens use values matching the old hard-coded values exactly
   - Tokens follow existing naming patterns (kebab-case)
   - Tokens are logically grouped and commented

4. **Accessibility:**
   - Motion effects only activate when user hasn't requested reduced motion
   - Non-motion feedback (color, opacity) always works
   - No jarring animations for motion-sensitive users
</verification>

<success_criteria>
- :root contains comprehensive design tokens (spacing, radius, overlays, shadows, motion)
- ZERO hard-coded rgba(255, 255, 255, ...) values in selectors (all use tokens)
- ZERO hard-coded padding/gap/border-radius values (all use tokens)
- ALL transform: scale() effects wrapped in @media (prefers-reduced-motion: no-preference)
- UI appearance unchanged (pixel-perfect match)
- App respects user motion preferences
- Code follows AGENTS.md token-only rule
</success_criteria>
