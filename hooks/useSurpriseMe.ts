import { useCallback, useState } from 'react';

import { INITIAL_PLACEHOLDERS } from '../constants';

export function useSurpriseMe(options: {
  setInputValue: (value: string) => void;
  handleSendMessage: (manualPrompt?: string) => void;
  initialPlaceholders?: string[];
}) {
  const { setInputValue, handleSendMessage, initialPlaceholders } = options;

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholders, setPlaceholders] = useState<string[]>(initialPlaceholders ?? INITIAL_PLACEHOLDERS);

  const handleSurpriseMe = useCallback(() => {
    const p = placeholders[placeholderIndex];
    setInputValue(p);
    handleSendMessage(p);
  }, [handleSendMessage, placeholderIndex, placeholders, setInputValue]);

  return { handleSurpriseMe, placeholderIndex, placeholders, setPlaceholderIndex, setPlaceholders };
}
