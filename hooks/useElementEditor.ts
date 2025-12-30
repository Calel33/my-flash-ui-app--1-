import { useCallback, type Dispatch, type SetStateAction } from 'react';

import type { ElementData } from '../components/ElementEditor';
import type { Session } from '../types';

type ElementChanges = Partial<ElementData['computedStyles']> & { textContent?: string; href?: string };

export function useElementEditor(options: {
  editingElement: ElementData | null;
  focusedArtifactIndex: number | null;
  currentSessionIndex: number;
  setSessions: Dispatch<SetStateAction<Session[]>>;
  setSelectorMode: Dispatch<SetStateAction<'edit' | 'extract' | false>>;
  setIsElementEditorOpen: Dispatch<SetStateAction<boolean>>;
  setEditingElement: Dispatch<SetStateAction<ElementData | null>>;
}) {
  const {
    editingElement,
    focusedArtifactIndex,
    currentSessionIndex,
    setSessions,
    setSelectorMode,
    setIsElementEditorOpen,
    setEditingElement,
  } = options;

  const applyElementChanges = useCallback(
    (changes: ElementChanges) => {
      if (!editingElement) return;

      const iframes = document.querySelectorAll('.artifact-card.focused iframe');
      if (iframes.length === 0) return;

      const iframe = iframes[0] as HTMLIFrameElement;
      if (!iframe.contentWindow) return;

      const { textContent, href, ...styles } = changes;
      iframe.contentWindow.postMessage(
        {
          type: 'APPLY_STYLE',
          path: editingElement.path,
          styles: Object.keys(styles).length > 0 ? styles : undefined,
          textContent,
          href,
        },
        window.location.origin,
      );
    },
    [editingElement],
  );

  const saveElementEdits = useCallback(() => {
    if (focusedArtifactIndex === null || currentSessionIndex === undefined || currentSessionIndex === null) return;

    const iframes = document.querySelectorAll('.artifact-card.focused iframe');
    if (iframes.length === 0) return;

    const iframe = iframes[0] as HTMLIFrameElement;
    if (!iframe.contentDocument) return;

    const updatedHtml = iframe.contentDocument.documentElement.outerHTML;
    setSessions((prev) =>
      prev.map((sess, sIdx) =>
        sIdx === currentSessionIndex
          ? {
              ...sess,
              artifacts: sess.artifacts.map((art, aIdx) =>
                aIdx === focusedArtifactIndex ? { ...art, html: updatedHtml } : art,
              ),
            }
          : sess,
      ),
    );

    setSelectorMode(false);
    setIsElementEditorOpen(false);
    setEditingElement(null);
  }, [
    focusedArtifactIndex,
    currentSessionIndex,
    setSessions,
    setSelectorMode,
    setIsElementEditorOpen,
    setEditingElement,
  ]);

  return { applyElementChanges, saveElementEdits };
}
