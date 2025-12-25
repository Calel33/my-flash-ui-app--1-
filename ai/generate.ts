/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Provider-Agnostic Generation Facade
 * Routes generation requests to the appropriate provider implementation.
 * Includes error normalization and optional GLM→Gemini fallback (D16, D17).
 */

import { ProviderId } from './providers';
import {
  geminiGenerateStyles,
  geminiStreamHtmlArtifact,
  geminiStreamReactComponent,
  geminiStreamSnippetExtraction,
  geminiStreamSnippetToReact,
  geminiStreamVariations,
  isGeminiConfigured,
  type GenerateStylesOptions,
  type StreamHtmlArtifactOptions,
  type StreamReactComponentOptions,
  type StreamSnippetExtractionOptions,
  type StreamSnippetToReactOptions,
  type StreamVariationsOptions,
} from './gemini';
import {
  glmGenerateStyles,
  glmStreamHtmlArtifact,
  glmStreamReactComponent,
  glmStreamSnippetExtraction,
  glmStreamSnippetToReact,
  glmStreamVariations,
} from './glm';
import {
  normalizeError,
  shouldAttemptFallback,
  withTimeout,
  DEFAULT_REQUEST_TIMEOUT_MS,
  AIProviderError,
} from './errors';

// Re-export error types for consumers
export { AIProviderError } from './errors';

// ============================================================================
// Facade Types
// ============================================================================

export interface FacadeGenerateStylesOptions extends GenerateStylesOptions {
  provider: ProviderId;
}

export interface FacadeStreamHtmlArtifactOptions extends StreamHtmlArtifactOptions {
  provider: ProviderId;
}

export interface FacadeStreamReactComponentOptions extends StreamReactComponentOptions {
  provider: ProviderId;
}

export interface FacadeStreamSnippetExtractionOptions extends StreamSnippetExtractionOptions {
  provider: ProviderId;
}

export interface FacadeStreamSnippetToReactOptions extends StreamSnippetToReactOptions {
  provider: ProviderId;
}

export interface FacadeStreamVariationsOptions extends StreamVariationsOptions {
  provider: ProviderId;
}

// ============================================================================
// Facade Functions
// ============================================================================

/**
 * Generate style directions using the specified provider.
 * Includes error normalization and optional GLM→Gemini fallback.
 */
export async function generateStyles(options: FacadeGenerateStylesOptions): Promise<string[]> {
  const { provider, ...rest } = options;

  try {
    const generateFn = provider === 'glm' ? glmGenerateStyles : geminiGenerateStyles;
    return await withTimeout(generateFn(rest), DEFAULT_REQUEST_TIMEOUT_MS, provider);
  } catch (error) {
    const normalizedError = normalizeError(error, provider);

    // Attempt fallback to Gemini if GLM fails with a transient error
    if (shouldAttemptFallback(normalizedError) && isGeminiConfigured()) {
      console.warn(`[Fallback] GLM failed, falling back to Gemini:`, normalizedError.message);
      try {
        return await withTimeout(geminiGenerateStyles(rest), DEFAULT_REQUEST_TIMEOUT_MS, 'gemini');
      } catch (fallbackError) {
        throw normalizeError(fallbackError, 'gemini');
      }
    }

    throw normalizedError;
  }
}

/**
 * Stream HTML artifact generation using the specified provider.
 * Includes error normalization and optional GLM→Gemini fallback.
 */
export async function* streamHtmlArtifact(
  options: FacadeStreamHtmlArtifactOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  try {
    const streamFn = provider === 'glm' ? glmStreamHtmlArtifact : geminiStreamHtmlArtifact;
    yield* streamFn(rest);
  } catch (error) {
    const normalizedError = normalizeError(error, provider);

    if (shouldAttemptFallback(normalizedError) && isGeminiConfigured()) {
      console.warn(`[Fallback] GLM streaming failed, falling back to Gemini:`, normalizedError.message);
      try {
        yield* geminiStreamHtmlArtifact(rest);
        return;
      } catch (fallbackError) {
        throw normalizeError(fallbackError, 'gemini');
      }
    }

    throw normalizedError;
  }
}

/**
 * Stream React component conversion using the specified provider.
 * Includes error normalization and optional GLM→Gemini fallback.
 */
export async function* streamReactComponent(
  options: FacadeStreamReactComponentOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  try {
    const streamFn = provider === 'glm' ? glmStreamReactComponent : geminiStreamReactComponent;
    yield* streamFn(rest);
  } catch (error) {
    const normalizedError = normalizeError(error, provider);

    if (shouldAttemptFallback(normalizedError) && isGeminiConfigured()) {
      console.warn(`[Fallback] GLM streaming failed, falling back to Gemini:`, normalizedError.message);
      try {
        yield* geminiStreamReactComponent(rest);
        return;
      } catch (fallbackError) {
        throw normalizeError(fallbackError, 'gemini');
      }
    }

    throw normalizedError;
  }
}

/**
 * Stream snippet extraction using the specified provider.
 * Includes error normalization and optional GLM→Gemini fallback.
 */
export async function* streamSnippetExtraction(
  options: FacadeStreamSnippetExtractionOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  try {
    const streamFn = provider === 'glm' ? glmStreamSnippetExtraction : geminiStreamSnippetExtraction;
    yield* streamFn(rest);
  } catch (error) {
    const normalizedError = normalizeError(error, provider);

    if (shouldAttemptFallback(normalizedError) && isGeminiConfigured()) {
      console.warn(`[Fallback] GLM streaming failed, falling back to Gemini:`, normalizedError.message);
      try {
        yield* geminiStreamSnippetExtraction(rest);
        return;
      } catch (fallbackError) {
        throw normalizeError(fallbackError, 'gemini');
      }
    }

    throw normalizedError;
  }
}

/**
 * Stream snippet to React conversion using the specified provider.
 * Includes error normalization and optional GLM→Gemini fallback.
 */
export async function* streamSnippetToReact(
  options: FacadeStreamSnippetToReactOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  try {
    const streamFn = provider === 'glm' ? glmStreamSnippetToReact : geminiStreamSnippetToReact;
    yield* streamFn(rest);
  } catch (error) {
    const normalizedError = normalizeError(error, provider);

    if (shouldAttemptFallback(normalizedError) && isGeminiConfigured()) {
      console.warn(`[Fallback] GLM streaming failed, falling back to Gemini:`, normalizedError.message);
      try {
        yield* geminiStreamSnippetToReact(rest);
        return;
      } catch (fallbackError) {
        throw normalizeError(fallbackError, 'gemini');
      }
    }

    throw normalizedError;
  }
}

/**
 * Stream variations generation using the specified provider.
 * Includes error normalization and optional GLM→Gemini fallback.
 */
export async function* streamVariations(
  options: FacadeStreamVariationsOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  try {
    const streamFn = provider === 'glm' ? glmStreamVariations : geminiStreamVariations;
    yield* streamFn(rest);
  } catch (error) {
    const normalizedError = normalizeError(error, provider);

    if (shouldAttemptFallback(normalizedError) && isGeminiConfigured()) {
      console.warn(`[Fallback] GLM streaming failed, falling back to Gemini:`, normalizedError.message);
      try {
        yield* geminiStreamVariations(rest);
        return;
      } catch (fallbackError) {
        throw normalizeError(fallbackError, 'gemini');
      }
    }

    throw normalizedError;
  }
}

// ============================================================================
// Utility: Clean code fences from streamed content
// ============================================================================

/**
 * Remove markdown code fences from accumulated content.
 */
export function cleanCodeFences(content: string): string {
  return content
    .replace(/^```[a-z]*\n/i, '')
    .replace(/^```\n/i, '')
    .replace(/\n```$/, '')
    .trim();
}
