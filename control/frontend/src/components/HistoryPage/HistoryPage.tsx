import { useState } from 'react';
import { useHistory } from '../../hooks/useHistory';
import StyleGroupSection from './StyleGroupSection';
import HistoryLightbox from './HistoryLightbox';
import EmptyState from '../shared/EmptyState';
import { SkeletonCard } from '../shared/Skeleton';
import { ArrowLeftIcon, ImagePlaceholderIcon } from '../shared/Icons';
import type { GenerationSummary } from '../../types';

interface HistoryPageProps {
  onBackToWorkspace: () => void;
}

export default function HistoryPage({ onBackToWorkspace }: HistoryPageProps) {
  const { styleGroups, loading, error, totalCount } = useHistory();
  const [lightbox, setLightbox] = useState<{
    generation: GenerationSummary;
    imageIndex: number;
  } | null>(null);

  const handleImageClick = (generation: GenerationSummary, imageIndex: number) => {
    setLightbox({ generation, imageIndex });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="history-header">
          <div className="flex items-center gap-4">
            <div className="skeleton h-8 w-40 rounded" />
            <div className="skeleton h-6 w-12 rounded-tag" />
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="history-header">
          <button onClick={onBackToWorkspace} className="btn-ghost flex items-center gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Studio
          </button>
        </div>
        <EmptyState
          icon={<ImagePlaceholderIcon className="w-16 h-16 text-swag-pink" />}
          title="Failed to Load"
          description={error}
        />
      </div>
    );
  }

  // Empty state
  if (totalCount === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="history-header">
          <button onClick={onBackToWorkspace} className="btn-ghost flex items-center gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Studio
          </button>
        </div>
        <EmptyState
          icon={<ImagePlaceholderIcon className="w-16 h-16 text-swag-text-quaternary" />}
          title="No Generations Yet"
          description="Generate some sketches first, then come back here to browse your archive"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Page header */}
      <div className="history-header">
        <div className="flex items-center gap-4">
          <button onClick={onBackToWorkspace} className="btn-ghost flex items-center gap-2 -ml-3">
            <ArrowLeftIcon className="w-4 h-4" />
            Studio
          </button>
          <div className="w-px h-6 bg-swag-border" />
          <h1 className="font-display text-3xl uppercase tracking-wider text-swag-white">
            Archive
          </h1>
          <span className="tag-green">{totalCount}</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {styleGroups.map((group, i) => (
          <StyleGroupSection
            key={group.styleId}
            group={group}
            defaultExpanded={i === 0}
            onImageClick={handleImageClick}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <HistoryLightbox
          dirName={lightbox.generation.dirName}
          images={lightbox.generation.images}
          initialIndex={lightbox.imageIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
