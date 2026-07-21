'use client';

import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import ProductEditor from './ProductEditor';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import Tag from '@/components/admin/ui/Tag';
import { useToast } from '@/components/admin/ui/Toast';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';
import { useDebouncedValue } from '@/components/admin/hooks/useDebouncedValue';
import { slugify } from '@/components/admin/lib/slugify';
import { formatCurrencyBRL } from '@/components/admin/lib/formatCurrency';

const EMPTY_PRODUCT = {
  id: null,
  title: '',
  slug: '',
  description: '',
  sku: '',
  peso: '',
  unidade_peso: 'g',
  preco: '',
  status: 'on',
  image_url: '',
  type: 'carnes_',
  pontuacao: '',
  categoryIds: [],
  uva: '',
  safra: '',
  origem: '',
  produtor: '',
  teor_alcoolico: '',
  temperatura: '',
  enologo: '',
  volume: '',
  amadurecimento: '',
  potencial_guarda: '',
  visual: '',
  olfativo: '',
  gustativo: '',
  harmonizacao: '',
};

const PER_PAGE = 20;

// Extraído de page.js: aba "Catálogo" (lista + filtro; o modal de edição já era o
// componente externo ProductEditor, mantido como filho aqui sem alterações).
export default function ProductsManager({ products, categories, role, password, onRefresh }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const toast = useToast();
  const confirm = useConfirm();

  const debouncedSearch = useDebouncedValue(search, 250);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (typeFilter !== '') {
      result = result.filter((p) => p.type === typeFilter);
    }
    if (debouncedSearch.trim() !== '') {
      const fuse = new Fuse(result, { keys: ['title', 'sku'], threshold: 0.4 });
      result = fuse.search(debouncedSearch).map((item) => item.item);
    }
    return result;
  }, [products, typeFilter, debouncedSearch]);

  const totalPages = Math.ceil(filteredProducts.length / PER_PAGE) || 1;
  const paginatedProducts = filteredProducts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openModal = (prod = null) => {
    if (role !== 'admin') {
      toast.error('Acesso restrito para Administrador.');
      return;
    }
    if (prod) {
      setForm({
        id: prod.id,
        title: prod.title,
        slug: prod.slug,
        description: prod.description || '',
        sku: prod.sku || '',
        peso: prod.peso || '',
        unidade_peso: prod.unidade_peso || 'g',
        preco: prod.preco ? String(prod.preco) : '',
        status: prod.status || 'on',
        image_url: prod.image_url || '',
        type: prod.type || 'carnes_',
        pontuacao: prod.pontuacao || '',
        categoryIds: prod.categories ? prod.categories.map((c) => c.id) : [],
        uva: prod.uva || '',
        safra: prod.safra || '',
        origem: prod.origem || '',
        produtor: prod.produtor || '',
        teor_alcoolico: prod.teor_alcoolico || '',
        temperatura: prod.temperatura || '',
        enologo: prod.enologo || '',
        volume: prod.volume || '',
        amadurecimento: prod.amadurecimento || '',
        potencial_guarda: prod.potencial_guarda || '',
        visual: prod.visual || '',
        olfativo: prod.olfativo || '',
        gustativo: prod.gustativo || '',
        harmonizacao: prod.harmonizacao || '',
      });
    } else {
      setForm(EMPTY_PRODUCT);
    }
    setShowModal(true);
  };

  const handleTitleChange = (val) => {
    setForm((prev) => ({ ...prev, title: val, slug: slugify(val) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (role !== 'admin') return;

    const payload = { ...form, preco: form.preco.trim() !== '' ? parseFloat(form.preco) : null };

    try {
      await adminFetch('/api/admin/products', { password, method: form.id ? 'PUT' : 'POST', body: payload });
      toast.success(form.id ? 'Produto atualizado!' : 'Produto criado!');
      setShowModal(false);
      onRefresh();
    } catch (err) {
      toast.error(`Erro ao salvar produto: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (role !== 'admin') return;
    const ok = await confirm({
      title: 'Excluir produto',
      message: 'Tem certeza que deseja excluir permanentemente este produto?',
      tone: 'danger',
      confirmLabel: 'Excluir',
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/products?id=${id}`, { password, method: 'DELETE' });
      onRefresh();
    } catch (err) {
      toast.error(`Erro ao excluir produto: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg text-base-content font-bold">Catálogo de Produtos</h3>
        {role === 'admin' && (
          <button onClick={() => openModal(null)} className="btn btn-primary">
            <i className="fa-solid fa-plus mr-2" aria-hidden="true"></i> Criar Produto
          </button>
        )}
      </div>

      <div className="card bg-base-200 shadow-sm border border-base-300 mb-6">
        <div className="card-body p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="input input-bordered w-full flex items-center gap-2">
              <i className="fa-solid fa-magnifying-glass text-base-content/40" aria-hidden="true"></i>
              <input
                type="search"
                className="grow"
                placeholder="Pesquisar catálogo..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <select
              className="select select-bordered w-full"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos os Setores</option>
              <option value="carnes_">Boutique de Carnes</option>
              <option value="adega">Adega de Vinhos</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
        <table className="table table-zebra w-full">
          <thead className="bg-base-200">
            <tr>
              <th className="w-24 px-4 py-3">Imagem</th>
              <th className="w-1/3 min-w-[280px] px-4 py-3">Título</th>
              <th className="w-44 min-w-[160px] px-4 py-3">EAN (SKU)</th>
              <th className="w-36 min-w-[120px] px-4 py-3">Preço</th>
              <th className="w-28 min-w-[90px] px-4 py-3">Setor</th>
              <th className="w-28 min-w-[90px] px-4 py-3">Status</th>
              {role === 'admin' && <th className="w-36 min-w-[130px] px-4 py-3">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((p) => (
              <tr key={p.id} className="hover">
                <td className="px-4 py-3.5">
                  {p.image_url ? (
                    <div className="avatar">
                      <div className="w-14 h-14 rounded-md border border-base-300 overflow-hidden shadow-sm">
                        <img src={p.image_url} alt={p.title} className="object-cover w-full h-full" />
                      </div>
                    </div>
                  ) : (
                    <div className="avatar placeholder">
                      <div className="bg-neutral/10 text-neutral rounded-md w-14 h-14 flex items-center justify-center border border-base-300">
                        <span className="text-xs uppercase font-bold text-base-content/40">Sem foto</span>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-bold text-base-content leading-snug">{p.title}</div>
                  {p.categories && p.categories.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {p.categories.map((c) => (
                        <Tag key={c.id} tone="primary">
                          {c.name}
                        </Tag>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5 font-mono text-xs font-semibold text-base-content/80 whitespace-nowrap">
                  {p.sku || '-'}
                </td>
                <td className="px-4 py-3.5 text-primary font-bold whitespace-nowrap">
                  {p.preco ? (
                    formatCurrencyBRL(p.preco)
                  ) : (
                    <span className="text-base-content/50 italic text-sm font-normal">Sob consulta</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <Tag>{p.type === 'carnes_' ? 'Boutique' : 'Adega'}</Tag>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge domain="product" status={p.status} />
                </td>
                {role === 'admin' && (
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => openModal(p)} className="btn btn-xs md:btn-sm btn-primary btn-outline font-semibold">
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="btn btn-xs md:btn-sm btn-ghost text-error/70 hover:text-error hover:bg-error/10"
                        aria-label={`Excluir produto ${p.title}`}
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

      <div className="flex justify-center mt-6">
        <div className="join">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="join-item btn btn-outline">
            Anterior
          </button>
          <button className="join-item btn btn-active no-animation pointer-events-none bg-base-300 text-base-content/70">
            Página <strong className="text-base-content mx-1">{page}</strong> de {totalPages}
          </button>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="join-item btn btn-outline">
            Próxima
          </button>
        </div>
      </div>

      {showModal && (
        <ProductEditor
          productForm={form}
          setProductForm={setForm}
          categories={categories}
          handleSaveProduct={handleSave}
          onClose={() => setShowModal(false)}
          handleProductTitleChange={handleTitleChange}
          password={password}
        />
      )}
    </div>
  );
}
