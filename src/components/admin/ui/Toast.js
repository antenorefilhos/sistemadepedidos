'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const TONE_CLASSES = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning',
  info: 'alert-info',
};

const TONE_ICONS = {
  success: 'fa-circle-check',
  error: 'fa-circle-exclamation',
  warning: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
};

// Substitui os ~35 alert() nativos espalhados pelo admin por notificações não-bloqueantes.
// Uso: const toast = useToast(); toast.success('Produto salvo'); toast.error('Falha ao salvar', { description: '...' });
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone, messageOrOptions, duration = 4500) => {
      const id = ++idRef.current;
      const options =
        typeof messageOrOptions === 'string' ? { title: messageOrOptions } : messageOrOptions || {};
      setToasts((prev) => [...prev, { id, tone, ...options }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (msg, opts) => push('success', msg, opts?.duration ?? 4500),
      error: (msg, opts) => push('error', msg, opts?.duration ?? 6000),
      warning: (msg, opts) => push('warning', msg, opts?.duration ?? 5000),
      info: (msg, opts) => push('info', msg, opts?.duration ?? 4500),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast toast-end toast-bottom z-[200] gap-2 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div key={t.id} className={`alert ${TONE_CLASSES[t.tone]} shadow-lg items-start`} role="status">
            <i className={`fa-solid ${TONE_ICONS[t.tone]} mt-0.5`} aria-hidden="true"></i>
            <div className="min-w-0">
              {t.title && <span className="font-semibold block break-words">{t.title}</span>}
              {t.description && <span className="text-sm opacity-80 block break-words">{t.description}</span>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Fechar notificação"
              className="btn btn-ghost btn-xs btn-circle ml-1"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast precisa ser usado dentro de <ToastProvider>');
  }
  return ctx;
}
