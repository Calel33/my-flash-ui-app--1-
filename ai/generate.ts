/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Provider-Agnostic Generation Facade
 * Routes generation requests to the appropriate provider implementation.
 */

import { ProviderId } from './providers';
import {
  geminiGenerateStyles,
  geminiStreamHtmlArtifact,
  geminiStreamReactComponent,
  geminiStreamSnippetExtraction,
  geminiStreamSnippetToReact,
  geminiStreamVariations,
  type GenerateStylesOptions,
  type StreamHtmlArtifactOptions,
  type StreamReactComponentOptions,
  type StreamSnippetExtractionOptions,
  type StreamSnippetToReactOptions,
  type StreamVariationsOptions,
} from './gemini';

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
 */
export async function generateStyles(options: FacadeGenerateStylesOptions): Promise<string[]> {
  const { provider, ...rest } = options;

  switch (provider) {
    case 'gemini':
      return geminiGenerateStyles(rest);
    case 'glm':
      // GLM implementation will be added in Stack 4
      throw new Error('GLM provider not yet implemented');
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Stream HTML artifact generation using the specified provider.
 */
export async function* streamHtmlArtifact(
  options: FacadeStreamHtmlArtifactOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  switch (provider) {
    case 'gemini':
      yield* geminiStreamHtmlArtifact(rest);
      break;
    case 'glm':
      // GLM implementation will be added in Stack 4
      throw new Error('GLM provider not yet implemented');
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Stream React component conversion using the specified provider.
 */
export async function* streamReactComponent(
  options: FacadeStreamReactComponentOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  switch (provider) {
    case 'gemini':
      yield* geminiStreamReactComponent(rest);
      break;
    case 'glm':
      // GLM implementation will be added in Stack 4
      throw new Error('GLM provider not yet implemented');
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Stream snippet extraction using the specified provider.
 */
export async function* streamSnippetExtraction(
  options: FacadeStreamSnippetExtractionOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  switch (provider) {
    case 'gemini':
      yield* geminiStreamSnippetExtraction(rest);
      break;
    case 'glm':
      // GLM implementation will be added in Stack 4
      throw new Error('GLM provider not yet implemented');
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Stream snippet to React conversion using the specified provider.
 */
export async function* streamSnippetToReact(
  options: FacadeStreamSnippetToReactOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  switch (provider) {
    case 'gemini':
      yield* geminiStreamSnippetToReact(rest);
      break;
    case 'glm':
      // GLM implementation will be added in Stack 4
      throw new Error('GLM provider not yet implemented');
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Stream variations generation using the specified provider.
 */
export async function* streamVariations(
  options: FacadeStreamVariationsOptions
): AsyncGenerator<string, void, unknown> {
  const { provider, ...rest } = options;

  switch (provider) {
    case 'gemini':
      yield* geminiStreamVariations(rest);
      break;
    case 'glm':
      // GLM implementation will be added in Stack 4
      throw new Error('GLM provider not yet implemented');
    default:
      throw new Error(`Unknown provider: ${provider}`);
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
