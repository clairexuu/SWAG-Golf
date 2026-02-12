import JSZip from 'jszip';
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
  onCancel: () => void;
}

export default function SketchGrid({ sketches, isGenerating, error, onImageClick, onCancel }: SketchGridProps) {
  const handleDownload = async (sketch: Sketch) => {
    if (!sketch.imagePath) return;
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
    const zip = new JSZip();
    await Promise.all(
      sketches.filter(s => s.imagePath).map(async (sketch, i) => {
        try {
          const response = await fetch(getImageUrl(sketch.imagePath!));
          const blob = await response.blob();
          zip.file(`sketch_${i + 1}.png`, blob);
        } catch (err) {
          console.error(`Failed to fetch sketch ${i + 1}:`, err);
        }
      })
    );
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sketches_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
        <div className="flex-1 grid grid-cols-4 gap-3 overflow-hidden justify-items-center">
          <SkeletonSketchCard />
          <SkeletonSketchCard />
          <SkeletonSketchCard />
          <SkeletonSketchCard />
        </div>
        <div className="text-center py-4">
          <p className="text-swag-white font-medium animate-pulse">Generating your concept sketches...</p>
          <p className="text-xs text-swag-text-tertiary mt-1">This may take a few moments</p>
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs uppercase tracking-wider mt-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
          >
            Cancel
          </button>
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
      <div className="flex-1 grid grid-cols-4 gap-3 overflow-hidden justify-items-center">
        {sketches.map((sketch, index) => (
          <SketchCard
            key={sketch.id}
            sketch={sketch}
            onExpand={() => onImageClick(index)}
            onDownload={() => handleDownload(sketch)}
          />
        ))}
      </div>
    </div>
  );
}
