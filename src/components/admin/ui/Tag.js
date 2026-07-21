// Badge de classificação/taxonomia (tipo de categoria, setor, tipo de bloco) — diferente
// de StatusBadge (que representa um estado semântico). Antes cada tela tinha seu próprio
// tratamento: badge-primary aqui, badge-ghost ali, badge-outline sem cor em outro lugar,
// com padding e tracking levemente diferentes em cada um.
export default function Tag({ children, tone = 'neutral', className = '' }) {
  const toneClass = tone === 'primary' ? 'badge-primary badge-outline' : 'badge-outline';
  return <span className={`badge ${toneClass} text-xs font-semibold uppercase tracking-wide ${className}`}>{children}</span>;
}
