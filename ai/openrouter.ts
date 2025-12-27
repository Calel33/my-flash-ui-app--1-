/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * OpenRouter Provider Implementation
 * Routes requests through backend proxy for secure API access.
 */

import { parseSSEStream } from './sseParser';
import type {
  GenerateStylesOptions,
  StreamHtmlArtifactOptions,
  StreamReactComponentOptions,
  StreamSnippetExtractionOptions,
  StreamSnippetToReactOptions,
  StreamVariationsOptions,
} from './gemini';

const PROXY_BASE = '/api/openrouter';

// Default OpenRouter model
const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-3.5-sonnet';

/**
 * Check if OpenRouter is configured by calling the health endpoint.
 */
export async function checkOpenRouterConfigured(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    return data.openrouter === true;
  } catch {
    return false;
  }
}

/**
 * OpenRouter message format matching SDK's Message type.
 * Supports: system, user, developer, assistant, tool roles.
 */
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'developer' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface OpenRouterChatRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
}

/**
 * Make non-streaming chat request via proxy.
 */
export async function openrouterChatFromProxy(request: OpenRouterChatRequest): Promise<string> {
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
 * Stream SSE response from OpenRouter proxy endpoint.
 */
export async function* openrouterStreamFromProxy(
  request: OpenRouterChatRequest
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

// ============================================================================
// Style Generation (Non-streaming)
// ============================================================================

/**
 * Generate style directions using OpenRouter (non-streaming).
 */
export async function openrouterGenerateStyles(options: GenerateStylesOptions): Promise<string[]> {
  const { prompt, isDesignSystemMode = false } = options;

  const systemPrompt = 'You are a UI design director returning ONLY JSON arrays of style names. No explanations, no markdown, just the raw JSON array.';

  const userPrompt = isDesignSystemMode
    ? `Generate 3 distinct Brand Personalities for: "${prompt}". Return ONLY a raw JSON array of 3 names.`
    : `Generate 3 distinct design directions for: "${prompt}". Return ONLY a raw JSON array of 3 names.`;

  const raw = await openrouterChatFromProxy({
    model: DEFAULT_OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  let generatedStyles = ['Style A', 'Style B', 'Style C'];
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
        generatedStyles = parsed;
      }
    }
  } catch {
    // Fall back to defaults if parsing fails
  }

  return generatedStyles;
}

// ============================================================================
// HTML Artifact Streaming
// ============================================================================

/**
 * Stream HTML artifact generation using OpenRouter.
 */
export async function* openrouterStreamHtmlArtifact(
  options: StreamHtmlArtifactOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, modelId = DEFAULT_OPENROUTER_MODEL } = options;

  const systemPrompt = 'You output ONLY raw HTML+CSS without markdown code fences or explanations. Start directly with <!DOCTYPE html> or <html>.';

  yield* openrouterStreamFromProxy({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
  });
}

// ============================================================================
// React Component Streaming
// ============================================================================

/**
 * Stream React component conversion using OpenRouter.
 */
export async function* openrouterStreamReactComponent(
  options: StreamReactComponentOptions
): AsyncGenerator<string, void, unknown> {
  const { html, modelId = DEFAULT_OPENROUTER_MODEL } = options;

  const systemPrompt = 'You are an expert React developer. Output ONLY the React component code without markdown code fences. No explanations.';

  const userPrompt = `Convert the following high-fidelity HTML/CSS component into a production-ready React component. Return ONLY the code. No markdown.\n\nHTML:\n${html}`;

  yield* openrouterStreamFromProxy({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });
}

// ============================================================================
// Snippet Extraction Streaming
// ============================================================================

/**
 * Stream snippet extraction using OpenRouter.
 */
export async function* openrouterStreamSnippetExtraction(
  options: StreamSnippetExtractionOptions
): AsyncGenerator<string, void, unknown> {
  const { snippetHtml, documentHtml } = options;

  const systemPrompt = 'You extract HTML elements into standalone files. Output ONLY raw HTML without markdown code fences.';

  const userPrompt = `
I have a full HTML/CSS document and I've selected a specific element from it. 
Your task is to extract this element and ALL its required CSS/JS into a clean, standalone HTML file.

**SELECTED ELEMENT:**
${snippetHtml}

**ORIGINAL DOCUMENT CONTEXT:**
${documentHtml}

**REQUIREMENTS:**
1. Return a single, valid HTML file containing the selected HTML and necessary <style> tags.
2. Use a modern, clean approach.
3. Return ONLY the code. No markdown.
`.trim();

  yield* openrouterStreamFromProxy({
    model: DEFAULT_OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });
}

// ============================================================================
// Snippet to React Conversion Streaming
// ============================================================================

/**
 * Stream snippet to React conversion using OpenRouter.
 */
export async function* openrouterStreamSnippetToReact(
  options: StreamSnippetToReactOptions
): AsyncGenerator<string, void, unknown> {
  const { snippetHtml, modelId = DEFAULT_OPENROUTER_MODEL } = options;

  const systemPrompt = 'You are an expert React developer. Output ONLY the React component code without markdown code fences. No explanations.';

  const userPrompt = `
Convert the following isolated HTML/CSS snippet into a clean, production-ready React functional component.
1. Use functional structure.
2. Include ALL necessary styles within a scoped <style> tag.
3. Name the component 'Component'.
4. Return ONLY the React code. No markdown.

Snippet:
${snippetHtml}
`.trim();

  yield* openrouterStreamFromProxy({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });
}

// ============================================================================
// Variations Generation Streaming
// ============================================================================

/**
 * Stream variations generation using OpenRouter.
 */
export async function* openrouterStreamVariations(
  options: StreamVariationsOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, temperature = 1.2 } = options;

  const systemPrompt = 'You are a creative UI designer. Output ONLY valid JSON without markdown code fences.';

  const userPrompt = `
Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${prompt}".
Required JSON Format: { "name": "Name", "html": "..." }
`.trim();

  yield* openrouterStreamFromProxy({
    model: DEFAULT_OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
  });
}
