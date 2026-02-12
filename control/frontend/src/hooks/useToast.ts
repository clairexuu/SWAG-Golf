import { useContext, useMemo } from 'react';
import { ToastContext } from '../components/shared/ToastContext';

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');

  return useMemo(() => ({
    success: (message: string, duration?: number) => ctx.addToast('success', message, duration),
    error: (message: string, duration?: number) => ctx.addToast('error', message, duration),
    info: (message: string, duration?: number) => ctx.addToast('info', message, duration),
  }), [ctx.addToast]);
}
