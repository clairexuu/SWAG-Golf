import type { Sketch } from '../../types';
import { DownloadIcon, ExpandIcon } from '../shared/Icons';

const API_BASE_URL = 'http://localhost:3001/api';
const getImageUrl = (imagePath: string) => `${API_BASE_URL}${imagePath}`;

interface SketchCardProps {
  sketch: Sketch;
  index: number;
  onExpand: () => void;
  onDownload: () => void;
}

export default function SketchCard({ sketch, index, onExpand, onDownload }: SketchCardProps) {
  return (
    <div className="sketch-card group cursor-pointer" onClick={onExpand}>
      {/* Image container */}
      <div className="aspect-[3/4] bg-surface-0 flex items-center justify-center">
        <img
          src={getImageUrl(sketch.imagePath)}
          alt={`Sketch ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Hover overlay */}
      <div className="sketch-card-overlay group-hover:opacity-100">
        {/* Top: sketch number */}
        <div className="absolute top-3 left-3">
          <span className="bg-black/60 text-swag-white text-xs font-bold px-2 py-1 rounded">
            #{index + 1}
          </span>
        </div>

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
