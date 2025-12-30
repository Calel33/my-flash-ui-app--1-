import React from 'react';

import type { ComponentVariation, LibraryItem } from '../types';
import type { ImportedDesignData } from '../utils';
import type { DrawerState } from '../hooks/useDrawer';

import ImportDesignPanel from './ImportDesignPanel';
import { CodeIcon, CopyIcon, DownloadIcon, PaletteIcon, ReactIcon, TrashIcon } from './Icons';

type SnippetTab = 'html' | 'react';

type Props = {
  drawerState: DrawerState;
  isLoading: boolean;
  isReactLoading: boolean;
  snippetTab: SnippetTab;
  setSnippetTab: (tab: SnippetTab) => void;
  currentSnippetData: string;
  copyFeedback: boolean;
  copyToClipboard: (text: string) => void;
  handleDownload: (content: string) => void;
  componentVariations: ComponentVariation[];
  applyVariation: (html: string) => void;
  storedItems: LibraryItem[];
  activeSystem: LibraryItem | null;
  loadFromLibrary: (item: LibraryItem) => void;
  toggleSystemContext: (item: LibraryItem, e: React.MouseEvent) => void;
  deleteFromLibrary: (id: string, e: React.MouseEvent) => void;
  handleImportDesign: (data: ImportedDesignData, displayName: string, type: 'design-system' | 'component') => void;
  closeDrawer: () => void;
};

export default function DrawerContent(props: Props) {
  const {
    drawerState,
    isLoading,
    isReactLoading,
    snippetTab,
    setSnippetTab,
    currentSnippetData,
    copyFeedback,
    copyToClipboard,
    handleDownload,
    componentVariations,
    applyVariation,
    storedItems,
    activeSystem,
    loadFromLibrary,
    toggleSystemContext,
    deleteFromLibrary,
    handleImportDesign,
    closeDrawer,
  } = props;

  return (
    <>
      {((isLoading && drawerState.mode === 'react' && !drawerState.data) ||
        (isReactLoading && snippetTab === 'react' && !drawerState.reactData) ||
        (isLoading && drawerState.mode === 'snippet' && !drawerState.data)) && (
        <div className="react-loading-state">
          <div className="react-loading-icon">
            <ReactIcon />
          </div>
          <div className="react-loading-text">
            <span className="loading-title">
              {drawerState.mode === 'react'
                ? 'Converting to React...'
                : isReactLoading
                  ? 'Converting...'
                  : 'Extracting...'}
            </span>
            <span className="loading-subtitle">Generating production-ready code</span>
          </div>
          <div className="loading-shimmer-bar" />
        </div>
      )}
      {drawerState.mode === 'snippet' && (
        <div className="snippet-tabs">
          <button
            className={`tab-btn ${snippetTab === 'html' ? 'active' : ''}`}
            onClick={() => setSnippetTab('html')}
          >
            <CodeIcon /> HTML
          </button>
          <button
            className={`tab-btn ${snippetTab === 'react' ? 'active' : ''}`}
            onClick={() => setSnippetTab('react')}
          >
            <ReactIcon /> React
          </button>
        </div>
      )}
      {(drawerState.mode === 'code' ||
        drawerState.mode === 'react' ||
        drawerState.mode === 'snippet' ||
        drawerState.mode === 'agent-prompt') && (
        <div className="code-container">
          <div className="drawer-actions">
            <button className="copy-code-button" onClick={() => copyToClipboard(currentSnippetData)}>
              <CopyIcon /> {copyFeedback ? 'Copied!' : 'Copy'}
            </button>
            {drawerState.mode !== 'agent-prompt' && (
              <button className="copy-code-button" onClick={() => handleDownload(currentSnippetData)}>
                <DownloadIcon /> Download
              </button>
            )}
          </div>
          {(isLoading && drawerState.mode === 'react' && !drawerState.data) ||
          (isReactLoading && snippetTab === 'react' && !drawerState.reactData) ? (
            <div className="code-skeleton">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="skeleton-line"
                  style={{ width: `${40 + Math.random() * 55}%`, animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
          ) : (
            <pre className={`code-block ${(isLoading || isReactLoading) && currentSnippetData ? 'streaming' : ''}`}>
              <code>{currentSnippetData}</code>
              {(isLoading || isReactLoading) && currentSnippetData && <span className="streaming-cursor" />}
            </pre>
          )}
        </div>
      )}
      {drawerState.mode === 'variations' && (
        <div className="sexy-grid">
          {componentVariations.map((v, i) => (
            <div key={i} className="sexy-card" onClick={() => applyVariation(v.html)}>
              <div className="sexy-preview">
                <iframe srcDoc={v.html} title={v.name} sandbox="allow-scripts" />
              </div>
              <div className="sexy-label">{v.name}</div>
            </div>
          ))}
        </div>
      )}
      {drawerState.mode === 'library' && (
        <div className="library-list">
          {storedItems.length === 0 ? (
            <div className="empty-library">Your library is empty.</div>
          ) : (
            storedItems.map((item) => (
              <div key={item.id} className="library-item" onClick={() => loadFromLibrary(item)}>
                <div className="library-item-info">
                  <div className="library-item-header">
                    <div className="library-item-name">{item.name}</div>
                    <span className={`item-type-badge ${item.type}`}>{item.type === 'design-system' ? 'DS' : 'CMP'}</span>
                  </div>
                  <div className="library-item-prompt">{item.prompt}</div>
                </div>
                <div className="library-item-actions">
                  {item.type === 'design-system' && (
                    <button
                      className={`context-btn ${activeSystem?.id === item.id ? 'active' : ''}`}
                      title={activeSystem?.id === item.id ? 'System Active' : 'Activate System Context'}
                      onClick={(e) => toggleSystemContext(item, e)}
                    >
                      <PaletteIcon />
                    </button>
                  )}
                  <button className="delete-item-btn" onClick={(e) => deleteFromLibrary(item.id, e)}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {drawerState.mode === 'import' && <ImportDesignPanel onImport={handleImportDesign} onCancel={closeDrawer} />}
    </>
  );
}
