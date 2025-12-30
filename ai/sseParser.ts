/**
 * SSE Stream Parser Utility
 * Shared utility for parsing Server-Sent Events streams from proxy endpoints.
 */

export interface SSEParserOptions {
  onChunk: (chunk: string) => void;
  onError: (error: Error) => void;
  onDone: () => void;
}

/**
 * Parse SSE stream from a Response object.
 * Handles data: prefixed lines and [DONE] termination.
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<string, void, unknown> {
  // Strict validation: Ensure response is actually SSE
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/event-stream')) {
    throw new Error(
      `Invalid response type: expected text/event-stream, got ${contentType || 'none'}`
    );
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
        } catch (parseError) {
          // Skip malformed chunks but log for debugging
          console.warn('[SSE Parser] Malformed chunk:', line);
        }
      }
    }
  }
}
