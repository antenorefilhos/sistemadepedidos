'use client';

import Modal from '@/components/admin/ui/Modal';
import { FONTS_LIST } from './biolinksDefaults';

// Extraído de BiolinksManager.js: configurações globais de um biolink (fundo, cor, branding, CSS/JS customizado).
export default function BiolinksSettingsModal({ open, onClose, bio, onChange, onSave }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurações do Biolink"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" form="biolink-settings-form" className="btn btn-primary">
            Salvar Configurações
          </button>
        </>
      }
    >
      <form
        id="biolink-settings-form"
        onSubmit={onSave}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="form-control md:col-span-2">
          <label className="label">
            <span className="label-text">Slug do link</span>
          </label>
          <div className="join w-full">
            <span className="join-item bg-base-200 px-4 flex items-center text-xs border border-base-300">/links/</span>
            <input
              type="text"
              required
              autoFocus
              value={bio.slug}
              onChange={(e) => onChange({ ...bio, slug: e.target.value })}
              placeholder="ex: boutique"
              className="input input-bordered join-item flex-grow"
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Título da página</span>
          </label>
          <input
            type="text"
            value={bio.title || ''}
            onChange={(e) => onChange({ ...bio, title: e.target.value })}
            placeholder="ex: Antenor & Filhos | Boutique"
            className="input input-bordered"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Fonte</span>
          </label>
          <select value={bio.font || 'var(--font-sans)'} onChange={(e) => onChange({ ...bio, font: e.target.value })} className="select select-bordered">
            {FONTS_LIST.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control md:col-span-2">
          <label className="label">
            <span className="label-text">Descrição (SEO)</span>
          </label>
          <textarea
            value={bio.description || ''}
            onChange={(e) => onChange({ ...bio, description: e.target.value })}
            placeholder="Descrição sobre a página..."
            className="textarea textarea-bordered"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Tipo de Fundo</span>
          </label>
          <select value={bio.background_type || 'gradient'} onChange={(e) => onChange({ ...bio, background_type: e.target.value })} className="select select-bordered">
            <option value="gradient">Gradiente Linear</option>
            <option value="image">Imagem Customizada</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Cor de Texto Global</span>
          </label>
          <input type="color" value={bio.text_color || '#ffffff'} onChange={(e) => onChange({ ...bio, text_color: e.target.value })} className="input input-bordered w-full" />
        </div>

        {bio.background_type === 'gradient' ? (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Fundo (Gradiente Cor 1)</span>
              </label>
              <input
                type="color"
                value={bio.background_color_one || '#000000'}
                onChange={(e) => onChange({ ...bio, background_color_one: e.target.value })}
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Fundo (Gradiente Cor 2)</span>
              </label>
              <input
                type="color"
                value={bio.background_color_two || '#000000'}
                onChange={(e) => onChange({ ...bio, background_color_two: e.target.value })}
                className="input input-bordered w-full"
              />
            </div>
          </>
        ) : (
          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text">URL da Imagem de Fundo</span>
            </label>
            <input
              type="text"
              value={bio.background_image || ''}
              onChange={(e) => onChange({ ...bio, background_image: e.target.value })}
              placeholder="https://exemplo.com/fundo.jpg"
              className="input input-bordered"
            />
          </div>
        )}

        <div className="form-control md:col-span-2 border-t border-base-300 mt-2 pt-4">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              checked={bio.display_branding !== false}
              onChange={(e) => onChange({ ...bio, display_branding: e.target.checked })}
              className="checkbox checkbox-primary"
            />
            <span className="label-text font-bold">Mostrar Rodapé/Branding</span>
          </label>
        </div>

        {bio.display_branding !== false && (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nome do Rodapé</span>
              </label>
              <input
                type="text"
                value={bio.branding_name || ''}
                onChange={(e) => onChange({ ...bio, branding_name: e.target.value })}
                placeholder="ex: Minha Loja"
                className="input input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Link do Rodapé</span>
              </label>
              <input
                type="text"
                value={bio.branding_url || ''}
                onChange={(e) => onChange({ ...bio, branding_url: e.target.value })}
                placeholder="https://..."
                className="input input-bordered"
              />
            </div>
          </>
        )}

        <div className="form-control md:col-span-2 border-t border-base-300 mt-2 pt-4">
          <label className="label">
            <span className="label-text font-bold text-warning">CSS Personalizado</span>
          </label>
          <textarea
            value={bio.custom_css || ''}
            onChange={(e) => onChange({ ...bio, custom_css: e.target.value })}
            placeholder="/* Digite estilos customizados aqui */"
            className="textarea textarea-bordered text-xs font-mono"
          />
        </div>

        <div className="form-control md:col-span-2">
          <label className="label">
            <span className="label-text font-bold text-warning">JS Personalizado (Scripts)</span>
          </label>
          <textarea
            value={bio.custom_js || ''}
            onChange={(e) => onChange({ ...bio, custom_js: e.target.value })}
            placeholder="<!-- Scripts de analytics, pixels, etc. -->"
            className="textarea textarea-bordered text-xs font-mono"
          />
        </div>
      </form>
    </Modal>
  );
}
