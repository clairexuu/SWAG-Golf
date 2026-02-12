import { useEffect } from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="modal-panel w-full max-w-md pointer-events-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl uppercase tracking-wider text-swag-white">
              {title}
            </h3>
            <button onClick={onClose} className="btn-icon">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
          <div>{children}</div>
          {footer && (
            <div className="mt-6 flex gap-3 justify-end">{footer}</div>
          )}
        </div>
      </div>
    </>
  );
}
