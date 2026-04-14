import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';

import {
  cleanCodeFences,
  streamReactComponent,
  streamSnippetExtraction,
  streamSnippetToReact,
} from '../ai/generate';
import type { ProviderId } from '../ai/providers';
import type { Session } from '../types';

import type { DrawerState } from './useDrawer';

type OpenDrawer = (next: Omit<DrawerState, 'isOpen'> & { isOpen?: boolean }) => void;

export function useSnippetConversion(options: {
  sessions: Session[];
  currentSessionIndex: number;
  focusedArtifactIndex: number | null;
  provider: ProviderId;
  componentModel: string;
  drawerState: DrawerState;
  openDrawer: OpenDrawer;
  setDrawerState: Dispatch<SetStateAction<DrawerState>>;
  snippetTab: 'html' | 'react';
  setSnippetTab: Dispatch<SetStateAction<'html' | 'react'>>;
  isReactLoading: boolean;
  setIsReactLoading: Dispatch<SetStateAction<boolean>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setSelectorMode: Dispatch<SetStateAction<'extract' | false>>;
}) {
  const {
    sessions,
    currentSessionIndex,
    focusedArtifactIndex,
    provider,
    componentModel,
    drawerState,
    openDrawer,
    setDrawerState,
    snippetTab,
    setSnippetTab,
    isReactLoading,
    setIsReactLoading,
    setIsLoading,
    setSelectorMode,
  } = options;

  const handleExtractSnippet = useCallback(
    async (snippetHtml: string, _context: string) => {
      const currentSession = sessions[currentSessionIndex];
      if (!currentSession || focusedArtifactIndex === null) return;
      const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

      setIsLoading(true);
      setSelectorMode(false);
      setSnippetTab('html');
      openDrawer({ mode: 'snippet', title: 'Isolated Component', data: '', reactData: '' });

      try {
        const stream = streamSnippetExtraction({
          provider: provider,
          snippetHtml,
          documentHtml: currentArtifact.html,
        });

        let accumulated = '';
        for await (const chunk of stream) {
          accumulated += chunk;
          const clean = cleanCodeFences(accumulated);
          setDrawerState((prev) => ({ ...prev, data: clean }));
        }
      } catch (e: any) {
        setDrawerState((prev) => ({ ...prev, data: `Error: ${e.message}` }));
      } finally {
        setIsLoading(false);
      }
    },
    [
      sessions,
      currentSessionIndex,
      focusedArtifactIndex,
      provider,
      setIsLoading,
      setSelectorMode,
      setSnippetTab,
      openDrawer,
      setDrawerState,
    ],
  );

  const handlePortSnippetToReact = useCallback(async () => {
    if (drawerState.reactData || isReactLoading) return;

    setIsReactLoading(true);
    try {
      const stream = streamSnippetToReact({
        provider: provider,
        snippetHtml: drawerState.data,
        modelId: componentModel,
      });

      let accumulated = '';
      for await (const chunk of stream) {
        accumulated += chunk;
        const clean = cleanCodeFences(accumulated);
        setDrawerState((prev) => ({ ...prev, reactData: clean }));
      }
    } catch (e: any) {
      setDrawerState((prev) => ({ ...prev, reactData: `// Error: ${e.message}` }));
    } finally {
      setIsReactLoading(false);
    }
  }, [
    drawerState.data,
    drawerState.reactData,
    isReactLoading,
    componentModel,
    provider,
    setDrawerState,
    setIsReactLoading,
  ]);

  useEffect(() => {
    if (snippetTab === 'react' && drawerState.mode === 'snippet' && !drawerState.reactData) {
      handlePortSnippetToReact();
    }
  }, [snippetTab, drawerState.mode, drawerState.reactData, handlePortSnippetToReact]);

  const handlePortToReact = useCallback(async () => {
    const currentSession = sessions[currentSessionIndex];
    if (!currentSession || focusedArtifactIndex === null) return;
    const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

    setIsLoading(true);
    openDrawer({ mode: 'react', title: 'React Component', data: '' });

    try {
      const stream = streamReactComponent({
        provider: provider,
        html: currentArtifact.html,
        modelId: componentModel,
      });

      let accumulated = '';
      for await (const chunk of stream) {
        accumulated += chunk;
        const clean = cleanCodeFences(accumulated);
        setDrawerState((prev) => ({ ...prev, data: clean }));
      }
    } catch (e: any) {
      setDrawerState((prev) => ({ ...prev, data: `// Error: ${e.message}` }));
    } finally {
      setIsLoading(false);
    }
  }, [
    sessions,
    currentSessionIndex,
    focusedArtifactIndex,
    componentModel,
    provider,
    setIsLoading,
    openDrawer,
    setDrawerState,
  ]);

  return { handleExtractSnippet, handlePortToReact };
}
