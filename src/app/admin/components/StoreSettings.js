'use client';

import { useState, useEffect, useRef } from 'react';

const DAISYUI_THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave", "retro", "cyberpunk", 
  "valentine", "halloween", "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", 
  "black", "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", 
  "winter", "dim", "nord", "sunset"
];

export default function StoreSettings({ password }) {
  const [settings, setSettings] = useState({
    company_data: { phone: '', address: '', hours: '', instagram: '' },
    cardapio_images: { food: '', drinks: '' },
    admin_theme: { theme: 'light' }
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
        const newSettings = { ...settings };
        data.forEach(item => {
          if (newSettings[item.key] !== undefined) {
            newSettings[item.key] = item.value;
          }
        });
        setSettings(newSettings);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async (key) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/settings?auth=${encodeURIComponent(password)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: settings[key] })
      });
      if (res.ok) {
        alert('Configurações salvas com sucesso!');
        if (key === 'admin_theme') {
            const chosenTheme = settings.admin_theme?.theme || 'light';
            document.documentElement.setAttribute('data-theme', chosenTheme);
            try { 
              localStorage.setItem('admin_theme', chosenTheme);
              window.dispatchEvent(new Event('admin_theme_changed'));
            } catch(e) {}
        }
      } else {
        alert('Erro ao salvar. Verifique se você criou a tabela app_settings no banco.');
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
          ...prev,
          cardapio_images: {
            ...prev.cardapio_images,
            [type]: data.url
          }
        }));
        alert('Imagem enviada! Clique em "Salvar Cardápio" para confirmar.');
      } else {
        alert(data.error || 'Erro ao fazer upload. Verifique as credenciais de FTP no .env');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar imagem.');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 flex justify-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-20 animate-[fadeIn_0.3s_ease]">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-primary mb-1">Configurações da Loja</h2>
          <p className="text-base-content/60 text-sm">Gerencie dados da empresa, cardápio digital e aparência geral.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD: DADOS DA EMPRESA */}
        <div className="card bg-base-200/50 border border-base-300 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-primary border-b border-base-300 pb-2 mb-4">
              <i className="fa-solid fa-building"></i> Dados da Empresa
            </h3>
            
            <div className="form-control w-full mb-3">
              <label className="label"><span className="label-text font-bold">Endereço Principal</span></label>
              <input 
                type="text" 
                className="input input-bordered w-full bg-base-100 focus:border-primary" 
                value={settings.company_data.address || ''}
                onChange={e => setSettings({...settings, company_data: {...settings.company_data, address: e.target.value}})}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-bold text-xs uppercase tracking-wider text-primary">WhatsApp Loja/Boutique</span></label>
                <input 
                  type="text" 
                  className="input input-bordered w-full bg-base-100 focus:border-primary" 
                  value={settings.company_data.phone || ''}
                  onChange={e => setSettings({...settings, company_data: {...settings.company_data, phone: e.target.value}})}
                  placeholder="Ex: (24) 98865-0462"
                />
              </div>
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-bold text-xs uppercase tracking-wider text-primary">WhatsApp Restaurante</span></label>
                <input 
                  type="text" 
                  className="input input-bordered w-full bg-base-100 focus:border-primary" 
                  value={settings.company_data.restaurant_phone || ''}
                  onChange={e => setSettings({...settings, company_data: {...settings.company_data, restaurant_phone: e.target.value}})}
                  placeholder="Ex: (24) 2222-1482"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-bold text-xs uppercase tracking-wider text-primary">Horário Loja/Boutique</span></label>
                <input 
                  type="text" 
                  className="input input-bordered w-full bg-base-100 focus:border-primary" 
                  value={settings.company_data.hours || ''}
                  onChange={e => setSettings({...settings, company_data: {...settings.company_data, hours: e.target.value}})}
                  placeholder="Ter a Sáb: 9h às 21h..."
                />
              </div>
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-bold text-xs uppercase tracking-wider text-primary">Horário Restaurante</span></label>
                <input 
                  type="text" 
                  className="input input-bordered w-full bg-base-100 focus:border-primary" 
                  value={settings.company_data.restaurant_hours || ''}
                  onChange={e => setSettings({...settings, company_data: {...settings.company_data, restaurant_hours: e.target.value}})}
                  placeholder="Qui a Sáb: 12h às 23h..."
                />
              </div>
            </div>

            <div className="form-control w-full mb-3">
              <label className="label"><span className="label-text font-bold">Instagram (URL ou @)</span></label>
              <input 
                type="text" 
                className="input input-bordered w-full bg-base-100 focus:border-primary" 
                value={settings.company_data.instagram || ''}
                onChange={e => setSettings({...settings, company_data: {...settings.company_data, instagram: e.target.value}})}
              />
            </div>

            <div className="form-control w-full mb-6">
              <label className="label">
                <span className="label-text font-bold">Cidades / Bairros Atendidos (Entrega)</span>
                <span className="label-text-alt text-base-content/50">Separados por vírgula</span>
              </label>
              <input 
                type="text" 
                placeholder="Ex: Petrópolis, Itaipava, Nogueira, Corrêas..." 
                className="input input-bordered w-full bg-base-100 focus:border-primary" 
                value={settings.company_data.delivery_areas || ''}
                onChange={e => setSettings({...settings, company_data: {...settings.company_data, delivery_areas: e.target.value}})}
              />
            </div>

            <div className="card-actions justify-end mt-auto">
              <button 
                className="btn btn-primary w-full shadow-md" 
                onClick={() => handleSave('company_data')}
                disabled={saving}
              >
                {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Salvar Dados'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* CARD: APARÊNCIA E TEMA */}
          <div className="card bg-base-200/50 border border-base-300 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-primary border-b border-base-300 pb-2 mb-4">
                <i className="fa-solid fa-palette"></i> Aparência do Painel
              </h3>
              
              <div className="form-control w-full mb-6">
                <label className="label">
                  <span className="label-text font-bold">Tema do Painel</span>
                  <span className="label-text-alt text-base-content/50">Afeta apenas a área administrativa</span>
                </label>
                <select 
                  className="select select-bordered w-full bg-base-100 focus:border-primary"
                  value={settings.admin_theme?.theme || 'light'}
                  onChange={e => {
                    const chosenTheme = e.target.value;
                    setSettings({...settings, admin_theme: { theme: chosenTheme }});
                    document.documentElement.setAttribute('data-theme', chosenTheme);
                    try { 
                      localStorage.setItem('admin_theme', chosenTheme);
                      window.dispatchEvent(new Event('admin_theme_changed'));
                    } catch(e) {}
                  }}
                >
                  {DAISYUI_THEMES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="card-actions justify-end">
                <button 
                  className="btn btn-primary w-full shadow-md" 
                  onClick={() => handleSave('admin_theme')}
                  disabled={saving}
                >
                  Aplicar Tema
                </button>
              </div>
            </div>
          </div>

          {/* CARD: CARDÁPIO DIGITAL */}
          <div className="card bg-base-200/50 border border-base-300 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-primary border-b border-base-300 pb-2 mb-4">
                <i className="fa-solid fa-image"></i> Imagens do Cardápio
              </h3>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="label"><span className="label-text font-bold text-base-content/70">Menu de Alimentação</span></label>
                  <div className="flex items-center gap-4">
                    <div className="avatar">
                      <div className="w-16 rounded border border-base-300 bg-base-100">
                        {settings.cardapio_images.food ? <img src={settings.cardapio_images.food} alt="Food Menu" /> : <div className="w-full h-full bg-base-200 flex items-center justify-center"><i className="fa-solid fa-image text-base-content/30"></i></div>}
                      </div>
                    </div>
                    <input type="file" className="hidden" ref={fileInputFoodRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'food')} />
                    <button className="btn btn-sm btn-outline" onClick={() => fileInputFoodRef.current.click()}>
                      Trocar Imagem
                    </button>
                  </div>
                </div>

                <div className="divider my-0"></div>

                <div>
                  <label className="label"><span className="label-text font-bold text-base-content/70">Carta de Vinhos / Bebidas</span></label>
                  <div className="flex items-center gap-4">
                    <div className="avatar">
                      <div className="w-16 rounded border border-base-300 bg-base-100">
                        {settings.cardapio_images.drinks ? <img src={settings.cardapio_images.drinks} alt="Drinks Menu" /> : <div className="w-full h-full bg-base-200 flex items-center justify-center"><i className="fa-solid fa-image text-base-content/30"></i></div>}
                      </div>
                    </div>
                    <input type="file" className="hidden" ref={fileInputDrinksRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'drinks')} />
                    <button className="btn btn-sm btn-outline" onClick={() => fileInputDrinksRef.current.click()}>
                      Trocar Imagem
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button 
                  className="btn btn-primary w-full shadow-md" 
                  onClick={() => handleSave('cardapio_images')}
                  disabled={saving}
                >
                  {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Salvar Cardápio'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
