<research_objective>
Research and document the complete implementation plan for adding OpenRouter as a third AI provider to this application, enabling users to choose from 300+ models via a unified API.

This is a **research task** - produce a comprehensive implementation guide with a cheat sheet, security considerations, and step-by-step integration plan following existing provider patterns (Gemini, GLM).

Thoroughly explore the OpenRouter TypeScript SDK documentation, existing codebase patterns, and security best practices to create a production-ready integration plan.
</research_objective>

<scope>
**Research Focus Areas:**
1. OpenRouter TypeScript SDK (`@openrouter/sdk`) - installation, initialization, streaming, error handling
2. Existing provider architecture patterns in `ai/` directory
3. Backend proxy server patterns in `server/proxy.ts`
4. Security best practices for API key handling
5. Model selection/discovery for OpenRouter's 300+ models

**Sources to Prioritize:**
- OpenRouter official docs: https://openrouter.ai/docs/sdks/typescript
- OpenRouter Quick Start: https://openrouter.ai/docs/quick-start
- OpenRouter Streaming: https://openrouter.ai/docs/api/reference/streaming
- Existing codebase files: `ai/providers.ts`, `ai/gemini.ts`, `ai/glm.ts`, `ai/glmClient.ts`, `server/proxy.ts`
- GitHub: https://github.com/OpenRouterTeam/typescript-sdk

**Out of Scope:**
- Actual implementation code (this is research only)
- UI components for model selection (separate task)
</scope>

<context>
**Current Architecture:**
- Dual-provider system: Gemini + GLM (Z.AI)
- Frontend client files: `ai/gemini.ts`, `ai/glm.ts`, `ai/glmClient.ts`
- Provider registry: `ai/providers.ts` with `ProviderId`, `ProviderModel`, `ProviderConfig` types
- Facade pattern: `ai/generate.ts` routes requests to appropriate provider
- Error handling: `ai/errors.ts` with `AIProviderError`, timeout utilities, fallback logic
- SSE streaming: `ai/sseParser.ts` parses server-sent events
- Backend proxy: `server/proxy.ts` - Express server holding API keys, proxying to Gemini/GLM APIs
- Health check: `/api/health` endpoint returns provider configuration status

**Key Patterns to Follow:**
1. API keys stored in `server/.env`, never exposed to client
2. All AI calls routed through backend proxy (`/api/gemini/*`, `/api/glm/*`)
3. Streaming via SSE with `data: {chunk: "..."}` and `data: [DONE]` format
4. Client uses async generators for streaming (`yield* parseSSEStream(response)`)
5. Error normalization with `normalizeError()` and `AIProviderError` class
6. Fallback mechanism for transient errors (GLM→Gemini)

**OpenRouter SDK Key Facts (from research):**
```typescript
// Installation
npm install @openrouter/sdk

// Basic usage
import OpenRouter from '@openrouter/sdk';

const client = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

// Non-streaming
const response = await client.chat.send({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Hello!" }]
});

// Streaming
const stream = await client.chat.send({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices?.[0]?.delta?.content;
}
```

**Alternative: OpenAI-compatible API**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://your-site.com',
    'X-Title': 'Your App Name',
  },
});
```
</context>

<deliverables>
Create a comprehensive research document at `./research/openrouter-provider-integration.md` with the following sections:

## 1. Executive Summary
- Brief overview of OpenRouter integration
- Recommended approach (native SDK vs OpenAI-compatible)
- Estimated complexity and effort

## 2. SDK Comparison
| Feature | @openrouter/sdk | OpenAI-compatible |
|---------|-----------------|-------------------|
| Type safety | ... | ... |
| Streaming | ... | ... |
| Error messages | ... | ... |
| Bundle size | ... | ... |

## 3. Implementation Cheat Sheet

### 3.1 Backend Proxy Updates (`server/proxy.ts`)
```typescript
// Exact code snippets for:
// - OpenRouter client initialization
// - Non-streaming endpoint: POST /api/openrouter/chat
// - Streaming endpoint: POST /api/openrouter/stream
// - Request/response types
```

### 3.2 Frontend Client (`ai/openrouter.ts`)
```typescript
// Exact code snippets for:
// - checkOpenRouterConfigured()
// - openrouterChatFromProxy()
// - openrouterStreamFromProxy() 
// - All generation functions matching Gemini/GLM pattern
```

### 3.3 Provider Registry Updates (`ai/providers.ts`)
```typescript
// Exact additions:
// - Add 'openrouter' to ProviderId union
// - Add OpenRouter to PROVIDER_CONFIG
// - Add sample models to MODELS array
// - Dynamic model fetching consideration
```

### 3.4 Facade Updates (`ai/generate.ts`)
```typescript
// Exact changes to:
// - Import openrouter functions
// - Add openrouter cases to all facade functions
// - Update fallback logic if needed
```

### 3.5 Environment Setup
```bash
# server/.env additions
OPENROUTER_API_KEY=sk-or-v1-...

# server/.env.example additions
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## 4. Security Considerations
- API key handling best practices
- Rate limiting considerations
- Request validation
- Headers for site identification (HTTP-Referer, X-Title)
- Cost tracking and spending limits

## 5. Model Selection Strategy
- Static model list vs dynamic fetching from `/api/v1/models`
- Model categorization (design, component, system kinds)
- Recommended initial model set
- User model input/search considerations

## 6. Error Handling
- OpenRouter-specific error codes and statuses
- Mapping to existing AIProviderError
- Fallback behavior with OpenRouter

## 7. Testing Plan
- Health check verification
- Streaming test cases
- Error scenario testing
- Model compatibility testing

## 8. Migration Checklist
- [ ] Install @openrouter/sdk in server/package.json
- [ ] Add OPENROUTER_API_KEY to server/.env
- [ ] Create /api/openrouter/* proxy endpoints
- [ ] Create ai/openrouter.ts client
- [ ] Update ai/providers.ts with OpenRouter config
- [ ] Update ai/generate.ts facade
- [ ] Update /api/health endpoint
- [ ] Test streaming functionality
- [ ] Test error handling
- [ ] Update .env.example files
</deliverables>

<evaluation_criteria>
1. **Completeness**: All sections populated with actionable content
2. **Code Quality**: Cheat sheet snippets follow existing codebase patterns exactly
3. **Security**: All security considerations thoroughly documented
4. **Practicality**: Implementation can be executed directly from this guide
5. **Type Safety**: All TypeScript types properly defined
6. **Patterns**: Follows established Gemini/GLM patterns consistently
</evaluation_criteria>

<verification>
Before completing, verify:
- [ ] All 8 sections of deliverable are complete
- [ ] Implementation cheat sheet has copy-paste ready code
- [ ] Security section addresses API key handling
- [ ] Model selection strategy is documented
- [ ] Testing plan covers streaming and errors
- [ ] Migration checklist is actionable
</verification>

<success_criteria>
A developer should be able to implement the complete OpenRouter integration by following this research document without needing additional research. The cheat sheet should contain production-ready code snippets that match existing codebase conventions.
</success_criteria>
