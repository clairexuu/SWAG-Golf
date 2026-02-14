import { createContext, useContext, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { generateSketches } from '../services/api';
import type { GenerateRequest, Sketch } from '../types';

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
  error: string | null;
  sketches: Sketch[];
  generate: (request: GenerateRequest) => Promise<void>;
  cancel: () => void;
  clearSketches: () => void;
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sketches, setSketches] = useState<Sketch[]>(() => loadFromStorage());
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (request: GenerateRequest) => {
    // Abort any in-flight request
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateSketches(request, controller.signal);

      if (response.success && response.data) {
        setSketches(response.data.sketches);
        saveToStorage(response.data.sketches);
      } else {
        setError(response.error?.message || 'Generation failed');
      }
    } catch (err) {
      // Ignore abort errors — user intentionally cancelled
      if (axios.isCancel(err) || (err instanceof DOMException && err.name === 'AbortError')) {
        return;
      }
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      // Only clear generating state if this controller wasn't replaced
      if (abortControllerRef.current === controller) {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    }
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
  }, []);

  const clearSketches = useCallback(() => {
    setSketches([]);
    setError(null);
    clearStorage();
  }, []);

  return (
    <GenerationContext.Provider value={{
      isGenerating, error, sketches, generate, cancel, clearSketches,
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
