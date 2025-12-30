import React from 'react';

import { PaletteIcon, SparklesIcon } from './Icons';

export default function EmptyState({
  hasStarted,
  isDesignSystemMode,
  isLoading,
  onToggleMode,
  onSurpriseMe,
}: {
  hasStarted: boolean;
  isDesignSystemMode: boolean;
  isLoading: boolean;
  onToggleMode: () => void;
  onSurpriseMe: () => void;
}) {
  return (
    <div className={`empty-state ${hasStarted ? 'fade-out' : ''}`}>
      <div className="empty-content">
        <h1>Flash UI</h1>
        <p>Creative UI generation in a flash</p>
        <div className="empty-actions">
          <button
            className={`mode-toggle ${isDesignSystemMode ? 'active' : ''}`}
            onClick={onToggleMode}
          >
            <PaletteIcon /> {isDesignSystemMode ? 'Design System Mode' : 'Component Mode'}
          </button>
          <button className="surprise-button" onClick={onSurpriseMe} disabled={isLoading}>
            <SparklesIcon /> Surprise Me
          </button>
        </div>
      </div>
    </div>
  );
}

