// Main Layout - Three-panel structure

import { useState } from 'react';
import StyleSelector from '../LeftPanel/StyleSelector';
import ChatInput from '../CenterPanel/ChatInput';
import SketchGrid from '../RightPanel/SketchGrid';
import { useGenerate } from '../../hooks/useGenerate';

export default function MainLayout() {
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [experimentalMode, setExperimentalMode] = useState(false);
  const { generate, isGenerating, error, sketches } = useGenerate();

  const handleGenerate = (input: string) => {
    if (!selectedStyleId) {
      return;
    }

    generate({
      input,
      styleId: selectedStyleId,
      numImages: 4,
      experimentalMode,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">SWAG Concept Sketch Agent</h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered design assistant for concept sketching</p>
      </header>

      {/* Main three-panel layout: 1/4 style, 1/4 input, 1/2 generated images */}
      <main className="flex-1 grid grid-cols-[25%_25%_50%] gap-4 p-4 overflow-hidden">
        {/* Left Panel */}
        <aside className="bg-white rounded-lg shadow-sm p-6 overflow-hidden flex flex-col">
          <StyleSelector
            selectedStyleId={selectedStyleId}
            onStyleSelect={setSelectedStyleId}
            experimentalMode={experimentalMode}
            onExperimentalToggle={setExperimentalMode}
          />
        </aside>

        {/* Center Panel */}
        <section className="bg-white rounded-lg shadow-sm p-6 overflow-hidden flex flex-col">
          <ChatInput
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            disabled={!selectedStyleId}
          />
        </section>

        {/* Right Panel */}
        <aside className="bg-white rounded-lg shadow-sm p-6 overflow-hidden flex flex-col">
          <SketchGrid sketches={sketches} isGenerating={isGenerating} error={error} />
        </aside>
      </main>
    </div>
  );
}
