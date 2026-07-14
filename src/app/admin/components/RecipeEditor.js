'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Carregar WYSIWYG dinamicamente para não quebrar SSR (apesar do Admin já ser client-side)
const Editor = dynamic(() => import('react-simple-wysiwyg').then(mod => mod.DefaultEditor), { ssr: false });

export default function RecipeEditor({ password, products }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  
  const [form, setForm] = useState({
    id: null,
    title: '',
    description: '',
    prep_time: '',
    servings: '',
    difficulty: 'Fácil',
    image_url: '',
    related_products: []
  });

  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recipes');
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleOpenForm = (recipe = null) => {
    if (recipe) {
      setForm({
        id: recipe.id,
        title: recipe.title || '',
        description: recipe.description || '',
        prep_time: recipe.prep_time || '',
        servings: recipe.servings || '',
        difficulty: recipe.difficulty || 'Fácil',
        image_url: recipe.image_url || '',
        related_products: recipe.related_products || []
      });
    } else {
      setForm({
        id: null,
        title: '',
        description: '',
        prep_time: '',
        servings: '',
        difficulty: 'Fácil',
        image_url: '',
        related_products: []
      });
    }
    setSelectedRecipe(recipe || { isNew: true });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const method = form.id ? 'PUT' : 'POST';
      const payload = { ...form };
      if (!payload.id) delete payload.id; // Let DB generate ID for new rows

      const res = await fetch(`/api/admin/recipes?auth=${encodeURIComponent(password)}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert(form.id ? 'Receita atualizada!' : 'Receita criada!');
        setSelectedRecipe(null);
        fetchRecipes();
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar receita.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta receita permanentemente?')) return;
    
    try {
      const res = await fetch(`/api/admin/recipes?id=${id}&auth=${encodeURIComponent(password)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchRecipes();
        if (selectedRecipe && selectedRecipe.id === id) {
          setSelectedRecipe(null);
        }
      } else {
        alert('Erro ao excluir receita.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/upload?auth=${encodeURIComponent(password)}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (res.ok && data.url) {
        setForm(prev => ({ ...prev, image_url: data.url }));
        alert('Imagem enviada com sucesso!');
      } else {
        alert(data.error || 'Erro no upload.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar imagem.');
    }
    setSaving(false);
  };

  const toggleProduct = (productIdStr) => {
    const current = [...form.related_products];
    if (current.includes(productIdStr)) {
      setForm({ ...form, related_products: current.filter(id => id !== productIdStr) });
    } else {
      current.push(productIdStr);
      setForm({ ...form, related_products: current });
    }
  };

  if (loading && recipes.length === 0) {
    return <div className="p-10 flex justify-center"><span className="loading loading-spinner text-primary"></span></div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-base-content mb-1">Editor de Receitas</h2>
          <p className="text-base-content/60 text-sm">Crie conteúdos ricos vinculando produtos da boutique.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <i className="fa-solid fa-plus"></i> Nova Receita
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LISTA DE RECEITAS */}
        <div className="col-span-1 flex flex-col gap-3">
          {recipes.map(recipe => (
            <div 
              key={recipe.id} 
              className={`card bg-base-100 shadow-sm border cursor-pointer transition-all hover:border-primary/50 ${selectedRecipe?.id === recipe.id ? 'border-primary' : 'border-base-300'}`}
              onClick={() => handleOpenForm(recipe)}
            >
              <div className="card-body p-4 flex-row items-center gap-4">
                <div className="w-12 h-12 rounded bg-base-300 flex-shrink-0 overflow-hidden border border-base-300 relative flex items-center justify-center">
                  {recipe.image_url 
                    ? <img 
                        src={recipe.image_url} 
                        alt={recipe.title} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.target.style.display='none'; const sibling = e.target.nextElementSibling; if (sibling) sibling.style.display='block'; }}
                      />
                    : null
                  }
                  <i className="fa-solid fa-utensils text-base-content/20 text-sm" style={{ display: recipe.image_url ? 'none' : 'block' }}></i>
                </div>
                <div>
                  <h3 className="font-bold text-base-content text-sm line-clamp-1">{recipe.title}</h3>
                  <div className="flex gap-1.5 flex-wrap mt-1 text-[10px]">
                    {recipe.prep_time && <span className="bg-base-200 px-1.5 py-0.5 rounded text-base-content/70">⏱️ {recipe.prep_time}</span>}
                    {recipe.servings && <span className="bg-base-200 px-1.5 py-0.5 rounded text-base-content/70">👥 {recipe.servings} porções</span>}
                    {recipe.difficulty && <span className="bg-base-200 px-1.5 py-0.5 rounded text-base-content/70">🔥 {recipe.difficulty}</span>}
                  </div>
                  <p className="text-[10px] text-base-content/50 mt-1">{recipe.related_products?.length || 0} produtos vinculados</p>
                </div>
              </div>
            </div>
          ))}
          {recipes.length === 0 && (
            <div className="text-center p-6 bg-base-100 border border-dashed border-base-300 rounded-xl text-base-content/50">
              Nenhuma receita cadastrada.
            </div>
          )}
        </div>

        {/* FORMULÁRIO DE EDIÇÃO */}
        {selectedRecipe && (
          <div className="col-span-2 card bg-base-100 border border-base-300 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center border-b border-base-200 pb-4 mb-4">
                <h3 className="card-title text-primary">
                  {form.id ? 'Editar Receita' : 'Criar Nova Receita'}
                </h3>
                {form.id && (
                  <button className="btn btn-sm btn-error btn-outline" onClick={() => handleDelete(form.id)}>
                    Excluir
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="form-control w-full">
                  <label className="label"><span className="label-text text-base-content/75 font-semibold">Título da Receita</span></label>
                  <input 
                    type="text" 
                    required 
                    className="input input-bordered w-full" 
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control w-full">
                    <label className="label"><span className="label-text text-base-content/75 font-semibold">Tempo de Preparo</span></label>
                    <input 
                      type="text" 
                      placeholder="Ex: 45min" 
                      className="input input-bordered w-full" 
                      value={form.prep_time}
                      onChange={e => setForm({...form, prep_time: e.target.value})}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label"><span className="label-text text-base-content/75 font-semibold">Rendimento (Porções)</span></label>
                    <input 
                      type="number" 
                      placeholder="Ex: 4" 
                      className="input input-bordered w-full" 
                      value={form.servings}
                      onChange={e => setForm({...form, servings: e.target.value})}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label"><span className="label-text text-base-content/75 font-semibold">Nível de Dificuldade</span></label>
                    <select 
                      className="select select-bordered w-full"
                      value={form.difficulty}
                      onChange={e => setForm({...form, difficulty: e.target.value})}
                    >
                      <option value="Fácil">Fácil</option>
                      <option value="Médio">Médio</option>
                      <option value="Difícil">Difícil</option>
                    </select>
                  </div>
                </div>

                <div className="form-control w-full">
                  <label className="label"><span className="label-text text-base-content/75 font-semibold">Imagem da Receita</span></label>
                  <div className="flex items-center gap-4">
                    {form.image_url && (
                      <div className="w-20 h-20 rounded overflow-hidden border border-base-300 flex-shrink-0 relative flex items-center justify-center bg-base-200">
                        <img 
                          src={form.image_url} 
                          alt="Preview" 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.target.style.display='none'; const sibling = e.target.nextElementSibling; if (sibling) sibling.style.display='block'; }}
                        />
                        <i className="fa-solid fa-utensils text-base-content/20 text-xl" style={{ display: 'none' }}></i>
                      </div>
                    )}
                    <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />
                    <button type="button" className="btn btn-sm btn-outline border-base-300" onClick={() => fileInputRef.current.click()} disabled={saving}>
                      {saving ? 'Enviando...' : 'Fazer Upload'}
                    </button>
                  </div>
                </div>

                <div className="form-control w-full">
                  <label className="label"><span className="label-text text-base-content/75 font-semibold">Ingredientes e Modo de Preparo</span></label>
                  <div className="border border-base-300 rounded-lg overflow-hidden">
                    <Editor 
                      value={form.description} 
                      onChange={(e) => setForm({...form, description: e.target.value})} 
                      containerProps={{ style: { height: '300px', overflowY: 'auto' } }}
                    />
                  </div>
                </div>

                <div className="form-control w-full mt-4">
                  <label className="label">
                    <span className="label-text text-base-content/75 font-semibold">Vincular Produtos (Aparecerão no rodapé da receita)</span>
                  </label>
                  <div className="mb-2">
                    <input 
                      type="text" 
                      placeholder="🔍 Buscar produto pelo nome..." 
                      className="input input-sm input-bordered w-full"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                  <div className="bg-base-200 border border-base-300 rounded-lg p-2 max-h-60 overflow-y-auto flex flex-col gap-1">
                    {products?.filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase())).map(prod => {
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
                          <span className="label-text text-base-content">{prod.title} <span className="text-base-content/50 text-xs">({prod.type})</span></span>
                        </label>
                      );
                    })}
                    {products?.filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                      <div className="text-center p-4 text-xs text-base-content/50 italic">Nenhum produto encontrado.</div>
                    )}
                  </div>
                </div>

                <div className="card-actions justify-end mt-6">
                  <button type="button" className="btn btn-ghost" onClick={() => setSelectedRecipe(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="loading loading-spinner"></span> : 'Salvar Receita'}
                  </button>
                </div>
   