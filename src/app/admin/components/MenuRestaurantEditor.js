'use client';

import { useState, useEffect, useRef } from 'react';

export default function MenuRestaurantEditor({ password }) {
  const [settings, setSettings] = useState({
    cardapio_images: { food: '', drinks: '' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const fileInputFoodRef = useRef(null);
  const fileInputDrinksRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/settings?auth=${encodeURIComponent(password)}`);
      if (res.ok) {
        const data = await res.json();
        const cardapioData = data.find(item => item.key === 'cardapio_images');
        if (cardapioData && cardapioData.value) {
          setSettings({ cardapio_images: cardapioData.value });
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/settings?auth=${encodeURIComponent(password)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'cardapio_images', value: settings.cardapio_images })
      });
      if (res.ok) {
        alert('Imagens do cardápio atualizadas com sucesso!');
      } else {
        alert('Erro ao salvar imagens.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    }
    setSaving(false);
  };

  const handleFileUpload = async (e, type) => {
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
        setSettings(prev => ({
          cardapio_images: {
            ...prev.cardapio_images,
            [type]: data.url
          }
        }));
        alert('Upload concluído com sucesso!');
      } else {
        alert(data.error || 'Erro no upload.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar arquivo.');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 flex justify-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-20 animate-[fadeIn_0.3s_ease]">
      <div>
        <h2 className="text-xl font-bold text-primary mb-1">Editor de Cardápio (Restaurante)</h2>
        <p className="text-base-content/60 text-sm">Atualize com facilidade os arquivos visuais dos cardápios exibidos na página pública.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD CARDAPIO COMIDAS */}
        <div className="card bg-base-100 border border-base-300 shadow-xl overflow-hidden">
          <figure className="h-64 bg-base-200 relative flex items-center justify-center border-b border-base-200">
            {settings.cardapio_images.food ? (
              <img src={settings.cardapio_images.food} alt="Cardápio À La Carte" className="object-cover w-full h-full" />
            ) : (
              <div className="flex flex-col items-center text-base-content/30 gap-2">
                <i className="fa-solid fa-image text-4xl"></i>
                <span className="text-xs uppercase tracking-wider font-bold">Sem imagem definida</span>
              </div>
            )}
          </figure>
          <div className="card-body p-6">
            <h3 className="card-title text-base-content text-base font-bold">Cardápio À La Carte (Alimentação)</h3>
            <p className="text-xs text-base-content/60 leading-relaxed mb-4">
              Esta imagem representa o menu principal oferecido na Brasa e nos pratos à la carte do restaurante.
            </p>
            <div className="card-actions flex gap-2">
              <input type="file" className="hidden" ref={fileInputFoodRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'food')} />
              <button className="btn btn-sm btn-outline flex-grow" onClick={() => fileInputFoodRef.current.click()} disabled={saving}>
                Fazer Upload
              </button>
            </div>
          </div>
        </div>

        {/* CARD BEBIDAS / ADEGA */}
        <div className="card bg-base-100 border border-base-300 shadow-xl overflow-hidden">
          <figure className="h-64 bg-base-200 relative flex items-center justify-center border-b border-base-200">
            {settings.cardapio_images.drinks ? (
              <img src={settings.cardapio_images.drinks} alt="Carta de Vinhos e Bebidas" className="object-cover w-full h-full" />
            ) : (
              <div className="flex flex-col items-center text-base-content/30 gap-2">
                <i className="fa-solid fa-image text-4xl"></i>
                <span className="text-xs uppercase tracking-wider font-bold">Sem imagem definida</span>
              </div>
            )}
          </figure>
          <div className="card-body p-6">
            <h3 className="card-title text-base-content text-base font-bold">Carta de Vinhos &amp; Bebidas</h3>
            <p className="text-xs text-base-content/60 leading-relaxed mb-4">
              Esta imagem representa a carta de vinhos finos da adega e o menu de drinks/bebidas no local.
            </p>
            <div className="card-actions flex gap-2">
              <input type="file" className="hidden" ref={fileInputDrinksRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'drinks')} />
              <button className="btn btn-sm btn-outline flex-grow" onClick={() => fileInputDrinksRef.current.click()} disabled={saving}>
                Fazer Upload
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end mt-4">
        <button className="btn btn-primary px-8" onClick={handleSave} disabled={saving}>
          {saving ? <span className="loading loading-spinner"></span> : 'Salvar Alterações do Cardápio'}
        </button>
      </div>
    </div>
  );
}
