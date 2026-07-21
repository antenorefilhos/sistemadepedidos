'use client';

import { useState } from 'react';
import Modal from '@/components/admin/ui/Modal';
import Tag from '@/components/admin/ui/Tag';
import { useToast } from '@/components/admin/ui/Toast';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';
import { slugify } from '@/components/admin/lib/slugify';

const EMPTY_FORM = { id: null, name: '', slug: '', type: 'sessoes_carnes_' };

// Extraído de page.js: aba "Categorias" (antes 100% inline no shell).
export default function CategoriesManager({ categories, role, password, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const toast = useToast();
  const confirm = useConfirm();

  const openModal = (cat = null) => {
    if (role !== 'admin') {
      toast.error('Acesso restrito para Administrador.');
      return;
    }
    setForm(cat ? { id: cat.id, name: cat.name, slug: cat.slug, type: cat.type } : EMPTY_FORM);
    setShowModal(true);
  };

  const handleNameChange = (val) => {
    setForm((prev) => (prev.id ? { ...prev, name: val } : { ...prev, name: val, slug: slugify(val) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (role !== 'admin') return;
    try {
      await adminFetch('/api/admin/categories', {
        password,
        method: form.id ? 'PUT' : 'POST',
        body: form,
      });
      toast.success(form.id ? 'Categoria atualizada!' : 'Categoria criada!');
      setShowModal(false);
      onRefresh();
    } catch (err) {
      toast.error(`Erro ao salvar categoria: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (role !== 'admin') return;
    const ok = await confirm({
      title: 'Excluir categoria',
      message: 'Deseja realmente excluir esta categoria? Ela será desvinculada de todos os produtos.',
      tone: 'danger',
      confirmLabel: 'Excluir',
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/categories?id=${id}`, { password, method: 'DELETE' });
      onRefresh();
    } catch (err) {
      toast.error(`Erro ao excluir categoria: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg text-base-content font-bold">Gerenciamento de Categorias</h3>
        {role === 'admin' && (
          <button onClick={() => openModal(null)} className="btn btn-primary">
            <i className="fa-solid fa-plus mr-2" aria-hidden="true"></i> Criar Categoria
          </button>
        )}
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
        <table className="table table-zebra w-full">
          <thead className="bg-base-200">
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Slug</th>
              <th>Tipo (Taxonomia)</th>
              {role === 'admin' && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="hover">
                <td className="font-mono text-xs">#{String(cat.id).slice(0, 8)}</td>
                <td className="font-bold">{cat.name}</td>
                <td className="font-mono text-xs text-base-content/70">{cat.slug}</td>
                <td>
                  <Tag tone="primary">{cat.type}</Tag>
                </td>
                {role === 'admin' && (
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openModal(cat)} className="btn btn-sm btn-outline btn-primary">
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="btn btn-sm btn-outline btn-error"
                        aria-label={`Excluir categoria ${cat.name}`}
                        title="Excluir"
                      >
                        <i className="fa-solid fa-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? 'Editar Categoria' : 'Criar Categoria'}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
              Cancelar
            </button>
            <button type="submit" form="category-form" className="btn btn-primary">
              Salvar Categoria
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-base-content/70 text-xs font-bold uppercase tracking-widest">
                Nome da Categoria
              </span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: VPJ Angus"
              className="input input-bordered w-full"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-base-content/70 text-xs font-bold uppercase tracking-widest">
                Tipo de Taxonomia
              </span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="sessoes_carnes_">Boutique: Categorias</option>
              <option value="racas_carnes">Boutique: Raças</option>
              <option value="embalagem_carnes">Boutique: Embalagens</option>
              <option value="sessoes_vinho_">Adega: Seções de Vinho</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
