/**
 * GLM Loading Indicator
 * Shows a subtle orbital animation when GLM is generating.
 */

import React from 'react';

interface GlmLoadingIndicatorProps {
  label?: string;
}

export default function GlmLoadingIndicator({ label = 'GLM is generating' }: GlmLoadingIndicatorProps) {
  return (
    <div className="glm-loading-indicator" aria-live="polite" aria-busy="true" role="status">
      <div className="glm-loading-orbit">
        <span className="glm-loading-dot" />
        <span className="glm-loading-dot glm-loading-dot-delay" />
        <span className="glm-loading-dot glm-loading-dot-delay-more" />
      </div>
      <div className="glm-loading-label">{label}</div>
    </div>
  );
}
