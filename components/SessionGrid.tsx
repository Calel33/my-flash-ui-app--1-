import React, { type RefObject } from 'react';

import type { Session } from '../types';

import ArtifactCard from './ArtifactCard';

type SelectorMode = 'edit' | 'extract' | false;

export default function SessionGrid({
  sessions,
  currentSessionIndex,
  focusedArtifactIndex,
  selectorMode,
  gridScrollRef,
  onFocusArtifact,
}: {
  sessions: Session[];
  currentSessionIndex: number;
  focusedArtifactIndex: number | null;
  selectorMode: SelectorMode;
  gridScrollRef: RefObject<HTMLDivElement>;
  onFocusArtifact: (artifactIndex: number) => void;
}) {
  return (
    <>
      {sessions.map((session, sIndex) => (
        <div
          key={session.id}
          className={`session-group ${sIndex === currentSessionIndex ? 'active-session' : sIndex < currentSessionIndex ? 'past-session' : 'future-session'}`}
        >
          <div className="artifact-grid" ref={sIndex === currentSessionIndex ? gridScrollRef : null}>
            {session.artifacts.map((artifact, aIndex) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                isFocused={focusedArtifactIndex === aIndex}
                isSelectorMode={!!selectorMode && focusedArtifactIndex === aIndex}
                onClick={() => onFocusArtifact(aIndex)}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

