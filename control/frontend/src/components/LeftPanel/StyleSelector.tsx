// Left Panel - Style Selector Component

import { useEffect, useState } from 'react';
import { getStyles } from '../../services/api';
import type { Style } from '../../types';

interface StyleSelectorProps {
  selectedStyleId: string | null;
  onStyleSelect: (styleId: string) => void;
  experimentalMode: boolean;
  onExperimentalToggle: (enabled: boolean) => void;
}

export default function StyleSelector({
  selectedStyleId,
  onStyleSelect,
  experimentalMode,
  onExperimentalToggle,
}: StyleSelectorProps) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStyles() {
      try {
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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading styles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Select Style</h2>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {styles.map((style) => (
          <div
            key={style.id}
            onClick={() => onStyleSelect(style.id)}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${
                selectedStyleId === style.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start">
              <input
                type="radio"
                checked={selectedStyleId === style.id}
                onChange={() => onStyleSelect(style.id)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{style.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{style.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={experimentalMode}
            onChange={(e) => onExperimentalToggle(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Experimental Mode</span>
        </label>
      </div>
    </div>
  );
}
