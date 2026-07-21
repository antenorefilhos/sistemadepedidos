'use client';

import { ToastProvider } from './Toast';
import { ConfirmProvider } from './ConfirmDialog';

// Monta uma única vez em src/app/admin/layout.js: dá a toda a árvore do admin
// acesso a useToast() (substitui alert()) e useConfirm() (substitui window.confirm()).
export default function AdminUIProvider({ children }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
