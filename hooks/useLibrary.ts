import { useCallback, useEffect, useState } from 'react';

import type { LibraryItem } from '../types';

const STORAGE_KEY = 'flash_ui_creative_library';

export function useLibrary() {
  const [storedItems, setStoredItems] = useState<LibraryItem[]>([]);
  const [activeSystem, setActiveSystem] = useState<LibraryItem | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      setStoredItems(JSON.parse(saved));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedItems));
  }, [storedItems]);

  const prependItem = useCallback((item: LibraryItem) => {
    setStoredItems((prev) => [item, ...prev]);
  }, []);

  const deleteItem = useCallback((id: string) => {
    setStoredItems((prev) => prev.filter((item) => item.id !== id));
    setActiveSystem((current) => (current?.id === id ? null : current));
  }, []);

  const clearActiveSystem = useCallback(() => {
    setActiveSystem(null);
  }, []);

  const toggleActiveSystem = useCallback((item: LibraryItem) => {
    setActiveSystem((current) => (current?.id === item.id ? null : item));
  }, []);

  return {
    activeSystem,
    clearActiveSystem,
    deleteItem,
    prependItem,
    setActiveSystem,
    storedItems,
    toggleActiveSystem,
  };
}

