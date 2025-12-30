import { useCallback, type Dispatch, type SetStateAction } from 'react';

import { cleanCodeFences, generateStyles, streamHtmlArtifact } from '../ai/generate';
import type { ProviderId } from '../ai/providers';
import type { Artifact, LibraryItem, Session } from '../types';
import { generateId } from '../utils';

export function useArtifactGeneration(options: {
  inputValue: string;
  isLoading: boolean;
  isDesignSystemMode: boolean;
  activeSystem: LibraryItem | null;
  concurrentGenerations: number;
  designSystemModel: string;
  componentModel: string;
  provider: ProviderId;
  setInputValue: Dispatch<SetStateAction<string>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setSessions: Dispatch<SetStateAction<Session[]>>;
  setFocusedArtifactIndex: Dispatch<SetStateAction<number | null>>;
}) {
  const {
    inputValue,
    isLoading,
    isDesignSystemMode,
    activeSystem,
    concurrentGenerations,
    designSystemModel,
    componentModel,
    provider,
    setInputValue,
    setIsLoading,
    setSessions,
    setFocusedArtifactIndex,
  } = options;

  const handleSendMessage = useCallback(
    async (manualPrompt?: string) => {
      const promptToUse = manualPrompt || inputValue;
      const trimmedInput = promptToUse.trim();
      if (!trimmedInput || isLoading) return;
      if (!manualPrompt) setInputValue('');

      setIsLoading(true);
      const sessionId = generateId();
      const placeholderArtifacts: Artifact[] = Array(concurrentGenerations)
        .fill(null)
        .map((_, i) => ({
          id: `${sessionId}_${i}`,
          styleName: 'Designing...',
          html: '',
          status: 'streaming',
          isDesignSystem: isDesignSystemMode,
        }));

      const newSession: Session = {
        id: sessionId,
        prompt: trimmedInput,
        timestamp: Date.now(),
        artifacts: placeholderArtifacts,
      };

      setSessions((prev) => [...prev, newSession]);
      setFocusedArtifactIndex(null);

      try {
        let generatedStyles: string[] = [];
        try {
          // Generate style directions using the facade
          generatedStyles = await generateStyles({
            provider: provider,
            prompt: trimmedInput,
            isDesignSystemMode,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to generate styles';
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    artifacts: s.artifacts.map((art) => ({
                      ...art,
                      status: 'error',
                      errorMessage,
                    })),
                  }
                : s,
            ),
          );
          throw error;
        }

        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  artifacts: s.artifacts.map((art, i) => ({
                    ...art,
                    styleName: generatedStyles[i] || `Direction ${i + 1}`,
                  })),
                }
              : s,
          ),
        );

        const systemInstructions = isDesignSystemMode
          ? `You are a Lead Design Systems Architect. Create a FULL DESIGN SYSTEM style guide and component library for: "${trimmedInput}".`
          : activeSystem
            ? `You are a frontend developer. Create a UI component for: "${trimmedInput}". 
                   CRITICAL: You MUST adhere to the following Design System tokens and CSS variables to ensure brand consistency:
                   ${activeSystem.html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || "No style context found. Use professional standards."}
                   Ensure the component looks like it belongs to this brand and uses the provided variables (colors, spacing, typography).`
            : `Create a stunning high-fidelity UI component for: "${trimmedInput}".`;

        const generateArtifact = async (artifact: Artifact, style: string) => {
          const finalPrompt = systemInstructions + `\n\nDirection: ${style}. Return RAW HTML only.`;

          try {
            setSessions((prev) =>
              prev.map((sess) =>
                sess.id === sessionId
                  ? {
                      ...sess,
                      artifacts: sess.artifacts.map((art) =>
                        art.id === artifact.id ? { ...art, agentPrompt: finalPrompt } : art,
                      ),
                    }
                  : sess,
              ),
            );

            const stream = streamHtmlArtifact({
              provider: provider,
              prompt: finalPrompt,
              modelId: isDesignSystemMode ? designSystemModel : componentModel,
              useThinking: isDesignSystemMode,
            });

            let accumulated = '';
            for await (const chunk of stream) {
              accumulated += chunk;
              setSessions((prev) =>
                prev.map((sess) =>
                  sess.id === sessionId
                    ? {
                        ...sess,
                        artifacts: sess.artifacts.map((art) =>
                          art.id === artifact.id ? { ...art, html: accumulated } : art,
                        ),
                      }
                    : sess,
                ),
              );
            }
            const final = cleanCodeFences(accumulated);
            setSessions((prev) =>
              prev.map((sess) =>
                sess.id === sessionId
                  ? {
                      ...sess,
                      artifacts: sess.artifacts.map((art) =>
                        art.id === artifact.id
                          ? { ...art, html: final, status: 'complete', errorMessage: undefined }
                          : art,
                      ),
                    }
                  : sess,
              ),
            );
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate artifact';
            setSessions((prev) =>
              prev.map((sess) =>
                sess.id === sessionId
                  ? {
                      ...sess,
                      artifacts: sess.artifacts.map((art) =>
                        art.id === artifact.id
                          ? { ...art, html: '', status: 'error', errorMessage }
                          : art,
                      ),
                    }
                  : sess,
              ),
            );
          }
        };

        await Promise.all(
          placeholderArtifacts.map(async (art, i) => {
            try {
              await generateArtifact(art, generatedStyles[i]);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to generate artifact';
              setSessions((prev) =>
                prev.map((sess) =>
                  sess.id === sessionId
                    ? {
                        ...sess,
                        artifacts: sess.artifacts.map((a) =>
                          a.id === art.id ? { ...a, status: 'error', errorMessage, html: '' } : a,
                        ),
                      }
                    : sess,
                ),
              );
            }
          }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      inputValue,
      isLoading,
      isDesignSystemMode,
      activeSystem,
      concurrentGenerations,
      designSystemModel,
      componentModel,
      provider,
      setInputValue,
      setIsLoading,
      setSessions,
      setFocusedArtifactIndex,
    ],
  );

  return { handleSendMessage };
}
