import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUpIcon, SpinnerIcon, FeedbackIcon, PencilIcon } from '../shared/Icons';

interface PromptComposerProps {
  onGenerate: (input: string) => void;
  onSubmitFeedback: (feedback: string) => void;
  isGenerating: boolean;
  disabled: boolean;
  hasSketches: boolean;
}

type Mode = 'concept' | 'feedback';

export default function PromptComposer({
  onGenerate,
  onSubmitFeedback,
  isGenerating,
  disabled,
  hasSketches,
}: PromptComposerProps) {
  const [mode, setMode] = useState<Mode>('concept');
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [input]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || disabled || isGenerating) return;

    if (mode === 'concept') {
      onGenerate(input);
    } else {
      onSubmitFeedback(input);
      setInput('');
    }
  }, [input, disabled, isGenerating, mode, onGenerate, onSubmitFeedback]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const placeholder =
    mode === 'concept'
      ? 'Describe your concept sketch idea...\n\nExample: playful golf ball character with cartoonish features'
      : 'Write feedback on the generated images here. Your feedback will be applied to all future generations of the current style.\n\nExample: make the lines thicker and add more detail to the eyes';

  const buttonLabel = mode === 'concept' ? 'Generate' : 'Submit';

  return (
    <div className="flex-shrink-0 p-4">
      <div className={`prompt-composer ${disabled ? 'opacity-50' : ''}`}>
        {/* Mode tabs */}
        <div className="flex items-center px-4 pt-3 gap-1">
          <button
            onClick={() => setMode('concept')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold uppercase tracking-wider transition-all ${
              mode === 'concept'
                ? 'bg-swag-green/15 text-swag-green'
                : 'text-swag-text-quaternary hover:text-swag-text-secondary'
            }`}
          >
            <PencilIcon className="w-3.5 h-3.5" />
            New Concept
          </button>
          <button
            onClick={() => hasSketches && setMode('feedback')}
            disabled={!hasSketches}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold uppercase tracking-wider transition-all ${
              mode === 'feedback'
                ? 'bg-swag-teal/15 text-swag-teal'
                : hasSketches
                  ? 'text-swag-text-quaternary hover:text-swag-text-secondary'
                  : 'text-swag-text-quaternary/50 cursor-not-allowed'
            }`}
          >
            <FeedbackIcon className="w-3.5 h-3.5" />
            Feedback
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Select a style to begin...' : placeholder}
          disabled={disabled || isGenerating}
          className="prompt-textarea min-h-[60px]"
          rows={2}
        />

        {/* Toolbar */}
        <div className="prompt-toolbar">
          <div className="flex items-center gap-3">
            {input.length > 0 && (
              <span className="text-xs text-swag-text-quaternary">
                {input.length} chars
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1">
              <kbd className="kbd">⌘</kbd>
              <kbd className="kbd">↵</kbd>
            </div>

            <button
              onClick={handleSubmit}
              disabled={disabled || isGenerating || !input.trim()}
              className={`flex items-center gap-2 px-4 py-2 rounded-btn font-bold text-sm uppercase tracking-wider transition-all ${
                isGenerating
                  ? 'bg-swag-green/20 text-swag-green animate-pulse-glow'
                  : mode === 'concept'
                    ? 'bg-swag-green text-black hover:bg-swag-green-muted hover:shadow-glow-green active:scale-[0.97] disabled:bg-surface-4 disabled:text-swag-text-quaternary disabled:cursor-not-allowed disabled:shadow-none'
                    : 'bg-swag-teal text-black hover:bg-swag-teal/80 active:scale-[0.97] disabled:bg-surface-4 disabled:text-swag-text-quaternary disabled:cursor-not-allowed disabled:shadow-none'
              }`}
            >
              {isGenerating ? (
                <>
                  <SpinnerIcon className="w-4 h-4" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <ArrowUpIcon className="w-4 h-4" />
                  <span>{buttonLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
