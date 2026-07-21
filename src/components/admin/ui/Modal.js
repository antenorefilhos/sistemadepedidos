'use client';

import { useEffect, useRef } from 'react';

const SIZE_CLASSES = {
  sm: 'max-w-[480px]',
  md: 'max-w-[720px]',
  lg: 'max-w-[960px]',
  xl: 'max-w-[1200px]',
};

// Modal padrão do admin, baseado no <dialog> nativo (mesmo padrão já usado em
// ProductEditor.js/HermesDashboard.js): foco e fechamento com Esc gratuitos do browser.
// Substitui as variações divergentes (div.modal, fixed inset-0 custom, card inline).
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  footer,
  children,
  bodyClassName = '',
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Mantém o estado React sincronizado quando o dialog fecha nativamente (Esc, clique no backdrop-form).
  const handleNativeClose = () => {
    if (onClose) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleNativeClose}
      className="modal modal-bottom sm:modal-middle"
    >
      <div
        className={`modal-box p-0 flex flex-col bg-base-100 border border-base-300 shadow-2xl rounded-2xl overflow-hidden ${SIZE_CLASSES[size] || SIZE_CLASSES.md}`}
      >
        {(title || icon) && (
          <div className="p-5 md:px-8 border-b border-base-300 flex justify-between items-center bg-base-200/50 shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              {icon && (
                <div className="w-11 h-11 bg-primary/15 rounded-xl flex items-center justify-center text-primary text-lg shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {title && <h2 className="text-base font-bold text-base-content m-0 leading-snug">{title}</h2>}
                {subtitle && <span className="text-sm text-base-content/60 truncate block">{subtitle}</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="btn btn-circle btn-ghost btn-sm text-base-content/60 hover:text-base-content hover:bg-base-content/10 shrink-0 !w-8 !h-8 !min-h-0 !p-0"
            >
              <i className="fa-solid fa-xmark text-lg" aria-hidden="true"></i>
            </button>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto p-6 md:p-8 ${bodyClassName}`}>{children}</div>

        {footer && (
          <div className="p-4 md:px-8 border-t border-base-300 flex justify-end gap-3 bg-base-200/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button aria-label="Fechar">close</button>
      </form>
    </dialog>
  );
}
