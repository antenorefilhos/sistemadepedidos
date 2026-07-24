'use client';

import { useMemo, useState } from 'react';
import Modal from '@/components/admin/ui/Modal';
import Tag from '@/components/admin/ui/Tag';
import { useToast } from '@/components/admin/ui/Toast';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';
import { slugify } from '@/components/admin/lib/slugify';

const EMPTY_FORM = { id: null, name: '', slug: '', type: 'sessoes_carnes_', parent_id: '' };

// Taxonomias (o campo `type`). Cada uma tem sua própria árvore de categorias/subcategorias.
const TAXONOMIES = [
  { key: 'sessoes_carnes_', label: 'Boutique · Categorias' },
  { key: 'racas_carnes', label: 'Boutique · Raças' },
  { key: 'embalagem_carnes', label: 'Boutique · Embalagens' },
  { key: 'sessoes_vinho_', label: 'Adega · Seções de Vinho' },
];

const byPos = (a, b) => (a.position ?? 0) - (b.position ?? 0) || a.name.localeCompare(b.name);

// Monta a floresta (nós de topo com .children) de uma lista plana, ordenada por position+nome.
function buildForest(cats) {
  const byId = new Map(cats.map((c) => [c.id, { ...c, children: [] }]));
  const roots = [];
  byId.forEach((node) => {
    const pid = node.parent_id;
    if (pid != null && pid !== node.id && byId.has(pid)) {
      byId.get(pid).children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortRec = (arr) => {
    arr.sort(byPos);
    arr.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

// Achata a floresta em linhas { cat, depth }, com guarda contra ciclos.
function flattenForest(roots) {
  const out = [];
  const seen = new Set();
  const walk = (node, depth) => {
    if (seen.has(node.id)) return;
    seen.add(node.id);
    out.push({ cat: node, depth });
    node.children.forEach((ch) => walk(ch, depth + 1));
  };
  roots.forEach((r) => walk(r, 0));
  return out;
}

export default function CategoriesManager({ categories, role, password, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // { id, zone: 'before'|'after'|'inside' }
  const toast = useToast();
  const confirm = useConfirm();

  const rowsByType = useMemo(() => {
    const map = {};
    TAXONOMIES.forEach((tax) => {
      map[tax.key] = flattenForest(buildForest(categories.filter((c) => c.type === tax.key)));
    });
    return map;
  }, [categories]);

  // Descendentes de uma categoria (para não permitir escolhê-los como pai → evita ciclo).
  const getDescendantIds = (catId) => {
    const ids = new Set();
    const stack = [catId];
    while (stack.length) {
      const cur = stack.pop();
      categories.forEach((c) => {
        if (c.parent_id === cur && !ids.has(c.id)) {
          ids.add(c.id);
          stack.push(c.id);
        }
      });
    }
    return ids;
  };

  const parentOptions = useMemo(() => {
    const blocked = form.id ? getDescendantIds(form.id) : new Set();
    return categories
      .filter((c) => c.type === form.type && c.id !== form.id && !blocked.has(c.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, form.type, form.id]);

  const openModal = (cat = null) => {
    if (role !== 'admin') {
      toast.error('Acesso restrito para Administrador.');
      return;
    }
    setForm(
      cat
        ? { id: cat.id, name: cat.name, slug: cat.slug, type: cat.type, parent_id: cat.parent_id ?? '' }
        : EMPTY_FORM
    );
    setShowModal(true);
  };

  const handleNameChange = (val) => {
    setForm((prev) => (prev.id ? { ...prev, name: val } : { ...prev, name: val, slug: slugify(val) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (role !== 'admin') return;
    setSaving(true);
    try {
      await adminFetch('/api/admin/categories', {
        password,
        method: form.id ? 'PUT' : 'POST',
        body: { ...form, parent_id: form.parent_id === '' ? null : Number(form.parent_id) },
      });
      toast.success(form.id ? 'Categoria atualizada!' : 'Categoria criada!');
      setShowModal(false);
      onRefresh();
    } catch (err) {
      toast.error(`Erro ao salvar categoria: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (role !== 'admin') return;
    const ok = await confirm({
      title: 'Excluir categoria',
      message: 'Deseja realmente excluir esta categoria? Ela será desvinculada dos produtos e suas subcategorias virarão de topo.',
      tone: 'danger',
      confirmLabel: 'Excluir',
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/categories?id=${cat.id}`, { password, method: 'DELETE' });
      onRefresh();
    } catch (err) {
      toast.error(`Erro ao excluir categoria: ${err.message}`);
    }
  };

  // Persiste um movimento (reordenação e/ou reparent) reatribuindo positions 0..n no grupo afetado.
  const persistMove = async (movedId, targetId, zone) => {
    const moved = categories.find((c) => c.id === movedId);
    const target = categories.find((c) => c.id === targetId);
    if (!moved || !target || moved.id === target.id || saving) return;
    if (moved.type !== target.type) {
      toast.error('Não é possível mover entre taxonomias diferentes.');
      return;
    }
    if (getDescendantIds(moved.id).has(target.id)) return; // evita ciclo

    let newParentId;
    let order;
    if (zone === 'inside') {
      newParentId = target.id;
      const children = categories
        .filter((c) => c.type === moved.type && (c.parent_id ?? null) === target.id && c.id !== moved.id)
        .sort(byPos);
      order = [...children, moved];
    } else {
      newParentId = target.parent_id ?? null;
      const siblings = categories
        .filter((c) => c.type === moved.type && (c.parent_id ?? null) === newParentId && c.id !== moved.id)
        .sort(byPos);
      const tIdx = siblings.findIndex((s) => s.id === target.id);
      const insertIdx = zone === 'before' ? tIdx : tIdx + 1;
      order = [...siblings.slice(0, insertIdx), moved, ...siblings.slice(insertIdx)];
    }

    setSaving(true);
    try {
      await Promise.all(
        order.map((c, i) =>
          adminFetch('/api/admin/categories', {
            password,
            method: 'PUT',
            body: {
              id: c.id,
              name: c.name,
              slug: c.slug,
              parent_id: c.id === moved.id ? newParentId : c.parent_id ?? null,
              position: i,
            },
          })
        )
      );
      onRefresh();
    } catch (err) {
      toast.error(`Erro ao mover: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Setas ↑↓ (fallback acessível): move entre irmãs.
  const moveArrow = async (cat, direction) => {
    if (role !== 'admin' || saving) return;
    const siblings = categories
      .filter((c) => c.type === cat.type && (c.parent_id ?? null) === (cat.parent_id ?? null))
      .sort(byPos);
    const idx = siblings.findIndex((s) => s.id === cat.id);
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= siblings.length) return;
    await persistMove(cat.id, siblings[swap].id, direction === 'up' ? 'before' : 'after');
  };

  // ── Drag & Drop nativo ──────────────────────────────────────────────
  const onDragStart = (e, cat) => {
    if (role !== 'admin') return;
    setDragId(cat.id);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(cat.id)); } catch { /* noop */ }
  };

  const onDragOverRow = (e, cat) => {
    if (dragId == null || cat.id === dragId) return;
    const moved = categories.find((c) => c.id === dragId);
    if (!moved || moved.type !== cat.type || getDescendantIds(dragId).has(cat.id)) {
      setDropTarget(null);
      return;
    }
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height || 1;
    const zone = y < h * 0.3 ? 'before' : y > h * 0.7 ? 'after' : 'inside';
    setDropTarget((prev) => (prev && prev.id === cat.id && prev.zone === zone ? prev : { id: cat.id, zone }));
  };

  const onDropRow = (e, cat) => {
    e.preventDefault();
    if (dragId != null && dropTarget && dropTarget.id === cat.id) {
      persistMove(dragId, cat.id, dropTarget.zone);
    }
    setDragId(null);
    setDropTarget(null);
  };

  const onDragEnd = () => {
    setDragId(null);
    setDropTarget(null);
  };

  const dropClass = (catId) => {
    if (!dropTarget || dropTarget.id !== catId) return '';
    if (dropTarget.zone === 'before') return 'border-t-2 border-primary';
    if (dropTarget.zone === 'after') return 'border-b-2 border-primary';
    return 'ring-2 ring-inset ring-primary bg-primary/5';
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg text-base-content font-bold">Gerenciamento de Categorias</h3>
          <p className="text-base-content/60 text-sm">
            Arraste para reordenar ou aninhar (soltar no meio de uma categoria a torna subcategoria). As setas ↑↓ também funcionam.
          </p>
        </div>
        {role === 'admin' && (
          <button onClick={() => openModal(null)} className="btn btn-primary">
            <i className="fa-solid fa-plus mr-2" aria-hidden="true"></i> Criar Categoria
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {TAXONOMIES.map((tax) => {
          const rows = rowsByType[tax.key] || [];
          return (
            <div key={tax.key} className="bg-base-100 rounded-box border border-base-300 overflow-hidden">
              <div className="px-4 py-3 bg-base-200 border-b border-base-300 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">{tax.label}</span>
                <Tag>{rows.length}</Tag>
              </div>

              {rows.length === 0 ? (
                <div className="p-6 text-center text-sm text-base-content/40 italic">Nenhuma categoria nesta taxonomia.</div>
              ) : (
                <ul className="divide-y divide-base-200">
                  {rows.map(({ cat, depth }) => (
                    <li
                      key={cat.id}
                      draggable={role === 'admin'}
                      onDragStart={(e) => onDragStart(e, cat)}
                      onDragOver={(e) => onDragOverRow(e, cat)}
                      onDrop={(e) => onDropRow(e, cat)}
                      onDragEnd={onDragEnd}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${dragId === cat.id ? 'opacity-40' : 'hover:bg-base-200/40'} ${dropClass(cat.id)}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0" style={{ paddingLeft: `${depth * 24}px` }}>
                        {role === 'admin' && (
                          <i className="fa-solid fa-grip-vertical text-base-content/25 cursor-grab" aria-hidden="true" title="Arraste para mover"></i>
                        )}
                        {depth > 0 && <i className="fa-solid fa-turn-up fa-rotate-90 text-base-content/30 text-xs" aria-hidden="true"></i>}
                        <div className="min-w-0">
                          <div className={`truncate ${depth === 0 ? 'font-bold text-base-content' : 'font-medium text-base-content/80'}`}>{cat.name}</div>
                          <div className="text-[11px] font-mono text-base-content/40 truncate">/{cat.slug} · {cat.products_count ?? 0} produto(s)</div>
                        </div>
                      </div>

                      {role === 'admin' && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => moveArrow(cat, 'up')} disabled={saving} className="btn btn-ghost btn-xs btn-square" aria-label="Mover para cima" title="Mover para cima">
                            <i className="fa-solid fa-chevron-up" aria-hidden="true"></i>
                          </button>
                          <button onClick={() => moveArrow(cat, 'down')} disabled={saving} className="btn btn-ghost btn-xs btn-square" aria-label="Mover para baixo" title="Mover para baixo">
                            <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
                          </button>
                          <button onClick={() => openModal(cat)} className="btn btn-xs btn-outline btn-primary">Editar</button>
                          <button onClick={() => handleDelete(cat)} className="btn btn-xs btn-outline btn-error btn-square" aria-label={`Excluir ${cat.name}`} title="Excluir">
                            <i className="fa-solid fa-trash" aria-hidden="true"></i>
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? 'Editar Categoria' : 'Criar Categoria'}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
            <button type="submit" form="category-form" className="btn btn-primary" disabled={saving}>Salvar Categoria</button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-base-content/70 text-xs font-bold uppercase tracking-widest">Nome da Categoria</span>
            </label>
            <input type="text" required autoFocus placeholder="Ex: VPJ Angus" className="input input-bordered w-full" value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-base-content/70 text-xs font-bold uppercase tracking-widest">Taxonomia</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value, parent_id: '' })}
              disabled={!!form.id}
            >
              {TAXONOMIES.map((tax) => (
                <option key={tax.key} value={tax.key}>{tax.label}</option>
              ))}
            </select>
            {form.id && <span className="text-[11px] text-base-content/40 mt-1">A taxonomia não é alterável na edição.</span>}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-base-content/70 text-xs font-bold uppercase tracking-widest">Categoria Pai</span>
            </label>
            <select className="select select-bordered w-full" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
              <option value="">— Categoria de topo (sem pai) —</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="text-[11px] text-base-content/40 mt-1">Ou arraste a categoria na lista para dentro de outra.</span>
          </div>
        </form>
      </Modal>
    </div>
  );
}
