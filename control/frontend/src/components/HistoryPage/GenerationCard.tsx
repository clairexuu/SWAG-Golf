import { useState } from 'react';
import JSZip from 'jszip';
import { DownloadIcon, ExpandIcon } from '../shared/Icons';
import { getGeneratedImageUrl } from '../../services/api';
import type { GenerationSummary } from '../../types';

function formatTimestamp(ts: string): string {
  const match = ts.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/);
  if (!match) return ts;
  const [, y, mo, d, h, mi] = match;
  const date = new Date(+y, +mo - 1, +d, +h, +mi);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface GenerationCardProps {
  generation: GenerationSummary;
  onImageClick: (imageIndex: number) => void;
  index: number;
}

export default function GenerationCard({ generation, onImageClick, index }: GenerationCardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const zip = new JSZip();
      await Promise.all(
        generation.images.map(async (filename, i) => {
          try {
            const response = await fetch(getGeneratedImageUrl(generation.dirName, filename));
            const blob = await response.blob();
            zip.file(`sketch_${i + 1}.png`, blob);
          } catch (err) {
            console.error(`Failed to fetch ${filename}:`, err);
          }
        })
      );
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generation_${generation.dirName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download all failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSingle = async (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    const imageUrl = getGeneratedImageUrl(generation.dirName, filename);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generation.dirName}_${filename}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div
      className="generation-card"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header: timestamp + prompt + actions */}
      <div className="generation-card-header">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-xs text-swag-green font-mono tracking-wider">
                {formatTimestamp(generation.timestamp)}
              </p>
              {generation.mode === 'refine' && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  Refined
                </span>
              )}
            </div>
            <p className="text-sm text-swag-text-secondary leading-relaxed line-clamp-2">
              {generation.userPrompt}
            </p>
          </div>
          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs text-swag-text-tertiary hover:text-swag-green transition-colors px-2 py-1 rounded hover:bg-surface-3"
            title="Download all sketches"
          >
            <DownloadIcon className={`w-3.5 h-3.5 ${downloading ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">ZIP</span>
          </button>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="generation-card-thumbnails">
        {generation.images.map((filename, imgIndex) => (
          <div key={filename} className="generation-card-thumb group relative">
            <img
              src={getGeneratedImageUrl(generation.dirName, filename)}
              alt={`Sketch ${imgIndex + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onClick={() => onImageClick(imgIndex)}
            />
            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button
                onClick={() => onImageClick(imgIndex)}
                className="p-1 text-swag-white hover:text-swag-green transition-colors"
                title="Expand"
              >
                <ExpandIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => handleDownloadSingle(e, filename)}
                className="p-1 text-swag-white hover:text-swag-green transition-colors"
                title="Download"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
