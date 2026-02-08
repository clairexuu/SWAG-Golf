// Center Panel - User Feedback Input Component

import { useState } from 'react';

interface UserFeedbackInputProps {
  onSubmit: (feedback: string) => void;
  isGenerating: boolean;
  disabled: boolean;
}

export default function UserFeedbackInput({
  onSubmit,
  isGenerating,
  disabled,
}: UserFeedbackInputProps) {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (feedback.trim() && !isGenerating) {
      onSubmit(feedback);
      setFeedback('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="panel-heading">Feedback</h2>

      {disabled ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-swag-text-quaternary">
            Generate sketches first to provide feedback
          </p>
        </div>
      ) : (
        <>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe your feedback on the generated sketches..."
            className="flex-1 input-dark resize-none text-sm"
            disabled={isGenerating}
          />

          <div className="mt-3">
            <button
              onClick={handleSubmit}
              disabled={isGenerating || !feedback.trim()}
              className="w-full btn-primary text-sm"
            >
              Submit Feedback
            </button>
          </div>
        </>
      )}
    </div>
  );
}
