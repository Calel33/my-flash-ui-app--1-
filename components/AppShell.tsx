import React from 'react';

import DottedGlowBackground from './DottedGlowBackground';

export default function AppShell({
  isArtifactFullscreen,
  children,
}: {
  isArtifactFullscreen: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`immersive-app ${isArtifactFullscreen ? 'fullscreen-artifact' : ''}`}>
      <DottedGlowBackground
        gap={24}
        radius={1.5}
        color="rgba(255, 255, 255, 0.02)"
        glowColor="rgba(255, 255, 255, 0.15)"
        speedScale={0.5}
      />
      {children}
    </div>
  );
}

