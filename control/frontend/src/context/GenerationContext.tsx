import { createContext, useContext, useState, useRef, useCallback } from 'react';
import { generateSketchesStream, refineSketchesStream, confirmGeneration } from '../services/api';
import type { GenerateRequest, RefineRequest, Sketch } from '../types';

const STORAGE_KEY = 'swag_sketches';

function saveToStorage(sketches: Sketch[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sketches));
  } catch { /* quota exceeded or unavailable */ }
}

function loadFromStorage(): Sketch[] {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function clearStorage() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* unavailable */ }
}

interface GenerationContextValue {
  isGenerating: boolean;
  isRestarting: boolean;
  serverBusy: boolean;
  refiningIndices: Set<number>;
  error: string | null;
  errorCode: string | null;
  sketches: Sketch[];
  generate: (request: GenerateRequest) => Promise<void>;
  refine: (request: RefineRequest, selectedIndices: number[]) => Promise<void>;
  cancel: () => void;
  clearSketches: () => void;
  retry: () => Promise<void>;
  restartAndRetry: () => Promise<void>;
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [serverBusy, setServerBusy] = useState(false);
  const [refiningIndices, setRefiningIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [sketches, setSketches] = useState<Sketch[]>(() => loadFromStorage());
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<
    | { type: 'generate'; request: GenerateRequest }
    | { type: 'refine'; request: RefineRequest; indices: number[] }
    | null
  >(null);

  const generate = useCallback(async (request: GenerateRequest) => {
    // Abort any in-flight request
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    lastRequestRef.current = { type: 'generate', request };
    setIsGenerating(true);
    setServerBusy(false);
    setRefiningIndices(new Set());
    setError(null);
    setErrorCode(null);

    // Initialize placeholder sketches for progressive display
    const numImages = request.numImages || 4;
    const placeholders: Sketch[] = Array.from({ length: numImages }, (_, i) => ({
      id: `pending_${i}`,
      imagePath: null,
      resolution: [1024, 1024] as [number, number],
      metadata: {
        promptSpec: { intent: '', refinedIntent: '', negativeConstraints: [] },
        referenceImages: [],
        retrievalScores: [],
      },
    }));
    setSketches(placeholders);

    try {
      await generateSketchesStream(
        request,
        {
          onProgress: (stage) => {
            if (stage === 'retry') {
              setServerBusy(true);
            }
          },
          onImage: (index, sketch) => {
            setSketches(prev => {
              const next = [...prev];
              next[index] = sketch;
              return next;
            });
          },
          onComplete: () => {
            // Persist to storage and confirm for archive
            setSketches(prev => {
              saveToStorage(prev);
              const firstPath = prev.find(s => s.imagePath)?.imagePath;
              if (firstPath) {
                const dirName = firstPath.split('/')[2];
                confirmGeneration(dirName).catch(() => {});
              }
              return prev;
            });
          },
          onError: (message) => {
            // Only set global error if no successful images have been received yet.
            // Per-image failures are shown inline via the sketch.error field.
            setSketches(prev => {
              const hasAnyImage = prev.some(s => s.imagePath !== null);
              if (!hasAnyImage) {
                setError(message);
                setErrorCode('GENERATION_ERROR');
              }
              return prev;
            });
          },
        },
        controller.signal
      );
    } catch (err) {
      // Ignore abort errors — user intentionally cancelled
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error('Generation error:', err);
      setError('Something went wrong. Please try again.');
      setErrorCode(null);
    } finally {
      // Only clear generating state if this controller wasn't replaced
      if (abortControllerRef.current === controller) {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    }
  }, []);

  const refine = useCallback(async (request: RefineRequest, selectedIndices: number[]) => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    lastRequestRef.current = { type: 'refine', request, indices: selectedIndices };
    setIsGenerating(true);
    setServerBusy(false);
    setRefiningIndices(new Set(selectedIndices));
    setError(null);
    setErrorCode(null);

    try {
      await refineSketchesStream(
        request,
        {
          onProgress: (stage) => {
            if (stage === 'retry') {
              setServerBusy(true);
            }
          },
          onImage: (index, sketch) => {
            // Map streaming index back to the original grid position
            const gridIndex = selectedIndices[index];
            if (gridIndex != null) {
              setSketches(prev => {
                const next = [...prev];
                next[gridIndex] = sketch;
                return next;
              });
              setRefiningIndices(prev => {
                const next = new Set(prev);
                next.delete(gridIndex);
                return next;
              });
            }
          },
          onComplete: () => {
            setSketches(prev => {
              saveToStorage(prev);
              const firstPath = prev.find(s => s.imagePath)?.imagePath;
              if (firstPath) {
                const dirName = firstPath.split('/')[2];
                confirmGeneration(dirName).catch(() => {});
              }
              return prev;
            });
          },
          onError: (message) => {
            setSketches(prev => {
              const hasAnyImage = prev.some(s => s.imagePath !== null);
              if (!hasAnyImage) {
                setError(message);
                setErrorCode('REFINE_ERROR');
              }
              return prev;
            });
          },
        },
        controller.signal
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error('Refine error:', err);
      setError('Something went wrong. Please try again.');
      setErrorCode(null);
    } finally {
      if (abortControllerRef.current === controller) {
        setIsGenerating(false);
        setRefiningIndices(new Set());
        abortControllerRef.current = null;
      }
    }
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
    setRefiningIndices(new Set());
    setErrorCode(null);
  }, []);

  const clearSketches = useCallback(() => {
    setSketches([]);
    setError(null);
    setErrorCode(null);
    clearStorage();
  }, []);

  const retry = useCallback(async () => {
    const last = lastRequestRef.current;
    if (!last) return;
    if (last.type === 'generate') {
      await generate(last.request);
    } else {
      await refine(last.request, last.indices);
    }
  }, [generate, refine]);

  const restartAndRetry = useCallback(async () => {
    setIsRestarting(true);
    setError(null);
    setErrorCode(null);

    try {
      const electronAPI = (window as any).electronAPI;

      if (!electronAPI?.restartBackend) {
        setError('Please restart the application to restore the generation service.');
        setErrorCode('NO_ELECTRON');
        return;
      }

      const result = await electronAPI.restartBackend();

      if (result.success) {
        setIsRestarting(false);
        await retry();
        return;
      }

      setError(`Unable to restart the generation service. Please restart the application.`);
      setErrorCode('RESTART_FAILED');
    } catch (err) {
      console.error('Restart failed:', err);
      setError('Unable to restart the generation service. Please restart the application.');
      setErrorCode('RESTART_FAILED');
    } finally {
      setIsRestarting(false);
    }
  }, [retry]);

  return (
    <GenerationContext.Provider value={{
      isGenerating, isRestarting, serverBusy, refiningIndices, error, errorCode, sketches,
      generate, refine, cancel, clearSketches, retry, restartAndRetry,
    }}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGenerationContext() {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error('useGenerationContext must be used within GenerationProvider');
  return ctx;
}
