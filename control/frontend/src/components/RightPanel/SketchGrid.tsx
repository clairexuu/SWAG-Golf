// Right Panel - Sketch Grid Component

import type { Sketch } from '../../types';

interface SketchGridProps {
  sketches: Sketch[];
  isGenerating: boolean;
  error: string | null;
}

export default function SketchGrid({ sketches, isGenerating, error }: SketchGridProps) {
  const handleDownload = (sketchId: string) => {
    console.log(`[MVP] Download sketch: ${sketchId}`);
    // TODO: Implement actual download functionality
  };

  const handleRegenerate = (sketchId: string) => {
    console.log(`[MVP] Regenerate sketch: ${sketchId}`);
    // TODO: Implement regeneration functionality
  };

  const handleFlag = (sketchId: string) => {
    console.log(`[MVP] Flag sketch: ${sketchId}`);
    // TODO: Implement flag/feedback functionality
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-500 text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-semibold">Generation Failed</p>
          <p className="text-sm mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-gray-600 font-medium">Generating sketches...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
      </div>
    );
  }

  if (sketches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-gray-600 font-medium">No sketches yet</p>
        <p className="text-sm text-gray-500 mt-2">Generate your first concept sketch</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        Generated Sketches ({sketches.length})
      </h2>

      <div className="flex-1 grid grid-cols-2 gap-4 overflow-y-auto">
        {sketches.map((sketch) => (
          <div key={sketch.id} className="flex flex-col bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
            {/* Placeholder image */}
            <div className="aspect-square bg-gray-200 flex items-center justify-center relative group">
              <div className="text-center">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-gray-500 text-sm">
                  {sketch.resolution[0]} × {sketch.resolution[1]}
                </span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="p-3 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => handleDownload(sketch.id)}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title="Download sketch"
              >
                Download
              </button>
              <button
                onClick={() => handleRegenerate(sketch.id)}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                title="Regenerate this sketch"
              >
                ↻
              </button>
              <button
                onClick={() => handleFlag(sketch.id)}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                title="Flag for review"
              >
                ⚑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
