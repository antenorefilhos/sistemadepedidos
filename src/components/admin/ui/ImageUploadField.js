'use client';

import { useRef, useState } from 'react';
import { adminFetch } from '../hooks/useAdminFetch';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import LoadingSpinner from './LoadingSpinner';

const STORAGE_MARKER = '/storage/v1/object/public/imagens/';

// Unifica a lógica de upload com drag-and-drop de ProductEditor.js (que já fazia bem) com o
// caso de RecipeEditor.js (que só tinha clique e não apagava a imagem antiga, vazando
// arquivos órfãos no bucket do Supabase Storage). Agora ambos sempre limpam a imagem antiga.
export default function ImageUploadField({
  value,
  onChange,
  uploadType,
  password,
  label = 'Imagem',
  hint = 'JPG, PNG ou WEBP',
  heightClass = 'h-80',
}) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();
  const confirm = useConfirm();

  const deleteFromStorage = (url) => {
    if (!url || !url.includes(STORAGE_MARKER)) return;
    adminFetch('/api/admin/upload', { password, method: 'DELETE', body: { url } }).catch((err) =>
      console.warn('Falha silenciosa ao remover imagem substituída:', err)
    );
  };

  const handleUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, envie apenas imagens (JPG, PNG, WEBP).');
      return;
    }

    const oldUrl = value;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await adminFetch(`/api/admin/upload?type=${encodeURIComponent(uploadType || '')}`, {
        password,
        method: 'POST',
        body: formData,
      });
      onChange(data.url);
      deleteFromStorage(oldUrl);
    } catch (err) {
      toast.error(err.message || 'Erro ao fazer upload da imagem.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!value) return;

    if (!value.includes(STORAGE_MARKER)) {
      onChange('');
      return;
    }

    const ok = await confirm({
      title: 'Remover imagem',
      message: 'Deseja realmente apagar esta imagem? Ela será excluída permanentemente do armazenamento.',
      tone: 'danger',
      confirmLabel: 'Remover',
    });
    if (!ok) return;

    setUploading(true);
    try {
      await adminFetch('/api/admin/upload', { password, method: 'DELETE', body: { url: value } });
    } catch (err) {
      toast.error(err.message || 'Erro ao apagar arquivo no storage.');
    } finally {
      onChange('');
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) await handleUpload(e.dataTransfer.files[0]);
  };

  return (
    <div className="form-control w-full">
      {label && (
        <label className="label">
          <span className="label-text text-xs tracking-widest uppercase font-bold">{label}</span>
        </label>
      )}

      {uploading ? (
        <div
          className={`w-full ${heightClass} rounded-2xl border-2 border-dashed border-primary bg-primary/5 flex flex-col items-center justify-center text-primary gap-4`}
        >
          <LoadingSpinner size="lg" />
          <span className="font-bold">Enviando arquivo...</span>
        </div>
      ) : value ? (
        <div className="flex flex-col gap-3">
          <div
            className={`w-full ${heightClass} bg-base-300/40 rounded-2xl border border-base-300 overflow-hidden relative flex items-center justify-center p-3`}
          >
            <img src={value} alt="Pré-visualização" className="max-w-full max-h-full object-contain rounded-xl shadow-sm" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-sm btn-outline flex-1 gap-1.5 text-xs font-bold whitespace-nowrap"
            >
              <i className="fa-solid fa-arrows-rotate text-xs" aria-hidden="true"></i> Substituir
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-sm btn-error btn-outline flex-1 gap-1.5 text-xs font-bold whitespace-nowrap"
              title="Apagar foto e remover do storage"
            >
              <i className="fa-solid fa-trash-can text-xs" aria-hidden="true"></i> Remover
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="hidden"
            aria-label={label}
          />
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          className={`w-full ${heightClass} rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-2 border-dashed
            ${dragActive ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-200/50 hover:bg-base-200 hover:border-base-content/20'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="hidden"
            aria-label={label}
          />
          <div className="text-center p-4 sm:p-6 text-base-content/60 flex flex-col items-center justify-center h-full w-full">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-base-content/5 rounded-full flex items-center justify-center mb-2 text-base-content shrink-0">
              <i className="fa-regular fa-image text-xl sm:text-2xl" aria-hidden="true"></i>
            </div>
            <div className="text-sm font-bold text-base-content mb-1">Arraste uma foto aqui</div>
            <div className="text-xs text-base-content/70">ou clique para procurar no seu computador</div>
            {hint && <div className="text-[10px] sm:text-xs mt-3 opacity-60 bg-base-content/5 px-3 py-1 rounded-full">{hint}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
