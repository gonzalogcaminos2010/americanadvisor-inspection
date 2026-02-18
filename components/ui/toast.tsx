'use client';

import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  addToast: (message: string, type: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

const typeStyles: Record<Toast['type'], string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-md px-4 py-3 text-sm text-white shadow-lg',
        typeStyles[toast.type]
      )}
    >
      <span>{toast.message}</span>
      <button onClick={() => onClose(toast.id)} className="shrink-0 rounded p-0.5 hover:bg-white/20">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type']) => {
    setToasts((prev) => [...prev, { id: ++toastId, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');

  return {
    toast: {
      success: (message: string) => ctx.addToast(message, 'success'),
      error: (message: string) => ctx.addToast(message, 'error'),
      info: (message: string) => ctx.addToast(message, 'info'),
    },
  };
}
