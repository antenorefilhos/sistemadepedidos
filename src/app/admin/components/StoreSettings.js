'use client';

import { useState, useEffect } from 'react';

const DAYS_OF_WEEK = [
  { key: 'seg', label: 'Segunda-feira' },
  { key: 'ter', label: 'Terça-feira' },
  { key: 'qua', label: 'Quarta-feira' },
  { key: 'qui', label: 'Quinta-feira' },
  { key: 'sex', label: 'Sexta-feira' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' }
];

const defaultWeeklyHours = () => ({
  seg: { open: '09:00', close: '19:00', closed: false },
  ter: { open: '09:00', close: '19:00', closed: false },
  qua: { open: '09:00', close: '19:00', closed: false },
  qui: { open: '09:00', close: '19:00', closed: false },
  sex: { open: '09:00', close: '19:00', closed: false },
  sab: { open: '09:00', close: '19:00', closed: false },
  dom: { open: '09:00', close: '19:00', closed: true }
});

export default function StoreSettings({ password }) {
  const [settings, setSettings] = useState({
    company_data: { 
      phone: '', 
      address: '', 
      hours: defaultWeeklyHours(), 
      instagram: '',
      delivery_areas: '',
      restaurant_phone: '',
      restaurant_address: '',
      restaurant_hours: defaultWeeklyHours()
    }
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

        // Garantir que os campos de horários sejam objetos semanais válidos
        if (newSettings.company_data) {
          if (typeof newSettings.company_data.hours !== 'object' || newSettings.company_data.hours === null || !newSettings.company_data.hours.seg) {
            newSettings.company_data.hours = defaultWeeklyHours();
          }
          if (typeof newSettings.company_data.restaurant_hours !== 'object' || newSettings.company_data.restaurant_hours === null || !newSettings.company_data.restaurant_hours.seg) {
            newSettings.company_data.restaurant_hours = defaultWeeklyHours();
          }
        }

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
  };

  const renderWeeklyHoursForm = (type) => {
    const weeklyData = settings.company_data[type] || defaultWeeklyHours();
    
    return (
      <div className="flex flex-col gap-2 mt-2 bg-base-200/30 p-4 rounded-lg border border-base-300 w-full">
        <label className="label-text font-bold text-xs uppercase tracking-wider text-base-content/60 mb-2">Horários de Funcionamento por Dia</label>
        {DAYS_OF_WEEK.map(day => {
          const dayInfo = weeklyData[day.key] || { open: '09:00', close: '19:00', closed: false };
          
          return (
            <div key={day.key} className="flex items-center justify-between gap-4 py-2 border-b border-base-300/10 last:border-b-0">
              <span className="text-xs font-bold text-base-content/80 w-24 md:w-28">{day.label}</span>
              
              <div className="flex items-center gap-4">
                <label className="label cursor-pointer p-0 gap-1.5">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-xs checkbox-primary" 
                    checked={dayInfo.closed}
                    onChange={(e) => {
                      const updated = {
                        ...weeklyData,
                        [day.key]: { ...dayInfo, closed: e.target.checked }
                      };
                      setSettings({
                        ...settings,
                        company_data: { ...settings.company_data, [type]: updated }
                      });
                    }}
                  />
                  <span className="label-text text-[11px] font-medium">Fechado</span>
                </label>
                
                <div className="flex items-center gap-1">
                  <input 
                    type="text" 
                    placeholder="09:00" 
                    className="input input-bordered input-xs w-16 text-center bg-base-100 focus:border-primary disabled:opacity-40"
                    value={dayInfo.open || ''}
                    disabled={dayInfo.closed}
                    onChange={(e) => {
                      const updated = {
                        ...weeklyData,
                        [day.key]: { ...dayInfo, open: e.target.value }
                      };
                      setSettings({
                        ...settings,
                        company_data: { ...settings.company_data, [type]: updated }
                      });
                    }}
                  />
                  <span className="text-[10px] text-base-content/40">às</span>
                  <input 
                    type="text" 
                    placeholder="19:00" 
                    className="input input-bordered input-xs w-16 text-center bg-base-100 focus:border-primary disabled:opacity-40"
                    value={dayInfo.close || ''}
                    disabled={dayInfo.closed}
                    onChange={(e) => {
                      const updated = {
                        ...weeklyData,
                        [day.key]: { ...dayInfo, close: e.target.value }
                      };
                      setSettings({
                        ...settings,
                        company_data: { ...settings.company_data, [type]: updated }
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
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
            <i className="fa-solid fa-sliders"></i> Dados da Empresa & Operações
          </h3>
          
          {/* SEÇÃO: BOUTIQUE & ADEGA */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <i className="fa-solid fa-store text-xs"></i> Boutique de Carnes & Adega (Loja)
            </h4>
            <div className="grid grid-cols-1 gap-4 bg-base-100/50 p-4 rounded-lg border border-base-300">
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">Endereço da Boutique</span></label>
                <input 
                  type="text" 
                  className="input input-bordered w-full bg-base-100 focus:border-primary" 
                  value={settings.company_data.address || ''}
                  onChange={e => setSettings({...settings, company_data: {...settings.company_data, address: e.target.value}})}
                  placeholder="Ex: Estrada União Indústria, 12273 - Itaipava"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label"><span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">WhatsApp / Contato Boutique</span></label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full bg-base-100 focus:border-primary mb-3" 
                    value={settings.company_data.phone || ''}
                    onChange={e => setSettings({...settings, company_data: {...settings.company_data, phone: e.target.value}})}
                    placeholder="Ex: (24) 98865-0462"
                  />
                </div>
                <div className="form-control w-full">
                  {renderWeeklyHoursForm('hours')}
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: RESTAURANTE & BISTRÔ */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <i className="fa-solid fa-utensils text-xs"></i> Restaurante & Bistrô
            </h4>
            <div className="grid grid-cols-1 gap-4 bg-base-100/50 p-4 rounded-lg border border-base-300">
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">Endereço do Restaurante</span></label>
                <input 
                  type="text" 
                  className="input input-bordered w-full bg-base-100 focus:border-primary" 
                  value={settings.company_data.restaurant_address || ''}
                  onChange={e => setSettings({...settings, company_data: {...settings.company_data, restaurant_address: e.target.value}})}
                  placeholder="Ex: Estrada União Indústria, 12273 - Itaipava"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label"><span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">WhatsApp / Contato Restaurante</span></label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full bg-base-100 focus:border-primary mb-3" 
                    value={settings.company_data.restaurant_phone || ''}
                    onChange={e => setSettings({...settings, company_data: {...settings.company_data, restaurant_phone: e.target.value}})}
                    placeholder="Ex: (24) 2222-1482"
                  />
                </div>
                <div className="form-control w-full">
                  {renderWeeklyHoursForm('restaurant_hours')}
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: INFORMAÇÕES GERAIS */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <i className="fa-solid fa-globe text-xs"></i> Informações Gerais & Rede Social
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-100/50 p-4 rounded-lg border border-base-300">
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">Instagram</span></label>
                <input 
                  type="text" 
                  className="input input-bordered w-full bg-base-100 focus:border-primary" 
                  value={settings.company_data.instagram || ''}
                  onChange={e => setSettings({...settings, company_data: {...settings.company_data, instagram: e.target.value}})}
                  placeholder="Ex: @antenorefilhos"
                />
              </div>
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">Cidades / Bairros Atendidos (Entrega)</span></label>
                <input 
                  type="text" 
                  className="input input-bordered w-full bg-base-100 focus:border-primary" 
                  value={settings.company_data.delivery_areas || ''}
                  onChange={e => setSettings({...settings, company_data: {...settings.company_data, delivery_areas: e.target.value}})}
                  placeholder="Ex: Petrópolis, Itaipava, Nogueira, Corrêas..."
                />
              </div>
            </div>
          </div>

          <div className="card-actions justify-end mt-4">
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
      </div>
    );
  }
