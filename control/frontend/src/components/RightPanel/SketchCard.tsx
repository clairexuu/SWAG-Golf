import type { Sketch } from '../../types';
import { DownloadIcon, ExpandIcon } from '../shared/Icons';

const API_BASE_URL = 'http://localhost:3001/api';
const getImageUrl = (imagePath: string) => `${API_BASE_URL}${imagePath}`;

interface SketchCardProps {
  sketch: Sketch;
  onExpand: () => void;
  onDownload: () => void;
}

export default function SketchCard({ sketch, onExpand, onDownload }: SketchCardProps) {
  return (
    <div className="sketch-card group cursor-pointer h-full aspect-[9/16]" onClick={onExpand}>
      {/* Image container */}
      <div className="h-full">
        <img
          src={getImageUrl(sketch.imagePath)}
          alt={sketch.id}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Hover overlay */}
      <div className="sketch-card-overlay group-hover:opacity-100">
        {/* Resolution info */}
        {sketch.resolution && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] text-swag-text-tertiary bg-black/60 px-1.5 py-0.5 rounded">
              {sketch.resolution[0]}x{sketch.resolution[1]}
            </span>
          </div>
        )}

        {/* Bottom: actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-swag-green text-black font-bold text-xs uppercase tracking-wider py-2 rounded-btn hover:bg-swag-green-muted transition-all active:scale-[0.97]"
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
