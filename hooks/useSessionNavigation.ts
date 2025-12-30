import { useCallback } from 'react';

import type { ProviderId } from '../ai/providers';
import type { Session } from '../types';

export function useSessionNavigation(options: {
  sessions: Session[];
  currentSessionIndex: number;
  focusedArtifactIndex: number | null;
  isLoading: boolean;
  provider: ProviderId;
  setCurrentSessionIndex: (next: number) => void;
  setFocusedArtifactIndex: (next: number | null) => void;
}) {
  const {
    sessions,
    currentSessionIndex,
    focusedArtifactIndex,
    isLoading,
    provider,
    setCurrentSessionIndex,
    setFocusedArtifactIndex,
  } = options;

  const nextItem = useCallback(() => {
    const sess = sessions[currentSessionIndex];
    if (focusedArtifactIndex !== null && sess && focusedArtifactIndex < sess.artifacts.length - 1) {
      setFocusedArtifactIndex(focusedArtifactIndex + 1);
    } else if (currentSessionIndex < sessions.length - 1) {
      setCurrentSessionIndex(currentSessionIndex + 1);
      setFocusedArtifactIndex(null);
    }
  }, [
    sessions,
    currentSessionIndex,
    focusedArtifactIndex,
    setCurrentSessionIndex,
    setFocusedArtifactIndex,
  ]);

  const prevItem = useCallback(() => {
    if (focusedArtifactIndex !== null && focusedArtifactIndex > 0) {
      setFocusedArtifactIndex(focusedArtifactIndex - 1);
    } else if (currentSessionIndex > 0) {
      setCurrentSessionIndex(currentSessionIndex - 1);
      setFocusedArtifactIndex(null);
    }
  }, [focusedArtifactIndex, currentSessionIndex, setCurrentSessionIndex, setFocusedArtifactIndex]);

  const hasStarted = sessions.length > 0 || isLoading;
  const isGlmLoading = isLoading && provider === 'glm';
  const currentSession = sessions[currentSessionIndex];
  const canGoBack = (focusedArtifactIndex !== null && focusedArtifactIndex > 0) || currentSessionIndex > 0;
  const canGoForward =
    (focusedArtifactIndex !== null &&
      currentSession &&
      focusedArtifactIndex < currentSession.artifacts.length - 1) ||
    currentSessionIndex < sessions.length - 1;

  return {
    canGoBack,
    canGoForward,
    currentSession,
    hasStarted,
    isGlmLoading,
    nextItem,
    prevItem,
  };
}

