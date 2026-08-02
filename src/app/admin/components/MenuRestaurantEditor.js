'use client';

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/admin/ui/ImageUploadField';
import LoadingSpinner from '@/components/admin/ui/LoadingSpinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';

export default function MenuRestaurantEditor({ password }) {
  const [settings, setSettings] = useState({ cardapio_images: { food: '', drinks: '', breakfast: '' } });
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
      const cardapioData = data.find((item) => item.key === 'cardapio_images');
      if (cardapioData?.value) {
        setSettings({ cardapio_images: cardapioData.value });
      }
    } catch (err) {
      toast.error(`Erro ao carregar configurações: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch('/api/admin/settings', {
        password,
        method: 'POST',
        body: { key: 'cardapio_images', value: settings.cardapio_images },
      });
      toast.success('Imagens do cardápio atualizadas com sucesso!');
    } catch (err) {
      toast.error(`Erro ao salvar imagens: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const setImage = (type) => (url) => {
    setSettings((prev) => ({ cardapio_images: { ...prev.cardapio_images, [type]: url } }));
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-20 animate-[fadeIn_0.3s_ease]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm">
        <div>
          <h3 className="text-xl text-base-content font-bold mb-1">Cardápios do Restaurante (Admin)</h3>
          <p className="text-base-content/60 text-sm">Gerencie e substitua as imagens dos cardápios (salvas no Supabase Storage) exibidas na página pública.</p>
        </div>
        <button className="btn btn-primary px-8 gap-2 font-bold shadow-md self-start sm:self-auto shrink-0" onClick={handleSave} disabled={saving}>
          {saving ? <LoadingSpinner size="sm" /> : <><i className="fa-solid fa-floppy-disk"></i> Salvar Alterações</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 border border-base-300 shadow-xl overflow-hidden">
          <div className="card-body p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h4 className="text-base font-bold text-base-content">Cardápio À La Carte</h4>
              </div>
              <p className="text-xs text-base-content/60 leading-relaxed mb-4">
                Imagem do menu principal de carnes na brasa, entradas e pratos à la carte do restaurante.
              </p>
            </div>
            <ImageUploadField
              value={settings.cardapio_images.food}
              onChange={setImage('food')}
              uploadType="cardapio"
              password={password}
              label=""
              heightClass="h-56"
            />
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 shadow-xl overflow-hidden">
          <div className="card-body p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <h4 className="text-base font-bold text-base-content">☕ Café da Manhã</h4>
              </div>
              <p className="text-xs text-base-content/60 leading-relaxed mb-4">
                Imagem do menu especial de café da manhã servido no restaurante.
              </p>
            </div>
            <ImageUploadField
              value={settings.cardapio_images.breakfast}
              onChange={setImage('breakfast')}
              uploadType="cardapio"
              password={password}
              label=""
              heightClass="h-56"
            />
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 shadow-xl overflow-hidden">
          <div className="card-body p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <h4 className="text-base font-bold text-base-content">🍷 Carta de Vinhos &amp; Bebidas</h4>
              </div>
              <p className="text-xs text-base-content/60 leading-relaxed mb-4">
                Imagem da carta de vinhos finos da adega e menu de bebidas do restaurante.
              </p>
            </div>
            <ImageUploadField
              value={settings.cardapio_images.drinks}
              onChange={setImage('drinks')}
              uploadType="cardapio"
              password={password}
              label=""
              heightClass="h-56"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <button className="btn btn-primary px-8 gap-2 font-bold shadow-md" onClick={handleSave} disabled={saving}>
          {saving ? <LoadingSpinner size="sm" /> : <><i className="fa-solid fa-floppy-disk"></i> Salvar Alterações dos Cardápios</>}
        </button>
      </div>
    </div>
  );
}
