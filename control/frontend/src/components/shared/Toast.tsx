import { useContext } from 'react';
import { ToastContext } from './ToastContext';
import { CheckIcon, ErrorCircleIcon, CloseIcon } from './Icons';

export default function ToastContainer() {
  const ctx = useContext(ToastContext);
  if (!ctx || ctx.toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {ctx.toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast ${
            toast.type === 'success' ? 'toast-success' :
            toast.type === 'error' ? 'toast-error' : 'toast-info'
          } ${toast.exiting ? 'animate-toast-out' : ''}`}
        >
          {toast.type === 'success' && <CheckIcon className="w-4 h-4 flex-shrink-0" />}
          {toast.type === 'error' && <ErrorCircleIcon className="w-4 h-4 flex-shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => ctx.removeToast(toast.id)}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
