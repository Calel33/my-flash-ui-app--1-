/**
 * GLM Client (z.ai) - Proxy-based
 * Routes all requests through the backend proxy server for secure API access.
 */

import { parseSSEStream } from './sseParser';

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
 * @deprecated This function always returns true and provides no meaningful check.
 * Use checkGlmConfigured() for accurate async check.
 */
export function isGlmConfigured(): boolean {
  if (import.meta.env.DEV) {
    console.warn(
      '[DEPRECATED] isGlmConfigured() always returns true. ' +
      'Use checkGlmConfigured() for accurate async check.'
    );
  }
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

  yield* parseSSEStream(response);
}
