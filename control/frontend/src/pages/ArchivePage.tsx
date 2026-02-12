import { useState } from 'react';
import { useStyleContext } from '../context/StyleContext';
import { useHistory } from '../hooks/useHistory';
import GenerationCard from '../components/HistoryPage/GenerationCard';
import HistoryLightbox from '../components/HistoryPage/HistoryLightbox';
import EmptyState from '../components/shared/EmptyState';
import { SkeletonStyleCard, SkeletonCard } from '../components/shared/Skeleton';
import { ImagePlaceholderIcon } from '../components/shared/Icons';
import type { GenerationSummary } from '../types';

export default function ArchivePage() {
  const { styles, stylesLoading } = useStyleContext();
  const { generations, loading, error, filterStyleId, setFilterStyleId, totalCount } = useHistory();

  const [lightbox, setLightbox] = useState<{
    generation: GenerationSummary;
    imageIndex: number;
  } | null>(null);

  const handleImageClick = (generation: GenerationSummary, imageIndex: number) => {
    setLightbox({ generation, imageIndex });
  };

  const handleSelectStyle = (styleId: string) => {
    setFilterStyleId(styleId);
  };

  const selectedStyle = styles.find(s => s.id === filterStyleId);

  return (
    <>
      {/* Left sidebar: style list */}
      <aside className="w-72 flex-shrink-0 bg-surface-1 border-r border-swag-border flex flex-col">
        <div className="px-3 py-3 border-b border-swag-border flex-shrink-0">
          <div className="text-xs font-bold uppercase tracking-widest text-swag-text-tertiary px-1">
            Archive
          </div>
        </div>

        <div className="flex-1 overflow-y-auto sidebar-scroll p-3">
          {stylesLoading ? (
            <div className="space-y-3">
              <SkeletonStyleCard />
              <SkeletonStyleCard />
              <SkeletonStyleCard />
            </div>
          ) : styles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-swag-text-tertiary">No styles yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {styles.map((style) => {
                const isSelected = filterStyleId === style.id;
                return (
                  <div
                    key={style.id}
                    onClick={() => handleSelectStyle(style.id)}
                    className={`style-card cursor-pointer ${isSelected ? 'style-card-selected' : ''}`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-card transition-all duration-200 ${
                      isSelected ? 'bg-swag-green' : 'bg-transparent'
                    }`} />
                    <div className="pl-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-swag-white text-sm truncate flex-1">{style.name}</h3>
                      </div>
                      {style.description && (
                        <span className="text-[10px] text-swag-text-quaternary line-clamp-2">
                          {style.description}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Right panel: generations for selected style */}
      <main className="flex-1 flex flex-col overflow-hidden bg-surface-0">
        {filterStyleId ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-swag-border flex-shrink-0">
              <div className="flex items-center gap-4">
                <h1 className="font-display text-2xl uppercase tracking-wider text-swag-white">
                  {selectedStyle?.name ?? filterStyleId}
                </h1>
                {!loading && (
                  <span className="text-xs text-swag-text-tertiary">
                    {totalCount} generation{totalCount !== 1 ? 's' : ''} · Only the most recent 100 are kept
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="grid grid-cols-1 gap-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : error ? (
                <EmptyState
                  icon={<ImagePlaceholderIcon className="w-16 h-16 text-swag-pink" />}
                  title="Failed to Load"
                  description={error}
                />
              ) : totalCount === 0 ? (
                <EmptyState
                  icon={<ImagePlaceholderIcon className="w-16 h-16 text-swag-text-quaternary" />}
                  title="No Generations Yet"
                  description="Generate some sketches with this style first, then come back here to browse your archive"
                />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {generations.map((gen, index) => (
                    <GenerationCard
                      key={gen.dirName}
                      generation={gen}
                      index={index}
                      onImageClick={(imgIndex) => handleImageClick(gen, imgIndex)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<ImagePlaceholderIcon className="w-16 h-16 text-swag-text-quaternary" />}
              title="Select a Style"
              description="Choose a style from the list to view its generation archive"
            />
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightbox && (
        <HistoryLightbox
          dirName={lightbox.generation.dirName}
          images={lightbox.generation.images}
          initialIndex={lightbox.imageIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
