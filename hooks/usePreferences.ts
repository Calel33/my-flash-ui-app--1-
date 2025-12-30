import { useEffect, useMemo, useState } from 'react';

import { MODELS, getComponentModels, getDesignSystemModels, type ProviderId } from '../ai/providers';

export type BarPosition = 'bottom' | 'left' | 'right';

function clampInt(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isValidProvider(value: string | null): value is ProviderId {
  return value === 'gemini' || value === 'glm' || value === 'openrouter';
}

function getPersistedProvider(): ProviderId {
  const saved = localStorage.getItem('flash_ui_provider');
  return isValidProvider(saved) ? saved : 'gemini';
}

function getPersistedModel(provider: ProviderId, kind: 'component' | 'design'): string | null {
  const providerKey = kind === 'component' ? `flash_ui_component_model_${provider}` : `flash_ui_design_system_model_${provider}`;
  const providerSaved = localStorage.getItem(providerKey);
  if (providerSaved) return providerSaved;
  const legacyKey = kind === 'component' ? 'flash_ui_component_model' : 'flash_ui_design_system_model';
  return localStorage.getItem(legacyKey);
}

function pickModelId(options: { savedId: string | null; provider: ProviderId; kind: 'component' | 'design' }) {
  const candidates =
    options.kind === 'component' ? getComponentModels(options.provider) : getDesignSystemModels(options.provider);
  const savedModel = options.savedId ? MODELS.find((m) => m.id === options.savedId) : undefined;
  if (savedModel && savedModel.provider === options.provider) return savedModel.id;
  if (candidates.length > 0) return candidates[0].id;
  return MODELS[0]?.id ?? '';
}

export function usePreferences() {
  const [concurrentGenerations, setConcurrentGenerations] = useState<number>(() => {
    const saved = localStorage.getItem('flash_ui_concurrent_generations');
    if (!saved) return 3;
    const parsed = parseInt(saved, 10);
    if (Number.isNaN(parsed)) return 3;
    return clampInt(parsed, 1, 5);
  });

  const [provider, setProvider] = useState<ProviderId>(() => getPersistedProvider());

  const availableModels = useMemo(() => MODELS.filter((m) => m.provider === provider), [provider]);

  const [componentModel, setComponentModel] = useState<string>(() => {
    const saved = getPersistedModel(getPersistedProvider(), 'component');
    const persistedProvider = getPersistedProvider();
    return pickModelId({ savedId: saved, provider: persistedProvider, kind: 'component' });
  });

  const [designSystemModel, setDesignSystemModel] = useState<string>(() => {
    const saved = getPersistedModel(getPersistedProvider(), 'design');
    const persistedProvider = getPersistedProvider();
    return pickModelId({ savedId: saved, provider: persistedProvider, kind: 'design' });
  });

  const [barPosition, setBarPosition] = useState<BarPosition>(() => {
    const saved = localStorage.getItem('flash_ui_bar_position');
    return saved === 'left' || saved === 'right' || saved === 'bottom' ? saved : 'bottom';
  });

  const [isBarHidden, setIsBarHidden] = useState<boolean>(() => {
    const saved = localStorage.getItem('flash_ui_bar_hidden');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('flash_ui_concurrent_generations', concurrentGenerations.toString());
  }, [concurrentGenerations]);

  useEffect(() => {
    localStorage.setItem('flash_ui_provider', provider);
  }, [provider]);

  useEffect(() => {
    const componentModels = getComponentModels(provider);
    const designModels = getDesignSystemModels(provider);

    const isComponentValid = componentModels.some((m) => m.id === componentModel);
    const isDesignValid = designModels.some((m) => m.id === designSystemModel);

    if (!isComponentValid) {
      const savedForProvider = getPersistedModel(provider, 'component');
      const nextComponent = pickModelId({ savedId: savedForProvider, provider, kind: 'component' });
      setComponentModel(nextComponent);
    }

    if (!isDesignValid) {
      const savedForProvider = getPersistedModel(provider, 'design');
      const nextDesign = pickModelId({ savedId: savedForProvider, provider, kind: 'design' });
      setDesignSystemModel(nextDesign);
    }
  }, [componentModel, designSystemModel, provider]);

  useEffect(() => {
    localStorage.setItem('flash_ui_component_model', componentModel);
    localStorage.setItem(`flash_ui_component_model_${provider}`, componentModel);
  }, [componentModel, provider]);

  useEffect(() => {
    localStorage.setItem('flash_ui_design_system_model', designSystemModel);
    localStorage.setItem(`flash_ui_design_system_model_${provider}`, designSystemModel);
  }, [designSystemModel, provider]);

  useEffect(() => {
    localStorage.setItem('flash_ui_bar_position', barPosition);
  }, [barPosition]);

  useEffect(() => {
    localStorage.setItem('flash_ui_bar_hidden', isBarHidden.toString());
  }, [isBarHidden]);

  return {
    availableModels,
    barPosition,
    componentModel,
    concurrentGenerations,
    designSystemModel,
    isBarHidden,
    provider,
    setBarPosition,
    setComponentModel,
    setConcurrentGenerations,
    setDesignSystemModel,
    setIsBarHidden,
    setProvider,
  };
}
