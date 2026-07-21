'use client';

import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

// Substitui o bloco "card + header + busca + filtro + tabela + empty state" duplicado
// quase byte-a-byte entre CustomersManager.js, ReviewsModerator.js e as abas inline de page.js.
//
// Responsável só pelo wrapper: quem chama continua dono do <table>/<thead>/<tbody> (via children)
// ou de um card de listagem mobile (via mobileCard), evitando forçar um formato rígido de colunas
// em casos com renderização de linha muito customizada (ex.: expand row de pedido).
export default function DataTable({
  title,
  actions,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  loading = false,
  isEmpty = false,
  emptyState,
  children,
}) {
  return (
    <div className="card bg-base-100 shadow-md border border-base-200">
      {(title || actions || onSearchChange || filters) && (
        <div className="card-body pb-0 md:pb-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {title && <h2 className="text-lg font-bold font-serif m-0">{title}</h2>}
            <div className="flex flex-1 flex-wrap justify-end items-center gap-3">
              {onSearchChange && (
                <label className="input input-bordered input-sm flex items-center gap-2 w-full sm:w-auto sm:min-w-[220px]">
                  <i className="fa-solid fa-magnifying-glass text-base-content/40" aria-hidden="true"></i>
                  <input
                    type="search"
                    className="grow"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    aria-label={searchPlaceholder}
                  />
                </label>
              )}
              {filters}
              {actions}
            </div>
          </div>
        </div>
      )}

      <div className="card-body pt-4">
        {loading ? (
          <LoadingSpinner fullscreen label="Carregando..." />
        ) : isEmpty ? (
          emptyState || <EmptyState title="Nenhum registro encontrado." />
        ) : (
          <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">{children}</div>
        )}
      </div>
    </div>
  );
}
