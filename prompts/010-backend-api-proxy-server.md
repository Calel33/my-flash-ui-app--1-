<objective>
Create a secure backend proxy server that keeps API keys server-side and proxies requests from the frontend to Gemini and GLM (z.ai) APIs.

This is critical for security: API keys must NEVER be sent to or exposed in the browser. The frontend will call local proxy endpoints, which inject credentials server-side before forwarding to the actual AI providers.
</objective>

<context>
This is a Vite + React 19 application with dual AI providers:
- **Gemini** (Google): Uses `@google/genai` SDK, key from `API_KEY` env var
- **GLM** (z.ai): OpenAI-compatible API at `https://api.z.ai/api/paas/v4/`, key from `ZAI_API_KEY`

Current architecture (INSECURE - to be replaced):
- `ai/gemini.ts` - calls Gemini directly from browser
- `ai/glmClient.ts` - calls GLM with `dangerouslyAllowBrowser: true`
- API keys exposed via `VITE_*` env vars compiled into frontend bundle

Target architecture (SECURE):
- Backend proxy server running alongside Vite dev server
- Frontend calls `/api/gemini/*` and `/api/glm/*` endpoints
- Proxy injects API keys from server-side env vars
- Keys never leave the server

@ai/gemini.ts - current Gemini implementation
@ai/glm.ts - current GLM implementation  
@ai/glmClient.ts - current GLM client setup
@ai/providers.ts - provider registry
@.env.local.example - env var template
</context>

<requirements>
1. **Create Express proxy server** (`server/proxy.ts`):
   - POST `/api/gemini/generate` - proxy to Gemini generateContent
   - POST `/api/gemini/stream` - proxy to Gemini generateContentStream (SSE)
   - POST `/api/glm/chat` - proxy to GLM chat completions
   - POST `/api/glm/stream` - proxy to GLM streaming chat completions (SSE)

2. **Environment variables** (server-side only, NOT VITE_*):
   - `GEMINI_API_KEY` - Google Gemini API key
   - `ZAI_API_KEY` - z.ai GLM API key
   - Store in `server/.env` (gitignored)

3. **Streaming support**:
   - Use Server-Sent Events (SSE) for streaming endpoints
   - Properly forward chunks from AI providers to frontend
   - Handle backpressure and connection cleanup

4. **Error handling**:
   - Return structured error responses
   - Don't leak API keys in error messages
   - Handle provider rate limits gracefully

5. **Development setup**:
   - Update `vite.config.ts` to proxy `/api/*` to backend server
   - Or run as separate process with CORS for dev

6. **Update frontend clients**:
   - Modify `ai/gemini.ts` to call proxy endpoints instead of direct SDK
   - Modify `ai/glmClient.ts` to call proxy endpoints
   - Remove `dangerouslyAllowBrowser: true` flag
   - Remove all `VITE_*` API key references from frontend code
</requirements>

<implementation>
Preferred stack for proxy server:
- Express.js (lightweight, widely used)
- dotenv for env loading
- node-fetch or native fetch for forwarding requests

Endpoint contract examples:

```typescript
// POST /api/gemini/generate
// Request body: { model: string, contents: array, config?: object }
// Response: { text: string } or SSE stream

// POST /api/glm/chat  
// Request body: { model: string, messages: array, temperature?: number }
// Response: { content: string } or SSE stream
```

For streaming, use SSE format:
```
data: {"chunk": "Hello"}
data: {"chunk": " world"}
data: [DONE]
```

Security considerations:
- Validate request body structure before forwarding
- Set appropriate CORS headers for development
- Rate limiting (optional, can be added later)
- Request size limits to prevent abuse
</implementation>

<output>
Create/modify files with relative paths:

1. `./server/proxy.ts` - Express proxy server implementation
2. `./server/package.json` - Server dependencies (express, dotenv, cors)
3. `./server/.env.example` - Template for server env vars
4. `./server/tsconfig.json` - TypeScript config for server
5. `./vite.config.ts` - Add proxy configuration for dev
6. `./ai/gemini.ts` - Update to call proxy endpoints
7. `./ai/glmClient.ts` - Update to call proxy endpoints
8. `./package.json` - Add scripts to run proxy server
9. `./.env.local.example` - Update to remove VITE_* API keys (they move to server)
</output>

<verification>
Before declaring complete, verify:
1. Server starts without errors: `npm run server`
2. No `VITE_*` API key variables remain in frontend code
3. No `dangerouslyAllowBrowser` flags remain
4. Frontend can call `/api/gemini/stream` and receive SSE responses
5. Frontend can call `/api/glm/stream` and receive SSE responses
6. API keys are only loaded from `server/.env`, never exposed to browser
7. TypeScript compiles without errors for both server and client
</verification>

<success_criteria>
- API keys stored exclusively in `server/.env`
- Proxy server exposes `/api/gemini/*` and `/api/glm/*` endpoints
- Frontend calls proxy instead of direct AI provider SDKs
- Streaming works via SSE for both providers
- No API keys or secrets in browser-accessible code
- Dev workflow: `npm run dev` starts both Vite and proxy
</success_criteria>
