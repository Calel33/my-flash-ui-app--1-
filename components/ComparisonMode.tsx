/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { ComparisonSlot } from '../types';
import { MODELS } from '../ai/providers';
import { useComparisonGeneration } from '../hooks/useComparisonGeneration';

interface ComparisonModeProps {
  slots: ComparisonSlot[];
  onAddSlot: () => void;
  onRemoveSlot: (id: string) => void;
  onUpdateSlot: (id: string, updates: Partial<ComparisonSlot>) => void;
  canAddMore: boolean;
  onExit: () => void;
}

export default function ComparisonMode({
  slots,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
  canAddMore,
  onExit,
}: ComparisonModeProps) {
  const [prompt, setPrompt] = useState('');
  const { results, generateComparison } = useComparisonGeneration();

  const handleSubmit = () => {
    if (!prompt.trim() || slots.length === 0) return;
    generateComparison(prompt, slots);
  };

  const hasResults = results.length > 0;

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  return (
    <div className="comparison-mode-container">
      <div className="comparison-mode-header">
        <h2>Comparison Mode</h2>
        <button onClick={onExit} className="mini-mode-toggle" aria-label="Exit Comparison Mode">
          ×
        </button>
      </div>

      {slots.length === 0 ? (
        <div className="comparison-empty-state">
          <p>Add providers to compare</p>
        </div>
      ) : (
        <>
          <div className="comparison-slots-wrapper">
            {slots.map((slot) => {
              const availableModels = MODELS.filter((m) => m.provider === slot.provider);

              return (
                <div key={slot.id} className="comparison-slot-card">
                  <select
                    value={slot.provider}
                    onChange={(e) =>
                      onUpdateSlot(slot.id, {
                        provider: e.target.value as 'gemini' | 'glm' | 'openrouter',
                        modelId: MODELS.find((m) => m.provider === e.target.value)?.id || '',
                      })
                    }
                    className="provider-select"
                  >
                    <option value="gemini">Gemini</option>
                    <option value="glm">GLM</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>

                  <select
                    value={slot.modelId}
                    onChange={(e) => onUpdateSlot(slot.id, { modelId: e.target.value })}
                    className="model-select"
                  >
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => onRemoveSlot(slot.id)}
                    className="mini-mode-toggle"
                    aria-label="Remove slot"
                    title="Remove slot"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div className="comparison-prompt-section">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter prompt to compare across providers..."
              className="comparison-prompt-input"
            />
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || slots.length === 0}
              className="comparison-submit-btn"
            >
              Compare
            </button>
          </div>

          {hasResults && (
            <div className="comparison-results-grid">
              {results.map((result) => (
                <div key={result.slotId} className="comparison-result-card">
                  <div className="result-header">
                    <span>{result.provider}</span>
                    <span>{result.modelId}</span>
                  </div>
                  {result.status === 'loading' && (
                    <div className="loading-spinner">Generating...</div>
                  )}
                  {result.status === 'error' && (
                    <div className="error-msg">{result.error}</div>
                  )}
                  {result.content && (
                    <div className="result-preview-wrapper">
                      <iframe
                        srcDoc={result.content}
                        className="result-preview-iframe"
                        sandbox="allow-scripts"
                        title={`Result: ${result.provider} - ${result.modelId}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {canAddMore && (
        <button onClick={onAddSlot} className="add-slot-btn">
          + Add Slot
        </button>
      )}
    </div>
  );
}
