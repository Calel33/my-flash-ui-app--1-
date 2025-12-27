/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Error Handling & Normalization (D16)
 * Provides standardized error types and utilities for the AI provider facade.
 */

import { ProviderId } from './providers';

// ============================================================================
// Error Types
// ============================================================================

/**
 * Normalized error shape for provider errors.
 */
export interface ProviderError {
  code?: string;
  status?: number;
  provider: ProviderId;
  message: string;
  isTransient: boolean;
  originalError?: unknown;
}

/**
 * Custom error class for provider-specific errors.
 */
export class AIProviderError extends Error {
  readonly code?: string;
  readonly status?: number;
  readonly provider: ProviderId;
  readonly isTransient: boolean;
  readonly originalError?: unknown;

  constructor(options: ProviderError) {
    super(options.message);
    this.name = 'AIProviderError';
    this.code = options.code;
    this.status = options.status;
    this.provider = options.provider;
    this.isTransient = options.isTransient;
    this.originalError = options.originalError;
  }

  /**
   * Get a user-friendly error message.
   */
  getUserMessage(): string {
    if (this.status === 429) {
      return `Rate limit exceeded for ${this.provider}. Please try again in a moment.`;
    }
    if (this.status && this.status >= 500) {
      return `${this.provider} service is temporarily unavailable. Please try again.`;
    }
    if (this.code === 'TIMEOUT') {
      return `Request to ${this.provider} timed out. Please try again.`;
    }
    if (this.code === 'NETWORK_ERROR') {
      return 'Network error. Please check your connection and try again.';
    }
    return this.message || 'An unexpected error occurred.';
  }
}

// ============================================================================
// Error Normalization
// ============================================================================

/**
 * Check if an HTTP status code indicates a transient error.
 */
export function isTransientStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * Extract status code from various error types.
 */
function extractStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.status === 'number') return err.status;
    if (typeof err.statusCode === 'number') return err.statusCode;
    if (err.response && typeof err.response === 'object') {
      const resp = err.response as Record<string, unknown>;
      if (typeof resp.status === 'number') return resp.status;
    }
  }
  return undefined;
}

/**
 * Extract error code from various error types.
 */
function extractCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.code === 'string') return err.code;
    if (typeof err.type === 'string') return err.type;
  }
  return undefined;
}

/**
 * Extract error message from various error types.
 */
function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') return err.message;
    if (typeof err.error === 'string') return err.error;
  }
  return 'Unknown error';
}

/**
 * Normalize any error into a standardized AIProviderError.
 */
export function normalizeError(error: unknown, provider: ProviderId): AIProviderError {
  if (error instanceof AIProviderError) {
    return error;
  }

  const status = extractStatus(error);
  const code = extractCode(error);
  const message = extractMessage(error);

  // Determine if the error is transient
  let isTransient = false;
  if (status !== undefined) {
    isTransient = isTransientStatus(status);
  } else if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
    isTransient = true;
  }

  // Log the original error in development
  if (import.meta.env.DEV) {
    console.error(`[${provider}] Provider error:`, error);
  }

  return new AIProviderError({
    code,
    status,
    provider,
    message,
    isTransient,
    originalError: error,
  });
}

// ============================================================================
// Timeout Utilities
// ============================================================================

/**
 * Default timeout for streaming operations (60 seconds).
 */
export const DEFAULT_STREAM_TIMEOUT_MS = 60_000;

/**
 * Default timeout for non-streaming operations (30 seconds).
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Timeout error for when operations exceed their time limit.
 */
export class TimeoutError extends AIProviderError {
  constructor(provider: ProviderId, timeoutMs: number) {
    super({
      code: 'TIMEOUT',
      provider,
      message: `Operation timed out after ${timeoutMs}ms`,
      isTransient: true,
    });
    this.name = 'TimeoutError';
  }
}

/**
 * Wrap a promise with a timeout.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  provider: ProviderId
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(provider, timeoutMs));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Create a timeout controller for streaming operations.
 * Returns a function to reset the timeout and an abort signal.
 */
export function createStreamTimeout(
  timeoutMs: number,
  provider: ProviderId,
  onTimeout: () => void
): { reset: () => void; clear: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const reset = () => {
    clear();
    timeoutId = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  };

  // Start the initial timeout
  reset();

  return { reset, clear };
}

// ============================================================================
// Fallback Configuration (D17)
// ============================================================================

/**
 * Feature flag for enabling GLM→Gemini fallback.
 * Defaults to true. Can be toggled via localStorage in dev.
 */
export const ENABLE_FALLBACK = typeof localStorage !== 'undefined'
  ? localStorage.getItem('enableProviderFallback') !== 'false'
  : true;

/**
 * Check if fallback should be attempted for this error.
 */
export function shouldAttemptFallback(error: AIProviderError): boolean {
  if (!ENABLE_FALLBACK) return false;
  if (error.provider !== 'glm') return false; // Only fallback from GLM to Gemini
  return error.isTransient;
}
