import React, { type Dispatch, type SetStateAction } from 'react';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BrainIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CodeIcon,
  GridIcon,
  ReactIcon,
  SaveIcon,
  SelectorIcon,
  SparklesIcon,
} from './Icons';

type SelectorMode = 'extract' | false;

export default function ActionBar({
  canGoBack,
  canGoForward,
  focusedArtifactIndex,
  isArtifactFullscreen,
  isLoading,
  areActionsVisible,
  prevItem,
  nextItem,
  selectorMode,
  setAreActionsVisible,
  setFocusedArtifactIndex,
  setIsArtifactFullscreen,
  setSelectorMode,
  handleGenerateVariations,
  handlePortToReact,
  handleSaveToLibrary,
  handleShowAgentPrompt,
  handleShowCode,
}: {
  canGoBack: boolean;
  canGoForward: boolean;
  focusedArtifactIndex: number | null;
  isArtifactFullscreen: boolean;
  isLoading: boolean;
  areActionsVisible: boolean;
  prevItem: () => void;
  nextItem: () => void;
  selectorMode: SelectorMode;
  setAreActionsVisible: Dispatch<SetStateAction<boolean>>;
  setFocusedArtifactIndex: Dispatch<SetStateAction<number | null>>;
  setIsArtifactFullscreen: Dispatch<SetStateAction<boolean>>;
  setSelectorMode: Dispatch<SetStateAction<SelectorMode>>;
  handleGenerateVariations: () => void;
  handlePortToReact: () => void;
  handleSaveToLibrary: () => void;
  handleShowAgentPrompt: () => void;
  handleShowCode: () => void;
}) {
  return (
    <>
      {canGoBack && (
        <button className="nav-handle left" onClick={prevItem}>
          <ArrowLeftIcon />
        </button>
      )}
      {canGoForward && (
        <button className="nav-handle right" onClick={nextItem}>
          <ArrowRightIcon />
        </button>
      )}
      <div className={`action-bar ${focusedArtifactIndex !== null ? 'visible' : ''}`}>
        <button
          className="action-bar-toggle"
          onClick={() => setAreActionsVisible(!areActionsVisible)}
          aria-label={areActionsVisible ? 'Hide action buttons' : 'Show action buttons'}
          aria-expanded={areActionsVisible}
          title={areActionsVisible ? 'Hide buttons' : 'Show buttons'}
        >
          {areActionsVisible ? <ChevronDownIcon /> : <ChevronUpIcon />}
        </button>
        <div className={`action-buttons ${areActionsVisible ? '' : 'hidden'}`}>
          <button
            onClick={() => {
              setFocusedArtifactIndex(null);
              setSelectorMode(false);
            }}
          >
            <GridIcon /> Grid View
          </button>
          {focusedArtifactIndex !== null && (
            <button onClick={() => setIsArtifactFullscreen((prev) => !prev)} aria-pressed={isArtifactFullscreen}>
              {isArtifactFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
          )}
          <button
            onClick={() => setSelectorMode(selectorMode === 'extract' ? false : 'extract')}
            className={selectorMode === 'extract' ? 'active-btn' : ''}
          >
            <CodeIcon /> {selectorMode === 'extract' ? 'Cancel Extract' : 'Extract'}
          </button>
          <button onClick={handleGenerateVariations} disabled={isLoading}>
            <SparklesIcon /> Variations
          </button>
          <button onClick={handlePortToReact} disabled={isLoading}>
            <ReactIcon /> Port to React
          </button>
          <button onClick={handleSaveToLibrary} title="Archive to Library">
            <SaveIcon /> Store
          </button>
          <button onClick={handleShowAgentPrompt}>
            <BrainIcon /> Agent Logic
          </button>
          <button onClick={handleShowCode}>
            <CodeIcon /> HTML/CSS
          </button>
        </div>
        {selectorMode && (
          <div className="selector-tip">
            Click any element to extract it as a component.
          </div>
        )}
      </div>
    </>
  );
}

