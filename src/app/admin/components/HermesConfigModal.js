'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/admin/ui/Modal';
import LoadingSpinner from '@/components/admin/ui/LoadingSpinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';

// Extraído de HermesDashboard.js: modal de configuração do agente (API key + system prompt).
export default function HermesConfigModal({ open, onClose, password }) {
  const [form, setForm] = useState({ api_key: '', system_prompt: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    adminFetch('/api/admin/hermes/config', { password })
      .then((data) => setForm({ api_key: data.api_key || '', system_prompt: data.system_prompt || '' }))
      .catch((err) => console.error(err));
  }, [open, password]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch('/api/admin/hermes/config', { password, method: 'POST', body: form });
      toast.success('Configurações salvas com sucesso!');
      onClose();
    } catch (err) {
      toast.error(`Erro ao salvar configurações: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurações do Agente Hermes"
      icon={<i className="fa-solid fa-gear" aria-hidden="true"></i>}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? <LoadingSpinner size="sm" /> : 'Salvar Configurações'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-bold tracking-widest uppercase text-xs">Gemini API Key</span>
          </label>
          <input
            type="password"
            placeholder="Cole sua API Key do Google AI Studio"
            className="input input-bordered w-full"
            value={form.api_key}
            onChange={(e) => setForm({ ...form, api_key: e.target.value })}
          />
          <label className="label">
            <span className="label-text-alt text-base-content/60">
              Se deixado em branco, o sistema tentará usar a variável de ambiente do servidor.
            </span>
          </label>
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-bold tracking-widest uppercase text-xs">System Prompt (Regras de Comportamento)</span>
          </label>
          <textarea
            placeholder="Ex: Você é o Hermes, especialista em vendas..."
            className="textarea textarea-bordered w-full min-h-[180px]"
            value={form.system_prompt}
            onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
          />
          <label className="label">
            <span className="label-text-alt text-base-content/60">
              Instruções base de como a IA deve agir, qual tom usar e quais restrições ela tem.
            </span>
          </label>
        </div>
      </div>
    </Modal>
  );
}
