import { useCallback, useState } from 'react';

export type DrawerMode =
  | 'code'
  | 'variations'
  | 'react'
  | 'snippet'
  | 'agent-prompt'
  | 'library'
  | 'import'
  | null;

export type DrawerState = {
  isOpen: boolean;
  mode: DrawerMode;
  title: string;
  data: string;
  reactData?: string;
  artifactName?: string;
};

const INITIAL_STATE: DrawerState = { isOpen: false, mode: null, title: '', data: '' };

export function useDrawer() {
  const [drawerState, setDrawerState] = useState<DrawerState>(INITIAL_STATE);

  const closeDrawer = useCallback(() => {
    setDrawerState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const openDrawer = useCallback((next: Omit<DrawerState, 'isOpen'> & { isOpen?: boolean }) => {
    setDrawerState({ ...next, isOpen: next.isOpen ?? true });
  }, []);

  return { closeDrawer, drawerState, openDrawer, setDrawerState };
}

