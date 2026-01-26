// Custom hook for sketch generation

import { useState } from 'react';
import { generateSketches } from '../services/api';
import type { GenerateRequest, Sketch } from '../types';

export function useGenerate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sketches, setSketches] = useState<Sketch[]>([]);

  const generate = async (request: GenerateRequest) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateSketches(request);

      if (response.success && response.data) {
        setSketches(response.data.sketches);
      } else {
        setError(response.error?.message || 'Generation failed');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearSketches = () => {
    setSketches([]);
    setError(null);
  };

  return { generate, isGenerating, error, sketches, clearSketches };
}
