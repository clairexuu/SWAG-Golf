// Left Panel - Style Selector Component

import { useEffect, useState } from 'react';
import { getStyles } from '../../services/api';
import type { Style } from '../../types';

interface StyleSelectorProps {
  selectedStyleId: string | null;
  onStyleSelect: (styleId: string) => void;
  refreshKey?: number;
}

export default function StyleSelector({
  selectedStyleId,
  onStyleSelect,
  refreshKey = 0,
}: StyleSelectorProps) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStyles() {
      try {
        setLoading(true);
        const fetchedStyles = await getStyles();
        setStyles(fetchedStyles);
      } catch (err) {
        console.error('Failed to fetch styles:', err);
        setError('Failed to load styles');
      } finally {
        setLoading(false);
      }
    }

    fetchStyles();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-swag-text-tertiary">Loading styles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-swag-pink">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="panel-heading">Select Style</h2>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {styles.map((style) => (
          <div
            key={style.id}
            onClick={() => onStyleSelect(style.id)}
            className={`
              p-3 border cursor-pointer transition-all
              ${
                selectedStyleId === style.id
                  ? 'border-swag-green bg-swag-green/10'
                  : 'border-swag-border bg-surface-2 hover:border-swag-border-strong'
              }
            `}
          >
            <div className="flex items-start">
              <input
                type="radio"
                checked={selectedStyleId === style.id}
                onChange={() => onStyleSelect(style.id)}
                className="mt-1 mr-3 accent-swag-green"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-swag-white">{style.name}</h3>
                <p className="text-sm text-swag-text-secondary mt-1">{style.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
