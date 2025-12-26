/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Provider Types & Model Registry
 * Defines the dual-provider architecture for Gemini and GLM.
 */

// Provider identifiers
export type ProviderId = 'gemini' | 'glm' | 'openrouter' | 'megallm';

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
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'General-purpose high-quality model',
    provider: 'openrouter',
    kind: 'design',
  },
  {
    id: 'openai/gpt-5.2',
    name: 'GPT-5.2',
    description: 'Latest flagship OpenAI model',
    provider: 'openrouter',
    kind: 'design',
  },
  {
    id: 'openai/gpt-5.1-codex-mini',
    name: 'GPT-5.1 Codex Mini',
    description: 'Code-optimized compact model',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    description: 'Fast and efficient GPT-5 variant',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    description: 'Balanced performance and quality',
    provider: 'openrouter',
    kind: 'design',
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    description: 'Fast and lightweight Claude model',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash (OR)',
    description: 'Google Gemini via OpenRouter',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'z-ai/glm-4.7',
    name: 'GLM 4.7 (OR)',
    description: 'Z.AI GLM via OpenRouter',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'mistralai/devstral-2512:free',
    name: 'Devstral (Free)',
    description: 'Mistral code-focused model - free tier',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'kwaipilot/kat-coder-pro:free',
    name: 'Kat Coder Pro (Free)',
    description: 'Coding assistant - free tier',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder (Free)',
    description: 'Alibaba code model - free tier',
    provider: 'openrouter',
    kind: 'component',
  },
  {
    id: 'xiaomi/mimo-v2-flash:free',
    name: 'MiMo V2 Flash (Free)',
    description: 'Xiaomi fast model - free tier',
    provider: 'openrouter',
    kind: 'component',
  },
  // MegaLLM models
  {
    id: 'gpt-5',
    name: 'GPT-5 (MegaLLM)',
    description: 'Flagship reasoning model via MegaLLM',
    provider: 'megallm',
    kind: 'design',
  },
  {
    id: 'gpt-4',
    name: 'GPT-4 (MegaLLM)',
    description: 'High-quality general model for UI/component flows',
    provider: 'megallm',
    kind: 'component',
  },
  {
    id: 'claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet (MegaLLM)',
    description: 'Anthropic Claude via MegaLLM routing',
    provider: 'megallm',
    kind: 'design',
  },
  {
    id: 'minimaxai/minimax-m2',
    name: 'MiniMax M2 (MegaLLM)',
    description: 'MiniMax flagship model via MegaLLM',
    provider: 'megallm',
    kind: 'design',
  },
  {
    id: 'mistral-large-3-675b-instruct-2512',
    name: 'Mistral Large 3 675B (MegaLLM)',
    description: 'Mistral flagship 675B model via MegaLLM',
    provider: 'megallm',
    kind: 'design',
  },
  {
    id: 'moonshotai/kimi-k2-instruct-0905',
    name: 'Kimi K2 Instruct (MegaLLM)',
    description: 'Moonshot Kimi K2 instruction model',
    provider: 'megallm',
    kind: 'component',
  },
  {
    id: 'moonshotai/kimi-k2-thinking',
    name: 'Kimi K2 Thinking (MegaLLM)',
    description: 'Moonshot Kimi K2 reasoning model',
    provider: 'megallm',
    kind: 'design',
  },
  {
    id: 'deepseek-ai/deepseek-v3.1',
    name: 'DeepSeek V3.1 (MegaLLM)',
    description: 'DeepSeek flagship model via MegaLLM',
    provider: 'megallm',
    kind: 'design',
  },
];

/**
 * Provider configuration registry.
 */
export const PROVIDER_CONFIG: Record<ProviderId, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google AI models for generation',
    envKey: 'API_KEY',
    isConfigured: () => Boolean(process.env.API_KEY),
  },
  glm: {
    id: 'glm',
    name: 'Z.AI GLM',
    description: 'Z.AI GLM models via OpenAI-compatible API',
    envKey: 'VITE_ZAI_API_KEY',
    isConfigured: () => Boolean(import.meta.env.VITE_ZAI_API_KEY),
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'OpenRouter multi-model routing API',
    envKey: 'VITE_OPENROUTER_API_KEY',
    isConfigured: () => Boolean(import.meta.env.VITE_OPENROUTER_API_KEY),
  },
  megallm: {
    id: 'megallm',
    name: 'MegaLLM',
    description: 'Unified multi-provider API via MegaLLM',
    envKey: 'VITE_MEGALLM_API_KEY',
    isConfigured: () => Boolean(import.meta.env.VITE_MEGALLM_API_KEY),
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
