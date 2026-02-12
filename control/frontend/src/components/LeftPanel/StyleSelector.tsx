import { useEffect, useState } from 'react';
import { getStyles } from '../../services/api';
import type { Style } from '../../types';
import { SkeletonStyleCard } from '../shared/Skeleton';
import EmptyState from '../shared/EmptyState';
import { PlusIcon } from '../shared/Icons';

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
      <div className="space-y-3">
        <SkeletonStyleCard />
        <SkeletonStyleCard />
        <SkeletonStyleCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-swag-pink text-sm">{error}</div>
      </div>
    );
  }

  if (styles.length === 0) {
    return (
      <EmptyState
        icon={<PlusIcon className="w-12 h-12" />}
        title="No Styles Yet"
        description="Create your first style to get started"
      />
    );
  }

  return (
    <div className="space-y-2">
      {styles.map((style) => {
        const isSelected = selectedStyleId === style.id;
        const hasVisualRules =
          style.visualRules.lineWeight ||
          style.visualRules.looseness ||
          style.visualRules.complexity;

        return (
          <div
            key={style.id}
            onClick={() => onStyleSelect(style.id)}
            className={`style-card ${isSelected ? 'style-card-selected' : ''}`}
          >
            {/* Green accent bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-card transition-all duration-200 ${
                isSelected ? 'bg-swag-green' : 'bg-transparent'
              }`}
            />

            <div className="pl-2">
              {/* Header row: name + ref image count */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-swag-white text-sm">{style.name}</h3>
                {style.referenceImages.length > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-swag-text-quaternary bg-surface-3 px-2 py-0.5 rounded-tag">
                    {style.referenceImages.length} refs
                  </span>
                )}
              </div>

              {/* Description */}
              {style.description && (
                <p className="text-xs text-swag-text-secondary line-clamp-2 mb-2">
                  {style.description}
                </p>
              )}

              {/* Visual rule badges */}
              {hasVisualRules && (
                <div className="flex flex-wrap gap-1.5">
                  {style.visualRules.lineWeight && (
                    <span className="tag-green !text-[10px] !px-2 !py-0.5">
                      {style.visualRules.lineWeight}
                    </span>
                  )}
                  {style.visualRules.looseness && (
                    <span className="tag-green !text-[10px] !px-2 !py-0.5">
                      {style.visualRules.looseness}
                    </span>
                  )}
                  {style.visualRules.complexity && (
                    <span className="tag-green !text-[10px] !px-2 !py-0.5">
                      {style.visualRules.complexity}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
