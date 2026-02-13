import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import StyleSelector from '../components/LeftPanel/StyleSelector';
import PromptComposer from '../components/CenterPanel/PromptComposer';
import SketchGrid from '../components/RightPanel/SketchGrid';
import Lightbox from '../components/RightPanel/Lightbox';
import { useGenerate } from '../hooks/useGenerate';
import { useSidebar } from '../hooks/useSidebar';
import { useToast } from '../hooks/useToast';
import { useStyleContext } from '../context/StyleContext';
import { submitFeedback, summarizeFeedback } from '../services/api';
import { SidebarCollapseIcon } from '../components/shared/Icons';
import type { Sketch } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';
const getImageUrl = (imagePath: string) => `${API_BASE_URL}${imagePath}`;

export default function StudioPage() {
  const { selectedStyleId, selectStyle } = useStyleContext();
  const { generate, cancel, isGenerating, error, sketches, clearSketches } = useGenerate();
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebar();
  const toast = useToast();

  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [hasFeedback, setHasFeedback] = useState(false);
  const [, setLastInput] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Refs for beforeunload / unmount flush
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

  // Also flush feedback when navigating away (component unmount)
  useEffect(() => {
    return () => {
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
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.key === 'Escape' && lightboxIndex !== null) {
        setLightboxIndex(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar, lightboxIndex]);

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
      toast.success('Feedback submitted');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      toast.error('Failed to submit feedback');
    }
  }, [sessionId, selectedStyleId, toast]);

  const handleStyleSelect = useCallback(async (newStyleId: string) => {
    if (hasFeedback && selectedStyleId) {
      try {
        await summarizeFeedback({ sessionId, styleId: selectedStyleId });
      } catch (err) {
        console.error('Failed to summarize feedback:', err);
      }
    }

    selectStyle(newStyleId);
    setSessionId(crypto.randomUUID());
    setHasFeedback(false);
    setLastInput('');
    clearSketches();
  }, [hasFeedback, selectedStyleId, sessionId, clearSketches, selectStyle]);

  const handleDownloadSketch = async (sketch: Sketch) => {
    if (!sketch.imagePath) return;
    const imageUrl = getImageUrl(sketch.imagePath);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sketch_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Sketch downloaded');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Download failed');
    }
  };

  return (
    <>
      <Sidebar collapsed={sidebarCollapsed}>
        <StyleSelector
          selectedStyleId={selectedStyleId}
          onStyleSelect={handleStyleSelect}
        />
      </Sidebar>

      <main className="flex-1 flex flex-col overflow-hidden bg-surface-0">
        {/* Studio toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-swag-border flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="btn-icon"
            title={sidebarCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
          >
            <SidebarCollapseIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isGenerating ? 'bg-swag-green animate-pulse' : 'bg-swag-text-quaternary'
              }`}
            />
            <span className="text-xs text-swag-text-tertiary">
              {isGenerating ? 'Generating...' : 'Ready'}
            </span>
          </div>

          <div className="flex-1" />

          <div className="hidden lg:flex items-center gap-1">
            <kbd className="kbd">⌘</kbd>
            <kbd className="kbd">↵</kbd>
            <span className="text-xs text-swag-text-quaternary ml-1">Generate</span>
          </div>
        </div>

        <SketchGrid
          sketches={sketches}
          isGenerating={isGenerating}
          error={error}
          onImageClick={(index) => setLightboxIndex(index)}
          onCancel={cancel}
        />
        <PromptComposer
          onGenerate={handleGenerate}
          onSubmitFeedback={handleSubmitFeedback}
          isGenerating={isGenerating}
          disabled={!selectedStyleId}
          hasSketches={sketches.length > 0}
        />
      </main>

      {lightboxIndex !== null && sketches.length > 0 && (
        <Lightbox
          sketches={sketches}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDownload={handleDownloadSketch}
        />
      )}
    </>
  );
}
