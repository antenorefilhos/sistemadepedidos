'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Modal from './Modal';

const ConfirmContext = createContext(null);

// Substitui os window.confirm() nativos espalhados pelo admin por um modal consistente com o design system.
// Uso: const confirm = useConfirm(); const ok = await confirm({ title, message, tone: 'danger' }); if (!ok) return;
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        title: options?.title || 'Confirmar ação',
        message: options?.message || 'Tem certeza que deseja continuar?',
        confirmLabel: options?.confirmLabel || 'Confirmar',
        cancelLabel: options?.cancelLabel || 'Cancelar',
        tone: options?.tone || 'neutral',
      });
    });
  }, []);

  const settle = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setState(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={() => settle(false)}
        title={state?.title}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => settle(false)}>
              {state?.cancelLabel}
            </button>
            <button
              type="button"
              className={`btn ${state?.tone === 'danger' ? 'btn-error' : 'btn-primary'}`}
              onClick={() => settle(true)}
            >
              {state?.confirmLabel}
            </button>
          </>
        }
      >
        <p className="text-base-content/80 leading-relaxed flex items-start gap-3">
          <i
            className={`fa-solid ${state?.tone === 'danger' ? 'fa-triangle-exclamation text-error' : 'fa-circle-question text-primary'} mt-0.5`}
            aria-hidden="true"
          ></i>
          <span>{state?.message}</span>
        </p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm precisa ser usado dentro de <ConfirmProvider>');
  }
  return ctx;
}
