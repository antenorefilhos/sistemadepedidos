// Mapa único de status -> {label, badgeClass} consumido por <StatusBadge domain="..." status="..." />.
// Substitui as convenções divergentes de badge espalhadas pelo admin (page.js, ReviewsModerator.js).
export const STATUS_MAPS = {
  order: {
    pending: { label: 'Pendente', badgeClass: 'badge-warning' },
    viewed: { label: 'Visualizado', badgeClass: 'badge-info' },
    completed: { label: 'Finalizado', badgeClass: 'badge-success' },
    cancelled: { label: 'Cancelado', badgeClass: 'badge-error' },
  },
  product: {
    on: { label: 'Ativo', badgeClass: 'badge-success' },
    off: { label: 'Oculto', badgeClass: 'badge-error' },
  },
  review: {
    approved: { label: 'Aprovada', badgeClass: 'badge-success' },
    pending: { label: 'Pendente', badgeClass: 'badge-warning' },
    rejected: { label: 'Rejeitada', badgeClass: 'badge-error' },
  },
};

export function getStatusInfo(domain, status) {
  return (
    STATUS_MAPS[domain]?.[status] || {
      label: status || '—',
      badgeClass: 'badge-neutral',
    }
  );
}
