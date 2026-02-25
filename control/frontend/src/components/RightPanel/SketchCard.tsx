import { useEffect } from 'react';
import type { Sketch } from '../../types';
import { DownloadIcon, ExpandIcon, ErrorCircleIcon, CheckIcon, SpinnerIcon, ImagePlaceholderIcon } from '../shared/Icons';
import { useImageLoad } from '../../hooks/useImageLoad';

const API_BASE_URL = 'http://localhost:3001/api';
const getImageUrl = (imagePath: string) => `${API_BASE_URL}${imagePath}`;

interface SketchCardProps {
  sketch: Sketch;
  onExpand: () => void;
  onDownload: () => void;
  isGenerating?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onImageLoadError?: () => void;
}

export default function SketchCard({ sketch, onExpand, onDownload, isGenerating, selectionMode, isSelected, onToggleSelect, onImageLoadError }: SketchCardProps) {
  const imageSrc = sketch.imagePath ? getImageUrl(sketch.imagePath) : null;
  const { isLoading, hasError, imgSrc, handleLoad, handleError } = useImageLoad({ src: imageSrc });
  const imageUnavailable = !sketch.imagePath || hasError;

  useEffect(() => {
    if (hasError) onImageLoadError?.();
  }, [hasError, onImageLoadError]);

  // Error state — show error message instead of image
  if (sketch.error) {
    return (
      <div className="sketch-card h-full aspect-[9/16] flex flex-col items-center justify-center gap-3 p-4 bg-surface-2 border border-red-500/30">
        <ErrorCircleIcon className="w-8 h-8 text-red-400 flex-shrink-0" />
        <p className="text-xs font-medium text-red-400 uppercase tracking-wider">Generation Failed</p>
        <p className="text-xs text-swag-text-tertiary text-center overflow-y-auto max-h-32 leading-relaxed">
          {sketch.error}
        </p>
      </div>
    );
  }

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelect?.();
    } else {
      onExpand();
    }
  };

  return (
    <div
      className={`sketch-card group cursor-pointer h-full aspect-[9/16] ${
        selectionMode && isSelected ? 'border-2 !border-amber-400' : ''
      }`}
      onClick={handleClick}
    >
      {/* Selection checkbox overlay */}
      {selectionMode && (
        <div
          className="absolute top-2 left-2 z-10"
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
        >
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-amber-400 border-amber-400'
              : 'bg-black/40 border-white/60 hover:border-white'
          }`}>
            {isSelected && <CheckIcon className="w-4 h-4 text-black" />}
          </div>
        </div>
      )}

      {/* Image container */}
      <div className="h-full relative">
        {hasError ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface-2">
            <ErrorCircleIcon className="w-8 h-8 text-swag-text-tertiary" />
            <span className="text-[10px] text-swag-text-quaternary uppercase tracking-wider">Image unavailable</span>
          </div>
        ) : imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={sketch.id}
              className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={handleLoad}
              onError={handleError}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
                <SpinnerIcon className="w-6 h-6 text-swag-text-quaternary" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface-2">
            <ImagePlaceholderIcon className="w-8 h-8 text-swag-text-quaternary" />
            <span className="text-[10px] text-swag-text-quaternary uppercase tracking-wider">No image</span>
          </div>
        )}
      </div>

      {/* Hover overlay — always visible during generation for completed cards */}
      <div className={`sketch-card-overlay ${
        isGenerating && !selectionMode && sketch.imagePath && !hasError
          ? 'opacity-100'
          : selectionMode ? '' : 'group-hover:opacity-100'
      }`}>
        {/* Bottom: actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!imageUnavailable) onDownload();
            }}
            disabled={imageUnavailable}
            className={`flex-1 flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider py-2 rounded-btn transition-all ${
              imageUnavailable
                ? 'bg-swag-green/40 text-black/40 cursor-not-allowed'
                : 'bg-swag-green text-black hover:bg-swag-green-muted active:scale-[0.97]'
            }`}
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            Download
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="flex items-center justify-center bg-surface-3/80 text-swag-white p-2 rounded-btn hover:bg-surface-4 transition-all active:scale-[0.97]"
          >
            <ExpandIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
