import { useState } from 'react';
import { ChevronDownIcon } from '../shared/Icons';
import GenerationCard from './GenerationCard';
import type { StyleGroup, GenerationSummary } from '../../types';

interface StyleGroupSectionProps {
  group: StyleGroup;
  defaultExpanded?: boolean;
  onImageClick: (generation: GenerationSummary, imageIndex: number) => void;
}

export default function StyleGroupSection({ group, defaultExpanded = false, onImageClick }: StyleGroupSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="style-group">
      {/* Group header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="style-group-header w-full text-left"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-display text-xl uppercase tracking-wider text-swag-white">
            {group.styleName}
          </h3>
          <span className="tag-green">{group.generations.length}</span>
          <span className="text-xs text-swag-text-quaternary">
            {group.totalImages} images
          </span>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-swag-text-tertiary transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Group body - generation cards */}
      {expanded && (
        <div className="style-group-body">
          {group.generations.map((gen, index) => (
            <GenerationCard
              key={gen.dirName}
              generation={gen}
              index={index}
              onImageClick={(imgIndex) => onImageClick(gen, imgIndex)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
