/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import type { ComparisonSlot } from '../types';

const MAX_SLOTS = 6;

interface UseComparisonModeProps {
  slots: ComparisonSlot[];
  setSlots: React.Dispatch<React.SetStateAction<ComparisonSlot[]>>;
}

export function useComparisonMode({ slots, setSlots }: UseComparisonModeProps) {
  const addSlot = useCallback(() => {
    if (slots.length >= MAX_SLOTS) return;
    
    const newSlot: ComparisonSlot = {
      id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      provider: 'gemini',
      modelId: 'gemini-3-flash-preview',
    };
    
    setSlots((prev) => [...prev, newSlot]);
  }, [slots.length, setSlots]);

  const removeSlot = useCallback((slotId: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
  }, [setSlots]);

  const updateSlot = useCallback((slotId: string, updates: Partial<ComparisonSlot>) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, ...updates } : s))
    );
  }, [setSlots]);

  const clearSlots = useCallback(() => {
    setSlots([]);
  }, [setSlots]);

  return {
    addSlot,
    removeSlot,
    updateSlot,
    clearSlots,
    canAddMore: slots.length < MAX_SLOTS,
    maxSlots: MAX_SLOTS,
  };
}
