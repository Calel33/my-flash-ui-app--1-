/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Gemini Provider Implementation
 * Calls backend proxy endpoints for secure API access.
 */

import { parseSSEStream } from './sseParser';

// =============================================================================
// Proxy API Helpers
// =============================================================================

const PROXY_BASE = '/api/gemini';

interface GeminiProxyRequest {
  model: string;
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  config?: {
    temperature?: number;
    thinkingConfig?: { thinkingBudget: number };
  };
}

/**
 * Check if Gemini is configured by calling the health endpoint.
 */
export async function checkGeminiConfigured(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    return data.gemini === true;
  } catch {
    return false;
  }
}

/**
 * @deprecated This function always returns true and provides no meaningful check.
 * Use checkGeminiConfigured() for accurate async check.
 */
export function isGeminiConfigured(): boolean {
  if (import.meta.env.DEV) {
    console.warn(
      '[DEPRECATED] isGeminiConfigured() always returns true. ' +
      'Use checkGeminiConfigured() for accurate async check.'
    );
  }
  return true;
}

/**
 * Stream SSE response from proxy endpoint.
 */
async function* streamFromProxy(
  endpoint: string,
  body: GeminiProxyRequest
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${PROXY_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Proxy request failed');
  }

  yield* parseSSEStream(response);
}

/**
 * Make non-streaming request to proxy.
 */
async function generateFromProxy(body: GeminiProxyRequest): Promise<string> {
  const response = await fetch(`${PROXY_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Proxy request failed');
  }

  const data = await response.json();
  return data.text ?? '';
}

// ============================================================================
// Style Generation (Non-streaming)
// ============================================================================

export interface GenerateStylesOptions {
  prompt: string;
  isDesignSystemMode?: boolean;
}

/**
 * Generate style directions using Gemini (non-streaming).
 * Returns an array of style/direction names.
 */
export async function geminiGenerateStyles(options: GenerateStylesOptions): Promise<string[]> {
  const { prompt, isDesignSystemMode = false } = options;

  const stylePrompt = isDesignSystemMode
    ? `Generate 3 distinct Brand Personalities for: "${prompt}". Return ONLY a raw JSON array of 3 names.`
    : `Generate 3 distinct design directions for: "${prompt}". Return ONLY a raw JSON array of 3 names.`;

  const text = await generateFromProxy({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: stylePrompt }] }],
  });

  let generatedStyles = ['Style A', 'Style B', 'Style C'];
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      generatedStyles = JSON.parse(match[0]);
    }
  } catch {
    // Fall back to defaults if parsing fails
  }

  return generatedStyles;
}

// ============================================================================
// HTML Artifact Streaming
// ============================================================================

export interface StreamHtmlArtifactOptions {
  prompt: string;
  modelId: string;
  useThinking?: boolean;
  thinkingBudget?: number;
}

/**
 * Stream HTML artifact generation using Gemini.
 * Yields text chunks as they arrive.
 */
export async function* geminiStreamHtmlArtifact(
  options: StreamHtmlArtifactOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, modelId, useThinking = false, thinkingBudget = 8000 } = options;

  const config = useThinking ? { thinkingConfig: { thinkingBudget } } : undefined;

  yield* streamFromProxy('/stream', {
    model: modelId,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  });
}

// ============================================================================
// React Component Streaming
// ============================================================================

export interface StreamReactComponentOptions {
  html: string;
  modelId: string;
  thinkingBudget?: number;
}

/**
 * Stream React component conversion using Gemini.
 * Converts HTML/CSS to a React functional component.
 */
export async function* geminiStreamReactComponent(
  options: StreamReactComponentOptions
): AsyncGenerator<string, void, unknown> {
  const { html, modelId, thinkingBudget = 8000 } = options;

  const prompt = `Convert the following high-fidelity HTML/CSS component into a production-ready React component. Return ONLY the code. No markdown.\n\nHTML:\n${html}`;

  yield* streamFromProxy('/stream', {
    model: modelId,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget } },
  });
}

// ============================================================================
// Snippet Extraction Streaming
// ============================================================================

export interface StreamSnippetExtractionOptions {
  snippetHtml: string;
  documentHtml: string;
  thinkingBudget?: number;
}

/**
 * Stream snippet extraction using Gemini.
 * Extracts a selected element into a standalone HTML file.
 */
export async function* geminiStreamSnippetExtraction(
  options: StreamSnippetExtractionOptions
): AsyncGenerator<string, void, unknown> {
  const { snippetHtml, documentHtml, thinkingBudget = 4000 } = options;

  const prompt = `
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

  yield* streamFromProxy('/stream', {
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget } },
  });
}

// ============================================================================
// Snippet to React Conversion Streaming
// ============================================================================

export interface StreamSnippetToReactOptions {
  snippetHtml: string;
  modelId: string;
  thinkingBudget?: number;
}

/**
 * Stream snippet to React conversion using Gemini.
 */
export async function* geminiStreamSnippetToReact(
  options: StreamSnippetToReactOptions
): AsyncGenerator<string, void, unknown> {
  const { snippetHtml, modelId, thinkingBudget = 6000 } = options;

  const prompt = `
Convert the following isolated HTML/CSS snippet into a clean, production-ready React functional component.
1. Use functional structure.
2. Include ALL necessary styles within a scoped <style> tag.
3. Name the component 'Component'.
4. Return ONLY the React code. No markdown.

Snippet:
${snippetHtml}
`.trim();

  yield* streamFromProxy('/stream', {
    model: modelId,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget } },
  });
}

// ============================================================================
// Variations Generation Streaming
// ============================================================================

export interface StreamVariationsOptions {
  prompt: string;
  temperature?: number;
}

/**
 * Stream variations generation using Gemini.
 * Generates conceptual variations of a design.
 */
export async function* geminiStreamVariations(
  options: StreamVariationsOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, temperature = 1.2 } = options;

  const variationPrompt = `
Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${prompt}".
Required JSON Format: { "name": "Name", "html": "..." }
`.trim();

  yield* streamFromProxy('/stream', {
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: variationPrompt }] }],
    config: { temperature },
  });
}
