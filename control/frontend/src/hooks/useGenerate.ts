// Custom hook for sketch generation

import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { generateSketches } from '../services/api';
import type { GenerateRequest, Sketch } from '../types';

export function useGenerate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = async (request: GenerateRequest) => {
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
  };

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
  }, []);

  const clearSketches = () => {
    setSketches([]);
    setError(null);
  };

  return { generate, cancel, isGenerating, error, sketches, clearSketches };
}
