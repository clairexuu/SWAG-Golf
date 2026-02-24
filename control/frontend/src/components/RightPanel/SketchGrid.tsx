import { useState, useEffect } from 'react';
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
  isRestarting?: boolean;
  serverBusy?: boolean;
  refiningIndices?: Set<number>;
  error: string | null;
  errorCode?: string | null;
  onImageClick: (index: number) => void;
  onCancel: () => void;
  onRetry?: () => void;
  onRestart?: () => void;
  selectionMode?: boolean;
  selectedIndices?: Set<number>;
  onToggleSelect?: (index: number) => void;
}

export default function SketchGrid({ sketches, isGenerating, isRestarting, serverBusy, refiningIndices, error, errorCode, onImageClick, onCancel, onRetry, onRestart, selectionMode, selectedIndices, onToggleSelect }: SketchGridProps) {
  const isActive = isGenerating || (refiningIndices != null && refiningIndices.size > 0);
  const availableCount = sketches.filter(s => s.imagePath).length;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    setElapsedSeconds(0);
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

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

  // Full-screen error state — only when no successful images exist
  const hasAnyImage = sketches.some(s => s.imagePath !== null);
  if (error && !hasAnyImage) {
    const isBackendError = errorCode === 'BACKEND_UNAVAILABLE';
    const displayMessage = isBackendError
      ? 'The generation service is temporarily unavailable. You can try again or restart the service.'
      : error;

    return (
      <EmptyState
        icon={<ErrorCircleIcon className="w-16 h-16 text-swag-pink" />}
        title="Unable to Generate"
        description={displayMessage}
        action={
          <div className="flex flex-col items-center gap-3">
            {onRetry && !isRestarting && (
              <button
                onClick={onRetry}
                className="px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-btn bg-swag-green text-black hover:bg-swag-green-muted transition-all"
              >
                Try Again
              </button>
            )}
            {isBackendError && onRestart && !isRestarting && (
              <button
                onClick={onRestart}
                className="px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-btn bg-surface-3 text-swag-white hover:bg-surface-4 transition-all"
              >
                Restart Service
              </button>
            )}
            {isRestarting && (
              <div className="flex items-center gap-2 text-swag-text-tertiary">
                <div className="w-4 h-4 border-2 border-swag-green border-t-transparent rounded-full animate-spin" />
                <span className="text-xs uppercase tracking-wider">Restarting service...</span>
              </div>
            )}
            {(errorCode === 'RESTART_FAILED' || errorCode === 'NO_ELECTRON') && (
              <p className="text-xs text-swag-text-tertiary mt-1">
                If the problem persists, please restart the application.
              </p>
            )}
          </div>
        }
      />
    );
  }

  // Loading state: full skeleton grid only when no sketches exist at all
  if (isGenerating && sketches.length === 0 && (!refiningIndices || refiningIndices.size === 0)) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <div className="flex-1 grid grid-cols-4 gap-4 justify-items-center">
          <SkeletonSketchCard />
          <SkeletonSketchCard />
          <SkeletonSketchCard />
          <SkeletonSketchCard />
        </div>
        <div className="text-center py-4">
          <p className="text-swag-white font-medium animate-pulse">Generating your concept sketches...</p>
          <p className="text-xs text-swag-text-tertiary mt-1">{elapsedSeconds}s elapsed</p>
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
    <div className="flex-1 flex flex-col overflow-hidden p-4 relative">
      {/* Gallery header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl uppercase tracking-wider text-swag-white">
            Generated Sketches
          </h2>
          <span className="tag-green">{sketches.length}</span>
          {selectionMode && selectedIndices && selectedIndices.size > 0 && (
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded">
              {selectedIndices.size} selected
            </span>
          )}
        </div>
        <button
          onClick={handleDownloadAll}
          disabled={availableCount === 0}
          className={`flex items-center gap-1.5 btn-ghost text-xs uppercase tracking-wider ${
            availableCount === 0 ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <DownloadIcon className="w-3.5 h-3.5" />
          {isActive && availableCount < sketches.length
            ? `Download ${availableCount} Ready`
            : 'Download All'}
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-4 gap-4 justify-items-center">
        {sketches.map((sketch, index) =>
          refiningIndices?.has(index) ? (
            <SkeletonSketchCard key={sketch.id} />
          ) : sketch.imagePath === null && !sketch.error && isGenerating ? (
            // Pending slot during SSE streaming — show skeleton
            <SkeletonSketchCard key={sketch.id} />
          ) : (
            <SketchCard
              key={sketch.id}
              sketch={sketch}
              onExpand={() => onImageClick(index)}
              onDownload={() => handleDownload(sketch)}
              isGenerating={isActive}
              selectionMode={selectionMode}
              isSelected={selectedIndices?.has(index)}
              onToggleSelect={() => onToggleSelect?.(index)}
            />
          )
        )}
      </div>
      {/* Generating status during SSE streaming */}
      {isGenerating && (!refiningIndices || refiningIndices.size === 0) && (
        <div className="absolute bottom-0 left-0 right-0 text-center py-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
          <p className="text-swag-white text-sm font-medium animate-pulse">
            Generating sketches... ({sketches.filter(s => s.imagePath).length}/{sketches.length}) — {elapsedSeconds}s elapsed
          </p>
          {serverBusy && (
            <p className="text-amber-400 text-xs font-medium mt-1">
              Server is busy — retrying, generation may take longer
            </p>
          )}
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs uppercase tracking-wider mt-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium transition-colors pointer-events-auto"
          >
            Cancel
          </button>
        </div>
      )}
      {refiningIndices && refiningIndices.size > 0 && (
        <div className="absolute bottom-0 left-0 right-0 text-center py-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
          <p className="text-swag-white text-sm font-medium animate-pulse">Refining {refiningIndices.size} sketch{refiningIndices.size > 1 ? 'es' : ''}... — {elapsedSeconds}s elapsed</p>
          {serverBusy && (
            <p className="text-amber-400 text-xs font-medium mt-1">
              Server is busy — retrying, generation may take longer
            </p>
          )}
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs uppercase tracking-wider mt-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium transition-colors pointer-events-auto"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
