import { useEffect } from 'react';

export function useIframeSelection(options: {
  selectorMode: 'extract' | false;
  handleExtractSnippet: (snippetHtml: string, context: string) => void | Promise<void>;
}) {
  const { selectorMode, handleExtractSnippet } = options;

  useEffect(() => {
    const handleIframeMessage = async (event: MessageEvent) => {
      try {
        if (event.data?.type === 'ELEMENT_SELECTED') {
          const { outerHTML, styleContext } = event.data;

          if (selectorMode === 'extract') {
            await handleExtractSnippet(outerHTML, styleContext);
          }
        }
      } catch (error) {
        console.error('Failed to handle iframe selection message', error);
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [selectorMode, handleExtractSnippet]);
}
