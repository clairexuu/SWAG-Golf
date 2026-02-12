import { useState, useEffect, useCallback, useMemo } from 'react';
import { getGenerations } from '../services/api';
import type { GenerationSummary, StyleGroup } from '../types';

export function useHistory() {
  const [generations, setGenerations] = useState<GenerationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStyleId, setFilterStyleId] = useState<string | null>(null);

  const fetchGenerations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getGenerations(filterStyleId || undefined);
      if (response.success) {
        setGenerations(response.generations);
      } else {
        setError('Failed to load history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [filterStyleId]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const styleGroups: StyleGroup[] = useMemo(() => {
    const groupMap = new Map<string, StyleGroup>();

    for (const gen of generations) {
      const key = gen.style.id;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          styleId: key,
          styleName: gen.style.name,
          generations: [],
          totalImages: 0,
        });
      }
      const group = groupMap.get(key)!;
      group.generations.push(gen);
      group.totalImages += gen.imageCount;
    }

    return Array.from(groupMap.values()).sort(
      (a, b) => b.generations.length - a.generations.length
    );
  }, [generations]);

  return {
    generations,
    styleGroups,
    loading,
    error,
    filterStyleId,
    setFilterStyleId,
    refresh: fetchGenerations,
    totalCount: generations.length,
  };
}
