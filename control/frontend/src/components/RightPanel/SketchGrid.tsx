import type { Sketch } from '../../types';
import SketchCard from './SketchCard';
import { SkeletonSketchCard } from '../shared/Skeleton';
import EmptyState from '../shared/EmptyState';
import { PencilIcon, ErrorCircleIcon, DownloadIcon } from '../shared/Icons';

const API_BASE_URL = 'http://localhost:3001/api';
const getImageUrl = (imagePath: string) => `${API_BASE_URL}${imagePath}`;

interface SketchGridProps {
  sketches: Sketch[];
  isGenerating: boolean;
  error: string | null;
  onImageClick: (index: number) => void;
}

export default function SketchGrid({ sketches, isGenerating, error, onImageClick }: SketchGridProps) {
  const handleDownload = async (sketch: Sketch) => {
    const imageUrl = getImageUrl(sketch.imagePath);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sketch_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleDownloadAll = async () => {
    for (const sketch of sketches) {
      await handleDownload(sketch);
    }
  };

  // Error state
  if (error) {
    return (
      <EmptyState
        icon={<ErrorCircleIcon className="w-16 h-16 text-swag-pink" />}
        title="Generation Failed"
        description={error}
      />
    );
  }

  // Loading state: skeleton grid
  if (isGenerating) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <div className="flex-1 grid grid-cols-2 gap-4 overflow-y-auto">
          <SkeletonSketchCard />
          <SkeletonSketchCard />
          <SkeletonSketchCard />
          <SkeletonSketchCard />
        </div>
        <div className="text-center py-4">
          <p className="text-swag-white font-medium animate-pulse">Generating your concept sketches...</p>
          <p className="text-xs text-swag-text-tertiary mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (sketches.length === 0) {
    return (
      <EmptyState
        icon={
          <div className="relative">
            <PencilIcon className="w-16 h-16" />
            <div className="absolute -inset-4 border-2 border-swag-text-quaternary/20 rounded-full animate-pulse" />
          </div>
        }
        title="Your Canvas Awaits"
        description="Select a style, describe your concept, and generate your first sketches"
      />
    );
  }

  // Gallery view
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      {/* Gallery header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl uppercase tracking-wider text-swag-white">
            Generated Sketches
          </h2>
          <span className="tag-green">{sketches.length}</span>
        </div>
        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-1.5 btn-ghost text-xs uppercase tracking-wider"
        >
          <DownloadIcon className="w-3.5 h-3.5" />
          Download All
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 overflow-y-auto">
        {sketches.map((sketch, index) => (
          <SketchCard
            key={sketch.id}
            sketch={sketch}
            index={index}
            onExpand={() => onImageClick(index)}
            onDownload={() => handleDownload(sketch)}
          />
        ))}
      </div>
    </div>
  );
}
