import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

import type { Artifact, LibraryItem, Session } from '../types';
import { createArtifactFromImport, createLibraryItemFromImport, generateId, type ImportedDesignData } from '../utils';

type Options = {
  sessions: Session[];
  currentSessionIndex: number;
  focusedArtifactIndex: number | null;
  setSessions: Dispatch<SetStateAction<Session[]>>;
  setCurrentSessionIndex: Dispatch<SetStateAction<number>>;
  setFocusedArtifactIndex: Dispatch<SetStateAction<number | null>>;
  prependLibraryItem: (item: LibraryItem) => void;
  deleteLibraryItem: (id: string) => void;
  activeSystem: LibraryItem | null;
  clearActiveSystem: () => void;
  toggleActiveSystem: (item: LibraryItem) => void;
  closeDrawer: () => void;
};

export function useSessionMutations(options: Options) {
  const {
    sessions,
    currentSessionIndex,
    focusedArtifactIndex,
    setSessions,
    setCurrentSessionIndex,
    setFocusedArtifactIndex,
    prependLibraryItem,
    deleteLibraryItem,
    activeSystem,
    clearActiveSystem,
    toggleActiveSystem,
    closeDrawer,
  } = options;

  const applyVariation = useCallback(
    (html: string) => {
      if (focusedArtifactIndex === null) return;
      setSessions((prev) =>
        prev.map((sess, i) =>
          i === currentSessionIndex
            ? {
                ...sess,
                artifacts: sess.artifacts.map((art, j) =>
                  j === focusedArtifactIndex ? { ...art, html, status: 'complete' } : art,
                ),
              }
            : sess,
        ),
      );
      closeDrawer();
    },
    [closeDrawer, currentSessionIndex, focusedArtifactIndex, setSessions],
  );

  const handleSaveToLibrary = useCallback(() => {
    const currentSession = sessions[currentSessionIndex];
    if (currentSession && focusedArtifactIndex !== null) {
      const artifact = currentSession.artifacts[focusedArtifactIndex];
      const newItem: LibraryItem = {
        id: generateId(),
        name: artifact.styleName || 'Untitled Item',
        prompt: currentSession.prompt,
        html: artifact.html,
        type: artifact.isDesignSystem ? 'design-system' : 'component',
        timestamp: Date.now(),
      };
      prependLibraryItem(newItem);
      alert(`Saved ${newItem.type === 'design-system' ? 'Design System' : 'Component'} to Library!`);
    }
  }, [currentSessionIndex, focusedArtifactIndex, prependLibraryItem, sessions]);

  const handleImportDesign = useCallback(
    (data: ImportedDesignData, displayName: string, type: 'design-system' | 'component') => {
      const sessionId = generateId();
      const artifact = createArtifactFromImport(data, displayName, type === 'design-system', sessionId);
      const libraryItem = createLibraryItemFromImport(data, displayName, type);

      const newSession: Session = {
        id: sessionId,
        prompt: `Imported: ${displayName}`,
        timestamp: Date.now(),
        artifacts: [artifact],
      };

      setSessions((prev) => {
        const nextIndex = prev.length;
        const updated = [...prev, newSession];
        setCurrentSessionIndex(nextIndex);
        return updated;
      });
      setFocusedArtifactIndex(0);
      prependLibraryItem(libraryItem);
      closeDrawer();
    },
    [closeDrawer, prependLibraryItem, setCurrentSessionIndex, setFocusedArtifactIndex, setSessions],
  );

  const toggleSystemContext = useCallback(
    (item: LibraryItem, e: ReactMouseEvent) => {
      e.stopPropagation();
      if (activeSystem?.id === item.id) {
        clearActiveSystem();
      } else {
        toggleActiveSystem(item);
        alert(`Active Context: ${item.name}. New components will follow this brand.`);
        closeDrawer();
      }
    },
    [activeSystem?.id, clearActiveSystem, closeDrawer, toggleActiveSystem],
  );

  const deleteFromLibrary = useCallback(
    (id: string, e: ReactMouseEvent) => {
      e.stopPropagation();
      deleteLibraryItem(id);
    },
    [deleteLibraryItem],
  );

  const loadFromLibrary = useCallback(
    (item: LibraryItem) => {
      const sessionId = generateId();
      const artifact: Artifact = {
        id: `${sessionId}_0`,
        styleName: item.name,
        html: item.html,
        status: 'complete',
        isDesignSystem: item.type === 'design-system',
      };

      const newSession: Session = {
        id: sessionId,
        prompt: item.prompt,
        timestamp: Date.now(),
        artifacts: [artifact],
      };

      setSessions((prev) => {
        const nextIndex = prev.length;
        const updated = [...prev, newSession];
        setCurrentSessionIndex(nextIndex);
        return updated;
      });
      setFocusedArtifactIndex(0);
      closeDrawer();
    },
    [closeDrawer, setCurrentSessionIndex, setFocusedArtifactIndex, setSessions],
  );

  return {
    applyVariation,
    deleteFromLibrary,
    handleImportDesign,
    handleSaveToLibrary,
    loadFromLibrary,
    toggleSystemContext,
  };
}
