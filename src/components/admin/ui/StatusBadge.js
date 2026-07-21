import { getStatusInfo } from '../lib/statusMaps';

// Substitui as 3 convenções divergentes de badge de status (badge DaisyUI puro,
// badge manual em Tailwind cru, badge + opacidade redundante) por um único componente.
export default function StatusBadge({ domain, status, className = '' }) {
  const { label, badgeClass } = getStatusInfo(domain, status);
  return <span className={`badge ${badgeClass} ${className}`}>{label}</span>;
}
