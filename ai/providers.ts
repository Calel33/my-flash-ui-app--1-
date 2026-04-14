/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Provider Types & Model Registry
 * Defines the dual-provider architecture for Gemini and GLM.
 */

// Provider identifiers
export type ProviderId = 'gemini' | 'glm' | 'openrouter';

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
  // OpenRouter models
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    description: 'Strong Anthropic model for design and coding tasks',
    provider: 'openrouter',
    kind: 'design',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI flagship multimodal model',
    provider: 'openrouter',
    kind: 'design',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    description: 'Fast and capable Google model via OpenRouter',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    description: 'Open-source high performance',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'minimax/minimax-m2.1',
    name: 'MiniMax M2.1',
    description: 'MiniMax flagship model',
    provider: 'openrouter',
    kind: 'design',
  },
  {
    id: 'z-ai/glm-4.7',
    name: 'GLM 4.7 (OpenRouter)',
    description: 'Z.AI GLM via OpenRouter',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    description: 'Latest Gemini preview via OpenRouter',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'xiaomi/mimo-v2-flash:free',
    name: 'MiMo V2 Flash (Free)',
    description: 'Xiaomi free model',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'mistralai/devstral-2512:free',
    name: 'Devstral (Free)',
    description: 'Mistral coding model - free tier',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'mistralai/devstral-2512',
    name: 'Devstral',
    description: 'Mistral coding model',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'kwaipilot/kat-coder-pro:free',
    name: 'KAT Coder Pro (Free)',
    description: 'Kwai coding model - free tier',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder (Free)',
    description: 'Alibaba coding model - free tier',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'qwen/qwen3.5-9b',
    name: 'Qwen 3.5 9B',
    description: 'Compact Qwen model via OpenRouter',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'qwen/qwen3-coder-next',
    name: 'Qwen3 Coder Next',
    description: 'Next-generation Qwen coding model',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'qwen/qwen3.5-flash-02-23',
    name: 'Qwen 3.5 Flash 02-23',
    description: 'Fast Qwen 3.5 Flash variant',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'qwen/qwen3.6-plus',
    name: 'Qwen 3.6 Plus',
    description: 'Higher-capability Qwen model via OpenRouter',
    provider: 'openrouter',
    kind: 'design',
  },
  {
    id: 'z-ai/glm-5.1',
    name: 'GLM 5.1 (OpenRouter)',
    description: 'Latest Z.AI GLM model via OpenRouter',
    provider: 'openrouter',
    kind: 'design',
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
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: '300+ AI models via unified API',
    envKey: 'OPENROUTER_API_KEY',
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
