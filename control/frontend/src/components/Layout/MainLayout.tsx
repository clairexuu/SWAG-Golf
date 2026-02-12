import { useState, useEffect, useRef, useCallback } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import StyleSelector from '../LeftPanel/StyleSelector';
import StyleManager from '../LeftPanel/StyleManager';
import PromptComposer from '../CenterPanel/PromptComposer';
import SketchGrid from '../RightPanel/SketchGrid';
import Lightbox from '../RightPanel/Lightbox';
import SlideOver from '../shared/SlideOver';
import ToastContainer from '../shared/Toast';
import { useGenerate } from '../../hooks/useGenerate';
import { useSidebar } from '../../hooks/useSidebar';
import { useToast } from '../../hooks/useToast';
import { submitFeedback, summarizeFeedback, getStyles } from '../../services/api';
import type { Style, Sketch } from '../../types';

const API_BASE_URL = 'http://localhost:3001/api';
const getImageUrl = (imagePath: string) => `${API_BASE_URL}${imagePath}`;

export default function MainLayout() {
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [selectedStyleName, setSelectedStyleName] = useState<string | undefined>();
  const [, setLastInput] = useState('');
  const [stylesVersion, setStylesVersion] = useState(0);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [hasFeedback, setHasFeedback] = useState(false);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { generate, isGenerating, error, sketches, clearSketches } = useGenerate();
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebar();
  const toast = useToast();

  // Refs for beforeunload handler
  const sessionIdRef = useRef(sessionId);
  const selectedStyleIdRef = useRef(selectedStyleId);
  const hasFeedbackRef = useRef(hasFeedback);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { selectedStyleIdRef.current = selectedStyleId; }, [selectedStyleId]);
  useEffect(() => { hasFeedbackRef.current = hasFeedback; }, [hasFeedback]);

  // Fetch style name when style changes
  useEffect(() => {
    if (!selectedStyleId) {
      setSelectedStyleName(undefined);
      return;
    }
    getStyles().then(styles => {
      const style = styles.find((s: Style) => s.id === selectedStyleId);
      setSelectedStyleName(style?.name);
    }).catch(() => {});
  }, [selectedStyleId, stylesVersion]);

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

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B: toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      // Escape: close lightbox, then slide-over
      if (e.key === 'Escape') {
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
        } else if (slideOverOpen) {
          setSlideOverOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar, lightboxIndex, slideOverOpen]);

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

  const handleDownloadSketch = async (sketch: Sketch) => {
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
    <div className="flex flex-col h-screen bg-surface-0">
      {/* Toast notifications */}
      <ToastContainer />

      {/* Header */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        isGenerating={isGenerating}
        selectedStyleName={selectedStyleName}
      />

      {/* Main area: Sidebar + Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onManageStyles={() => setSlideOverOpen(true)}
        >
          <StyleSelector
            selectedStyleId={selectedStyleId}
            onStyleSelect={handleStyleSelect}
            refreshKey={stylesVersion}
          />
        </Sidebar>

        {/* Main workspace */}
        <main className="flex-1 flex flex-col overflow-hidden bg-surface-0">
          {/* Sketch gallery */}
          <SketchGrid
            sketches={sketches}
            isGenerating={isGenerating}
            error={error}
            onImageClick={(index) => setLightboxIndex(index)}
          />

          {/* Prompt composer */}
          <PromptComposer
            onGenerate={handleGenerate}
            onSubmitFeedback={handleSubmitFeedback}
            isGenerating={isGenerating}
            disabled={!selectedStyleId}
            hasSketches={sketches.length > 0}
          />
        </main>
      </div>

      {/* Slide-over: Style Manager */}
      {slideOverOpen && (
        <>
          <div className="overlay-backdrop" onClick={() => setSlideOverOpen(false)} />
          <SlideOver onClose={() => setSlideOverOpen(false)} title="Manage Styles">
            <StyleManager
              selectedStyleId={selectedStyleId}
              onStyleChanged={handleStyleChanged}
              onStyleDeleted={handleStyleDeleted}
              onClose={() => setSlideOverOpen(false)}
            />
          </SlideOver>
        </>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && sketches.length > 0 && (
        <Lightbox
          sketches={sketches}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDownload={handleDownloadSketch}
        />
      )}
    </div>
  );
}
