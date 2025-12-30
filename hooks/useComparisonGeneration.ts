/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { streamHtmlArtifact } from '../ai/generate';
import type { ComparisonSlot, ComparisonResult } from '../types';

const GENERATION_TIMEOUT_MS = 15000; // 15 seconds

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
        const timeoutId = setTimeout(() => {
          setResults(prev => prev.map(r =>
            r.slotId === slot.id && r.status === 'loading'
              ? { 
                  ...r, 
                  status: 'error', 
                  error: 'Generation timeout: No response within 15 seconds' 
                }
              : r
          ));
        }, GENERATION_TIMEOUT_MS);

        try {
          const stream = streamHtmlArtifact({
            provider: slot.provider,
            modelId: slot.modelId,
            prompt,
          });

          let content = '';
          let hasReceivedData = false;

          for await (const chunk of stream) {
            hasReceivedData = true;
            clearTimeout(timeoutId); // Clear timeout once we start receiving data
            content += chunk;
            setResults(prev => prev.map(r =>
              r.slotId === slot.id
                ? { ...r, content, status: 'loading' }
                : r
            ));
          }

          clearTimeout(timeoutId);

          // Check if we actually received content
          if (!hasReceivedData || content.trim() === '') {
            throw new Error('Empty response from provider');
          }

          // Mark as success once streaming completes
          setResults(prev => prev.map(r =>
            r.slotId === slot.id
              ? { ...r, status: 'success' }
              : r
          ));
        } catch (error) {
          clearTimeout(timeoutId);
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
