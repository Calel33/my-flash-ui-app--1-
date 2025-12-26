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
  openRouterGenerateStyles,
  openRouterStreamHtmlArtifact,
  openRouterStreamReactComponent,
  openRouterStreamSnippetExtraction,
  openRouterStreamSnippetToReact,
  openRouterStreamVariations,
} from './openrouter';
import {
  megaGenerateStyles,
  megaStreamHtmlArtifact,
  megaStreamReactComponent,
  megaStreamSnippetExtraction,
  megaStreamSnippetToReact,
  megaStreamVariations,
} from './megallm';
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
// Provider Selection Helpers
// ============================================================================

/**
 * Select the appropriate generate styles function based on provider.
 */
function selectGenerateStylesFn(provider: ProviderId) {
  switch (provider) {
    case 'megallm':
      return megaGenerateStyles;
    case 'openrouter':
      return openRouterGenerateStyles;
    case 'glm':
      return glmGenerateStyles;
    default:
      return geminiGenerateStyles;
  }
}

/**
 * Select the appropriate stream HTML artifact function based on provider.
 */
function selectStreamHtmlArtifactFn(provider: ProviderId) {
  switch (provider) {
    case 'megallm':
      return megaStreamHtmlArtifact;
    case 'openrouter':
      return openRouterStreamHtmlArtifact;
    case 'glm':
      return glmStreamHtmlArtifact;
    default:
      return geminiStreamHtmlArtifact;
  }
}

/**
 * Select the appropriate stream React component function based on provider.
 */
function selectStreamReactComponentFn(provider: ProviderId) {
  switch (provider) {
    case 'megallm':
      return megaStreamReactComponent;
    case 'openrouter':
      return openRouterStreamReactComponent;
    case 'glm':
      return glmStreamReactComponent;
    default:
      return geminiStreamReactComponent;
  }
}

/**
 * Select the appropriate stream snippet extraction function based on provider.
 */
function selectStreamSnippetExtractionFn(provider: ProviderId) {
  switch (provider) {
    case 'megallm':
      return megaStreamSnippetExtraction;
    case 'openrouter':
      return openRouterStreamSnippetExtraction;
    case 'glm':
      return glmStreamSnippetExtraction;
    default:
      return geminiStreamSnippetExtraction;
  }
}

/**
 * Select the appropriate stream snippet to React function based on provider.
 */
function selectStreamSnippetToReactFn(provider: ProviderId) {
  switch (provider) {
    case 'megallm':
      return megaStreamSnippetToReact;
    case 'openrouter':
      return openRouterStreamSnippetToReact;
    case 'glm':
      return glmStreamSnippetToReact;
    default:
      return geminiStreamSnippetToReact;
  }
}

/**
 * Select the appropriate stream variations function based on provider.
 */
function selectStreamVariationsFn(provider: ProviderId) {
  switch (provider) {
    case 'megallm':
      return megaStreamVariations;
    case 'openrouter':
      return openRouterStreamVariations;
    case 'glm':
      return glmStreamVariations;
    default:
      return geminiStreamVariations;
  }
}

// ============================================================================
// Facade Functions
// ============================================================================

/**
 * Generate style directions using the specified provider.
 * Includes error normalization and optional fallback to Gemini.
 */
export async function generateStyles(options: FacadeGenerateStylesOptions): Promise<string[]> {
  const { provider, ...rest } = options;

  try {
    const generateFn = selectGenerateStylesFn(provider);
    return await withTimeout(generateFn(rest), DEFAULT_REQUEST_TIMEOUT_MS, provider);
  } catch (error) {
    const normalizedError = normalizeError(error, provider);

    // Attempt fallback to Gemini if non-Gemini provider fails with a transient error
    if (shouldAttemptFallback(normalizedError) && isGeminiConfigured()) {
      console.warn(`[Fallback] ${provider} failed, falling back to Gemini:`, normalizedError.message);
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
 * Includes error normalization and optional fallback to Gemini.
 */
export async function* streamHtmlArtifact(
  options: FacadeStreamHtmlArtifactOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  try {
    const streamFn = selectStreamHtmlArtifactFn(provider);
    yield* streamFn(rest);
  } catch (error) {
    const normalizedError = normalizeError(error, provider);

    if (shouldAttemptFallback(normalizedError) && isGeminiConfigured()) {
      console.warn(`[Fallback] ${provider} streaming failed, falling back to Gemini:`, normalizedError.message);
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
 * Includes error normalization and optional fallback to Gemini.
 */
export async function* streamReactComponent(
  options: FacadeStreamReactComponentOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  try {
    const streamFn = selectStreamReactComponentFn(provider);
    yield* streamFn(rest);
  } catch (error) {
    const normalizedError = normalizeError(error, provider);

    if (shouldAttemptFallback(normalizedError) && isGeminiConfigured()) {
      console.warn(`[Fallback] ${provider} streaming failed, falling back to Gemini:`, normalizedError.message);
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
 * Includes error normalization and optional fallback to Gemini.
 */
export async function* streamSnippetExtraction(
  options: FacadeStreamSnippetExtractionOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  try {
    const streamFn = selectStreamSnippetExtractionFn(provider);
    yield* streamFn(rest);
  } catch (error) {
    const normalizedError = normalizeError(error, provider);

    if (shouldAttemptFallback(normalizedError) && isGeminiConfigured()) {
      console.warn(`[Fallback] ${provider} streaming failed, falling back to Gemini:`, normalizedError.message);
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
 * Includes error normalization and optional fallback to Gemini.
 */
export async function* streamSnippetToReact(
  options: FacadeStreamSnippetToReactOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  try {
    const streamFn = selectStreamSnippetToReactFn(provider);
    yield* streamFn(rest);
  } catch (error) {
    const normalizedError = normalizeError(error, provider);

    if (shouldAttemptFallback(normalizedError) && isGeminiConfigured()) {
      console.warn(`[Fallback] ${provider} streaming failed, falling back to Gemini:`, normalizedError.message);
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
 * Includes error normalization and optional fallback to Gemini.
 */
export async function* streamVariations(
  options: FacadeStreamVariationsOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  try {
    const streamFn = selectStreamVariationsFn(provider);
    yield* streamFn(rest);
  } catch (error) {
    const normalizedError = normalizeError(error, provider);

    if (shouldAttemptFallback(normalizedError) && isGeminiConfigured()) {
      console.warn(`[Fallback] ${provider} streaming failed, falling back to Gemini:`, normalizedError.message);
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
