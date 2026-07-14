'use client';

import { useState, useEffect } from 'react';

const BLOCK_TYPES = [
  { type: 'avatar', label: 'Avatar/Foto de Perfil', icon: 'fa-user' },
  { type: 'heading', label: 'Título/Cabeçalho', icon: 'fa-heading' },
  { type: 'paragraph', label: 'Parágrafo/Texto', icon: 'fa-paragraph' },
  { type: 'link', label: 'Botão de Link Externo', icon: 'fa-link' },
  { type: 'phone_collector', label: 'Captador de WhatsApp', icon: 'fa-phone' }
];

const FONTS_LIST = [
  { value: 'var(--font-sans)', label: 'Sans-Serif Padrão' },
  { value: 'var(--font-serif)', label: 'Serif Elegante' },
  { value: 'Inter, sans-serif', label: 'Inter (Moderna)' },
  { value: 'Playfair Display, serif', label: 'Playfair (Clássica)' },
  { value: 'Outfit, sans-serif', label: 'Outfit (Premium)' }
];

export default function BiolinksManager({ password }) {
  const [biolinks, setBiolinks] = useState([]);
  const [selectedBiolink, setSelectedBiolink] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modais e Estados de Criação/Edição
  const [showBioModal, setShowBioModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  
  const [currentBio, setCurrentBio] = useState({
    slug: '',
    title: '',
    description: '',
    background_type: 'gradient', // 'gradient', 'image'
    background_color_one: '#0F0D09',
    background_color_two: '#7F6346',
    background_image: '',
    text_color: '#ffffff',
    font: 'var(--font-sans)',
    display_branding: true,
    branding_name: '',
    branding_url: '',
    custom_css: '',
    custom_js: ''
  });

  const [currentBlock, setCurrentBlock] = useState({
    type: 'link',
    location_url: '',
    settings: {},
    sort_order: 0,
    is_enabled: true
  });
  
  useEffect(() => {
    fetchBiolinks();
  }, []);

  const fetchBiolinks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/biolinks?auth=${encodeURIComponent(password)}`);
      if (res.ok) {
        const data = await res.json();
        setBiolinks(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadBiolinkDetails = async (slug) => {
    try {
      const res = await fetch(`/api/admin/biolinks?slug=${slug}&auth=${encodeURIComponent(password)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedBiolink(data);
        setBlocks(data.blocks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBiolink = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/biolinks?auth=${encodeURIComponent(password)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentBio)
      });
      if (res.ok) {
        setShowBioModal(false);
        fetchBiolinks();
        if (selectedBiolink && selectedBiolink.slug === currentBio.slug) {
          loadBiolinkDetails(currentBio.slug);
        }
      } else {
        alert('Erro ao salvar Biolink. Verifique se o slug é único.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBiolink = async (id) => {
    if (!confirm('Deseja realmente excluir este biolink? Todos os blocos serão perdidos.')) return;
    try {
      const res = await fetch(`/api/admin/biolinks?id=${id}&auth=${encodeURIComponent(password)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedBiolink(null);
        fetchBiolinks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBlock = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/biolinks/blocks?auth=${encodeURIComponent(password)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currentBlock, biolink_id: selectedBiolink.id })
      });
      if (res.ok) {
        setShowBlockModal(false);
        loadBiolinkDetails(selectedBiolink.slug);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlock = async (id) => {
    if (!confirm('Excluir este bloco?')) return;
    try {
      const res = await fetch(`/api/admin/biolinks/blocks?id=${id}&auth=${encodeURIComponent(password)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadBiolinkDetails(selectedBiolink.slug);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveBlock = async (index, direction) => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    // Swap sort_order
    const temp = newBlocks[index].sort_order;
    newBlocks[index].sort_order = newBlocks[targetIndex].sort_order;
    newBlocks[targetIndex].sort_order = temp;

    // Swap elements locally for instant feedback
    const hold = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = hold;
    setBlocks(newBlocks);

    // Save ordering in API
    try {
      await fetch(`/api/admin/biolinks/blocks?auth=${encodeURIComponent(password)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlocks.map((b, idx) => ({ id: b.id, sort_order: idx })))
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto pb-20 animate-[fadeIn_0.3s_ease]">
      
      {/* Coluna 1: Lista de Biolinks */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="flex justify-between items-center bg-base-200 p-4 rounded-xl border border-base-300">
          <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Meus Biolinks</h3>
          <button 
            onClick={() => {
              setCurrentBio({
                slug: '',
                title: '',
                description: '',
                background_type: 'gradient',
                background_color_one: '#0F0D09',
                background_color_two: '#7F6346',
                background_image: '',
                text_color: '#ffffff',
                font: 'var(--font-sans)',
                display_branding: true,
                branding_name: '',
                branding_url: '',
                custom_css: '',
                custom_js: ''
              });
              setShowBioModal(true);
            }} 
            className="btn btn-primary btn-xs"
          >
            + Criar Novo
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {biolinks.map(bio => (
            <div 
              key={bio.id} 
              onClick={() => loadBiolinkDetails(bio.slug)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedBiolink?.slug === bio.slug ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200/50 hover:bg-base-200'}`}
            >
              <div>
                <h4 className="font-bold text-sm text-white">/{bio.slug}</h4>
                <p className="text-[10px] text-base-content/50 uppercase tracking-widest">{bio.title || 'Sem título'}</p>
              </div>
              <div className="flex gap-2">
                <a href={`/links/${bio.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-circle btn-ghost btn-xs text-primary" onClick={(e) => e.stopPropagation()}>
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentBio(bio);
                    setShowBioModal(true);
                  }} 
                  className="btn btn-circle btn-ghost btn-xs text-white"
                >
                  <i className="fa-solid fa-pen"></i>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBiolink(bio.id);
                  }} 
                  className="btn btn-circle btn-ghost btn-xs text-error"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coluna 2: Editor Detalhado */}
      <div className="w-full lg:w-2/3">
        {selectedBiolink ? (
          <div className="flex flex-col gap-6">
            
            {/* Header com preview e ações */}
            <div className="flex justify-between items-center bg-base-200 p-6 rounded-xl border border-base-300">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">/{selectedBiolink.slug}</h2>
                <p className="text-xs text-base-content/60">{selectedBiolink.description || 'Nenhuma descrição inserida.'}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setCurrentBio(selectedBiolink);
                    setShowBioModal(true);
                  }} 
                  className="btn btn-outline btn-sm"
                >
                  Configurações Globais
                </button>
                <button 
                  onClick={() => {
                    setCurrentBlock({
                      type: 'link',
                      location_url: '',
                      settings: {
                        name: '',
                        background_color: '#ffffff',
                        text_color: '#000000',
                        open_in_new_tab: true,
                        border_radius: 'round',
                        border_width: 0,
                        border_style: 'solid',
                        border_color: '#000000',
                        border_shadow_offset_x: 0,
                        border_shadow_offset_y: 6,
                        border_shadow_blur: 20,
                        border_shadow_spread: 0,
                        border_shadow_color: '#00000015',
                        animation: 'false',
                        image: ''
                      },
                      sort_order: blocks.length,
                      is_enabled: true
                    });
                    setShowBlockModal(true);
                  }} 
                  className="btn btn-primary btn-sm shadow-md"
                >
                  + Adicionar Bloco
                </button>
              </div>
            </div>

            {/* Listagem de Blocos */}
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-xs uppercase tracking-widest text-primary mb-2">Estrutura e Blocos</h3>
              
              {blocks.length === 0 ? (
                <div className="p-8 text-center text-base-content/50 border-2 border-dashed border-base-300 rounded-xl">
                  Nenhum bloco ativo neste biolink. Clique em "Adicionar Bloco" para começar.
                </div>
              ) : (
                blocks.map((block, index) => {
                  const settings = block.settings || {};
                  return (
                    <div 
                      key={block.id} 
                      className="flex items-center justify-between p-4 bg-base-200 rounded-xl border border-base-300 hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <button disabled={index === 0} onClick={() => handleMoveBlock(index, 'up')} className="btn btn-ghost btn-circle btn-xs text-base-content/40 disabled:opacity-20 hover:text-white">
                            <i className="fa-solid fa-chevron-up"></i>
                          </button>
                          <button disabled={index === blocks.length - 1} onClick={() => handleMoveBlock(index, 'down')} className="btn btn-ghost btn-circle btn-xs text-base-content/40 disabled:opacity-20 hover:text-white">
                            <i className="fa-solid fa-chevron-down"></i>
                          </button>
                        </div>
                        
                        <div className="w-10 h-10 rounded-lg bg-base-300 flex justify-center items-center text-primary">
                          <i className={`fa-solid ${BLOCK_TYPES.find(t => t.type === block.type)?.icon || 'fa-cubes'} text-md`}></i>
                        </div>

                        <div>
                          <span className="badge badge-sm badge-outline uppercase text-[9px] tracking-wider mb-1">{block.type}</span>
                          <h4 className="font-bold text-sm text-white">
                            {block.type === 'link' ? settings.name : block.type === 'heading' ? settings.text : block.type === 'paragraph' ? (settings.text || '').substring(0, 40) + '...' : block.type === 'phone_collector' ? settings.name : 'Bloco de Configuração'}
                          </h4>
                          <span className="text-[10px] text-base-content/40">Visualizações: {block.clicks || 0}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setCurrentBlock(block);
                            setShowBlockModal(true);
                          }} 
                          className="btn btn-circle btn-ghost btn-sm text-white"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button 
                          onClick={() => handleDeleteBlock(block.id)} 
                          className="btn btn-circle btn-ghost btn-sm text-error"
                        >
                          <i className="fa-solid fa-trash"></i>
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
            <i className="fa-solid fa-link text-4xl text-primary/40 mb-4"></i>
            <h3 className="font-bold text-white text-base mb-1">Selecione um Biolink</h3>
            <p className="text-xs text-base-content/50 max-w-xs">Escolha um biolink na barra lateral para ver, reordenar ou editar blocos de botões e customizar estilos.</p>
          </div>
        )}
      </div>

      {/* MODAL BIOLINK */}
      {showBioModal && (
        <div className="modal modal-open">
          <form onSubmit={handleSaveBiolink} className="modal-box bg-base-200 border border-base-300 max-w-2xl">
            <h3 className="font-bold text-lg text-primary mb-6">Configurações Avançadas do Biolink</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="form-control md:col-span-2">
                <label className="label"><span className="label-text">Slug do link</span></label>
                <div className="join w-full">
                  <span className="join-item bg-base-300 px-4 flex items-center text-xs border border-base-300">/links/</span>
                  <input 
                    type="text" 
                    required
                    value={currentBio.slug}
                    onChange={(e) => setCurrentBio({ ...currentBio, slug: e.target.value })}
                    placeholder="ex: boutique" 
                    className="input input-bordered join-item flex-grow bg-black/40 text-sm focus:border-primary!"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Título da página</span></label>
                <input 
                  type="text"
                  value={currentBio.title || ''}
                  onChange={(e) => setCurrentBio({ ...currentBio, title: e.target.value })}
                  placeholder="ex: Antenor & Filhos | Boutique" 
                  className="input input-bordered bg-black/40 text-sm"
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Fonte Premium</span></label>
                <select 
                  value={currentBio.font || 'var(--font-sans)'}
                  onChange={(e) => setCurrentBio({ ...currentBio, font: e.target.value })}
                  className="select select-bordered bg-black/40 text-sm"
                >
                  {FONTS_LIST.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-control md:col-span-2">
                <label className="label"><span className="label-text">Descrição (SEO)</span></label>
                <textarea 
                  value={currentBio.description || ''}
                  onChange={(e) => setCurrentBio({ ...currentBio, description: e.target.value })}
                  placeholder="Descrição sobre a página..." 
                  className="textarea textarea-bordered bg-black/40 text-sm"
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Tipo de Fundo</span></label>
                <select 
                  value={currentBio.background_type || 'gradient'}
                  onChange={(e) => setCurrentBio({ ...currentBio, background_type: e.target.value })}
                  className="select select-bordered bg-black/40 text-sm"
                >
                  <option value="gradient">Gradiente Linear</option>
                  <option value="image">Imagem Customizada</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Cor de Texto Global</span></label>
                <input 
                  type="color"
                  value={currentBio.text_color || '#ffffff'}
                  onChange={(e) => setCurrentBio({ ...currentBio, text_color: e.target.value })}
                  className="input input-bordered bg-black/40 w-full"
                />
              </div>

              {currentBio.background_type === 'gradient' ? (
                <>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Fundo (Gradiente Cor 1)</span></label>
                    <input 
                      type="color"
                      value={currentBio.background_color_one || '#000000'}
                      onChange={(e) => setCurrentBio({ ...currentBio, background_color_one: e.target.value })}
                      className="input input-bordered bg-black/40 w-full"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Fundo (Gradiente Cor 2)</span></label>
                    <input 
                      type="color"
                      value={currentBio.background_color_two || '#000000'}
                      onChange={(e) => setCurrentBio({ ...currentBio, background_color_two: e.target.value })}
                      className="input input-bordered bg-black/40 w-full"
                    />
                  </div>
                </>
              ) : (
                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text">URL da Imagem de Fundo</span></label>
                  <input 
                    type="text"
                    value={currentBio.background_image || ''}
                    onChange={(e) => setCurrentBio({ ...currentBio, background_image: e.target.value })}
                    placeholder="https://exemplo.com/fundo.jpg"
                    className="input input-bordered bg-black/40 text-sm"
                  />
                </div>
              )}

              {/* BRANDING PERSONALIZADO */}
              <div className="form-control md:col-span-2 border-t border-base-300 mt-2 pt-2">
                <label className="label cursor-pointer justify-start gap-4">
                  <input 
                    type="checkbox" 
                    checked={currentBio.display_branding !== false}
                    onChange={(e) => setCurrentBio({ ...currentBio, display_branding: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text font-bold">Mostrar Rodapé/Branding</span>
                </label>
              </div>

              {currentBio.display_branding !== false && (
                <>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Nome do Rodapé</span></label>
                    <input 
                      type="text"
                      value={currentBio.branding_name || ''}
                      onChange={(e) => setCurrentBio({ ...currentBio, branding_name: e.target.value })}
                      placeholder="ex: Minha Loja"
                      className="input input-bordered bg-black/40 text-sm"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Link do Rodapé</span></label>
                    <input 
                      type="text"
                      value={currentBio.branding_url || ''}
                      onChange={(e) => setCurrentBio({ ...currentBio, branding_url: e.target.value })}
                      placeholder="https://..."
                      className="input input-bordered bg-black/40 text-sm"
                    />
                  </div>
                </>
              )}

              {/* CSS & JS CUSTOMIZADO */}
              <div className="form-control md:col-span-2 border-t border-base-300 mt-2 pt-2">
                <label className="label"><span className="label-text font-bold text-warning">CSS Personalizado</span></label>
                <textarea 
                  value={currentBio.custom_css || ''}
                  onChange={(e) => setCurrentBio({ ...currentBio, custom_css: e.target.value })}
                  placeholder="/* Digite estilos customizados aqui */"
                  className="textarea textarea-bordered bg-black/40 text-xs font-mono"
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label"><span className="label-text font-bold text-warning">JS Personalizado (Scripts)</span></label>
                <textarea 
                  value={currentBio.custom_js || ''}
                  onChange={(e) => setCurrentBio({ ...currentBio, custom_js: e.target.value })}
                  placeholder="<!-- Digite scripts de analytics, pixels, etc. -->"
                  className="textarea textarea-bordered bg-black/40 text-xs font-mono"
                />
              </div>
            </div>

            <div className="modal-action mt-8 border-t border-base-300 pt-4">
              <button type="button" onClick={() => setShowBioModal(false)} className="btn btn-outline btn-sm">Cancelar</button>
              <button type="submit" className="btn btn-primary btn-sm">Salvar Configurações</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL BLOCO */}
      {showBlockModal && (
        <div className="modal modal-open">
          <form onSubmit={handleSaveBlock} className="modal-box bg-base-200 border border-base-300 max-w-2xl">
            <h3 className="font-bold text-lg text-primary mb-6">Configurar Bloco</h3>
            
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="form-control">
                <label className="label"><span className="label-text font-bold">Tipo do Bloco</span></label>
                <select 
                  value={currentBlock.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setCurrentBlock({
                      ...currentBlock,
                      type,
                      settings: type === 'link' ? {
                        name: '',
                        background_color: '#ffffff',
                        text_color: '#000000',
                        open_in_new_tab: true,
                        border_radius: 'round',
                        border_width: 0,
                        border_style: 'solid',
                        border_color: '#000000',
                        border_shadow_offset_x: 0,
                        border_shadow_offset_y: 6,
                        border_shadow_blur: 20,
                        border_shadow_spread: 0,
                        border_shadow_color: '#00000015',
                        animation: 'false',
                        image: ''
                      } : type === 'avatar' ? {
                        image: '',
                        size: 96,
                        border_radius: 'round',
                        border_width: 0,
                        border_style: 'solid',
                        border_color: '#ffffff',
                        border_shadow_offset_x: 0,
                        border_shadow_offset_y: 4,
                        border_shadow_blur: 15,
                        border_shadow_color: '#00000030'
                      } : type === 'heading' ? {
                        text: '',
                        heading_type: 'h2',
                        text_color: '#ffffff'
                      } : type === 'paragraph' ? {
                        text: '',
                        text_color: '#d7b994'
                      } : type === 'phone_collector' ? {
                        name: 'Promoções no WhatsApp',
                        button_text: 'Quero Participar',
                        name_placeholder: 'Seu Nome',
                        phone_placeholder: 'Seu WhatsApp'
                      } : {}
                    });
                  }}
                  className="select select-bordered bg-black/40 text-sm focus:border-primary!"
                >
                  {BLOCK_TYPES.map(t => (
                    <option key={t.type} value={t.type}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* RENDERIZAÇÃO CONDICIONAL BASEADO NO TIPO SELECIONADO */}
              {currentBlock.type === 'avatar' && (
                <>
                  <div className="form-control">
                    <label className="label"><span className="label-text">URL da Imagem do Perfil</span></label>
                    <input 
                      type="text"
                      required
                      value={currentBlock.settings.image || ''}
                      onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, image: e.target.value } })}
                      placeholder="/uploads/avatars/imagem.png"
                      className="input input-bordered bg-black/40 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Tamanho (px)</span></label>
                      <input 
                        type="number"
                        value={currentBlock.settings.size || 96}
                        onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, size: parseInt(e.target.value) || 96 } })}
                        className="input input-bordered bg-black/40 text-sm"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text font-bold">Formato das Bordas</span></label>
                      <select 
                        value={currentBlock.settings.border_radius || 'round'}
                        onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, border_radius: e.target.value } })}
                        className="select select-bordered bg-black/40 text-sm"
                      >
                        <option value="round">Redondo (Total)</option>
                        <option value="rounded">Arredondado (Suave)</option>
                        <option value="straight">Reto (Sem borda)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {currentBlock.type === 'heading' && (
                <>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Texto do Título</span></label>
                    <input 
                      type="text"
                      required
                      value={currentBlock.settings.text || ''}
                      onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, text: e.target.value } })}
                      className="input input-bordered bg-black/40 text-sm focus:border-primary!"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Tamanho (Tag)</span></label>
                      <select 
                        value={currentBlock.settings.heading_type || 'h2'}
                        onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, heading_type: e.target.value } })}
                        className="select select-bordered bg-black/40 text-sm"
                      >
                        <option value="h1">Título H1</option>
                        <option value="h2">Título H2</option>
                        <option value="h3">Título H3</option>
                        <option value="h4">Título H4</option>
                        <option value="h5">Título H5</option>
                        <option value="h6">Título H6</option>
                      </select>
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Cor do Texto</span></label>
                      <input 
                        type="color"
                        value={currentBlock.settings.text_color || '#ffffff'}
                        onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, text_color: e.target.value } })}
                        className="input input-bordered bg-black/40 w-full"
                      />
                    </div>
                  </div>
                </>
              )}

              {currentBlock.type === 'paragraph' && (
                <>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Texto do Parágrafo</span></label>
                    <textarea 
                      required
                      value={currentBlock.settings.text || ''}
                      onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, text: e.target.value } })}
                      className="textarea textarea-bordered bg-black/40 text-sm focus:border-primary!"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Cor do Texto</span></label>
                    <input 
                      type="color"
                      value={currentBlock.settings.text_color || '#ffffff'}
                      onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, text_color: e.target.value } })}
                      className="input input-bordered bg-black/40 w-full"
                    />
                  </div>
                </>
              )}

              {currentBlock.type === 'link' && (
                <>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Nome do Botão</span></label>
                    <input 
                      type="text"
                      required
                      value={currentBlock.settings.name || ''}
                      onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, name: e.target.value } })}
                      className="input input-bordered bg-black/40 text-sm focus:border-primary!"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">URL de Destino</span></label>
                    <input 
                      type="text"
                      required
                      value={currentBlock.location_url || ''}
                      onChange={(e) => setCurrentBlock({ ...currentBlock, location_url: e.target.value })}
                      placeholder="https://..." 
                      className="input input-bordered bg-black/40 text-sm focus:border-primary!"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">URL do Ícone do Botão</span></label>
                    <input 
                      type="text"
                      value={currentBlock.settings.image || ''}
                      onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, image: e.target.value } })}
                      placeholder="ex: https://site.com/icone.png"
                      className="input input-bordered bg-black/40 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Fundo do Botão</span></label>
                      <input 
                        type="color"
                        value={currentBlock.settings.background_color || '#ffffff'}
                        onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, background_color: e.target.value } })}
                        className="input input-bordered bg-black/40 w-full"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Cor do Texto</span></label>
                      <input 
                        type="color"
                        value={currentBlock.settings.text_color || '#000000'}
                        onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, text_color: e.target.value } })}
                        className="input input-bordered bg-black/40 w-full"
                      />
                    </div>
                  </div>

                  {/* ESTILOS DE BORDA E SOMBRAS 1:1 DO 66BIOLINKS */}
                  <div className="grid grid-cols-3 gap-4 border-t border-base-300 mt-2 pt-2">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Bordas</span></label>
                      <select 
                        value={currentBlock.settings.border_radius || 'round'}
                        onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, border_radius: e.target.value } })}
                        className="select select-bordered bg-black/40 text-xs"
                      >
                        <option value="round">Totalmente Redondo</option>
                        <option value="rounded">Arredondado</option>
                        <option value="straight">Reto</option>
                      </select>
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Largura Borda</span></label>
                      <input 
                        type="number"
                        value={currentBlock.settings.border_width || 0}
                        onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, border_width: parseInt(e.target.value) || 0 } })}
                        className="input input-bordered bg-black/40 text-xs"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Estilo Borda</span></label>
                      <select 
                        value={currentBlock.settings.border_style || 'solid'}
                        onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, border_style: e.target.value } })}
                        className="select select-bordered bg-black/40 text-xs"
                      >
                        <option value="solid">Sólida</option>
                        <option value="dashed">Tracejada</option>
                        <option value="dotted">Pontilhada</option>
                        <option value="double">Dupla</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Cor da Borda</span></label>
                      <input 
                        type="color"
                        value={currentBlock.settings.border_color || '#000000'}
                        onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, border_color: e.target.value } })}
                        className="input input-bordered bg-black/40 w-full"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Animação de Entrada</span></label>
                      <select 
                        value={currentBlock.settings.animation || 'false'}
                        onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, animation: e.target.value } })}
                        className="select select-bordered bg-black/40 text-xs"
                      >
                        <option value="false">Nenhuma</option>
                        <option value="bounce">Salto (Bounce)</option>
                        <option value="tada">Tada (Festa)</option>
                        <option value="wobble">Oscilação (Wobble)</option>
                        <option value="shake">Tremor (Shake)</option>
                        <option value="pulse">Pulso (Pulse)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-control border-t border-base-300 mt-2 pt-2">
                    <label className="label"><span className="label-text font-bold">Configuração de Sombra (CSS Box Shadow)</span></label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] opacity-75">Sombra X (px)</span>
                        <input 
                          type="number" 
                          value={currentBlock.settings.border_shadow_offset_x || 0}
                          onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, border_shadow_offset_x: parseInt(e.target.value) || 0 } })}
                          className="input input-bordered bg-black/40 text-xs w-full"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] opacity-75">Sombra Y (px)</span>
                        <input 
                          type="number" 
                          value={currentBlock.settings.border_shadow_offset_y || 6}
                          onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, border_shadow_offset_y: parseInt(e.target.value) || 0 } })}
                          className="input input-bordered bg-black/40 text-xs w-full"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] opacity-75">Desfoque (Blur)</span>
                        <input 
                          type="number" 
                          value={currentBlock.settings.border_shadow_blur || 20}
                          onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, border_shadow_blur: parseInt(e.target.value) || 0 } })}
                          className="input input-bordered bg-black/40 text-xs w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="form-control">
                        <label className="label"><span className="label-text">Cor da Sombra</span></label>
                        <input 
                          type="text"
                          value={currentBlock.settings.border_shadow_color || '#00000015'}
                          onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, border_shadow_color: e.target.value } })}
                          placeholder="rgba(0,0,0,0.1) ou #hex"
                          className="input input-bordered bg-black/40 text-xs"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Espalhamento (Spread)</span></label>
                        <input 
                          type="number"
                          value={currentBlock.settings.border_shadow_spread || 0}
                          onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, border_shadow_spread: parseInt(e.target.value) || 0 } })}
                          className="input input-bordered bg-black/40 text-xs w-full"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentBlock.type === 'phone_collector' && (
                <>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Título do Captador</span></label>
                    <input 
                      type="text"
                      required
                      value={currentBlock.settings.name || ''}
                      onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, name: e.target.value } })}
                      className="input input-bordered bg-black/40 text-sm focus:border-primary!"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Texto do Botão</span></label>
                    <input 
                      type="text"
                      required
                      value={currentBlock.settings.button_text || ''}
                      onChange={(e) => setCurrentBlock({ ...currentBlock, settings: { ...currentBlock.settings, button_text: e.target.value } })}
                      className="input input-bordered bg-black/40 text-sm focus:border-primary!"
                    />
                  </div>
                </>
              )}

              <div className="form-control mt-2 border-t border-base-300 pt-2">
                <label className="label cursor-pointer justify-start gap-4">
                  <input 
                    type="checkbox" 
                    checked={currentBlock.is_enabled}
                    onChange={(e) => setCurrentBlock({ ...currentBlock, is_enabled: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text font-bold">Bloco Ativo/Habilitado</span>
                </label>
              </div>
            </div>

            <div className="modal-action mt-8 border-t border-base-300 pt-4">
              <button type="button" onClick={() => setShowBlockModal(false)} className="btn btn-outline btn-sm">Cancelar</button>
              <button type="submit" className="btn btn-primary btn-sm">Confirmar Bloco</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
