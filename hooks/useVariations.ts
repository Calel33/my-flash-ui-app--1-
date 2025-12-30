import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

import { streamVariations } from '../ai/generate';
import type { ProviderId } from '../ai/providers';
import type { ComponentVariation, Session } from '../types';

import type { DrawerState } from './useDrawer';

type OpenDrawer = (next: Omit<DrawerState, 'isOpen'> & { isOpen?: boolean }) => void;

export function extractVariationsFromBuffer(buffer: string): {
  buffer: string;
  variations: ComponentVariation[];
} {
  const variations: ComponentVariation[] = [];

  let braceCount = 0;
  let start = buffer.indexOf('{');
  while (start !== -1) {
    braceCount = 0;
    let end = -1;

    for (let i = start; i < buffer.length; i++) {
      if (buffer[i] === '{') braceCount++;
      else if (buffer[i] === '}') braceCount--;
      if (braceCount === 0 && i > start) {
        end = i;
        break;
      }
    }

    if (end === -1) break;

    const jsonString = buffer.substring(start, end + 1);
    try {
      const variation = JSON.parse(jsonString);
      if (variation?.name && variation?.html) {
        variations.push(variation);
      }
      buffer = buffer.substring(end + 1);
      start = buffer.indexOf('{');
    } catch {
      start = buffer.indexOf('{', start + 1);
    }
  }

  return { buffer, variations };
}

export function useVariations(options: {
  sessions: Session[];
  currentSessionIndex: number;
  focusedArtifactIndex: number | null;
  provider: ProviderId;
  openDrawer: OpenDrawer;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}) {
  const {
    sessions,
    currentSessionIndex,
    focusedArtifactIndex,
    provider,
    openDrawer,
    setIsLoading,
  } = options;

  const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);

  const handleGenerateVariations = useCallback(async () => {
    const currentSession = sessions[currentSessionIndex];
    if (!currentSession || focusedArtifactIndex === null) return;
    const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

    setIsLoading(true);
    setComponentVariations([]);
    openDrawer({ mode: 'variations', title: 'Variations', data: currentArtifact.id });

    try {
      const stream = streamVariations({
        provider,
        prompt: currentSession.prompt,
      });

      let buffer = '';
      for await (const chunk of stream) {
        buffer += chunk;
        const parsed = extractVariationsFromBuffer(buffer);
        buffer = parsed.buffer;
        if (parsed.variations.length > 0) {
          setComponentVariations((prev) => [...prev, ...parsed.variations]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessions, currentSessionIndex, focusedArtifactIndex, provider, openDrawer, setIsLoading]);

  return { componentVariations, handleGenerateVariations };
}

