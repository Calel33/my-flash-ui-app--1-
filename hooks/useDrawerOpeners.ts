import { useCallback } from 'react';

import type { Session } from '../types';

import type { DrawerState } from './useDrawer';

type OpenDrawer = (next: Omit<DrawerState, 'isOpen'> & { isOpen?: boolean }) => void;

export function useDrawerOpeners(options: {
  sessions: Session[];
  currentSessionIndex: number;
  focusedArtifactIndex: number | null;
  openDrawer: OpenDrawer;
}) {
  const { sessions, currentSessionIndex, focusedArtifactIndex, openDrawer } = options;

  const handleShowCode = useCallback(() => {
    const currentSession = sessions[currentSessionIndex];
    if (currentSession && focusedArtifactIndex !== null) {
      const artifact = currentSession.artifacts[focusedArtifactIndex];
      openDrawer({
        mode: 'code',
        title: 'Source Code',
        data: artifact.html,
        artifactName: artifact.displayName || artifact.styleName,
      });
    }
  }, [currentSessionIndex, focusedArtifactIndex, openDrawer, sessions]);

  const handleShowAgentPrompt = useCallback(() => {
    const currentSession = sessions[currentSessionIndex];
    if (currentSession && focusedArtifactIndex !== null) {
      const artifact = currentSession.artifacts[focusedArtifactIndex];
      openDrawer({
        mode: 'agent-prompt',
        title: 'Agent Logic',
        data: artifact.agentPrompt || 'Instruction metadata not available.',
        artifactName: artifact.displayName || artifact.styleName,
      });
    }
  }, [currentSessionIndex, focusedArtifactIndex, openDrawer, sessions]);

  const handleShowLibrary = useCallback(() => {
    openDrawer({ mode: 'library', title: 'Creative Library', data: '' });
  }, [openDrawer]);

  const handleShowImport = useCallback(() => {
    openDrawer({ mode: 'import', title: 'Import Design', data: '' });
  }, [openDrawer]);

  return { handleShowAgentPrompt, handleShowCode, handleShowImport, handleShowLibrary };
}

