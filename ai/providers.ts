/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Provider Types & Model Registry
 * Defines the dual-provider architecture for Gemini and GLM.
 */

// Provider identifiers
export type ProviderId = 'gemini' | 'glm';

// Model capability kinds
export type ModelKind = 'design' | 'component' | 'system';

// Provider model definition
export interface ProviderModel {
  id: string;
  name: string;
  description: string;
  provider: ProviderId;
  kind: ModelKind;
}

// Provider configuration
export interface ProviderConfig {
  id: ProviderId;
  name: string;
  description: string;
  envKey: string;
  isConfigured: () => boolean;
}

/**
 * Unified model registry containing all available models across providers.
 * Existing Gemini models are preserved with their original IDs.
 */
export const MODELS: ProviderModel[] = [
  // Gemini models (existing)
  {
    id: 'gemini-3-flash-preview',
    name: 'Flash (Faster)',
    description: 'Higher rate limits, good for components',
    provider: 'gemini',
    kind: 'component',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Pro (Smarter)',
    description: 'Lower rate limits, better for complex systems',
    provider: 'gemini',
    kind: 'design',
  },
  // GLM models
  {
    id: 'glm-4.7',
    name: 'GLM 4.7',
    description: 'Flagship GLM for UI + layout generation',
    provider: 'glm',
    kind: 'component',
  },
];

/**
 * Provider configuration registry.
 * Configuration status is checked via proxy health endpoint at runtime.
 */
export const PROVIDER_CONFIG: Record<ProviderId, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google AI models for generation',
    envKey: 'GEMINI_API_KEY',
    isConfigured: () => true, // Check via /api/health at runtime
  },
  glm: {
    id: 'glm',
    name: 'Z.AI GLM',
    description: 'Z.AI GLM models via OpenAI-compatible API',
    envKey: 'ZAI_API_KEY',
    isConfigured: () => true, // Check via /api/health at runtime
  },
};

// ============================================================================
// Model Helper Functions (D6)
// ============================================================================

/**
 * Get all models for a specific provider.
 */
export function getModelsByProvider(provider: ProviderId): ProviderModel[] {
  return MODELS.filter((m) => m.provider === provider);
}

/**
 * Get models filtered by provider and kind.
 */
export function getModelsByProviderAndKind(
  provider: ProviderId,
  kind: ModelKind
): ProviderModel[] {
  return MODELS.filter((m) => m.provider === provider && m.kind === kind);
}

/**
 * Get component-capable models for a provider.
 */
export function getComponentModels(provider: ProviderId): ProviderModel[] {
  return MODELS.filter(
    (m) => m.provider === provider && (m.kind === 'component' || m.kind === 'design')
  );
}

/**
 * Get design-system-capable models for a provider.
 */
export function getDesignSystemModels(provider: ProviderId): ProviderModel[] {
  return MODELS.filter(
    (m) => m.provider === provider && (m.kind === 'design' || m.kind === 'component')
  );
}

/**
 * Find a model by ID.
 */
export function getModelById(modelId: string): ProviderModel | undefined {
  return MODELS.find((m) => m.id === modelId);
}

/**
 * Get default model for a provider and mode.
 */
export function getDefaultModel(
  provider: ProviderId,
  isDesignSystemMode: boolean
): ProviderModel | undefined {
  const models = isDesignSystemMode
    ? getDesignSystemModels(provider)
    : getComponentModels(provider);
  return models[0];
}

/**
 * Check if a provider is configured (has API key).
 */
export function isProviderConfigured(provider: ProviderId): boolean {
  return PROVIDER_CONFIG[provider].isConfigured();
}

/**
 * Get all configured providers.
 */
export function getConfiguredProviders(): ProviderId[] {
  return (Object.keys(PROVIDER_CONFIG) as ProviderId[]).filter((p) =>
    PROVIDER_CONFIG[p].isConfigured()
  );
}
