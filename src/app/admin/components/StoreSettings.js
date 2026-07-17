'use client';

import { useState, useEffect } from 'react';

export default function StoreSettings({ password }) {
  const [settings, setSettings] = useState({
    company_data: { phone: '', address: '', hours: '', instagram: '' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      } else {
        alert('Erro ao salvar. Verifique se você criou a tabela app_settings no banco.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    }
    setSaving(false);
  };



  if (loading) return <div className="p-10 flex justify-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto pb-20 animate-[fadeIn_0.3s_ease]">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-primary mb-1">Configurações da Loja</h2>
          <p className="text-base-content/60 text-sm">Gerencie dados da empresa, horários de funcionamento e links.</p>
        </div>
      </div>

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
  );
}
