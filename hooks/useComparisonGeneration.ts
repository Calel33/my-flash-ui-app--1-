/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { streamHtmlArtifact } from '../ai/generate';
import type { ComparisonSlot, ComparisonResult } from '../types';

export function useComparisonGeneration() {
  const [results, setResults] = useState<ComparisonResult[]>([]);

  const generateComparison = useCallback(async (
    prompt: string,
    slots: ComparisonSlot[]
  ) => {
    // Initialize results with loading state
    const initialResults: ComparisonResult[] = slots.map(slot => ({
      slotId: slot.id,
      status: 'loading',
      content: '',
      provider: slot.provider,
      modelId: slot.modelId,
    }));
    setResults(initialResults);

    // Kick off parallel streams (Promise.allSettled to prevent one failure blocking others)
    await Promise.allSettled(
      slots.map(async (slot) => {
        try {
          const stream = streamHtmlArtifact({
            provider: slot.provider,
            modelId: slot.modelId,
            prompt,
          });

          let content = '';
          for await (const chunk of stream) {
            content += chunk;
            setResults(prev => prev.map(r =>
              r.slotId === slot.id
                ? { ...r, content, status: 'loading' }
                : r
            ));
          }

          // Mark as success once streaming completes
          setResults(prev => prev.map(r =>
            r.slotId === slot.id
              ? { ...r, status: 'success' }
              : r
          ));
        } catch (error) {
          // Capture error without blocking other slots
          setResults(prev => prev.map(r =>
            r.slotId === slot.id
              ? { 
                  ...r, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : 'Generation failed' 
                }
              : r
          ));
        }
      })
    );
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return { 
    results, 
    generateComparison,
    clearResults,
  };
}
