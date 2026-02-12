interface SkeletonLineProps {
  width?: 'full' | '3/4' | '1/2' | '1/4';
  height?: string;
}

export function SkeletonLine({ width = 'full', height = 'h-4' }: SkeletonLineProps) {
  const widthClass = width === 'full' ? 'w-full' : width === '3/4' ? 'w-3/4' : width === '1/2' ? 'w-1/2' : 'w-1/4';
  return <div className={`skeleton ${widthClass} ${height}`} />;
}

interface SkeletonCardProps {
  aspectRatio?: string;
  className?: string;
}

export function SkeletonCard({ aspectRatio = 'aspect-[3/4]', className = '' }: SkeletonCardProps) {
  return <div className={`skeleton ${aspectRatio} ${className}`} />;
}

export function SkeletonStyleCard() {
  return (
    <div className="skeleton p-4 space-y-2">
      <div className="h-5 w-2/3 bg-surface-4 rounded" />
      <div className="h-3 w-full bg-surface-4 rounded" />
      <div className="h-3 w-1/2 bg-surface-4 rounded" />
      <div className="flex gap-2 mt-2">
        <div className="h-5 w-16 bg-surface-4 rounded-tag" />
        <div className="h-5 w-12 bg-surface-4 rounded-tag" />
      </div>
    </div>
  );
}

export function SkeletonSketchCard() {
  return (
    <div className="skeleton h-full aspect-[9/16] animate-pulse-glow" />
  );
}
