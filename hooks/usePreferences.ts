import { useEffect, useMemo, useState } from 'react';

import { getDefaultModel, MODELS, type ProviderId } from '../ai/providers';

export type BarPosition = 'bottom' | 'left' | 'right';

function clampInt(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isValidProvider(value: string | null): value is ProviderId {
  return value === 'gemini' || value === 'glm' || value === 'openrouter';
}

export function usePreferences() {
  const [concurrentGenerations, setConcurrentGenerations] = useState<number>(() => {
    const saved = localStorage.getItem('flash_ui_concurrent_generations');
    if (!saved) return 3;
    const parsed = parseInt(saved, 10);
    if (Number.isNaN(parsed)) return 3;
    return clampInt(parsed, 1, 5);
  });

  const [provider, setProvider] = useState<ProviderId>(() => {
    const saved = localStorage.getItem('flash_ui_provider');
    return isValidProvider(saved) ? saved : 'gemini';
  });

  const availableModels = useMemo(() => MODELS.filter((m) => m.provider === provider), [provider]);

  const [componentModel, setComponentModel] = useState<string>(() => {
    const saved = localStorage.getItem('flash_ui_component_model');
    return saved || 'gemini-3-flash-preview';
  });

  const [designSystemModel, setDesignSystemModel] = useState<string>(() => {
    const saved = localStorage.getItem('flash_ui_design_system_model');
    return saved || 'gemini-3-pro-preview';
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
    const defaultModel = getDefaultModel(provider, false);
    const defaultDesignModel = getDefaultModel(provider, true);
    if (defaultModel) setComponentModel(defaultModel.id);
    if (defaultDesignModel) setDesignSystemModel(defaultDesignModel.id);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem('flash_ui_component_model', componentModel);
  }, [componentModel]);

  useEffect(() => {
    localStorage.setItem('flash_ui_design_system_model', designSystemModel);
  }, [designSystemModel]);

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

