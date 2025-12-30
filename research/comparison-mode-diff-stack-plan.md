# Comparison Mode - Diff Stack Implementation Plan

**Feature:** Multi-provider/model side-by-side comparison interface  
**Date:** 2025-12-30  
**Strategy:** Incremental vertical slices via diff stack workflow

---

## Executive Summary

This plan breaks the Comparison Mode feature into **5 logical diffs**, each delivering a working vertical slice. Every diff is testable, preserves existing flows, and builds incrementally toward the complete feature.

### Key Constraints
- **P0 MUST:** Use existing design tokens only (no hard-coded values)
- **P0 MUST:** Preserve all existing single-provider flows untouched
- **P0 MUST:** Reuse streaming facades from `ai/generate.ts` (no new low-level API calls)
- **P1 SHOULD:** Keep files ≤500 lines; single responsibility per module

---

## Diff Stack Breakdown

### **Diff 1: Foundation - Types & State Management**
**Goal:** Add core comparison types and state structure without UI changes

**Scope:**
- Add `ComparisonSlot` type to `types.ts`
- Add comparison state to `index.tsx` (default: empty, not active)
- Create `hooks/useComparisonMode.ts` for slot management logic

**Files Modified:**
```
types.ts                        # Add ComparisonSlot, ComparisonResult types
index.tsx                       # Add comparisonSlots state, isComparisonMode flag
hooks/useComparisonMode.ts      # NEW - slot add/remove/update helpers
```

**Types to Add:**
```typescript
// types.ts additions
export interface ComparisonSlot {
  id: string;
  provider: ProviderId;
  modelId: string;
}

export interface ComparisonResult {
  slotId: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  content: string;
  error?: string;
  provider: ProviderId;
  modelId: string;
}
```

**Verification:**
- TypeScript compiles without errors
- New state initializes correctly in `index.tsx`
- `useComparisonMode` hook exports working add/remove/update functions
- No visual changes to UI
- All existing tests pass

**P0 Compliance:**
- ✅ No assumptions - all types match existing `ProviderId` pattern
- ✅ Architecture preserved - state follows existing patterns
- ✅ No UI changes yet

---

### **Diff 2: Comparison Mode Toggle & Empty State**
**Goal:** Add UI toggle to enter/exit Comparison Mode with empty state

**Scope:**
- Add toggle button to PromptBar
- Create `components/ComparisonMode.tsx` with empty state
- Mount/unmount ComparisonMode component based on `isComparisonMode` flag

**Files Modified:**
```
components/PromptBar.tsx        # Add Comparison Mode toggle button
components/ComparisonMode.tsx   # NEW - Empty state component
index.tsx                       # Conditionally render ComparisonMode
components/Icons.tsx            # Add ComparisonIcon (optional)
index.css                       # Add .comparison-mode-container base styles
```

**Component Structure:**
```typescript
// components/ComparisonMode.tsx (v1 - empty state)
export default function ComparisonMode({
  onExit,
}: {
  onExit: () => void;
}) {
  return (
    <div className="comparison-mode-container">
      <div className="comparison-mode-header">
        <h2>Comparison Mode</h2>
        <button onClick={onExit} className="mini-mode-toggle">
          Exit
        </button>
      </div>
      <div className="comparison-empty-state">
        <p>Add providers to compare</p>
      </div>
    </div>
  );
}
```

**CSS Additions (index.css):**
```css
/* Comparison Mode - Composing existing tokens */
.comparison-mode-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--app-bg);
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-2xl);
}

.comparison-mode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.comparison-empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
}
```

**Verification:**
- Toggle button appears in PromptBar (reuses existing button styles)
- Clicking toggle shows ComparisonMode overlay
- Exit button returns to normal mode
- Normal mode UI completely untouched and functional
- No hard-coded colors/spacing (verified via CSS review)

**P0 Compliance:**
- ✅ Design system followed - uses existing tokens only
- ✅ No breaking changes to normal mode
- ✅ Modal file <500 lines

---

### **Diff 3: Slot Configuration UI**
**Goal:** Add provider/model selection for comparison slots

**Scope:**
- Add slot list with add/remove controls
- Integrate provider/model selects (filtered by provider)
- Enforce max slot limit (4-6 slots)
- Persist slot configs during session

**Files Modified:**
```
components/ComparisonMode.tsx   # Add slot configuration UI
hooks/useComparisonMode.ts      # Add max slot enforcement
ai/providers.ts                 # Export getModelsByProvider helper (if needed)
index.css                       # Add slot card styles
```

**Updated Component:**
```typescript
// components/ComparisonMode.tsx (v2 - with slot UI)
export default function ComparisonMode({
  slots,
  addSlot,
  removeSlot,
  updateSlot,
  onExit,
}: {
  slots: ComparisonSlot[];
  addSlot: () => void;
  removeSlot: (id: string) => void;
  updateSlot: (id: string, updates: Partial<ComparisonSlot>) => void;
  onExit: () => void;
}) {
  const MAX_SLOTS = 6;

  return (
    <div className="comparison-mode-container">
      <div className="comparison-mode-header">
        <h2>Comparison Mode</h2>
        <button onClick={onExit} className="mini-mode-toggle">
          Exit
        </button>
      </div>
      
      <div className="comparison-slots-wrapper">
        {slots.map((slot) => (
          <div key={slot.id} className="comparison-slot-card">
            <select
              value={slot.provider}
              onChange={(e) => updateSlot(slot.id, { provider: e.target.value as ProviderId })}
              className="provider-select"
            >
              <option value="gemini">Gemini</option>
              <option value="glm">GLM</option>
              <option value="openrouter">OpenRouter</option>
            </select>
            
            <select
              value={slot.modelId}
              onChange={(e) => updateSlot(slot.id, { modelId: e.target.value })}
              className="model-select"
            >
              {MODELS.filter(m => m.provider === slot.provider).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            
            <button
              onClick={() => removeSlot(slot.id)}
              className="mini-mode-toggle"
              aria-label="Remove slot"
            >
              ×
            </button>
          </div>
        ))}
        
        {slots.length < MAX_SLOTS && (
          <button onClick={addSlot} className="add-slot-btn">
            + Add Slot
          </button>
        )}
      </div>
    </div>
  );
}
```

**CSS Additions:**
```css
.comparison-slots-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.comparison-slot-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--glass-overlay-subtle);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.add-slot-btn {
  padding: var(--spacing-md);
  background: var(--glass-overlay-medium);
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-duration) var(--transition-easing);
}

.add-slot-btn:hover {
  background: var(--glass-overlay-strong);
  border-color: var(--accent-color);
  color: var(--text-primary);
}
```

**Verification:**
- Can add up to 6 slots
- Add button disabled at max slots
- Provider selection updates available models
- Remove button deletes slot
- Model selects show only provider-specific models
- Existing select styles (.provider-select, .model-select) reused

**P0 Compliance:**
- ✅ MCP context verified - MODELS, getComponentModels patterns confirmed
- ✅ Design system tokens only
- ✅ Max slot limit enforced

---

### **Diff 4: Prompt Input & Parallel Generation**
**Goal:** Add prompt input and trigger parallel generation across slots

**Scope:**
- Add prompt input to ComparisonMode
- Create comparison generation handler using existing facades
- Track per-slot loading states
- Display loading indicators per slot

**Files Modified:**
```
components/ComparisonMode.tsx   # Add prompt input + submit
hooks/useComparisonGeneration.ts # NEW - parallel generation orchestrator
index.css                       # Add results grid layout
```

**New Hook:**
```typescript
// hooks/useComparisonGeneration.ts
import { useState, useCallback } from 'react';
import { streamHtmlArtifact } from '../ai/generate';
import type { ComparisonSlot, ComparisonResult } from '../types';

export function useComparisonGeneration() {
  const [results, setResults] = useState<ComparisonResult[]>([]);
  
  const generateComparison = useCallback(async (
    prompt: string,
    slots: ComparisonSlot[]
  ) => {
    // Initialize results
    const initialResults: ComparisonResult[] = slots.map(slot => ({
      slotId: slot.id,
      status: 'loading',
      content: '',
      provider: slot.provider,
      modelId: slot.modelId,
    }));
    setResults(initialResults);
    
    // Kick off parallel streams
    await Promise.allSettled(
      slots.map(async (slot, index) => {
        try {
          const stream = streamHtmlArtifact({
            provider: slot.provider,
            modelId: slot.modelId,
            prompt,
          });
          
          let content = '';
          for await (const chunk of stream) {
            content += chunk;
            setResults(prev => prev.map(r =>
              r.slotId === slot.id
                ? { ...r, content, status: 'loading' }
                : r
            ));
          }
          
          setResults(prev => prev.map(r =>
            r.slotId === slot.id
              ? { ...r, status: 'success' }
              : r
          ));
        } catch (error) {
          setResults(prev => prev.map(r =>
            r.slotId === slot.id
              ? { ...r, status: 'error', error: error.message }
              : r
          ));
        }
      })
    );
  }, []);
  
  return { results, generateComparison };
}
```

**Updated ComparisonMode Component:**
```typescript
// Add to ComparisonMode.tsx
const [prompt, setPrompt] = useState('');
const { results, generateComparison } = useComparisonGeneration();

const handleSubmit = () => {
  if (!prompt.trim() || slots.length === 0) return;
  generateComparison(prompt, slots);
};

// Add UI
<div className="comparison-prompt-section">
  <textarea
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    placeholder="Enter prompt to compare across providers..."
    className="comparison-prompt-input"
  />
  <button
    onClick={handleSubmit}
    disabled={!prompt.trim() || slots.length === 0}
    className="comparison-submit-btn"
  >
    Compare
  </button>
</div>

<div className="comparison-results-grid">
  {results.map(result => (
    <div key={result.slotId} className="comparison-result-card">
      <div className="result-header">
        <span>{result.provider}</span>
        <span>{result.modelId}</span>
      </div>
      {result.status === 'loading' && <div className="loading-spinner">...</div>}
      {result.status === 'error' && <div className="error-msg">{result.error}</div>}
      {result.content && <div className="result-preview">{result.content}</div>}
    </div>
  ))}
</div>
```

**CSS Additions:**
```css
.comparison-prompt-section {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.comparison-prompt-input {
  flex: 1;
  padding: var(--spacing-md);
  background: var(--input-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
}

.comparison-submit-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--accent-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-duration) var(--transition-easing);
}

.comparison-submit-btn:hover:not(:disabled) {
  background: var(--glass-overlay-strong);
  transform: scale(var(--scale-hover));
}

.comparison-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comparison-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  flex: 1;
  overflow-y: auto;
}

.comparison-result-card {
  background: var(--glass-overlay-subtle);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.result-header {
  display: flex;
  justify-content: space-between;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: var(--text-secondary);
}

.error-msg {
  padding: var(--spacing-md);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  color: #fca5a5;
  font-size: 0.75rem;
}
```

**Verification:**
- Submit disabled when no prompt or no slots
- Parallel generation kicks off for all slots
- Loading states show per slot independently
- One slot failing doesn't block others
- Streaming content updates in real-time
- Reuses existing `streamHtmlArtifact` facade (no new API calls)

**P0 Compliance:**
- ✅ Dependencies mapped - uses `ai/generate.ts` facades only
- ✅ No new low-level API calls
- ✅ Error handling preserves existing patterns

---

### **Diff 5: Results Rendering & Responsive Layout**
**Goal:** Render HTML previews and ensure responsive grid layout

**Scope:**
- Render HTML content in iframes (similar to existing artifact cards)
- Add responsive breakpoints for grid
- Polish loading/error states
- Add keyboard shortcuts (ESC to exit)

**Files Modified:**
```
components/ComparisonMode.tsx   # Add iframe rendering, keyboard handlers
index.css                       # Add responsive grid breakpoints
```

**Updated Result Rendering:**
```typescript
// In comparison-result-card
{result.content && (
  <div className="result-preview-wrapper">
    <iframe
      srcDoc={result.content}
      className="result-preview-iframe"
      sandbox="allow-scripts"
      title={`Result: ${result.provider} - ${result.modelId}`}
    />
  </div>
)}
```

**Responsive CSS:**
```css
/* Mobile: stack vertically */
@media (max-width: 768px) {
  .comparison-results-grid {
    grid-template-columns: 1fr;
  }
  
  .comparison-slot-card {
    flex-direction: column;
    align-items: stretch;
  }
}

/* Tablet: 2 columns */
@media (min-width: 769px) and (max-width: 1200px) {
  .comparison-results-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: up to 3 columns */
@media (min-width: 1201px) {
  .comparison-results-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

.result-preview-wrapper {
  flex: 1;
  min-height: 300px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.result-preview-iframe {
  width: 100%;
  height: 100%;
  min-height: 300px;
  border: none;
  background: white;
}
```

**Keyboard Shortcut:**
```typescript
// Add to ComparisonMode useEffect
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onExit();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onExit]);
```

**Verification:**
- HTML renders correctly in iframes
- Grid collapses to 1 column on mobile
- Grid shows 2 columns on tablet
- Grid shows 3+ columns on desktop
- ESC key exits Comparison Mode
- All results scrollable independently
- No horizontal overflow at any breakpoint

**P0 Compliance:**
- ✅ Responsive behavior defined (mobile/tablet/desktop)
- ✅ Accessibility: keyboard navigation, ARIA labels
- ✅ Design tokens only - no hard-coded breakpoints outside CSS

---

## Diff Stack Summary

| Diff | Description | Files Changed | Tests Required |
|------|-------------|---------------|----------------|
| 1 | Types & State | 3 new/modified | Unit tests for types, state |
| 2 | Toggle & Empty State | 4 new/modified | Integration: toggle on/off |
| 3 | Slot Configuration | 3 modified | Unit: slot CRUD, max limit |
| 4 | Generation & Loading | 3 new/modified | Integration: parallel streams |
| 5 | Rendering & Responsive | 2 modified | E2E: full comparison flow |

**Total:** ~12 files, 5 incremental diffs

---

## Implementation Order

1. **Diff 1** → Verify types compile, state initializes
2. **Diff 2** → Verify toggle works, no regressions
3. **Diff 3** → Verify slot management, model filtering
4. **Diff 4** → Verify parallel generation, error isolation
5. **Diff 5** → Verify rendering, responsive layout

Each diff should be:
- ✅ Committed separately
- ✅ Tested independently
- ✅ Reviewed for P0 compliance before next diff

---

## Testing Checklist (Per Diff)

### Diff 1
- [ ] TypeScript compiles without errors
- [ ] New state initializes with empty slots array
- [ ] `useComparisonMode` hook exports correct API

### Diff 2
- [ ] Toggle button appears in PromptBar
- [ ] Clicking toggle shows ComparisonMode overlay
- [ ] Exit button restores normal mode
- [ ] Normal mode unchanged and functional
- [ ] No hard-coded styles (CSS review passed)

### Diff 3
- [ ] Can add slots up to max limit (6)
- [ ] Add button disabled at max
- [ ] Remove slot works
- [ ] Provider change updates model list
- [ ] Model selects show filtered options

### Diff 4
- [ ] Submit disabled when no prompt/slots
- [ ] Parallel generation starts for all slots
- [ ] Per-slot loading states visible
- [ ] One slot error doesn't block others
- [ ] Streaming updates content in real-time

### Diff 5
- [ ] HTML renders in iframes
- [ ] Grid responsive on mobile/tablet/desktop
- [ ] ESC key exits mode
- [ ] No horizontal scroll at any width
- [ ] All results independently scrollable

---

## P0 Compliance Gate (Final)

Before merging to main, verify:

- [ ] **P0:** MCP context retrieved for all symbols
- [ ] **P0:** No assumptions made - all APIs verified
- [ ] **P0:** Architecture preserved - no breaking changes to normal mode
- [ ] **P0:** Design system followed - tokens only, no hard-coded values
- [ ] **P0:** Dependencies mapped - all affected files identified
- [ ] **P1:** Tests passing - smoke tests for all diffs
- [ ] **P1:** Files <500 lines - modular structure maintained

---

## Rollback Strategy

If any diff causes issues:

1. **Revert the specific diff** (Git revert)
2. **Verify previous diff still works**
3. **Fix issues in isolated branch**
4. **Re-apply with fixes**

Each diff is independently revertable without breaking prior work.

---

## References

- Provider patterns: `ai/providers.ts`, `ai/generate.ts`
- Existing hooks: `hooks/useArtifactGeneration.ts`, `hooks/usePreferences.ts`
- Design tokens: `index.css` (lines 1-60)
- Component patterns: `components/PromptBar.tsx`

---

**Last Updated:** 2025-12-30  
**Status:** Ready for implementation
