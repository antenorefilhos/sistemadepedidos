'use client';

import { useState, useEffect } from 'react';

export default function CustomersManager({ password }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null); // For notes editing modal
  const [editingNotes, setEditingNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers?auth=${encodeURIComponent(password)}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Error fetching admin customers:', err);
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
      const res = await fetch(`/api/admin/customers?auth=${encodeURIComponent(password)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: selectedCustomer.whatsapp,
          notes: editingNotes
        })
      });
      if (res.ok) {
        setCustomers(customers.map(c => c.whatsapp === selectedCustomer.whatsapp ? { ...c, notes: editingNotes } : c));
        setSelectedCustomer(null);
      } else {
        alert('Erro ao salvar observações.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar.');
    }
    setSavingNotes(false);
  };

  const filteredCustomers = customers.filter(c => {
    const term = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(term) || (c.whatsapp || '').includes(term) || (c.email || '').toLowerCase().includes(term);
  });

  const totalSpentAll = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const totalOrdersAll = customers.reduce((sum, c) => sum + c.total_orders, 0);

  return (
    <div>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body p-6">
            <h4 className="text-xs font-bold text-base-content/60 uppercase tracking-wider">Total de Clientes</h4>
            <div className="text-2xl font-black text-base-content mt-1">{customers.length}</div>
            <p className="text-[10px] text-base-content/50 mt-1">Clientes cadastrados via orçamentos</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body p-6">
            <h4 className="text-xs font-bold text-base-content/60 uppercase tracking-wider">Faturamento Acumulado</h4>
            <div className="text-2xl font-black text-primary mt-1">
              R$ {totalSpentAll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-base-content/50 mt-1">Soma de todos os orçamentos finalizados</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body p-6">
            <h4 className="text-xs font-bold text-base-content/60 uppercase tracking-wider">Total de Pedidos</h4>
            <div className="text-2xl font-black text-base-content mt-1">{totalOrdersAll}</div>
            <p className="text-[10px] text-base-content/50 mt-1">Volume de orçamentos gerados</p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="card bg-base-100 shadow-md border border-base-200 mb-6">
        <div className="card-body p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-grow w-full md:max-w-md">
            <input 
              type="text" 
              placeholder="🔍 Buscar cliente por nome, whatsapp ou e-mail..." 
              className="input input-bordered w-full h-11"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={fetchCustomers} className="btn btn-outline btn-sm h-11 min-h-11 gap-2">
            <i className="fa-solid fa-arrows-rotate"></i> Atualizar Lista
          </button>
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="text-center py-12"><span className="loading loading-spinner text-primary"></span></div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card bg-base-100 border border-base-200 p-10 text-center italic text-base-content/60">
          Nenhum cliente encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
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
              {filteredCustomers.map(cust => (
                <tr key={cust.whatsapp} className="hover">
                  <td>
                    <div className="font-bold text-base-content">{cust.name}</div>
                    {cust.email && <div className="text-[10px] text-base-content/50">{cust.email}</div>}
                  </td>
                  <td>
                    <a 
                      href={`https://wa.me/${cust.whatsapp.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-success hover:text-success/80 font-bold flex items-center gap-1.5 text-xs w-fit"
                    >
                      <i className="fa-brands fa-whatsapp text-sm"></i> {cust.whatsapp}
                    </a>
                  </td>
                  <td className="text-center font-semibold">{cust.total_orders}</td>
                  <td className="text-right font-bold text-primary">
                    R$ {cust.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right text-xs text-base-content/70">
                    R$ {(cust.total_spent / (cust.total_orders || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-xs text-base-content/60">
                    {new Date(cust.last_order_at).toLocaleDateString('pt-BR')}
                  </td>
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
                    <button 
                      onClick={() => handleOpenNotesModal(cust)} 
                      className="btn btn-xs btn-outline btn-primary gap-1"
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Notas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* NOTES EDIT MODAL */}
      {selectedCustomer && (
        <dialog className="modal modal-open" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-box bg-base-100 border border-base-300 max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-base-content mb-2">Anotações Internas</h3>
            <p className="text-xs text-base-content/60 mb-4">
              Escreva notas para <b>{selectedCustomer.name}</b> ({selectedCustomer.whatsapp}). Visível apenas para o time do Antenor & Filhos.
            </p>
            
            <textarea 
              rows="4" 
              className="textarea textarea-bordered w-full text-sm p-3 mb-4 focus:outline-none"
              placeholder="Ex: Cliente prefere cortes altos, sempre liga antes, cliente VIP..."
              value={editingNotes}
              onChange={e => setEditingNotes(e.target.value)}
            />

            <div className="modal-actions flex justify-end gap-2">
              <button className="btn btn-sm btn-ghost" onClick={() => setSelectedCustomer(null)}>Cancelar</button>
              <button 
                className="btn btn-sm btn-primary" 
                onClick={handleSaveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
