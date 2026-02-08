// Main Layout - Three-panel structure

import { useState, useEffect, useRef, useCallback } from 'react';
import StyleSelector from '../LeftPanel/StyleSelector';
import StyleManager from '../LeftPanel/StyleManager';
import ChatInput from '../CenterPanel/ChatInput';
import UserFeedbackInput from '../CenterPanel/UserFeedbackInput';
import SketchGrid from '../RightPanel/SketchGrid';
import { useGenerate } from '../../hooks/useGenerate';
import { submitFeedback, summarizeFeedback } from '../../services/api';

export default function MainLayout() {
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState('');
  const [stylesVersion, setStylesVersion] = useState(0);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [hasFeedback, setHasFeedback] = useState(false);
  const { generate, isGenerating, error, sketches, clearSketches } = useGenerate();

  // Refs for beforeunload handler (needs current values without re-registering)
  const sessionIdRef = useRef(sessionId);
  const selectedStyleIdRef = useRef(selectedStyleId);
  const hasFeedbackRef = useRef(hasFeedback);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { selectedStyleIdRef.current = selectedStyleId; }, [selectedStyleId]);
  useEffect(() => { hasFeedbackRef.current = hasFeedback; }, [hasFeedback]);

  // Flush feedback on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasFeedbackRef.current && selectedStyleIdRef.current) {
        const payload = JSON.stringify({
          sessionId: sessionIdRef.current,
          styleId: selectedStyleIdRef.current,
        });
        navigator.sendBeacon(
          'http://localhost:3001/api/feedback/summarize',
          new Blob([payload], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleGenerate = (input: string) => {
    if (!selectedStyleId) return;

    setLastInput(input);
    generate({
      input,
      styleId: selectedStyleId,
      numImages: 4,
      sessionId,
    });
  };

  const handleSubmitFeedback = useCallback(async (feedback: string) => {
    if (!selectedStyleId) return;

    try {
      await submitFeedback({
        sessionId,
        styleId: selectedStyleId,
        feedback,
      });
      setHasFeedback(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  }, [sessionId, selectedStyleId]);

  const handleStyleSelect = useCallback(async (newStyleId: string) => {
    // Summarize feedback for previous style before switching
    if (hasFeedback && selectedStyleId) {
      try {
        await summarizeFeedback({ sessionId, styleId: selectedStyleId });
      } catch (err) {
        console.error('Failed to summarize feedback:', err);
      }
    }

    // Switch to new style with fresh session
    setSelectedStyleId(newStyleId);
    setSessionId(crypto.randomUUID());
    setHasFeedback(false);
    setLastInput('');
    clearSketches();
  }, [hasFeedback, selectedStyleId, sessionId, clearSketches]);

  const handleStyleChanged = () => {
    setStylesVersion((v) => v + 1);
  };

  const handleStyleDeleted = (deletedId: string) => {
    if (selectedStyleId === deletedId) {
      setSelectedStyleId(null);
      setSessionId(crypto.randomUUID());
      setHasFeedback(false);
      setLastInput('');
      clearSketches();
    }
    handleStyleChanged();
  };

  return (
    <div className="flex flex-col h-screen bg-surface-0">
      {/* Header */}
      <header className="bg-surface-0 border-b border-swag-border-subtle px-6 py-3">
        <h1 className="font-display text-2xl text-swag-green uppercase tracking-widest">
          SWAG Concept Sketch Agent
        </h1>
        <p className="text-sm text-swag-text-tertiary mt-0.5 font-body">
          AI-powered design assistant for concept sketching
        </p>
      </header>

      {/* Main three-panel layout: 1/4 style, 1/4 input, 1/2 generated images */}
      <main className="flex-1 grid grid-cols-[25%_25%_50%] gap-3 p-3 overflow-hidden">
        {/* Left Panel - StyleSelector (top) + StyleManager (bottom) */}
        <aside className="panel">
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col border-b border-swag-border pb-4 mb-4">
            <StyleSelector
              selectedStyleId={selectedStyleId}
              onStyleSelect={handleStyleSelect}
              refreshKey={stylesVersion}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <StyleManager
              selectedStyleId={selectedStyleId}
              onStyleChanged={handleStyleChanged}
              onStyleDeleted={handleStyleDeleted}
            />
          </div>
        </aside>

        {/* Center Panel - ChatInput (top) + UserFeedbackInput (bottom) */}
        <section className="panel">
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col border-b border-swag-border pb-4 mb-4">
            <ChatInput
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              disabled={!selectedStyleId}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <UserFeedbackInput
              onSubmit={handleSubmitFeedback}
              isGenerating={isGenerating}
              disabled={sketches.length === 0}
            />
          </div>
        </section>

        {/* Right Panel - SketchGrid */}
        <aside className="panel">
          <SketchGrid
            sketches={sketches}
            isGenerating={isGenerating}
            error={error}
          />
        </aside>
      </main>
    </div>
  );
}
