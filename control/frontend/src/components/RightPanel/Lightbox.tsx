import { useEffect, useState, useCallback } from 'react';
import type { Sketch } from '../../types';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, ErrorCircleIcon, SpinnerIcon, ImagePlaceholderIcon } from '../shared/Icons';
import { useImageLoad } from '../../hooks/useImageLoad';

const API_BASE_URL = 'http://localhost:3001/api';
const getImageUrl = (imagePath: string) => `${API_BASE_URL}${imagePath}`;

interface LightboxProps {
  sketches: Sketch[];
  initialIndex: number;
  onClose: () => void;
  onDownload: (sketch: Sketch) => void;
}

export default function Lightbox({ sketches, initialIndex, onClose, onDownload }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % sketches.length);
  }, [sketches.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + sketches.length) % sketches.length);
  }, [sketches.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goNext, goPrev]);

  const currentSketch = sketches[currentIndex];
  const imageSrc = currentSketch?.imagePath ? getImageUrl(currentSketch.imagePath) : null;
  const { isLoading, hasError, imgSrc, handleLoad, handleError } = useImageLoad({ src: imageSrc });
  const imageUnavailable = !currentSketch?.imagePath || hasError || !!currentSketch?.error;

  if (!currentSketch) return null;

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 btn-icon text-swag-white z-10"
      >
        <CloseIcon className="w-6 h-6" />
      </button>

      {/* Download button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload(currentSketch);
        }}
        className={`absolute top-4 left-4 flex items-center gap-2 bg-surface-2/80 text-swag-white px-3 py-2 rounded-btn text-sm font-medium transition-all z-10 ${
          imageUnavailable ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-3'
        }`}
        disabled={imageUnavailable}
      >
        <DownloadIcon className="w-4 h-4" />
        Download
      </button>

      {/* Navigation arrows */}
      {sketches.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 btn-icon text-swag-white bg-surface-2/50 hover:bg-surface-3 p-3 rounded-full z-10"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 btn-icon text-swag-white bg-surface-2/50 hover:bg-surface-3 p-3 rounded-full z-10"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Image / Error / Loading */}
      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {currentSketch.error ? (
          <div className="flex flex-col items-center gap-4 text-center px-8">
            <ErrorCircleIcon className="w-16 h-16 text-red-400" />
            <p className="text-sm font-medium text-red-400 uppercase tracking-wider">Generation Failed</p>
            <p className="text-sm text-swag-text-tertiary max-w-md">{currentSketch.error}</p>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center gap-4 text-center px-8">
            <ErrorCircleIcon className="w-16 h-16 text-swag-text-tertiary" />
            <p className="text-sm font-medium text-swag-text-secondary uppercase tracking-wider">Image Unavailable</p>
            <p className="text-xs text-swag-text-tertiary">The image could not be loaded</p>
          </div>
        ) : imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={`Sketch ${currentIndex + 1}`}
              className={`lightbox-image transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={handleLoad}
              onError={handleError}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <SpinnerIcon className="w-10 h-10 text-swag-text-tertiary" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center px-8">
            <ImagePlaceholderIcon className="w-16 h-16 text-swag-text-quaternary" />
            <p className="text-sm text-swag-text-tertiary">No image available</p>
          </div>
        )}
      </div>

      {/* Counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-2/80 text-swag-white text-sm font-medium px-4 py-2 rounded-btn z-10">
        {currentIndex + 1} of {sketches.length}
      </div>
    </div>
  );
}
