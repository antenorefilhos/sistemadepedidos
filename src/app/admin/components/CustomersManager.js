'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/admin/ui/Modal';
import DataTable from '@/components/admin/ui/DataTable';
import EmptyState from '@/components/admin/ui/EmptyState';
import LoadingSpinner from '@/components/admin/ui/LoadingSpinner';
import StatCard from '@/components/admin/ui/StatCard';
import { useToast } from '@/components/admin/ui/Toast';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';
import { useDebouncedValue } from '@/components/admin/hooks/useDebouncedValue';
import { formatCurrencyBRL } from '@/components/admin/lib/formatCurrency';

export default function CustomersManager({ password }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const toast = useToast();

  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      setCustomers(await adminFetch('/api/admin/customers', { password }));
    } catch (err) {
      toast.error(`Erro ao carregar clientes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNotesModal = (cust) => {
    setSelectedCustomer(cust);
    setEditingNotes(cust.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    setSavingNotes(true);
    try {
      await adminFetch('/api/admin/customers', {
        password,
        method: 'PUT',
        body: { whatsapp: selectedCustomer.whatsapp, notes: editingNotes },
      });
      setCustomers((prev) =>
        prev.map((c) => (c.whatsapp === selectedCustomer.whatsapp ? { ...c, notes: editingNotes } : c))
      );
      setSelectedCustomer(null);
    } catch (err) {
      toast.error(`Erro ao salvar observações: ${err.message}`);
    } finally {
      setSavingNotes(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const term = debouncedSearch.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.whatsapp || '').includes(term) ||
      (c.email || '').toLowerCase().includes(term)
    );
  });

  const totalSpentAll = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const totalOrdersAll = customers.reduce((sum, c) => sum + c.total_orders, 0);

  return (
    <div>
      <h3 className="text-lg text-base-content font-bold mb-6">Clientes</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard icon="fa-address-book" tone="primary" label="Total de Clientes" value={customers.length} caption="Clientes cadastrados via orçamentos" />
        <StatCard icon="fa-circle-dollar-to-slot" tone="success" label="Faturamento Acumulado" value={formatCurrencyBRL(totalSpentAll)} caption="Soma de todos os orçamentos finalizados" />
        <StatCard icon="fa-file-invoice" tone="info" label="Total de Pedidos" value={totalOrdersAll} caption="Volume de orçamentos gerados" />
      </div>

      <DataTable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar cliente por nome, WhatsApp ou e-mail..."
        actions={
          <button onClick={fetchCustomers} className="btn btn-outline btn-sm gap-2">
            <i className="fa-solid fa-arrows-rotate" aria-hidden="true"></i> Atualizar Lista
          </button>
        }
        loading={loading}
        isEmpty={filteredCustomers.length === 0}
        emptyState={<EmptyState icon="fa-address-book" title="Nenhum cliente encontrado." />}
      >
        <table className="table table-zebra table-md w-full">
          <thead className="bg-base-200">
            <tr>
              <th>Cliente</th>
              <th>WhatsApp</th>
              <th className="text-center">Qtd. Pedidos</th>
              <th className="text-right">Total Comprado</th>
              <th className="text-right">Ticket Médio</th>
              <th>Último Pedido</th>
              <th>Observações Internas</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((cust) => (
              <tr key={cust.whatsapp} className="hover">
                <td>
                  <div className="font-bold text-base-content">{cust.name}</div>
                  {cust.email && <div className="text-xs text-base-content/50">{cust.email}</div>}
                </td>
                <td>
                  <a
                    href={`https://wa.me/${cust.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-success hover:text-success/80 font-bold flex items-center gap-1.5 text-xs w-fit"
                  >
                    <i className="fa-brands fa-whatsapp text-sm" aria-hidden="true"></i> {cust.whatsapp}
                  </a>
                </td>
                <td className="text-center font-semibold">{cust.total_orders}</td>
                <td className="text-right font-bold text-primary tabular-nums">{formatCurrencyBRL(cust.total_spent)}</td>
                <td className="text-right text-xs text-base-content/70 tabular-nums">
                  {formatCurrencyBRL(cust.total_spent / (cust.total_orders || 1))}
                </td>
                <td className="text-xs text-base-content/60">{new Date(cust.last_order_at).toLocaleDateString('pt-BR')}</td>
                <td className="max-w-[200px] truncate" title={cust.notes || ''}>
                  {cust.notes ? (
                    <span className="badge badge-outline border-base-300 text-xs px-2 py-1 max-w-[180px] truncate block text-left">
                      {cust.notes}
                    </span>
                  ) : (
                    <span className="text-xs text-base-content/40 italic">Nenhuma anotação</span>
                  )}
                </td>
                <td className="text-right">
                  <button onClick={() => handleOpenNotesModal(cust)} className="btn btn-xs btn-outline btn-primary gap-1">
                    <i className="fa-solid fa-pen-to-square" aria-hidden="true"></i> Notas
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>

      <Modal
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Anotações Internas"
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setSelectedCustomer(null)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSaveNotes} disabled={savingNotes}>
              {savingNotes ? <LoadingSpinner size="xs" /> : 'Salvar Alterações'}
            </button>
          </>
        }
      >
        {selectedCustomer && (
          <>
            <p className="text-xs text-base-content/60 mb-4">
              Notas para <b>{selectedCustomer.name}</b> ({selectedCustomer.whatsapp}) — visível apenas para o time
              Antenor &amp; Filhos.
            </p>
            <textarea
              rows={4}
              className="textarea textarea-bordered w-full text-sm p-3 focus:outline-none"
              placeholder="Ex: Cliente prefere cortes altos, sempre liga antes, cliente VIP..."
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              autoFocus
            />
          </>
        )}
      </Modal>
    </div>
  );
}
