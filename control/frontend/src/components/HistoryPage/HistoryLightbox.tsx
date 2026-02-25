import { useEffect, useState, useCallback } from 'react';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, ErrorCircleIcon, SpinnerIcon } from '../shared/Icons';
import { getGeneratedImageUrl } from '../../services/api';
import { useImageLoad } from '../../hooks/useImageLoad';

interface HistoryLightboxProps {
  dirName: string;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function HistoryLightbox({ dirName, images, initialIndex, onClose }: HistoryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goNext, goPrev]);

  const imageSrc = getGeneratedImageUrl(dirName, images[currentIndex]);
  const { isLoading, hasError, imgSrc, handleLoad, handleError } = useImageLoad({ src: imageSrc });
  const imageUnavailable = hasError;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const imageUrl = getGeneratedImageUrl(dirName, images[currentIndex]);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dirName}_${images[currentIndex]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 btn-icon text-swag-white z-10">
        <CloseIcon className="w-6 h-6" />
      </button>

      <button
        onClick={handleDownload}
        disabled={imageUnavailable}
        className={`absolute top-4 left-4 flex items-center gap-2 bg-surface-2/80 text-swag-white px-3 py-2 rounded-btn text-sm font-medium transition-all z-10 ${
          imageUnavailable ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-3'
        }`}
      >
        <DownloadIcon className="w-4 h-4" />
        Download
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 btn-icon text-swag-white bg-surface-2/50 hover:bg-surface-3 p-3 rounded-full z-10"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 btn-icon text-swag-white bg-surface-2/50 hover:bg-surface-3 p-3 rounded-full z-10"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </>
      )}

      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {hasError ? (
          <div className="flex flex-col items-center gap-4 text-center px-8">
            <ErrorCircleIcon className="w-16 h-16 text-swag-text-tertiary" />
            <p className="text-sm font-medium text-swag-text-secondary uppercase tracking-wider">Image Unavailable</p>
            <p className="text-xs text-swag-text-tertiary">The image could not be loaded</p>
          </div>
        ) : imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={`Generated sketch ${currentIndex + 1}`}
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
        ) : null}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-2/80 text-swag-white text-sm font-medium px-4 py-2 rounded-btn z-10">
        {currentIndex + 1} of {images.length}
      </div>
    </div>
  );
}
