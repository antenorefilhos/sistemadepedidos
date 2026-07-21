'use client';

import { useState } from 'react';
import { useToast } from '@/components/admin/ui/Toast';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';
import { slugify } from '@/components/admin/lib/slugify';

// Extraído de page.js: aba "Vendedores" (antes 100% inline no shell).
export default function SellersManager({ sellers, role, password, onRefresh }) {
  const [newSeller, setNewSeller] = useState({ name: '', phone: '' });
  const toast = useToast();
  const confirm = useConfirm();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (role !== 'admin' || !newSeller.name || !newSeller.phone) return;

    try {
      await adminFetch('/api/admin/sellers', {
        password,
        method: 'POST',
        body: { ...newSeller, slug: slugify(newSeller.name) },
      });
      toast.success('Vendedor cadastrado com sucesso!');
      setNewSeller({ name: '', phone: '' });
      onRefresh();
    } catch (err) {
      toast.error(`Erro ao criar vendedor: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (role !== 'admin') return;
    const ok = await confirm({
      title: 'Excluir vendedor',
      message: 'Tem certeza que deseja excluir este vendedor?',
      tone: 'danger',
      confirmLabel: 'Excluir',
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/sellers?id=${id}`, { password, method: 'DELETE' });
      onRefresh();
    } catch (err) {
      toast.error(`Erro ao excluir vendedor: ${err.message}`);
    }
  };

  const copyLink = (seller) => {
    const link = `${window.location.origin}/?ref=${seller.slug}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link copiado para ${seller.name}`, { description: link });
  };

  return (
    <div>
      <h3 className="text-lg text-base-content font-bold mb-6">Vendedores</h3>

      <div className={`grid gap-8 ${role === 'admin' ? 'lg:grid-cols-[1fr_350px]' : 'grid-cols-1'} items-start`}>
        <div>
          <h4 className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-4">
            Lista de Vendedores Ativos
          </h4>
          <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
            <table className="table table-zebra table-sm w-full">
              <thead className="bg-base-200">
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>WhatsApp</th>
                  <th>Slug Comissional</th>
                  <th>Link de Vendas</th>
                  {role === 'admin' && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.id} className="hover">
                    <td className="font-mono text-xs">#{String(s.id).slice(0, 8)}</td>
                    <td className="font-bold">{s.name}</td>
                    <td>
                      <a
                        href={`https://wa.me/${s.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 font-bold flex items-center gap-2 w-fit"
                      >
                        <i className="fa-brands fa-whatsapp text-lg" aria-hidden="true"></i>
                        {s.phone}
                      </a>
                    </td>
                    <td className="font-mono text-xs text-base-content/70">?ref={s.slug}</td>
                    <td>
                      <button
                        onClick={() => copyLink(s)}
                        className="btn btn-xs btn-primary btn-outline flex items-center gap-1.5"
                        title="Copiar link comissionado"
                      >
                        <i className="fa-regular fa-copy" aria-hidden="true"></i>
                        Copiar Link
                      </button>
                    </td>
                    {role === 'admin' && (
                      <td>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="btn btn-sm btn-outline btn-error"
                          aria-label={`Excluir vendedor ${s.name}`}
                          title="Excluir"
                        >
                          <i className="fa-solid fa-trash" aria-hidden="true"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {role === 'admin' && (
          <aside className="card bg-base-200 shadow-sm border border-base-300 w-full">
            <div className="card-body p-6">
              <h4 className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">Cadastrar Vendedor</h4>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold">Nome Completo</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do vendedor"
                    className="input input-bordered w-full"
                    value={newSeller.name}
                    onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold">WhatsApp (Fixo sem símbolos)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 5524988650462"
                    className="input input-bordered w-full"
                    value={newSeller.phone}
                    onChange={(e) => setNewSeller({ ...newSeller, phone: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary mt-2">
                  Salvar Vendedor
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
