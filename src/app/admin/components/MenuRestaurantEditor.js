'use client';

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/admin/ui/ImageUploadField';
import LoadingSpinner from '@/components/admin/ui/LoadingSpinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';

export default function MenuRestaurantEditor({ password }) {
  const [settings, setSettings] = useState({ cardapio_images: { food: '', drinks: '' } });
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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-20 animate-[fadeIn_0.3s_ease]">
      <div>
        <h3 className="text-lg text-base-content font-bold mb-1">Cardápio (Admin)</h3>
        <p className="text-base-content/60 text-sm">Atualize os arquivos visuais dos cardápios exibidos na página pública.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-100 border border-base-300 shadow-xl overflow-hidden">
          <div className="card-body p-6">
            <h4 className="text-sm font-bold text-base-content mb-1">Cardápio À La Carte (Alimentação)</h4>
            <p className="text-xs text-base-content/60 leading-relaxed mb-4">
              Esta imagem representa o menu principal oferecido na Brasa e nos pratos à la carte do restaurante.
            </p>
            <ImageUploadField
              value={settings.cardapio_images.food}
              onChange={setImage('food')}
              uploadType="cardapio"
              password={password}
              label=""
              heightClass="h-48"
            />
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 shadow-xl overflow-hidden">
          <div className="card-body p-6">
            <h4 className="text-sm font-bold text-base-content mb-1">Carta de Vinhos &amp; Bebidas</h4>
            <p className="text-xs text-base-content/60 leading-relaxed mb-4">
              Esta imagem representa a carta de vinhos finos da adega e o menu de drinks/bebidas no local.
            </p>
            <ImageUploadField
              value={settings.cardapio_images.drinks}
              onChange={setImage('drinks')}
              uploadType="cardapio"
              password={password}
              label=""
              heightClass="h-48"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button className="btn btn-primary px-8" onClick={handleSave} disabled={saving}>
          {saving ? <LoadingSpinner size="sm" /> : 'Salvar Alterações do Cardápio'}
        </button>
      </div>
    </div>
  );
}
