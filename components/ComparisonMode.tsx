/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { ComparisonSlot } from '../types';
import { MODELS } from '../ai/providers';

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
      )}

      {canAddMore && (
        <button onClick={onAddSlot} className="add-slot-btn">
          + Add Slot
        </button>
      )}
    </div>
  );
}
