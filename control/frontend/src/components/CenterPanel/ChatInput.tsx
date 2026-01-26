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
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Describe Your Concept</h2>

      <div className="flex-1 flex flex-col">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your concept sketch idea...&#10;&#10;Example: playful golf ball character with cartoonish features"
          className="flex-1 p-4 border-2 border-gray-200 rounded-lg resize-none focus:outline-none focus:border-blue-500 transition-colors"
          disabled={isGenerating}
        />

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {input.length > 0 && <span>{input.length} characters</span>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={disabled || isGenerating || !input.trim()}
            className={`
              px-6 py-3 rounded-lg font-semibold transition-all
              ${
                disabled || isGenerating || !input.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }
            `}
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
          <p className="mt-2 text-sm text-amber-600">Please select a style first</p>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Tip: Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to generate
      </div>
    </div>
  );
}
