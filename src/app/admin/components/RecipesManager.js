'use client';

import { useState, useEffect } from 'react';

export default function RecipesManager({ authPass }) {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    prep_time: '',
    image_url: '',
    related_products: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, prodRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/products')
      ]);
      
      if (recRes.ok) setRecipes(await recRes.json());
      if (prodRes.ok) {
        const allProds = await prodRes.json();
        // Filtrar apenas carnes
        setProducts(allProds.filter(p => p.type === 'carnes_'));
      }
    } catch (err) {
      console.error('Error fetching recipes data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (recipe = null) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        instructions: recipe.instructions || '',
        prep_time: recipe.prep_time || '',
        image_url: recipe.image_url || '',
        related_products: recipe.related_products || []
      });
    } else {
      setEditingRecipe(null);
      setFormData({
        title: '',
        description: '',
        instructions: '',
        prep_time: '',
        image_url: '',
        related_products: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecipe(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = '/api/admin/recipes?auth=' + authPass;
      const method = editingRecipe ? 'PUT' : 'POST';
      const body = { ...formData };
      if (editingRecipe) body.id = editingRecipe.id;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert('Receita salva com sucesso!');
        handleCloseModal();
        fetchData();
      } else {
        const error = await res.json();
        alert('Erro ao salvar receita: ' + error.error);
      }
    } catch (err) {
      alert('Erro inesperado: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover esta receita?')) return;
    try {
      const res = await fetch(`/api/admin/recipes?auth=${authPass}&id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Erro ao deletar.');
      }
    } catch (err) {
      alert('Erro inesperado: ' + err.message);
    }
  };

  const toggleProduct = (productId) => {
    const pId = String(productId);
    if (formData.related_products.includes(pId)) {
      setFormData({ ...formData, related_products: formData.related_products.filter(id => id !== pId) });
    } else {
      setFormData({ ...formData, related_products: [...formData.related_products, pId] });
    }
  };

  return (
    <div className="bg-white text-black p-6 rounded shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wider">Gestão de Receitas</h2>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-[#D2BB8A] text-black px-4 py-2 font-bold text-sm uppercase tracking-wider hover:bg-black hover:text-[#D2BB8A] transition-colors"
        >
          + Nova Receita
        </button>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Nenhuma receita cadastrada ainda.</div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-3 px-2 uppercase text-xs font-bold">Título</th>
              <th className="py-3 px-2 uppercase text-xs font-bold">Tempo</th>
              <th className="py-3 px-2 uppercase text-xs font-bold">Produtos Vinculados</th>
              <th className="py-3 px-2 uppercase text-xs font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map(recipe => (
              <tr key={recipe.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-2 font-semibold">{recipe.title}</td>
                <td className="py-3 px-2 text-sm">{recipe.prep_time}</td>
                <td className="py-3 px-2 text-sm">{recipe.related_products?.length || 0}</td>
                <td className="py-3 px-2 text-right">
                  <button onClick={() => handleOpenModal(recipe)} className="text-blue-600 mr-4 font-bold text-sm hover:underline">Editar</button>
                  <button onClick={() => handleDelete(recipe.id)} className="text-red-600 font-bold text-sm hover:underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl my-10 p-8 relative">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-2xl font-bold">&times;</button>
            <h3 className="text-base font-bold uppercase tracking-wider mb-6 border-b border-black pb-2">
              {editingRecipe ? 'Editar Receita' : 'Nova Receita'}
            </h3>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Título da Receita</label>
                <input required type="text" className="w-full border border-gray-300 p-2" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Tempo de Preparo / Rendimento</label>
                  <input type="text" placeholder="Ex: 40 min / Serve 4" className="w-full border border-gray-300 p-2" value={formData.prep_time} onChange={e => setFormData({...formData, prep_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">URL da Imagem (Opcional)</label>
                  <input type="text" className="w-full border border-gray-300 p-2" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Descrição Curta</label>
                <textarea className="w-full border border-gray-300 p-2 h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Modo de Preparo / Ingredientes (HTML permitido)</label>
                <textarea className="w-full border border-gray-300 p-2 h-40 font-mono text-sm" value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})}></textarea>
              </div>

              <div className="border-t border-black pt-4 mt-2">
                <label className="block text-xs font-bold uppercase mb-2 text-[#D2BB8A]">Vincular a Carnes da Loja</label>
                <p className="text-xs text-gray-500 mb-4">Selecione os produtos que esta receita utiliza. Ela aparecerá na página destes produtos.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200">
                  {products.map(p => {
                    const isChecked = formData.related_products.includes(String(p.id));
                    return (
                      <label key={p.id} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-1">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => toggleProduct(p.id)}
                          className="mt-1"
                        />
                        <span className="text-xs truncate" dangerouslySetInnerHTML={{ __html: p.title }} />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button type="submit" className="bg-black text-[#D2BB8A] font-bold uppercase tracking-widest px-8 py-3 hover:bg-[#D2BB8A] hover:text-black transition-colors">
                  Salvar Receita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
