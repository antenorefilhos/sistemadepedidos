'use client';

import { useEffect, useState } from 'react';
import BiolinksSettingsModal from './BiolinksSettingsModal';
import BiolinksBlockModal from './BiolinksBlockModal';
import LoadingSpinner from '@/components/admin/ui/LoadingSpinner';
import EmptyState from '@/components/admin/ui/EmptyState';
import Tag from '@/components/admin/ui/Tag';
import { useToast } from '@/components/admin/ui/Toast';
import { useConfirm } from '@/components/admin/ui/ConfirmDialog';
import { adminFetch } from '@/components/admin/hooks/useAdminFetch';
import { BLOCK_TYPES, emptyBio, emptyBlock } from './biolinksDefaults';

export default function BiolinksManager({ password }) {
  const [biolinks, setBiolinks] = useState([]);
  const [selectedBiolink, setSelectedBiolink] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showBioModal, setShowBioModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [currentBio, setCurrentBio] = useState(emptyBio());
  const [currentBlock, setCurrentBlock] = useState(emptyBlock());

  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchBiolinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchBiolinks() {
    setLoading(true);
    try {
      setBiolinks(await adminFetch('/api/admin/biolinks', { password }));
    } catch (err) {
      toast.error(`Erro ao carregar biolinks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadBiolinkDetails(slug) {
    try {
      const data = await adminFetch(`/api/admin/biolinks?slug=${slug}`, { password });
      setSelectedBiolink(data);
      setBlocks(data.blocks || []);
    } catch (err) {
      toast.error(`Erro ao carregar biolink: ${err.message}`);
    }
  }

  const handleSaveBiolink = async (e) => {
    e.preventDefault();
    try {
      await adminFetch('/api/admin/biolinks', { password, method: 'POST', body: currentBio });
      setShowBioModal(false);
      fetchBiolinks();
      if (selectedBiolink?.slug === currentBio.slug) loadBiolinkDetails(currentBio.slug);
    } catch (err) {
      toast.error('Erro ao salvar biolink. Verifique se o slug é único.');
    }
  };

  const handleDeleteBiolink = async (id) => {
    const ok = await confirm({
      title: 'Excluir biolink',
      message: 'Todos os blocos deste biolink serão perdidos permanentemente.',
      tone: 'danger',
      confirmLabel: 'Excluir',
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/biolinks?id=${id}`, { password, method: 'DELETE' });
      setSelectedBiolink(null);
      fetchBiolinks();
    } catch (err) {
      toast.error(`Erro ao excluir biolink: ${err.message}`);
    }
  };

  const handleSaveBlock = async (e) => {
    e.preventDefault();
    try {
      await adminFetch('/api/admin/biolinks/blocks', { password, method: 'POST', body: { ...currentBlock, biolink_id: selectedBiolink.id } });
      setShowBlockModal(false);
      loadBiolinkDetails(selectedBiolink.slug);
    } catch (err) {
      toast.error(`Erro ao salvar bloco: ${err.message}`);
    }
  };

  const handleDeleteBlock = async (id) => {
    const ok = await confirm({ title: 'Excluir bloco', message: 'Excluir este bloco permanentemente?', tone: 'danger', confirmLabel: 'Excluir' });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/biolinks/blocks?id=${id}`, { password, method: 'DELETE' });
      loadBiolinkDetails(selectedBiolink.slug);
    } catch (err) {
      toast.error(`Erro ao excluir bloco: ${err.message}`);
    }
  };

  const handleMoveBlock = async (index, direction) => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);

    try {
      await adminFetch('/api/admin/biolinks/blocks', {
        password,
        method: 'PUT',
        body: newBlocks.map((b, idx) => ({ id: b.id, sort_order: idx })),
      });
    } catch (err) {
      toast.error(`Erro ao reordenar blocos: ${err.message}`);
      loadBiolinkDetails(selectedBiolink.slug);
    }
  };

  const openNewBioModal = () => {
    setCurrentBio(emptyBio());
    setShowBioModal(true);
  };

  const openNewBlockModal = () => {
    setCurrentBlock({ ...emptyBlock(), sort_order: blocks.length });
    setShowBlockModal(true);
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto pb-20 animate-[fadeIn_0.3s_ease]">
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="flex justify-between items-center bg-base-200 p-4 rounded-xl border border-base-300">
          <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Meus Biolinks</h3>
          <button onClick={openNewBioModal} className="btn btn-primary btn-xs">
            <i className="fa-solid fa-plus mr-1" aria-hidden="true"></i> Criar Novo
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {biolinks.map((bio) => (
            <div
              key={bio.id}
              onClick={() => loadBiolinkDetails(bio.slug)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedBiolink?.slug === bio.slug ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-100 hover:bg-base-200'}`}
            >
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-base-content truncate">/{bio.slug}</h4>
                <p className="text-xs text-base-content/50 uppercase tracking-widest truncate">{bio.title || 'Sem título'}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <a
                  href={`/links/${bio.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-circle btn-ghost btn-xs text-primary"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Abrir /${bio.slug} em nova aba`}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentBio(bio);
                    setShowBioModal(true);
                  }}
                  className="btn btn-circle btn-ghost btn-xs text-base-content/70"
                  aria-label={`Editar biolink /${bio.slug}`}
                >
                  <i className="fa-solid fa-pen" aria-hidden="true"></i>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBiolink(bio.id);
                  }}
                  className="btn btn-circle btn-ghost btn-xs text-error"
                  aria-label={`Excluir biolink /${bio.slug}`}
                >
                  <i className="fa-solid fa-trash" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          ))}
          {biolinks.length === 0 && <EmptyState icon="fa-link" title="Nenhum biolink criado ainda." />}
        </div>
      </div>

      <div className="w-full lg:w-2/3">
        {selectedBiolink ? (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-base-200 p-6 rounded-xl border border-base-300">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-base-content mb-1 truncate">/{selectedBiolink.slug}</h3>
                <p className="text-xs text-base-content/60 truncate">{selectedBiolink.description || 'Nenhuma descrição inserida.'}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    setCurrentBio(selectedBiolink);
                    setShowBioModal(true);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Configurações Globais
                </button>
                <button onClick={openNewBlockModal} className="btn btn-primary btn-sm shadow-md">
                  <i className="fa-solid fa-plus mr-1" aria-hidden="true"></i> Adicionar Bloco
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-xs uppercase tracking-widest text-primary mb-2">Estrutura e Blocos</h4>

              {blocks.length === 0 ? (
                <EmptyState icon="fa-cubes" title='Nenhum bloco ativo. Clique em "Adicionar Bloco" para começar.' />
              ) : (
                blocks.map((block, index) => {
                  const settings = block.settings || {};
                  const blockTitle =
                    block.type === 'link' || block.type === 'phone_collector'
                      ? settings.name
                      : block.type === 'heading'
                        ? settings.text
                        : block.type === 'paragraph'
                          ? `${(settings.text || '').substring(0, 40)}...`
                          : 'Bloco de Configuração';

                  return (
                    <div key={block.id} className="flex items-center justify-between p-4 bg-base-100 rounded-xl border border-base-300 hover:border-primary/40 transition-all">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            disabled={index === 0}
                            onClick={() => handleMoveBlock(index, 'up')}
                            aria-label="Mover bloco para cima"
                            className="btn btn-ghost btn-circle btn-xs text-base-content/40 disabled:opacity-20"
                          >
                            <i className="fa-solid fa-chevron-up" aria-hidden="true"></i>
                          </button>
                          <button
                            disabled={index === blocks.length - 1}
                            onClick={() => handleMoveBlock(index, 'down')}
                            aria-label="Mover bloco para baixo"
                            className="btn btn-ghost btn-circle btn-xs text-base-content/40 disabled:opacity-20"
                          >
                            <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
                          </button>
                        </div>

                        <div className="w-10 h-10 rounded-lg bg-base-200 flex justify-center items-center text-primary shrink-0">
                          <i className={`fa-solid ${BLOCK_TYPES.find((t) => t.type === block.type)?.icon || 'fa-cubes'}`} aria-hidden="true"></i>
                        </div>

                        <div className="min-w-0">
                          <Tag className="mb-1">{block.type}</Tag>
                          <h5 className="font-bold text-sm text-base-content truncate">{blockTitle}</h5>
                          <span className="text-xs text-base-content/40">Visualizações: {block.clicks || 0}</span>
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setCurrentBlock(block);
                            setShowBlockModal(true);
                          }}
                          className="btn btn-circle btn-ghost btn-sm text-base-content/70"
                          aria-label="Editar bloco"
                        >
                          <i className="fa-solid fa-pen" aria-hidden="true"></i>
                        </button>
                        <button onClick={() => handleDeleteBlock(block.id)} className="btn btn-circle btn-ghost btn-sm text-error" aria-label="Excluir bloco">
                          <i className="fa-solid fa-trash" aria-hidden="true"></i>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="h-96 flex flex-col justify-center items-center border border-dashed border-base-300 bg-base-200/20 rounded-2xl text-center p-6">
            <i className="fa-solid fa-link text-4xl text-primary/40 mb-4" aria-hidden="true"></i>
            <h4 className="font-bold text-base-content text-base mb-1">Selecione um Biolink</h4>
            <p className="text-xs text-base-content/50 max-w-xs">Escolha um biolink na barra lateral para ver, reordenar ou editar blocos e customizar estilos.</p>
          </div>
        )}
      </div>

      <BiolinksSettingsModal open={showBioModal} onClose={() => setShowBioModal(false)} bio={currentBio} onChange={setCurrentBio} onSave={handleSaveBiolink} />
      <BiolinksBlockModal open={showBlockModal} onClose={() => setShowBlockModal(false)} block={currentBlock} onChange={setCurrentBlock} onSave={handleSaveBlock} />
    </div>
  );
}
