/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Gemini Provider Implementation
 * Wraps GoogleGenAI SDK for use with the provider facade.
 */

import { GoogleGenAI } from '@google/genai';

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY is not configured.');
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

/**
 * Check if Gemini is configured.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.API_KEY);
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
  const ai = getGeminiClient();

  const stylePrompt = isDesignSystemMode
    ? `Generate 3 distinct Brand Personalities for: "${prompt}". Return ONLY a raw JSON array of 3 names.`
    : `Generate 3 distinct design directions for: "${prompt}". Return ONLY a raw JSON array of 3 names.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { role: 'user', parts: [{ text: stylePrompt }] },
  });

  let generatedStyles = ['Style A', 'Style B', 'Style C'];
  try {
    const match = response.text?.match(/\[[\s\S]*\]/);
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
  const ai = getGeminiClient();

  const config = useThinking ? { thinkingConfig: { thinkingBudget } } : undefined;

  const responseStream = await ai.models.generateContentStream({
    model: modelId,
    contents: [{ parts: [{ text: prompt }], role: 'user' }],
    config,
  });

  for await (const chunk of responseStream) {
    const text = chunk.text;
    if (typeof text === 'string' && text) {
      yield text;
    }
  }
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
  const ai = getGeminiClient();

  const prompt = `Convert the following high-fidelity HTML/CSS component into a production-ready React component. Return ONLY the code. No markdown.\n\nHTML:\n${html}`;

  const responseStream = await ai.models.generateContentStream({
    model: modelId,
    contents: [{ parts: [{ text: prompt }], role: 'user' }],
    config: { thinkingConfig: { thinkingBudget } },
  });

  for await (const chunk of responseStream) {
    const text = chunk.text;
    if (typeof text === 'string' && text) {
      yield text;
    }
  }
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
  const ai = getGeminiClient();

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

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }], role: 'user' }],
    config: { thinkingConfig: { thinkingBudget } },
  });

  for await (const chunk of responseStream) {
    const text = chunk.text;
    if (typeof text === 'string' && text) {
      yield text;
    }
  }
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
  const ai = getGeminiClient();

  const prompt = `
Convert the following isolated HTML/CSS snippet into a clean, production-ready React functional component.
1. Use functional structure.
2. Include ALL necessary styles within a scoped <style> tag.
3. Name the component 'Component'.
4. Return ONLY the React code. No markdown.

Snippet:
${snippetHtml}
`.trim();

  const responseStream = await ai.models.generateContentStream({
    model: modelId,
    contents: [{ parts: [{ text: prompt }], role: 'user' }],
    config: { thinkingConfig: { thinkingBudget } },
  });

  for await (const chunk of responseStream) {
    const text = chunk.text;
    if (typeof text === 'string' && text) {
      yield text;
    }
  }
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
  const ai = getGeminiClient();

  const variationPrompt = `
Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${prompt}".
Required JSON Format: { "name": "Name", "html": "..." }
`.trim();

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: variationPrompt }], role: 'user' }],
    config: { temperature },
  });

  for await (const chunk of responseStream) {
    const text = chunk.text;
    if (typeof text === 'string' && text) {
      yield text;
    }
  }
}
