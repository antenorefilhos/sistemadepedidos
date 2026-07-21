'use client';

import { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import ImageUploadField from '@/components/admin/ui/ImageUploadField';
import WysiwygField from '@/components/admin/ui/WysiwygField';
import LoadingSpinner from '@/components/admin/ui/LoadingSpinner';
import { useToast } from '@/components/admin/ui/Toast';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';
import { useDebouncedValue } from '@/components/admin/hooks/useDebouncedValue';

const EMPTY_FORM = {
  id: null,
  title: '',
  description: '',
  ingredients: '',
  instructions: '',
  prep_time: '',
  servings: '',
  difficulty: 'Fácil',
  image_url: '',
  related_products: [],
};

export default function RecipeEditor({ password, products }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const toast = useToast();
  const confirm = useConfirm();

  const debouncedSearch = useDebouncedValue(productSearch, 250);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!debouncedSearch.trim()) return products;
    const fuse = new Fuse(products, { keys: ['title'], threshold: 0.4 });
    return fuse.search(debouncedSearch).map((res) => res.item);
  }, [products, debouncedSearch]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recipes');
      if (res.ok) setRecipes(await res.json());
    } catch (err) {
      toast.error('Erro ao carregar receitas.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (recipe = null) => {
    setForm(recipe ? { ...EMPTY_FORM, ...recipe } : EMPTY_FORM);
    setSelectedRecipe(recipe || { isNew: true });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.id) delete payload.id;
      await adminFetch('/api/admin/recipes', { password, method: form.id ? 'PUT' : 'POST', body: payload });
      toast.success(form.id ? 'Receita atualizada!' : 'Receita criada!');
      setSelectedRecipe(null);
      fetchRecipes();
    } catch (err) {
      toast.error(`Erro ao salvar receita: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Excluir receita',
      message: 'Excluir esta receita permanentemente?',
      tone: 'danger',
      confirmLabel: 'Excluir',
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/recipes?id=${id}`, { password, method: 'DELETE' });
      fetchRecipes();
      if (selectedRecipe?.id === id) setSelectedRecipe(null);
    } catch (err) {
      toast.error(`Erro ao excluir receita: ${err.message}`);
    }
  };

  const toggleProduct = (productIdStr) => {
    setForm((prev) => ({
      ...prev,
      related_products: prev.related_products.includes(productIdStr)
        ? prev.related_products.filter((id) => id !== productIdStr)
        : [...prev.related_products, productIdStr],
    }));
  };

  if (loading && recipes.length === 0) {
    return (
      <div className="p-10 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg text-base-content font-bold mb-1">Receitas</h3>
          <p className="text-base-content/60 text-sm">Crie conteúdos ricos vinculando produtos da boutique.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <i className="fa-solid fa-plus mr-2" aria-hidden="true"></i> Nova Receita
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="col-span-1 flex flex-col gap-3">
          {recipes.map((recipe) => (
            <RecipeListItem
              key={recipe.id}
              recipe={recipe}
              active={selectedRecipe?.id === recipe.id}
              onClick={() => handleOpenForm(recipe)}
            />
          ))}
          {recipes.length === 0 && (
            <div className="text-center p-6 bg-base-100 border border-dashed border-base-300 rounded-xl text-base-content/50">
              Nenhuma receita cadastrada.
            </div>
          )}
        </div>

        {selectedRecipe && (
          <div className="col-span-2 card bg-base-100 border border-base-300 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center border-b border-base-200 pb-4 mb-4">
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider">
                  {form.id ? 'Editar Receita' : 'Criar Nova Receita'}
                </h4>
                {form.id && (
                  <button className="btn btn-sm btn-error btn-outline" onClick={() => handleDelete(form.id)}>
                    Excluir
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text text-base-content/75 font-semibold">Título da Receita</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    className="input input-bordered w-full"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-base-content/75 font-semibold">Tempo de Preparo</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 45min"
                      className="input input-bordered w-full"
                      value={form.prep_time}
                      onChange={(e) => setForm({ ...form, prep_time: e.target.value })}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-base-content/75 font-semibold">Rendimento (Porções)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 4"
                      className="input input-bordered w-full"
                      value={form.servings}
                      onChange={(e) => setForm({ ...form, servings: e.target.value })}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-base-content/75 font-semibold">Nível de Dificuldade</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    >
                      <option value="Fácil">Fácil</option>
                      <option value="Médio">Médio</option>
                      <option value="Difícil">Difícil</option>
                    </select>
                  </div>
                </div>

                <ImageUploadField
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                  uploadType="recipe"
                  password={password}
                  label="Imagem da Receita"
                  heightClass="h-48"
                />

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text text-base-content/75 font-semibold">Resumo / Introdução da Receita</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Uma breve introdução sobre o prato..."
                    className="textarea textarea-bordered w-full"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text text-base-content/75 font-semibold">Ingredientes</span>
                  </label>
                  <WysiwygField value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} height="200px" />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text text-base-content/75 font-semibold">Modo de Preparo</span>
                  </label>
                  <WysiwygField value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} height="300px" />
                </div>

                <div className="form-control w-full mt-4">
                  <label className="label">
                    <span className="label-text text-base-content/75 font-semibold">Vincular Produtos (Aparecerão no rodapé da receita)</span>
                  </label>
                  <label className="input input-bordered input-sm flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-magnifying-glass text-base-content/40" aria-hidden="true"></i>
                    <input
                      type="search"
                      className="grow"
                      placeholder="Buscar produto pelo nome..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </label>
                  <div className="bg-base-200 border border-base-300 rounded-lg p-2 max-h-60 overflow-y-auto flex flex-col gap-1">
                    {filteredProducts.map((prod) => {
                      const idStr = String(prod.id);
                      const isSelected = form.related_products.includes(idStr);
                      return (
                        <label key={prod.id} className="cursor-pointer label flex justify-start gap-4 p-2 hover:bg-base-300/50 rounded transition-all">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm"
                            checked={isSelected}
                            onChange={() => toggleProduct(idStr)}
                          />
                          <span className="label-text text-base-content">
                            {prod.title} <span className="text-base-content/50 text-xs">({prod.type})</span>
                          </span>
                        </label>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <div className="text-center p-4 text-xs text-base-content/50 italic">Nenhum produto encontrado.</div>
                    )}
                  </div>
                </div>

                <div className="card-actions justify-end mt-6">
                  <button type="button" className="btn btn-ghost" onClick={() => setSelectedRecipe(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <LoadingSpinner size="sm" /> : 'Salvar Receita'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeListItem({ recipe, active, onClick }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`card bg-base-100 shadow-sm border cursor-pointer transition-all hover:border-primary/50 ${active ? 'border-primary' : 'border-base-300'}`}
      onClick={onClick}
    >
      <div className="card-body p-4 flex-row items-center gap-4">
        <div className="w-12 h-12 rounded bg-base-300 shrink-0 overflow-hidden border border-base-300 flex items-center justify-center">
          {recipe.image_url && !imageError ? (
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" onError={() => setImageError(true)} />
          ) : (
            <i className="fa-solid fa-utensils text-base-content/20 text-sm" aria-hidden="true"></i>
          )}
        </div>
        <div>
          <h5 className="font-bold text-base-content text-sm line-clamp-1">{recipe.title}</h5>
          <div className="flex gap-1.5 flex-wrap mt-1 text-xs">
            {recipe.prep_time && <span className="bg-base-200 px-1.5 py-0.5 rounded text-base-content/70">{recipe.prep_time}</span>}
            {recipe.servings && <span className="bg-base-200 px-1.5 py-0.5 rounded text-base-content/70">{recipe.servings} porções</span>}
            {recipe.difficulty && <span className="bg-base-200 px-1.5 py-0.5 rounded text-base-content/70">{recipe.difficulty}</span>}
          </div>
          <p className="text-xs text-base-content/50 mt-1">{recipe.related_products?.length || 0} produtos vinculados</p>
        </div>
      </div>
    </div>
  );
}
