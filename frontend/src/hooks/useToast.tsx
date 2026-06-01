'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const MAX_TOASTS = 3;

let idCounter = 0;

function generateId(): string {
  return `toast-${Date.now()}-${++idCounter}`;
}

/**
 * ToastProvider wraps the app and manages the toast notification stack.
 * Renders ToastViewport at the bottom-right corner.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const dismissAll = useCallback((): void => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const toast = useCallback(
    (newToast: Omit<Toast, 'id'>): void => {
      const id = generateId();
      const duration = newToast.duration ?? 4000;

      setToasts((prev) => {
        const next = [...prev, { ...newToast, id }];
        // Keep only the most recent MAX_TOASTS
        return next.slice(-MAX_TOASTS);
      });

      // Auto-dismiss
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
    </ToastContext.Provider>
  );
}

/**
 * useToast hook for triggering toast notifications from any component.
 */
export function useToast(): Omit<ToastContextType, 'toasts'> {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  const { toasts: _, ...rest } = context;
  return rest;
}

/**
 * useToastState hook for accessing the current toast list.
 * Used internally by ToastViewport.
 */
export function useToastState(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastState must be used within a ToastProvider');
  }
  return context;
}
