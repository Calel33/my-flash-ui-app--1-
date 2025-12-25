/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * GLM Provider Implementation
 * Wraps z.ai GLM via OpenAI-compatible SDK for use with the provider facade.
 */

import { getGlmClient, isGlmConfigured } from './glmClient';
import type OpenAI from 'openai';
import type {
  GenerateStylesOptions,
  StreamHtmlArtifactOptions,
  StreamReactComponentOptions,
  StreamSnippetExtractionOptions,
  StreamSnippetToReactOptions,
  StreamVariationsOptions,
} from './gemini';

export { isGlmConfigured };

// Default GLM model
const DEFAULT_GLM_MODEL = 'glm-4.7';

// ============================================================================
// Stream Iteration Helper
// ============================================================================

/**
 * Helper to iterate over OpenAI-compatible chat completion streams.
 * Extracts text content from each chunk and yields it.
 */
async function* iterateStream(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): AsyncGenerator<string, void, unknown> {
  for await (const chunk of stream) {
    const text = chunk.choices?.[0]?.delta?.content ?? '';
    if (text) {
      yield text;
    }
  }
}

// ============================================================================
// Style Generation (Non-streaming)
// ============================================================================

/**
 * Generate style directions using GLM (non-streaming).
 * Returns an array of style/direction names.
 */
export async function glmGenerateStyles(options: GenerateStylesOptions): Promise<string[]> {
  const { prompt, isDesignSystemMode = false } = options;

  const glmClient = getGlmClient();

  const systemPrompt = 'You are a UI design director returning ONLY JSON arrays of style names. No explanations, no markdown, just the raw JSON array.';

  const userPrompt = isDesignSystemMode
    ? `Generate 3 distinct Brand Personalities for: "${prompt}". Return ONLY a raw JSON array of 3 names.`
    : `Generate 3 distinct design directions for: "${prompt}". Return ONLY a raw JSON array of 3 names.`;

  const completion = await glmClient.chat.completions.create({
    model: DEFAULT_GLM_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: false,
  });

  let generatedStyles = ['Style A', 'Style B', 'Style C'];
  try {
    const raw = completion.choices[0]?.message?.content ?? '[]';
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
 * Stream HTML artifact generation using GLM.
 * Yields text chunks as they arrive.
 */
export async function* glmStreamHtmlArtifact(
  options: StreamHtmlArtifactOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, modelId = DEFAULT_GLM_MODEL } = options;

  const glmClient = getGlmClient();

  const systemPrompt = 'You output ONLY raw HTML+CSS without markdown code fences or explanations. Start directly with <!DOCTYPE html> or <html>.';

  const stream = await glmClient.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
    stream: true,
  });

  yield* iterateStream(stream);
}

// ============================================================================
// React Component Streaming
// ============================================================================

/**
 * Stream React component conversion using GLM.
 * Converts HTML/CSS to a React functional component.
 */
export async function* glmStreamReactComponent(
  options: StreamReactComponentOptions
): AsyncGenerator<string, void, unknown> {
  const { html, modelId = DEFAULT_GLM_MODEL } = options;

  const glmClient = getGlmClient();

  const systemPrompt = 'You are an expert React developer. Output ONLY the React component code without markdown code fences. No explanations.';

  const userPrompt = `Convert the following high-fidelity HTML/CSS component into a production-ready React component. Return ONLY the code. No markdown.\n\nHTML:\n${html}`;

  const stream = await glmClient.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    stream: true,
  });

  yield* iterateStream(stream);
}

// ============================================================================
// Snippet Extraction Streaming
// ============================================================================

/**
 * Stream snippet extraction using GLM.
 * Extracts a selected element into a standalone HTML file.
 */
export async function* glmStreamSnippetExtraction(
  options: StreamSnippetExtractionOptions
): AsyncGenerator<string, void, unknown> {
  const { snippetHtml, documentHtml } = options;

  const glmClient = getGlmClient();

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

  const stream = await glmClient.chat.completions.create({
    model: DEFAULT_GLM_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    stream: true,
  });

  yield* iterateStream(stream);
}

// ============================================================================
// Snippet to React Conversion Streaming
// ============================================================================

/**
 * Stream snippet to React conversion using GLM.
 */
export async function* glmStreamSnippetToReact(
  options: StreamSnippetToReactOptions
): AsyncGenerator<string, void, unknown> {
  const { snippetHtml, modelId = DEFAULT_GLM_MODEL } = options;

  const glmClient = getGlmClient();

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

  const stream = await glmClient.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    stream: true,
  });

  yield* iterateStream(stream);
}

// ============================================================================
// Variations Generation Streaming
// ============================================================================

/**
 * Stream variations generation using GLM.
 * Generates conceptual variations of a design.
 */
export async function* glmStreamVariations(
  options: StreamVariationsOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, temperature = 1.2 } = options;

  const glmClient = getGlmClient();

  const systemPrompt = 'You are a creative UI designer. Output ONLY valid JSON without markdown code fences.';

  const userPrompt = `
Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${prompt}".
Required JSON Format: { "name": "Name", "html": "..." }
`.trim();

  const stream = await glmClient.chat.completions.create({
    model: DEFAULT_GLM_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    stream: true,
  });

  yield* iterateStream(stream);
}
