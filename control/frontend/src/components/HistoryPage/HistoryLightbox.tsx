import { useEffect, useState, useCallback } from 'react';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from '../shared/Icons';
import { getGeneratedImageUrl } from '../../services/api';

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
        className="absolute top-4 left-4 flex items-center gap-2 bg-surface-2/80 text-swag-white px-3 py-2 rounded-btn text-sm font-medium hover:bg-surface-3 transition-all z-10"
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

      <img
        src={getGeneratedImageUrl(dirName, images[currentIndex])}
        alt={`Generated sketch ${currentIndex + 1}`}
        className="lightbox-image"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-2/80 text-swag-white text-sm font-medium px-4 py-2 rounded-btn z-10">
        {currentIndex + 1} of {images.length}
      </div>
    </div>
  );
}
