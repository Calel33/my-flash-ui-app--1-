/**
 * PromptPopup
 * Focused multi-line editor for the bottom input.
 */

import React, { useEffect, useRef } from 'react';
import { ArrowUpIcon } from './Icons';

interface PromptPopupProps {
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
  isLoading: boolean;
  placeholder: string;
}

export default function PromptPopup({
  isOpen,
  value,
  onChange,
  onSend,
  onClose,
  isLoading,
  placeholder,
}: PromptPopupProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      const length = textarea.value.length;
      if (typeof textarea.setSelectionRange === 'function') {
        // Ensure caret is placed at the end of the existing value
        requestAnimationFrame(() => {
          textarea.setSelectionRange(length, length);
        });
      } else {
        textarea.selectionStart = length;
        textarea.selectionEnd = length;
      }
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="prompt-popup-overlay" role="dialog" aria-modal="true" aria-label="Edit prompt">
      <div className="prompt-popup" onClick={e => e.stopPropagation()}>
        <div className="prompt-popup-header">
          <span className="prompt-popup-title">Expanded Prompt</span>
          <button
            type="button"
            className="prompt-popup-close"
            onClick={onClose}
            aria-label="Close prompt editor"
          >
            ×
          </button>
        </div>
        <div className="prompt-popup-body">
          <textarea
            ref={textareaRef}
            className="prompt-popup-textarea"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
          />
        </div>
        <div className="prompt-popup-footer">
          <button
            type="button"
            className="prompt-popup-send"
            onClick={onSend}
            disabled={isLoading || !value.trim()}
            aria-label="Send prompt"
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
