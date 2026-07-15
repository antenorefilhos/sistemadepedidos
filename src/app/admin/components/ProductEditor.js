'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('react-simple-wysiwyg'), { ssr: false });

export default function ProductEditor({ 
  productForm, 
  setProductForm, 
  categories, 
  handleSaveProduct, 
  onClose,
  handleProductTitleChange,
  password
}) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, envie apenas imagens (JPG, PNG, WEBP).');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/admin/upload?auth=${encodeURIComponent(password)}&type=product`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setProductForm(prev => ({ ...prev, image_url: data.url }));
      } else {
        alert(data.error || 'Erro ao fazer upload da imagem.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao enviar imagem.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderTabButton = (id, icon, label, description) => (
    <button 
      type="button"
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-4 p-4 text-left border-l-4 transition-all duration-200
        ${activeTab === id 
          ? 'bg-base-200/50 border-primary text-base-content rounded-r-xl my-1' 
          : 'border-transparent text-base-content/60 hover:bg-base-200/30 my-1'}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-200
        ${activeTab === id ? 'bg-primary/20 text-primary' : 'bg-base-content/5 text-base-content'}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold tracking-wide">{label}</span>
        <span className={`text-[11px] mt-0.5 ${activeTab === id ? 'opacity-100 text-base-content/80' : 'opacity-70 text-base-content/50'}`}>
          {description}
        </span>
      </div>
    </button>
  );

  return (
    <dialog className="modal modal-open">
      <form onSubmit={handleSaveProduct} className="modal-box max-w-[1200px] h-[85vh] p-0 flex flex-col bg-base-100 border border-base-300 shadow-2xl rounded-2xl overflow-hidden">
        
        {/* Superior: Header Limpo */}
        <div className="p-6 md:px-8 border-b border-base-300 flex justify-between items-center bg-base-200/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary text-xl">
              <i className="fa-solid fa-box-open"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-base-content font-serif m-0">
                {productForm.id ? 'Editor de Produto' : 'Novo Produto'}
              </h2>
              <span className="text-sm text-base-content/60">
                {productForm.title ? productForm.title : 'Preencha as informações para o catálogo'}
              </span>
            </div>
          </div>
          
          <button type="button" onClick={onClose} className="btn btn-circle btn-ghost btn-sm text-base-content/60 hover:text-base-content hover:bg-base-content/10">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Corpo Principal (Abas + Conteúdo) */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Menu Lateral Abas */}
          <div className="w-[280px] bg-base-300/30 border-r border-base-300 flex flex-col pt-4 shrink-0">
            {renderTabButton('geral', <i className="fa-solid fa-align-left"></i>, 'Informações', 'Nome, EAN e Descrição')}
            {renderTabButton('preco', <i className="fa-solid fa-tag"></i>, 'Preços & Pesos', 'Valores e dimensões')}
            {renderTabButton('midia', <i className="fa-regular fa-image"></i>, 'Mídia Visual', 'Fotos do produto')}
            {productForm.type === 'adega' && renderTabButton('vinho', <i className="fa-solid fa-wine-glass"></i>, 'Ficha Técnica', 'Atributos de Vinhos')}
            {renderTabButton('categoria', <i className="fa-solid fa-layer-group"></i>, 'Classificação', 'Setores e categorias')}
            {renderTabButton('seo', <i className="fa-solid fa-globe"></i>, 'Visibilidade', 'Status e links diretos')}
          </div>

          {/* Conteúdo da Aba */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-base-100">
            <div className="max-w-3xl">

              {/* ABA 1: DADOS BÁSICOS */}
              {activeTab === 'geral' && (
                <div className="flex flex-col gap-8 animate-[fadeInTab_0.3s_ease]">
                  
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-xs tracking-widest uppercase font-bold">Nome do Produto <span className="text-primary">*</span></span>
                    </label>
                    <input 
                      type="text" required 
                      placeholder="Ex: Picanha Wagyu A5 1kg" 
                      className="input input-bordered w-full text-lg h-14"
                      value={productForm.title}
                      onChange={(e) => handleProductTitleChange(e.target.value)}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-xs tracking-widest uppercase font-bold">Código de Barras / EAN / SKU</span>
                    </label>
                    <input 
                      type="text" placeholder="Para leitura no PDV / ERP Solidcon" 
                      className="input input-bordered w-full font-mono h-12"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-xs tracking-widest uppercase font-bold">Descrição / Notas de Degustação</span>
                    </label>
                    <style>{`
                      .rsw-editor { min-height: 200px; font-family: inherit; font-size: 15px; border: 1px solid var(--fallback-bc,oklch(var(--bc)/0.2)) !important; border-radius: var(--rounded-btn, 0.5rem); color: inherit; background-color: var(--fallback-b1,oklch(var(--b1)/1)) !important; }
                      .rsw-toolbar { border-bottom: 1px solid var(--fallback-bc,oklch(var(--bc)/0.2)) !important; background-color: var(--fallback-b2,oklch(var(--b2)/1)) !important; border-radius: var(--rounded-btn, 0.5rem) var(--rounded-btn, 0.5rem) 0 0; }
                      .rsw-btn { color: inherit !important; }
                      .rsw-btn:hover { background-color: var(--fallback-bc,oklch(var(--bc)/0.1)) !important; }
                    `}</style>
                    <Editor 
                      value={productForm.description || ''} 
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* ABA 2: PREÇO E MEDIDAS */}
              {activeTab === 'preco' && (
                <div className="flex flex-col gap-8 animate-[fadeInTab_0.3s_ease]">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text text-xs tracking-widest uppercase font-bold">Preço de Venda (R$)</span>
                      </label>
                      <input 
                        type="number" step="0.01" placeholder="0.00" 
                        className="input input-bordered w-full text-xl font-bold text-primary h-14"
                        value={productForm.preco}
                        onChange={(e) => setProductForm({ ...productForm, preco: e.target.value })}
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text text-xs tracking-widest uppercase font-bold text-base-content/50">
                          Preço Promocional <i className="fa-solid fa-lock text-[10px] ml-1"></i>
                        </span>
                      </label>
                      <input 
                        type="number" step="0.01" placeholder="0.00" disabled
                        className="input input-bordered w-full h-14 opacity-50 cursor-not-allowed"
                        title="Liberado no Módulo 4: ERP Solidcon"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text text-xs tracking-widest uppercase font-bold">Peso Líquido / Volume</span>
                      </label>
                      <input 
                        type="text" placeholder="Ex: 500" 
                        className="input input-bordered w-full h-12"
                        value={productForm.peso}
                        onChange={(e) => setProductForm({ ...productForm, peso: e.target.value })}
                      />
                    </div>
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text text-xs tracking-widest uppercase font-bold">Unidade de Medida</span>
                      </label>
                      <select 
                        className="select select-bordered w-full h-12"
                        value={productForm.unidade_peso}
                        onChange={(e) => setProductForm({ ...productForm, unidade_peso: e.target.value })}
                      >
                        <option value="g">Gramas (g) - Porções</option>
                        <option value="kg">Quilos (kg) - Peças Inteiras</option>
                        <option value="ml">Mililitros (ml) - Garrafas</option>
                        <option value="un">Unidade (un) - Acessórios</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-xs tracking-widest uppercase font-bold text-base-content/50">
                        Estoque Sincronizado <i className="fa-solid fa-lock text-[10px] ml-1"></i>
                      </span>
                    </label>
                    <input 
                      type="text" placeholder="Aguardando conexão com ERP Solidcon..." disabled
                      className="input input-bordered w-full italic opacity-50 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {/* ABA 3: MÍDIA */}
              {activeTab === 'midia' && (
                <div className="flex flex-col gap-8 animate-[fadeInTab_0.3s_ease]">
                  
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-xs tracking-widest uppercase font-bold">Galeria (Imagem Principal)</span>
                    </label>
                    
                    {/* Premium Drag and Drop Area */}
                    <div 
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={onButtonClick}
                      className={`w-full h-80 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden border-2 border-dashed
                        ${dragActive ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-200/50 hover:bg-base-200 hover:border-base-content/20'}`}
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
                      
                      {uploading ? (
                        <div className="text-primary flex flex-col items-center gap-4">
                          <span className="loading loading-spinner loading-lg"></span>
                          <span className="font-bold">Enviando arquivo...</span>
                        </div>
                      ) : productForm.image_url ? (
                        <div className="relative w-full h-[240px] bg-base-300 rounded-xl border border-base-300 overflow-hidden">
                          <img src={productForm.image_url} alt="Pré-visualização do produto" className="w-full h-full object-contain p-4" />
                          <button className="absolute bottom-0 left-0 right-0 bg-base-content/90 p-4 text-center text-sm text-base-100 flex justify-center gap-3 font-bold hover:bg-base-content transition-colors">
                            <i className="fa-solid fa-upload"></i> Clique ou Arraste nova imagem para substituir
                          </button>
                        </div>
                      ) : (
                        <div className="text-center p-10 text-base-content/60 flex flex-col items-center">
                          <div className="w-20 h-20 bg-base-content/5 rounded-full flex items-center justify-center mb-5 text-base-content">
                            <i className="fa-regular fa-image text-3xl"></i>
                          </div>
                          <div className="text-lg text-base-content font-bold mb-2">Arraste uma foto aqui</div>
                          <div className="text-sm">ou clique para procurar no seu computador</div>
                          <div className="text-xs mt-5 opacity-60 bg-base-content/5 px-4 py-2 rounded-full">
                            JPG, PNG ou WEBP • Máx 2MB
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="divider text-xs text-base-content/50 uppercase tracking-widest font-bold">OU FORNEÇA UMA URL EXTERNA</div>

                  <div className="form-control w-full">
                    <div className="relative">
                      <i className="fa-solid fa-link absolute left-4 top-1/2 -translate-y-1/2 text-base-content/50"></i>
                      <input 
                        type="text" placeholder="https://meusite.com/imagem.jpg" 
                        className="input input-bordered w-full pl-12 h-14"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA EXTRA: FICHA TÉCNICA (VINHOS) */}
              {activeTab === 'vinho' && productForm.type === 'adega' && (
                <div className="flex flex-col gap-8 animate-[fadeInTab_0.3s_ease]">
                  
                  {/* SEÇÃO 1: CARACTERÍSTICAS BÁSICAS */}
                  <div className="bg-base-200/50 p-6 md:p-8 rounded-2xl border border-base-300">
                    <h3 className="text-sm uppercase font-bold text-primary mb-6 tracking-wider">Características Principais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Uva(s)</span></label>
                        <input type="text" placeholder="Ex: Cabernet Sauvignon" className="input input-bordered w-full h-12"
                          value={productForm.uva || ''} onChange={(e) => setProductForm({ ...productForm, uva: e.target.value })} />
                      </div>
                      <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Safra</span></label>
                        <input type="text" placeholder="Ex: 2019" className="input input-bordered w-full h-12"
                          value={productForm.safra || ''} onChange={(e) => setProductForm({ ...productForm, safra: e.target.value })} />
                      </div>
                      <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">País / Região</span></label>
                        <input type="text" placeholder="Ex: Mendoza, Argentina" className="input input-bordered w-full h-12"
                          value={productForm.origem || ''} onChange={(e) => setProductForm({ ...productForm, origem: e.target.value })} />
                      </div>
                      <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Produtor / Vinícola</span></label>
                        <input type="text" placeholder="Ex: Catena Zapata" className="input input-bordered w-full h-12"
                          value={productForm.produtor || ''} onChange={(e) => setProductForm({ ...productForm, produtor: e.target.value })} />
                      </div>
                      <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Enólogo</span></label>
                        <input type="text" placeholder="Ex: Alejandro Vigil" className="input input-bordered w-full h-12"
                          value={productForm.enologo || ''} onChange={(e) => setProductForm({ ...productForm, enologo: e.target.value })} />
                      </div>
                      <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Volume</span></label>
                        <input type="text" placeholder="Ex: 750ml" className="input input-bordered w-full h-12"
                          value={productForm.volume || ''} onChange={(e) => setProductForm({ ...productForm, volume: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 2: SERVIÇO E GUARDA */}
                  <div className="bg-base-200/50 p-6 md:p-8 rounded-2xl border border-base-300">
                    <h3 className="text-sm uppercase font-bold text-primary mb-6 tracking-wider">Serviço e Guarda</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Teor Alcoólico</span></label>
                        <input type="text" placeholder="Ex: 13,5%" className="input input-bordered w-full h-12"
                          value={productForm.teor_alcoolico || ''} onChange={(e) => setProductForm({ ...productForm, teor_alcoolico: e.target.value })} />
                      </div>
                      <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Temperatura de Serviço</span></label>
                        <input type="text" placeholder="Ex: 16°C a 18°C" className="input input-bordered w-full h-12"
                          value={productForm.temperatura || ''} onChange={(e) => setProductForm({ ...productForm, temperatura: e.target.value })} />
                      </div>
                      <div className="form-control w-full md:col-span-2">
                        <label className="label"><span className="label-text font-bold">Potencial de Guarda</span></label>
                        <input type="text" placeholder="Ex: Até 10 anos" className="input input-bordered w-full h-12"
                          value={productForm.potencial_guarda || ''} onChange={(e) => setProductForm({ ...productForm, potencial_guarda: e.target.value })} />
                      </div>
                      <div className="form-control w-full md:col-span-2">
                        <label className="label"><span className="label-text font-bold">Amadurecimento</span></label>
                        <textarea placeholder="Descreva como e onde o vinho maturou..." className="textarea textarea-bordered w-full min-h-[80px]"
                          value={productForm.amadurecimento || ''} onChange={(e) => setProductForm({ ...productForm, amadurecimento: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 3: NOTAS DE DEGUSTAÇÃO */}
                  <div className="bg-base-200/50 p-6 md:p-8 rounded-2xl border border-base-300">
                    <h3 className="text-sm uppercase font-bold text-primary mb-6 tracking-wider">Notas de Degustação</h3>
                    <div className="flex flex-col gap-6">
                      <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Visual</span></label>
                        <textarea placeholder="Ex: Vermelho rubi intenso..." className="textarea textarea-bordered w-full min-h-[60px]"
                          value={productForm.visual || ''} onChange={(e) => setProductForm({ ...productForm, visual: e.target.value })} />
                      </div>
                      <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Olfativo</span></label>
                        <textarea placeholder="Ex: Aromas de frutas vermelhas..." className="textarea textarea-bordered w-full min-h-[60px]"
                          value={productForm.olfativo || ''} onChange={(e) => setProductForm({ ...productForm, olfativo: e.target.value })} />
                      </div>
                      <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Gustativo</span></label>
                        <textarea placeholder="Ex: Taninos macios, final longo..." className="textarea textarea-bordered w-full min-h-[60px]"
                          value={productForm.gustativo || ''} onChange={(e) => setProductForm({ ...productForm, gustativo: e.target.value })} />
                      </div>
                      <div className="form-control w-full">
                        <label className="label"><span className="label-text font-bold">Harmonização</span></label>
                        <textarea placeholder="Ex: Carnes vermelhas, queijos maduros..." className="textarea textarea-bordered w-full min-h-[60px]"
                          value={productForm.harmonizacao || ''} onChange={(e) => setProductForm({ ...productForm, harmonizacao: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: CATEGORIAS E SETOR */}
              {activeTab === 'categoria' && (
                <div className="flex flex-col gap-8 animate-[fadeInTab_0.3s_ease]">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control w-full">
                      <label className="label"><span className="label-text text-xs tracking-widest uppercase font-bold">Setor Base do Produto</span></label>
                      <select 
                        className="select select-bordered w-full h-14 bg-primary/5 text-primary font-bold border-primary/30"
                        value={productForm.type}
                        onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                      >
                        <option value="carnes_">🥩 Boutique de Carnes</option>
                        <option value="adega">🍷 Adega de Vinhos</option>
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label"><span className="label-text text-xs tracking-widest uppercase font-bold">Pontuação (Específico Vinhos)</span></label>
                      <input 
                        type="text" placeholder="Ex: RP95 | WS92" 
                        className={`input input-bordered w-full h-14 ${productForm.type === 'adega' ? '' : 'opacity-40 cursor-not-allowed'}`}
                        value={productForm.pontuacao}
                        onChange={(e) => setProductForm({ ...productForm, pontuacao: e.target.value })}
                        disabled={productForm.type !== 'adega'}
                      />
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label mb-2"><span className="label-text text-xs tracking-widest uppercase font-bold">Vincular Categorias de Apresentação</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-6 border border-base-300 rounded-2xl bg-base-200/50 max-h-[350px] overflow-y-auto">
                      {categories.filter(c => {
                        if (productForm.type === 'adega') {
                          return c.type === 'sessoes_vinho_';
                        } else {
                          return c.type === 'sessoes_carnes_' || c.type === 'racas_carnes' || c.type === 'embalagem_carnes';
                        }
                      }).map(cat => {
                        const isChecked = productForm.categoryIds.includes(cat.id);
                        return (
                          <label key={cat.id} className={`flex items-center gap-3 text-sm cursor-pointer px-4 py-3 rounded-xl border transition-all duration-200
                            ${isChecked ? 'bg-primary/10 text-primary border-primary/30 font-bold' : 'bg-base-100/50 text-base-content/70 border-transparent hover:bg-base-200'}`}>
                            <input 
                              type="checkbox" 
                              className="checkbox checkbox-primary checkbox-sm"
                              checked={isChecked}
                              onChange={() => {
                                const updated = isChecked 
                                  ? productForm.categoryIds.filter(id => id !== cat.id)
                                  : [...productForm.categoryIds, cat.id];
                                setProductForm({ ...productForm, categoryIds: updated });
                              }}
                            />
                            {cat.name}
                          </label>
                        );
                      })}
                      
                      {categories.filter(c => {
                        if (productForm.type === 'adega') {
                          return c.type === 'sessoes_vinho_';
                        } else {
                          return c.type === 'sessoes_carnes_' || c.type === 'racas_carnes' || c.type === 'embalagem_carnes';
                        }
                      }).length === 0 && (
                        <div className="text-base-content/50 italic p-3 col-span-full">Nenhuma categoria disponível para este setor.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 5: SEO E VISIBILIDADE */}
              {activeTab === 'seo' && (
                <div className="flex flex-col gap-8 animate-[fadeInTab_0.3s_ease]">
                  
                  <div className={`p-6 rounded-2xl border flex items-start gap-5 transition-all duration-300
                    ${productForm.status === 'on' ? 'bg-success/5 border-success/20' : 'bg-error/5 border-error/20'}`}>
                    <div className="pt-1">
                      <input 
                        type="checkbox" 
                        className={`toggle ${productForm.status === 'on' ? 'toggle-success' : 'toggle-error'}`}
                        checked={productForm.status === 'on'}
                        onChange={(e) => setProductForm({ ...productForm, status: e.target.checked ? 'on' : 'off' })}
                        id="status-check"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="status-check" className={`text-lg font-bold cursor-pointer mb-2 ${productForm.status === 'on' ? 'text-success' : 'text-error'}`}>
                        {productForm.status === 'on' ? 'Produto Ativo e Visível' : 'Produto Oculto (Rascunho / Sem Estoque)'}
                      </label>
                      <span className="text-sm text-base-content/60 leading-relaxed">
                        Desmarque esta opção para esconder este produto da loja. Ele continuará salvo no seu banco de dados, mas seus clientes não conseguirão vê-lo nem adicioná-lo ao carrinho.
                      </span>
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label"><span className="label-text text-xs tracking-widest uppercase font-bold">URL Amigável (Slug Gerado)</span></label>
                    <div className="flex items-center bg-base-300/50 border border-base-300 rounded-xl px-4 overflow-hidden">
                      <span className="text-base-content/50 text-sm whitespace-nowrap">antenorefilhos.com.br/produtos/</span>
                      <input 
                        type="text" 
                        className="flex-1 py-4 px-2 border-none bg-transparent text-primary text-sm font-mono outline-none min-w-0"
                        value={productForm.slug}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 md:px-8 border-t border-base-300 flex justify-end gap-4 bg-base-200/50">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary gap-2">
            <i className="fa-solid fa-check"></i> Salvar Produto no Catálogo
          </button>
        </div>

      </form>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
