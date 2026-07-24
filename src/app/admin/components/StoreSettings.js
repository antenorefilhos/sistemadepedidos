'use client';

import { useEffect, useState } from 'react';
import WeeklyHoursForm, { defaultWeeklyHours } from './WeeklyHoursForm';
import LoadingSpinner from '@/components/admin/ui/LoadingSpinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';
import { DEFAULT_DISCOUNT_CONFIG } from '@/lib/pricing';

const INITIAL_COMPANY_DATA = {
  phone: '',
  address: '',
  hours: defaultWeeklyHours(),
  instagram: '',
  delivery_areas: '',
  restaurant_phone: '',
  restaurant_address: '',
  restaurant_hours: defaultWeeklyHours(),
};

export default function StoreSettings({ password }) {
  const [settings, setSettings] = useState({ company_data: INITIAL_COMPANY_DATA, discount: DEFAULT_DISCOUNT_CONFIG });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/api/admin/settings', { password });
      const companyItem = data.find((item) => item.key === 'company_data');
      const discountItem = data.find((item) => item.key === 'adega_discount');
      setSettings((prev) => ({
        company_data: companyItem?.value
          ? {
              ...INITIAL_COMPANY_DATA,
              ...companyItem.value,
              hours: companyItem.value.hours?.seg ? companyItem.value.hours : defaultWeeklyHours(),
              restaurant_hours: companyItem.value.restaurant_hours?.seg ? companyItem.value.restaurant_hours : defaultWeeklyHours(),
            }
          : prev.company_data,
        discount: discountItem?.value ? { ...DEFAULT_DISCOUNT_CONFIG, ...discountItem.value } : DEFAULT_DISCOUNT_CONFIG,
      }));
    } catch (err) {
      toast.error(`Erro ao carregar configurações: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setSettings((prev) => ({ ...prev, company_data: { ...prev.company_data, [field]: value } }));
  };

  const updateDiscountField = (field, value) => {
    setSettings((prev) => ({ ...prev, discount: { ...prev.discount, [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch('/api/admin/settings', { password, method: 'POST', body: { key: 'company_data', value: settings.company_data } });
      await adminFetch('/api/admin/settings', { password, method: 'POST', body: { key: 'adega_discount', value: settings.discount } });
      toast.success('Configurações salvas com sucesso!');
    } catch (err) {
      toast.error(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl w-full mx-auto pb-20 animate-[fadeIn_0.3s_ease]">
      <div>
        <h3 className="text-lg text-base-content font-bold mb-1">Configurações</h3>
        <p className="text-base-content/60 text-sm">Dados das frentes de negócio, horários de funcionamento e links.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <ContactSection
          icon="fa-store"
          title="Boutique & Adega (Loja)"
          address={settings.company_data.address}
          onAddressChange={(v) => updateField('address', v)}
          phone={settings.company_data.phone}
          onPhoneChange={(v) => updateField('phone', v)}
          addressPlaceholder="Ex: Estrada União Indústria, 12273 - Itaipava"
          phonePlaceholder="Ex: (24) 98865-0462"
          hours={settings.company_data.hours}
          onHoursChange={(v) => updateField('hours', v)}
        />

        <ContactSection
          icon="fa-utensils"
          title="Restaurante & Bistrô"
          address={settings.company_data.restaurant_address}
          onAddressChange={(v) => updateField('restaurant_address', v)}
          phone={settings.company_data.restaurant_phone}
          onPhoneChange={(v) => updateField('restaurant_phone', v)}
          addressPlaceholder="Ex: Estrada União Indústria, 12273 - Itaipava"
          phonePlaceholder="Ex: (24) 2222-1482"
          hours={settings.company_data.restaurant_hours}
          onHoursChange={(v) => updateField('restaurant_hours', v)}
        />
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-xl w-full">
        <div className="card-body p-6">
          <h4 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-base-300 pb-2 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-wine-bottle" aria-hidden="true"></i> Desconto de Caixa (Adega)
          </h4>

          <label className="flex items-center gap-3 cursor-pointer mb-5 w-fit">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={settings.discount.enabled !== false}
              onChange={(e) => updateDiscountField('enabled', e.target.checked)}
            />
            <span className="text-sm font-semibold text-base-content">
              {settings.discount.enabled !== false ? 'Desconto ativo' : 'Desconto desativado'}
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">Desconto Caixa 6 un. (%)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="input input-bordered w-full"
                value={settings.discount.cx6}
                onChange={(e) => updateDiscountField('cx6', e.target.value === '' ? '' : Number(e.target.value))}
                disabled={settings.discount.enabled === false}
                placeholder="Ex: 5"
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">Desconto Caixa 12 un. (%)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="input input-bordered w-full"
                value={settings.discount.cx12}
                onChange={(e) => updateDiscountField('cx12', e.target.value === '' ? '' : Number(e.target.value))}
                disabled={settings.discount.enabled === false}
                placeholder="Ex: 10"
              />
            </div>
          </div>

          <p className="text-xs text-base-content/50 mt-3">
            Vale apenas para produtos da Adega, por quantidade total de garrafas do vinho no carrinho (6+ ou 12+). Aplicado de forma autoritativa no checkout.
          </p>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-xl w-full">
        <div className="card-body p-6">
          <h4 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-base-300 pb-2 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-globe" aria-hidden="true"></i> Geral &amp; Redes Sociais
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">Instagram</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={settings.company_data.instagram || ''}
                onChange={(e) => updateField('instagram', e.target.value)}
                placeholder="Ex: @antenorefilhos"
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">
                  Cidades / Bairros Atendidos (Entrega)
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={settings.company_data.delivery_areas || ''}
                onChange={(e) => updateField('delivery_areas', e.target.value)}
                placeholder="Ex: Petrópolis, Itaipava, Nogueira, Corrêas..."
              />
            </div>
          </div>

          <div className="card-actions justify-end">
            <button className="btn btn-primary w-full md:w-64 font-bold" onClick={handleSave} disabled={saving}>
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk mr-2" aria-hidden="true"></i> Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactSection({ icon, title, address, onAddressChange, phone, onPhoneChange, addressPlaceholder, phonePlaceholder, hours, onHoursChange }) {
  return (
    <div className="card bg-base-100 border border-base-300 shadow-xl">
      <div className="card-body p-6 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-base-300 pb-2 mb-4 flex items-center gap-2">
            <i className={`fa-solid ${icon}`} aria-hidden="true"></i> {title}
          </h4>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">Endereço</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={address || ''}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder={addressPlaceholder}
            />
          </div>

          <div className="form-control w-full mb-5">
            <label className="label">
              <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">WhatsApp / Contato</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={phone || ''}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder={phonePlaceholder}
            />
          </div>

          <WeeklyHoursForm value={hours} onChange={onHoursChange} />
        </div>
      </div>
    </div>
  );
}
