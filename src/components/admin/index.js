// Barrel do kit de UI compartilhado do admin — import curto: `import { Modal, useToast } from '@/components/admin'`.
export { default as Modal } from './ui/Modal';
export { ConfirmProvider, useConfirm } from './ui/ConfirmDialog';
export { ToastProvider, useToast } from './ui/Toast';
export { default as AdminUIProvider } from './ui/AdminUIProvider';
export { default as StatusBadge } from './ui/StatusBadge';
export { default as StatCard } from './ui/StatCard';
export { default as Tag } from './ui/Tag';
export { default as LoadingSpinner } from './ui/LoadingSpinner';
export { default as EmptyState } from './ui/EmptyState';
export { default as DataTable } from './ui/DataTable';
export { default as ImageUploadField } from './ui/ImageUploadField';
export { default as WysiwygField } from './ui/WysiwygField';

export { adminFetch, useAdminFetch, useAdminMutation, AdminFetchError } from './hooks/useAdminFetch';
export { useDebouncedValue } from './hooks/useDebouncedValue';

export { formatCurrencyBRL } from './lib/formatCurrency';
export { slugify } from './lib/slugify';
export { STATUS_MAPS, getStatusInfo } from './lib/statusMaps';
