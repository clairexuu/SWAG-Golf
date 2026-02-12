import { createContext, useState, useCallback, useEffect, useRef } from 'react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration: number;
  exiting?: boolean;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (type: ToastItem['type'], message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    // Start exit animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    // Remove after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback((type: ToastItem['type'], message: string, duration = 3000) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, message, duration }]);

    const timer = setTimeout(() => {
      removeToast(id);
      timersRef.current.delete(id);
    }, duration);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}
