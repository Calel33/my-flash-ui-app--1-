/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ComparisonModeProps {
  onExit: () => void;
}

export default function ComparisonMode({ onExit }: ComparisonModeProps) {
  return (
    <div className="comparison-mode-container">
      <div className="comparison-mode-header">
        <h2>Comparison Mode</h2>
        <button onClick={onExit} className="mini-mode-toggle" aria-label="Exit Comparison Mode">
          ×
        </button>
      </div>
      <div className="comparison-empty-state">
        <p>Add providers to compare</p>
      </div>
    </div>
  );
}
