'use client';

import Modal from '@/components/admin/ui/Modal';
import { BLOCK_TYPES, defaultBlockSettings } from './biolinksDefaults';

// Extraído de BiolinksManager.js: editor de um bloco (campos variam por tipo).
export default function BiolinksBlockModal({ open, onClose, block, onChange, onSave }) {
  const settings = block.settings || {};
  const updateSettings = (patch) => onChange({ ...block, settings: { ...settings, ...patch } });

  const handleTypeChange = (type) => {
    onChange({ ...block, type, settings: defaultBlockSettings(type) });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurar Bloco"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" form="biolink-block-form" className="btn btn-primary">
            Confirmar Bloco
          </button>
        </>
      }
    >
      <form id="biolink-block-form" onSubmit={onSave} className="flex flex-col gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">Tipo do Bloco</span>
          </label>
          <select value={block.type} onChange={(e) => handleTypeChange(e.target.value)} className="select select-bordered">
            {BLOCK_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {block.type === 'avatar' && (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">URL da Imagem do Perfil</span>
              </label>
              <input
                type="text"
                required
                value={settings.image || ''}
                onChange={(e) => updateSettings({ image: e.target.value })}
                placeholder="/uploads/avatars/imagem.png"
                className="input input-bordered"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tamanho (px)</span>
                </label>
                <input
                  type="number"
                  value={settings.size || 96}
                  onChange={(e) => updateSettings({ size: parseInt(e.target.value, 10) || 96 })}
                  className="input input-bordered"
                />
              </div>
              <BorderRadiusSelect value={settings.border_radius} onChange={(v) => updateSettings({ border_radius: v })} />
            </div>
          </>
        )}

        {block.type === 'heading' && (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Texto do Título</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={settings.text || ''}
                onChange={(e) => updateSettings({ text: e.target.value })}
                className="input input-bordered"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tamanho (Tag)</span>
                </label>
                <select value={settings.heading_type || 'h2'} onChange={(e) => updateSettings({ heading_type: e.target.value })} className="select select-bordered">
                  {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => (
                    <option key={tag} value={tag}>
                      Título {tag.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Cor do Texto</span>
                </label>
                <input type="color" value={settings.text_color || '#ffffff'} onChange={(e) => updateSettings({ text_color: e.target.value })} className="input input-bordered w-full" />
              </div>
            </div>
          </>
        )}

        {block.type === 'paragraph' && (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Texto do Parágrafo</span>
              </label>
              <textarea required autoFocus value={settings.text || ''} onChange={(e) => updateSettings({ text: e.target.value })} className="textarea textarea-bordered" />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Cor do Texto</span>
              </label>
              <input type="color" value={settings.text_color || '#ffffff'} onChange={(e) => updateSettings({ text_color: e.target.value })} className="input input-bordered w-full" />
            </div>
          </>
        )}

        {block.type === 'link' && (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nome do Botão</span>
              </label>
              <input type="text" required autoFocus value={settings.name || ''} onChange={(e) => updateSettings({ name: e.target.value })} className="input input-bordered" />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">URL de Destino</span>
              </label>
              <input
                type="text"
                required
                value={block.location_url || ''}
                onChange={(e) => onChange({ ...block, location_url: e.target.value })}
                placeholder="https://..."
                className="input input-bordered"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">URL do Ícone do Botão</span>
              </label>
              <input
                type="text"
                value={settings.image || ''}
                onChange={(e) => updateSettings({ image: e.target.value })}
                placeholder="ex: https://site.com/icone.png"
                className="input input-bordered"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Fundo do Botão</span>
                </label>
                <input type="color" value={settings.background_color || '#ffffff'} onChange={(e) => updateSettings({ background_color: e.target.value })} className="input input-bordered w-full" />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Cor do Texto</span>
                </label>
                <input type="color" value={settings.text_color || '#000000'} onChange={(e) => updateSettings({ text_color: e.target.value })} className="input input-bordered w-full" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-base-300 mt-2 pt-4">
              <BorderRadiusSelect value={settings.border_radius} onChange={(v) => updateSettings({ border_radius: v })} />
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Largura Borda</span>
                </label>
                <input
                  type="number"
                  value={settings.border_width || 0}
                  onChange={(e) => updateSettings({ border_width: parseInt(e.target.value, 10) || 0 })}
                  className="input input-bordered"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Estilo Borda</span>
                </label>
                <select value={settings.border_style || 'solid'} onChange={(e) => updateSettings({ border_style: e.target.value })} className="select select-bordered">
                  <option value="solid">Sólida</option>
                  <option value="dashed">Tracejada</option>
                  <option value="dotted">Pontilhada</option>
                  <option value="double">Dupla</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Cor da Borda</span>
                </label>
                <input type="color" value={settings.border_color || '#000000'} onChange={(e) => updateSettings({ border_color: e.target.value })} className="input input-bordered w-full" />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Animação de Entrada</span>
                </label>
                <select value={settings.animation || 'false'} onChange={(e) => updateSettings({ animation: e.target.value })} className="select select-bordered">
                  <option value="false">Nenhuma</option>
                  <option value="bounce">Salto (Bounce)</option>
                  <option value="tada">Tada (Festa)</option>
                  <option value="wobble">Oscilação (Wobble)</option>
                  <option value="shake">Tremor (Shake)</option>
                  <option value="pulse">Pulso (Pulse)</option>
                </select>
              </div>
            </div>

            <div className="form-control border-t border-base-300 mt-2 pt-4">
              <label className="label">
                <span className="label-text font-bold">Sombra (CSS Box Shadow)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <NumberField label="Sombra X (px)" value={settings.border_shadow_offset_x} onChange={(v) => updateSettings({ border_shadow_offset_x: v })} />
                <NumberField label="Sombra Y (px)" value={settings.border_shadow_offset_y ?? 6} onChange={(v) => updateSettings({ border_shadow_offset_y: v })} />
                <NumberField label="Desfoque (Blur)" value={settings.border_shadow_blur ?? 20} onChange={(v) => updateSettings({ border_shadow_blur: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Cor da Sombra</span>
                  </label>
                  <input
                    type="text"
                    value={settings.border_shadow_color || '#00000015'}
                    onChange={(e) => updateSettings({ border_shadow_color: e.target.value })}
                    placeholder="rgba(0,0,0,0.1) ou #hex"
                    className="input input-bordered text-xs"
                  />
                </div>
                <NumberField label="Espalhamento (Spread)" value={settings.border_shadow_spread} onChange={(v) => updateSettings({ border_shadow_spread: v })} />
              </div>
            </div>
          </>
        )}

        {block.type === 'phone_collector' && (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Título do Captador</span>
              </label>
              <input type="text" required autoFocus value={settings.name || ''} onChange={(e) => updateSettings({ name: e.target.value })} className="input input-bordered" />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Texto do Botão</span>
              </label>
              <input type="text" required value={settings.button_text || ''} onChange={(e) => updateSettings({ button_text: e.target.value })} className="input input-bordered" />
            </div>
          </>
        )}

        <div className="form-control mt-2 border-t border-base-300 pt-4">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              checked={block.is_enabled}
              onChange={(e) => onChange({ ...block, is_enabled: e.target.checked })}
              className="checkbox checkbox-primary"
            />
            <span className="label-text font-bold">Bloco Ativo/Habilitado</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

function BorderRadiusSelect({ value, onChange }) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text">Formato das Bordas</span>
      </label>
      <select value={value || 'round'} onChange={(e) => onChange(e.target.value)} className="select select-bordered">
        <option value="round">Totalmente Redondo</option>
        <option value="rounded">Arredondado</option>
        <option value="straight">Reto</option>
      </select>
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div>
      <span className="text-xs opacity-75">{label}</span>
      <input
        type="number"
        value={value || 0}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="input input-bordered text-xs w-full"
      />
    </div>
  );
}
