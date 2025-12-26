# MegaLLM Provider Implementation Plan

## Goals and Assumptions

### Goals
1. Add MegaLLM as a fourth AI provider alongside Gemini, GLM, and OpenRouter
2. Enable users to select MegaLLM-backed models (GPT-5, GPT-4, Claude variants) from the UI
3. Preserve all existing Gemini/GLM/OpenRouter functionality with zero regressions
4. Follow the established multi-provider architecture patterns

### Assumptions
- MegaLLM API key will be stored in `VITE_MEGALLM_API_KEY` (see research doc → Authentication model)
- OpenAI SDK compatibility confirmed (see research doc → Comparison: Existing Providers vs MegaLLM)
- Streaming uses identical SSE format to GLM/OpenRouter (see research doc → Streaming semantics)
- Initial rollout targets design-oriented (`gpt-5`) and component-oriented (`gpt-4`) models

### Key Constraints (from AGENTS.md)
- **No hard-coded styles**: All UI uses design system tokens only
- **Backwards compatibility**: All existing provider flows must continue working
- **Vertical slice architecture**: Complete features in isolated slices
- **Max 500 lines per file**: Modular, single-responsibility modules
- **No code deletion**: Preserve all existing functionality
- **DRY principle**: Reuse existing patterns (iterateStream, error normalization)

---

## Phase 1: Environment and Configuration Setup

**Reference**: Research doc → "Environment and configuration" (Step-by-Step Checklist #1)

### Task 1.1: Add Environment Variable Template
**Files**: `.env.local.example`
**Preconditions**: None
**Description**: Add `VITE_MEGALLM_API_KEY` placeholder to the example env file.

```env
# MegaLLM Provider (unified multi-provider API)
VITE_MEGALLM_API_KEY=sk-mega-your-key-here
```

**Why**: Documents the required configuration for developers; follows pattern of `VITE_ZAI_API_KEY` and `VITE_OPENROUTER_API_KEY`.

### Task 1.2: Configure Local Development Key
**Files**: `.env.local` (not committed)
**Preconditions**: MegaLLM dashboard account and API key
**Description**: Add the actual API key to `.env.local`.

**Security Note**: Keys must never be committed. The `.gitignore` already excludes `.env.local`.

---

## Phase 2: MegaLLM Client Module

**Reference**: Research doc → "Implementation Cheat Sheet → A. Minimal MegaLLM client setup"

### Task 2.1: Create MegaLLM Client Wrapper
**Files**: `ai/megallmClient.ts` (new)
**Preconditions**: Phase 1 complete
**Dependencies**: `openai` package (already installed for GLM/OpenRouter)

**Description**: Create an OpenAI-compatible client configured for MegaLLM's base URL.

```typescript
// ai/megallmClient.ts
import OpenAI from 'openai';

const MEGALLM_API_KEY = import.meta.env.VITE_MEGALLM_API_KEY;
const MEGALLM_BASE_URL = 'https://ai.megallm.io/v1';

let megaClientInstance: OpenAI | null = null;

export function isMegaLLMConfigured(): boolean {
  return Boolean(MEGALLM_API_KEY);
}

export function getMegaLLMClient(): OpenAI {
  if (!MEGALLM_API_KEY) {
    throw new Error('VITE_MEGALLM_API_KEY is not configured for MegaLLM provider.');
  }

  if (!megaClientInstance) {
    megaClientInstance = new OpenAI({
      apiKey: MEGALLM_API_KEY,
      baseURL: MEGALLM_BASE_URL,
      dangerouslyAllowBrowser: true,
    });
  }

  return megaClientInstance;
}
```

**Why**: Follows lazy client construction pattern from `glmClient.ts` and `openrouterClient.ts`. Uses `dangerouslyAllowBrowser: true` to match existing browser-based usage.

---

## Phase 3: Provider Registry Updates

**Reference**: Research doc → "Recommended Integration Architecture → Step 1. Extend provider and model registries" and "Implementation Cheat Sheet → B. Provider registry and configuration"

### Task 3.1: Extend ProviderId Type
**Files**: `ai/providers.ts`
**Preconditions**: None
**Description**: Add `'megallm'` to the `ProviderId` union type.

```typescript
export type ProviderId = 'gemini' | 'glm' | 'openrouter' | 'megallm';
```

**Why**: The provider registry drives UI model selection and facade routing. MegaLLM must be a first-class provider ID before any other integration work.

### Task 3.2: Add MegaLLM Models to Registry
**Files**: `ai/providers.ts`
**Preconditions**: Task 3.1 complete
**Description**: Add MegaLLM model entries to the `MODELS` array.

```typescript
// MegaLLM models
{
  id: 'gpt-5',
  name: 'GPT-5 (MegaLLM)',
  description: 'Flagship reasoning model via MegaLLM',
  provider: 'megallm',
  kind: 'design',
},
{
  id: 'gpt-4',
  name: 'GPT-4 (MegaLLM)',
  description: 'High-quality general model for UI/component flows',
  provider: 'megallm',
  kind: 'component',
},
{
  id: 'claude-3.7-sonnet',
  name: 'Claude 3.7 Sonnet (MegaLLM)',
  description: 'Anthropic Claude via MegaLLM routing',
  provider: 'megallm',
  kind: 'design',
},
```

**Why**: Model IDs come from MegaLLM's documented catalog (research doc → Model catalog and naming). Using `kind: 'design'` for high-reasoning models and `kind: 'component'` for faster models.

### Task 3.3: Add MegaLLM to PROVIDER_CONFIG
**Files**: `ai/providers.ts`
**Preconditions**: Task 3.1 complete, Task 2.1 complete
**Description**: Add MegaLLM entry to the provider configuration registry.

```typescript
megallm: {
  id: 'megallm',
  name: 'MegaLLM',
  description: 'Unified multi-provider API via MegaLLM',
  envKey: 'VITE_MEGALLM_API_KEY',
  isConfigured: () => Boolean(import.meta.env.VITE_MEGALLM_API_KEY),
},
```

**Why**: Enables `isProviderConfigured('megallm')` checks and surfaces MegaLLM in `getConfiguredProviders()`. UI components can use this to conditionally render MegaLLM options.

---

## Phase 4: MegaLLM Provider Implementation

**Reference**: Research doc → "Implementation Cheat Sheet → C. MegaLLM operations mirroring GLM/OpenRouter"

### Task 4.1: Create MegaLLM Provider Module
**Files**: `ai/megallm.ts` (new)
**Preconditions**: Phase 2 and Phase 3 complete
**Description**: Implement all provider functions mirroring `ai/glm.ts` and `ai/openrouter.ts`.

**Functions to implement**:
1. `megaGenerateStyles` - Non-streaming style generation
2. `megaStreamHtmlArtifact` - HTML artifact streaming
3. `megaStreamReactComponent` - React component streaming
4. `megaStreamSnippetExtraction` - Snippet extraction streaming
5. `megaStreamSnippetToReact` - Snippet-to-React streaming
6. `megaStreamVariations` - Variations generation streaming

**Shared helper**:
```typescript
async function* iterateStream(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): AsyncGenerator<string, void, unknown> {
  for await (const chunk of stream) {
    const text = chunk.choices?.[0]?.delta?.content ?? '';
    if (text) yield text;
  }
}
```

**Why**: Reusing the `iterateStream` pattern from GLM/OpenRouter ensures consistent streaming behavior. System prompts are copied from existing providers to maintain identical output formatting.

### Task 4.2: Implement Core Streaming Functions
**Files**: `ai/megallm.ts`
**Preconditions**: Task 4.1 skeleton complete
**Description**: Complete implementation of all 6 provider functions using the patterns established in `ai/openrouter.ts`.

**Key implementation details**:
- Default model: `'gpt-5'` for design flows, `'gpt-4'` for component flows
- Temperature settings match existing providers (0.7 for components, 0.9 for artifacts, 1.2 for variations)
- System prompts identical to GLM/OpenRouter for output consistency
- Use `stream: true` for all streaming functions

---

## Phase 5: Facade Integration

**Reference**: Research doc → "Recommended Integration Architecture → Step 4. Wire MegaLLM into the facade" and "Implementation Cheat Sheet → D. Facade routing and fallback strategy"

### Task 5.1: Import MegaLLM Functions
**Files**: `ai/generate.ts`
**Preconditions**: Phase 4 complete
**Description**: Add imports for MegaLLM provider functions.

```typescript
import {
  megaGenerateStyles,
  megaStreamHtmlArtifact,
  megaStreamReactComponent,
  megaStreamSnippetExtraction,
  megaStreamSnippetToReact,
  megaStreamVariations,
} from './megallm';
```

### Task 5.2: Update Provider Selection Helpers
**Files**: `ai/generate.ts`
**Preconditions**: Task 5.1 complete
**Description**: Add `'megallm'` case to each selector function.

```typescript
function selectGenerateStylesFn(provider: ProviderId) {
  switch (provider) {
    case 'megallm':
      return megaGenerateStyles;
    case 'openrouter':
      return openRouterGenerateStyles;
    case 'glm':
      return glmGenerateStyles;
    default:
      return geminiGenerateStyles;
  }
}
```

**Apply to all selectors**:
- `selectGenerateStylesFn`
- `selectStreamHtmlArtifactFn`
- `selectStreamReactComponentFn`
- `selectStreamSnippetExtractionFn`
- `selectStreamSnippetToReactFn`
- `selectStreamVariationsFn`

### Task 5.3: Integrate MegaLLM into Fallback Strategy
**Files**: `ai/errors.ts`
**Preconditions**: Task 5.2 complete
**Description**: Ensure MegaLLM errors are normalized and can trigger fallback.

The existing `shouldAttemptFallback` already handles non-Gemini providers:
```typescript
export function shouldAttemptFallback(error: AIProviderError): boolean {
  if (!ENABLE_FALLBACK) return false;
  if (error.provider === 'gemini') return false;
  return error.isTransient;
}
```

**No changes needed** for basic fallback. MegaLLM will automatically fall back to Gemini on transient errors (429, 5xx) when Gemini is configured.

---

## Phase 6: UI/State Integration

**Reference**: Research doc → "Implementation Cheat Sheet → E. UI and state integration"

### Task 6.1: Verify Model Selector Compatibility
**Files**: Components using `MODELS` and `PROVIDER_CONFIG`
**Preconditions**: Phase 3 complete
**Description**: Verify that existing provider/model selection UI automatically includes MegaLLM.

**Expected behavior**:
- `getModelsByProvider('megallm')` returns MegaLLM models
- `isProviderConfigured('megallm')` returns true when API key is set
- `getConfiguredProviders()` includes `'megallm'` when configured

**Why**: The registry-driven design means UI components automatically surface new providers without code changes, provided they use the helper functions.

### Task 6.2: Conditional Provider Display (if needed)
**Files**: UI components rendering provider options
**Preconditions**: Task 6.1 verification complete
**Description**: If any UI hardcodes provider lists, update to use registry helpers.

**Constraint**: All styling must use design system tokens. No inline styles or hard-coded colors.

---

## Phase 7: Testing and Validation

**Reference**: Research doc → "Step-by-Step Checklist" item #7

### Task 7.1: Manual Flow Testing
**Preconditions**: All previous phases complete, `VITE_MEGALLM_API_KEY` configured
**Test cases**:

| Flow | MegaLLM Model | Expected Behavior |
|------|---------------|-------------------|
| Generate Styles | gpt-5 | Returns JSON array of 3 style names |
| Stream HTML Artifact | gpt-5 | SSE chunks yielded, valid HTML output |
| Stream React Component | gpt-4 | Valid React component code streamed |
| Stream Snippet Extraction | gpt-4 | Standalone HTML file streamed |
| Stream Snippet to React | gpt-4 | React component from snippet |
| Stream Variations | gpt-5 | JSON array of 3 variations |

### Task 7.2: Error Handling Validation
**Preconditions**: Task 7.1 complete
**Test cases**:
1. **Missing API key**: Verify clear error message, no runtime crash
2. **Invalid API key**: Verify 401 error normalized, user-friendly message
3. **Rate limit (429)**: Verify `isTransient: true`, fallback to Gemini if configured
4. **Network error**: Verify retry/fallback behavior

### Task 7.3: Fallback Flow Testing
**Preconditions**: Both MegaLLM and Gemini configured
**Test case**: Simulate MegaLLM failure → verify Gemini fallback activates with console warning.

### Task 7.4: Provider Disabled Testing
**Preconditions**: Remove `VITE_MEGALLM_API_KEY` from environment
**Test case**: Verify MegaLLM is not shown in UI, no errors on app load.

---

## Phase 8: Rollout Strategy

### Task 8.1: Feature Flag (Optional)
**Files**: `ai/errors.ts` or new `ai/featureFlags.ts`
**Description**: Add environment-controlled feature flag for MegaLLM.

```typescript
export const ENABLE_MEGALLM = import.meta.env.VITE_ENABLE_MEGALLM !== 'false';
```

**Why**: Allows disabling MegaLLM without removing API key, useful for staged rollout.

### Task 8.2: Staged Rollout Plan
1. **Internal/Dev**: Enable MegaLLM in development environment, full testing
2. **Dark Launch**: Deploy with `VITE_ENABLE_MEGALLM=false`, verify no regressions
3. **Beta**: Enable for subset of users, monitor error rates
4. **Full Launch**: Enable for all users

### Task 8.3: Rollback Procedure
If issues arise:
1. Set `VITE_ENABLE_MEGALLM=false` in environment
2. Redeploy (MegaLLM hidden from UI, no code revert needed)
3. Investigate and fix issues
4. Re-enable after verification

---

## Implementation Order Summary

| Phase | Tasks | Dependencies | Risk Level |
|-------|-------|--------------|------------|
| 1. Environment Setup | 1.1, 1.2 | None | Low |
| 2. Client Module | 2.1 | Phase 1 | Low |
| 3. Provider Registry | 3.1, 3.2, 3.3 | Phase 2 | Low |
| 4. Provider Implementation | 4.1, 4.2 | Phase 3 | Medium |
| 5. Facade Integration | 5.1, 5.2, 5.3 | Phase 4 | Medium |
| 6. UI Integration | 6.1, 6.2 | Phase 5 | Low |
| 7. Testing | 7.1, 7.2, 7.3, 7.4 | Phase 6 | Low |
| 8. Rollout | 8.1, 8.2, 8.3 | Phase 7 | Low |

---

## Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `.env.local.example` | Modify | Add `VITE_MEGALLM_API_KEY` template |
| `ai/megallmClient.ts` | Create | OpenAI-compatible client wrapper |
| `ai/megallm.ts` | Create | Provider implementation (6 functions) |
| `ai/providers.ts` | Modify | Add `'megallm'` to ProviderId, MODELS, PROVIDER_CONFIG |
| `ai/generate.ts` | Modify | Add MegaLLM imports and switch cases |
| `ai/errors.ts` | Verify | Confirm fallback works for new provider |

---

## Readiness Checklist

Before considering MegaLLM integration complete:

### Configuration
- [ ] `VITE_MEGALLM_API_KEY` documented in `.env.local.example`
- [ ] API key stored securely in `.env.local` (not committed)
- [ ] `isMegaLLMConfigured()` returns correct boolean

### Client Module
- [ ] `ai/megallmClient.ts` exists and follows GLM/OpenRouter pattern
- [ ] Lazy client instantiation works correctly
- [ ] Base URL set to `https://ai.megallm.io/v1`

### Provider Registry
- [ ] `ProviderId` includes `'megallm'`
- [ ] At least one design-kind and one component-kind model in `MODELS`
- [ ] `PROVIDER_CONFIG['megallm']` has correct `envKey` and `isConfigured()`

### Provider Implementation
- [ ] All 6 provider functions implemented in `ai/megallm.ts`
- [ ] Streaming uses `iterateStream` helper
- [ ] System prompts match GLM/OpenRouter for consistency

### Facade Integration
- [ ] All selector functions handle `'megallm'` case
- [ ] Fallback from MegaLLM to Gemini works for transient errors
- [ ] Error normalization produces user-friendly messages

### Testing
- [ ] All 6 flows tested with MegaLLM models
- [ ] Error scenarios validated (missing key, invalid key, rate limit)
- [ ] Fallback behavior confirmed
- [ ] Provider disabled scenario verified

### Backwards Compatibility
- [ ] Gemini flows unchanged and working
- [ ] GLM flows unchanged and working
- [ ] OpenRouter flows unchanged and working
- [ ] UI renders correctly with/without MegaLLM configured

### Code Quality
- [ ] Files under 500 lines
- [ ] No hard-coded styles (design tokens only)
- [ ] No duplicate logic (reusing existing patterns)
- [ ] TypeScript types correct

---

## References

This plan directly implements recommendations from:
- `./research/megallm-provider-integration.md` - Primary source of truth
  - Overview of MegaLLM for Flash UI
  - Current Provider Architecture analysis
  - Comparison: Existing Providers vs MegaLLM
  - Recommended Integration Architecture (Steps 1-4)
  - Implementation Cheat Sheet (Sections A-E)
  - Step-by-Step Checklist (Items 1-7)
- `./AGENTS.md` - Coding guidelines and constraints
- `~/.factory/AGENTS.md` - Personal global instructions
