import { useEffect, type Dispatch, type SetStateAction } from 'react';

import type { ElementData } from '../components/ElementEditor';

export function useIframeSelection(options: {
  selectorMode: 'edit' | 'extract' | false;
  setEditingElement: Dispatch<SetStateAction<ElementData | null>>;
  setIsElementEditorOpen: Dispatch<SetStateAction<boolean>>;
  handleExtractSnippet: (snippetHtml: string, context: string) => void | Promise<void>;
}) {
  const { selectorMode, setEditingElement, setIsElementEditorOpen, handleExtractSnippet } = options;

  useEffect(() => {
    const handleIframeMessage = async (event: MessageEvent) => {
      try {
        if (event.data?.type === 'ELEMENT_SELECTED') {
          const { elementData, outerHTML, styleContext } = event.data;

          if (selectorMode === 'edit' && elementData) {
            setEditingElement(elementData);
            setIsElementEditorOpen(true);
          } else if (selectorMode === 'extract') {
            await handleExtractSnippet(outerHTML, styleContext);
          }
        }
      } catch (error) {
        console.error('Failed to handle iframe selection message', error);
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [selectorMode, setEditingElement, setIsElementEditorOpen, handleExtractSnippet]);
}
