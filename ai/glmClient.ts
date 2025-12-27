/**
 * GLM Client (z.ai) - Proxy-based
 * Routes all requests through the backend proxy server for secure API access.
 */

const PROXY_BASE = '/api/glm';

/**
 * Check if GLM is configured by calling the health endpoint.
 */
export async function checkGlmConfigured(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    return data.glm === true;
  } catch {
    return false;
  }
}

/**
 * Legacy sync check - returns true since we can't know without async call.
 * Use checkGlmConfigured() for accurate async check.
 */
export function isGlmConfigured(): boolean {
  return true;
}

export interface GlmChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
}

/**
 * Make non-streaming chat request via proxy.
 */
export async function glmChatFromProxy(request: GlmChatRequest): Promise<string> {
  const response = await fetch(`${PROXY_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Proxy request failed');
  }

  const data = await response.json();
  return data.content ?? '';
}

/**
 * Stream SSE response from GLM proxy endpoint.
 */
export async function* glmStreamFromProxy(
  request: GlmChatRequest
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${PROXY_BASE}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Proxy request failed');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.chunk) yield parsed.chunk;
          if (parsed.error) throw new Error(parsed.error);
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}
