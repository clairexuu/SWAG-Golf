import { useStyleContext } from '../../context/StyleContext';
import { SkeletonStyleCard } from '../shared/Skeleton';
import EmptyState from '../shared/EmptyState';
import { PlusIcon } from '../shared/Icons';

interface StyleSelectorProps {
  selectedStyleId: string | null;
  onStyleSelect: (styleId: string) => void;
}

export default function StyleSelector({
  selectedStyleId,
  onStyleSelect,
}: StyleSelectorProps) {
  const { styles, stylesLoading } = useStyleContext();

  if (stylesLoading) {
    return (
      <div className="space-y-3">
        <SkeletonStyleCard />
        <SkeletonStyleCard />
        <SkeletonStyleCard />
      </div>
    );
  }

  if (styles.length === 0) {
    return (
      <EmptyState
        icon={<PlusIcon className="w-12 h-12" />}
        title="No Styles Yet"
        description="Create your first style to get started"
      />
    );
  }

  return (
    <div className="space-y-2">
      {styles.map((style) => {
        const isSelected = selectedStyleId === style.id;

        return (
          <div
            key={style.id}
            onClick={() => onStyleSelect(style.id)}
            className={`style-card ${isSelected ? 'style-card-selected' : ''}`}
          >
            {/* Green accent bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-card transition-all duration-200 ${
                isSelected ? 'bg-swag-green' : 'bg-transparent'
              }`}
            />

            <div className="pl-2">
              <h3 className="font-semibold text-swag-white text-sm mb-1">{style.name}</h3>
              {style.description && (
                <p className="text-xs text-swag-text-secondary line-clamp-2">
                  {style.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
