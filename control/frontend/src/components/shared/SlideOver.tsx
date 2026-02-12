import { useEffect } from 'react';
import { CloseIcon } from './Icons';

interface SlideOverProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function SlideOver({ onClose, title, children }: SlideOverProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="slide-over">
      <div className="slide-over-header">
        <h2 className="font-display text-xl uppercase tracking-wider text-swag-white">
          {title}
        </h2>
        <button onClick={onClose} className="btn-icon">
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
