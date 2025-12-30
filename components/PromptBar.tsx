import React, { type Dispatch, type SetStateAction } from 'react';

import type { ProviderId } from '../ai/providers';
import type { LibraryItem } from '../types';
import type { BarPosition } from '../hooks/usePreferences';

import PromptPopup from './PromptPopup';
import {
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  LibraryIcon,
  PaletteIcon,
  PinBottomIcon,
  PinLeftIcon,
  PinRightIcon,
  ThinkingIcon,
  UploadIcon,
} from './Icons';

type ModelOption = { id: string; name: string };

export default function PromptBar({
  activeSystem,
  availableModels,
  barPosition,
  componentModel,
  concurrentGenerations,
  designSystemModel,
  isBarHidden,
  isDesignSystemMode,
  isLoading,
  inputValue,
  isPromptPopupOpen,
  provider,
  clearActiveSystem,
  handleSendMessage,
  setBarPosition,
  setComponentModel,
  setConcurrentGenerations,
  setDesignSystemModel,
  setIsBarHidden,
  setIsDesignSystemMode,
  setInputValue,
  setIsPromptPopupOpen,
  setProvider,
  handleShowImport,
  handleShowLibrary,
}: {
  activeSystem: LibraryItem | null;
  availableModels: ModelOption[];
  barPosition: BarPosition;
  componentModel: string;
  concurrentGenerations: number;
  designSystemModel: string;
  isBarHidden: boolean;
  isDesignSystemMode: boolean;
  isLoading: boolean;
  inputValue: string;
  isPromptPopupOpen: boolean;
  provider: ProviderId;
  clearActiveSystem: () => void;
  handleSendMessage: () => void;
  setBarPosition: Dispatch<SetStateAction<BarPosition>>;
  setComponentModel: Dispatch<SetStateAction<string>>;
  setConcurrentGenerations: Dispatch<SetStateAction<number>>;
  setDesignSystemModel: Dispatch<SetStateAction<string>>;
  setIsBarHidden: Dispatch<SetStateAction<boolean>>;
  setIsDesignSystemMode: Dispatch<SetStateAction<boolean>>;
  setInputValue: Dispatch<SetStateAction<string>>;
  setIsPromptPopupOpen: Dispatch<SetStateAction<boolean>>;
  setProvider: Dispatch<SetStateAction<ProviderId>>;
  handleShowImport: () => void;
  handleShowLibrary: () => void;
}) {
  return (
    <>
      {!isBarHidden && (
        <div className={`floating-input-container bar-position-${barPosition}`}>
          {activeSystem && (
            <div className="active-context-badge" onClick={clearActiveSystem}>
              🎯 Brand: <strong>{activeSystem.name}</strong> <span className="clear-ctx">&times;</span>
            </div>
          )}
          <div className={`input-wrapper ${isLoading ? 'loading' : ''} ${isDesignSystemMode ? 'design-system-active' : ''}`}>
            <button
              className="mini-mode-toggle pin-control-btn"
              title="Bar Position"
              onClick={() => {
                const positions: BarPosition[] = ['bottom', 'left', 'right'];
                const currentIndex = positions.indexOf(barPosition);
                const nextIndex = (currentIndex + 1) % positions.length;
                setBarPosition(positions[nextIndex]);
              }}
              aria-label={`Change bar position (current: ${barPosition})`}
            >
              {barPosition === 'bottom' && <PinBottomIcon />}
              {barPosition === 'left' && <PinLeftIcon />}
              {barPosition === 'right' && <PinRightIcon />}
            </button>
            <button
              className="mini-mode-toggle"
              title="Hide Bar"
              onClick={() => setIsBarHidden(true)}
              aria-label="Hide prompt bar"
            >
              <EyeOffIcon />
            </button>
            <button
              className={`mini-mode-toggle ${isDesignSystemMode ? 'active' : ''}`}
              title="Design System Mode"
              onClick={() => setIsDesignSystemMode(!isDesignSystemMode)}
            >
              <PaletteIcon />
            </button>
            <button className="mini-mode-toggle" title="My Creative Library" onClick={handleShowLibrary}>
              <LibraryIcon />
            </button>
            <button className="mini-mode-toggle" title="Import HTML Design" onClick={handleShowImport}>
              <UploadIcon />
            </button>
            <div className="provider-select-control" title="AI Provider">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ProviderId)}
                className="provider-select"
                disabled={isLoading}
              >
                <option value="gemini">Gemini</option>
                <option value="glm">GLM</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
            <div className="generation-count-control" title="Number of concurrent generations">
              <input
                type="range"
                min="1"
                max="5"
                value={concurrentGenerations}
                onChange={(e) => setConcurrentGenerations(parseInt(e.target.value, 10))}
                className="generation-slider"
                disabled={isLoading}
              />
              <span className="generation-count-label">{concurrentGenerations}</span>
            </div>
            <div className="model-select-control" title={`Model for ${isDesignSystemMode ? 'Design System' : 'Component'} mode`}>
              <select
                value={isDesignSystemMode ? designSystemModel : componentModel}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isDesignSystemMode) {
                    setDesignSystemModel(value);
                  } else {
                    setComponentModel(value);
                  }
                }}
                className="model-select"
                disabled={isLoading}
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            {!isLoading ? (
              <button
                className="open-popup-button"
                onClick={() => setIsPromptPopupOpen(true)}
                disabled={isLoading}
                aria-label="Open prompt editor"
                title="Write prompt"
              >
                <EditIcon />
                {barPosition === 'bottom' && <span className="popup-button-label">Write Prompt</span>}
              </button>
            ) : (
              <div className="input-generating-label" aria-label="Generating">
                <ThinkingIcon />
              </div>
            )}
          </div>
        </div>
      )}
      {isBarHidden && (
        <button
          className={`bar-reveal-handle bar-position-${barPosition}`}
          onClick={() => setIsBarHidden(false)}
          aria-label="Show prompt bar"
          title="Show prompt bar"
        >
          <EyeIcon />
        </button>
      )}
      <PromptPopup
        isOpen={isPromptPopupOpen}
        value={inputValue}
        onChange={setInputValue}
        onSend={() => {
          handleSendMessage();
          setIsPromptPopupOpen(false);
        }}
        onClose={() => setIsPromptPopupOpen(false)}
        isLoading={isLoading}
        placeholder={isDesignSystemMode ? 'Describe brand architecture...' : 'Describe a UI component...'}
      />
    </>
  );
}

