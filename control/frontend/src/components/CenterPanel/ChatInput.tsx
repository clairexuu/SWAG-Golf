// Center Panel - Chat Input Component

import { useState } from 'react';

interface ChatInputProps {
  onGenerate: (input: string) => void;
  isGenerating: boolean;
  disabled: boolean;
}

export default function ChatInput({ onGenerate, isGenerating, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim() && !disabled && !isGenerating) {
      onGenerate(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="panel-heading">Describe Your Concept</h2>

      <div className="flex-1 flex flex-col">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your concept sketch idea...&#10;&#10;Example: playful golf ball character with cartoonish features"
          className="flex-1 input-dark resize-none"
          disabled={isGenerating}
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-swag-text-tertiary">
            {input.length > 0 && <span>{input.length} characters</span>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={disabled || isGenerating || !input.trim()}
            className="btn-primary"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Sketches'
            )}
          </button>
        </div>

        {disabled && !isGenerating && (
          <p className="mt-2 text-sm text-swag-pink">Please select a style first</p>
        )}
      </div>

    </div>
  );
}
