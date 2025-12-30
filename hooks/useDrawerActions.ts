import { useCallback, useState } from 'react';

import { slugifyName } from '../utils';

import type { DrawerMode } from './useDrawer';

type SnippetTab = 'html' | 'react';

export function useDrawerActions(params: {
  drawerMode: DrawerMode;
  artifactName?: string;
  snippetTab: SnippetTab;
}) {
  const { drawerMode, artifactName, snippetTab } = params;
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleDownload = useCallback(
    (content: string) => {
      if (!content) return;
      const isReact = drawerMode === 'react' || (drawerMode === 'snippet' && snippetTab === 'react');
      const isPrompt = drawerMode === 'agent-prompt';
      const ext = isReact ? '.tsx' : isPrompt ? '.txt' : '.html';

      const baseName = artifactName ? slugifyName(artifactName) : 'flash-ui-export';
      const filename = `${baseName}${ext}`;

      const mimeType = isReact ? 'text/typescript' : isPrompt ? 'text/plain' : 'text/html';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [artifactName, drawerMode, snippetTab],
  );

  const copyToClipboard = useCallback(async (text: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }, []);

  return { copyFeedback, copyToClipboard, handleDownload };
}

