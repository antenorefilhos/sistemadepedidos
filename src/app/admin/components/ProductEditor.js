'use client';

import { useState, useRef } from 'react';

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
      const res = await fetch(`/api/admin/upload?auth=${encodeURIComponent(password)}`, {
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
      style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: '16px',
        backgroundColor: activeTab === id ? 'var(--primary-light)' : 'transparent',
        color: activeTab === id ? 'var(--text-primary)' : 'var(--text-muted)',
        border: 'none', 
        borderLeft: activeTab === id ? '3px solid var(--primary)' : '3px solid transparent',
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
        borderRadius: '0 12px 12px 0', margin: '4px 12px 4px 0'
      }}
    >
      <span style={{ 
        fontSize: '18px', 
        color: activeTab === id ? 'var(--primary)' : 'inherit',
        backgroundColor: activeTab === id ? 'rgba(171,144,112,0.15)' : 'rgba(255,255,255,0.05)',
        width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '8px', transition: 'all 0.2s ease'
      }}>
        {icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '0.03em' }}>{label}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', opacity: activeTab === id ? 1 : 0.7 }}>{description}</span>
      </div>
    </button>
  );

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', 
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', 
      padding: '20px', animation: 'fadeIn 0.2s ease' 
    }}>
      
      <form onSubmit={handleSaveProduct} className="glass" style={{ 
        width: '100%', maxWidth: '1200px', height: '85vh', 
        display: 'flex', flexDirection: 'column', 
        borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        
        {/* Superior: Header Limpo */}
        <div style={{ 
          padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          backgroundColor: 'rgba(0,0,0,0.2)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '20px' }}>
              <i className="fa-solid fa-box-open"></i>
            </div>
            <div>
              <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: '600', fontFamily: 'var(--font-serif)' }}>
                {productForm.id ? 'Editor de Produto' : 'Novo Produto'}
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                {productForm.title ? productForm.title : 'Preencha as informações para o catálogo'}
              </span>
            </div>
          </div>
          
          <button type="button" onClick={onClose} style={{ 
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', 
            width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }} onMouseOver={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: '16px' }}></i>
          </button>
        </div>

        {/* Corpo Principal (Abas + Conteúdo) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Menu Lateral Abas */}
          <div style={{ 
            width: '280px', backgroundColor: 'rgba(0,0,0,0.3)', 
            borderRight: '1px solid rgba(255,255,255,0.05)', 
            display: 'flex', flexDirection: 'column', paddingTop: '16px' 
          }}>
            {renderTabButton('geral', <i className="fa-solid fa-align-left"></i>, 'Informações', 'Nome, EAN e Descrição')}
            {renderTabButton('preco', <i className="fa-solid fa-tag"></i>, 'Preços & Pesos', 'Valores e dimensões')}
            {renderTabButton('midia', <i className="fa-regular fa-image"></i>, 'Mídia Visual', 'Fotos do produto')}
            {productForm.type === 'adega_' && renderTabButton('vinho', <i className="fa-solid fa-wine-glass"></i>, 'Ficha Técnica', 'Atributos de Vinhos')}
            {renderTabButton('categoria', <i className="fa-solid fa-layer-group"></i>, 'Classificação', 'Setores e categorias')}
            {renderTabButton('seo', <i className="fa-solid fa-globe"></i>, 'Visibilidade', 'Status e links diretos')}
          </div>

          {/* Conteúdo da Aba */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '40px 50px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
            <div style={{ maxWidth: '800px' }}>

              {/* ABA 1: DADOS BÁSICOS */}
              {activeTab === 'geral' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeInTab 0.3s ease' }}>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>Nome do Produto <span style={{color: 'var(--primary)'}}>*</span></label>
                    <input 
                      type="text" required 
                      placeholder="Ex: Picanha Wagyu A5 1kg" 
                      className="form-control"
                      style={{ fontSize: '16px', padding: '16px' }}
                      value={productForm.title}
                      onChange={(e) => handleProductTitleChange(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>Código de Barras / EAN / SKU</label>
                    <input 
                      type="text" placeholder="Para leitura no PDV / ERP Solidcon" 
                      className="form-control"
                      style={{ padding: '16px' }}
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>Descrição / Notas de Degustação</label>
                    <textarea 
                      placeholder="Conte a história do produto, modo de preparo ou harmonização..." 
                      className="form-control"
                      style={{ minHeight: '160px', resize: 'vertical', padding: '16px' }}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* ABA 2: PREÇO E MEDIDAS */}
              {activeTab === 'preco' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeInTab 0.3s ease' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>Preço de Venda (R$)</label>
                      <input 
                        type="number" step="0.01" placeholder="0.00" 
                        className="form-control"
                        style={{ fontSize: '20px', fontWeight: 'bold', padding: '16px' }}
                        value={productForm.preco}
                        onChange={(e) => setProductForm({ ...productForm, preco: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Preço Promocional <i className="fa-solid fa-lock" style={{fontSize: '10px', marginLeft: '4px'}}></i></label>
                      <input 
                        type="number" step="0.01" placeholder="0.00" disabled
                        className="form-control"
                        style={{ padding: '16px', opacity: 0.5, cursor: 'not-allowed' }}
                        title="Liberado no Módulo 4: ERP Solidcon"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>Peso Líquido / Volume</label>
                      <input 
                        type="text" placeholder="Ex: 500" 
                        className="form-control"
                        style={{ padding: '16px' }}
                        value={productForm.peso}
                        onChange={(e) => setProductForm({ ...productForm, peso: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>Unidade de Medida</label>
                      <select 
                        className="form-control"
                        style={{ padding: '16px', cursor: 'pointer' }}
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

                  <div className="form-group">
                      <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Estoque Sincronizado <i className="fa-solid fa-lock" style={{fontSize: '10px', marginLeft: '4px'}}></i></label>
                      <input 
                        type="text" placeholder="Aguardando conexão com ERP Solidcon..." disabled
                        className="form-control"
                        style={{ padding: '16px', opacity: 0.5, cursor: 'not-allowed', fontStyle: 'italic' }}
                      />
                  </div>
                </div>
              )}

              {/* ABA 3: MÍDIA */}
              {activeTab === 'midia' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeInTab 0.3s ease' }}>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>Galeria (Imagem Principal)</label>
                    
                    {/* Premium Drag and Drop Area */}
                    <div 
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={onButtonClick}
                      style={{ 
                        width: '100%', height: '320px', 
                        border: `2px dashed ${dragActive ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`, 
                        borderRadius: '16px', 
                        backgroundColor: dragActive ? 'rgba(171, 144, 112, 0.05)' : 'rgba(0,0,0,0.3)', 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                        cursor: 'pointer', transition: 'all 0.3s', position: 'relative', overflow: 'hidden'
                      }}
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
                      
                      {uploading ? (
                        <div style={{ color: 'var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '32px' }}></i>
                          <span style={{ fontWeight: '600' }}>Enviando arquivo...</span>
                        </div>
                      ) : productForm.image_url ? (
                        <>
                          <img src={productForm.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20px' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', padding: '16px', textAlign: 'center', fontSize: '13px', color: 'white', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-upload"></i> Clique ou Arraste nova imagem para substituir
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <i className="fa-regular fa-image" style={{ fontSize: '32px', color: 'white' }}></i>
                          </div>
                          <div style={{ fontSize: '18px', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>Arraste uma foto aqui</div>
                          <div style={{ fontSize: '14px' }}>ou clique para procurar no seu computador</div>
                          <div style={{ fontSize: '12px', marginTop: '20px', opacity: 0.6, backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '99px' }}>
                            JPG, PNG ou WEBP • Máx 2MB
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ height: '1px', flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OU FORNEÇA UMA URL EXTERNA</span>
                    <div style={{ height: '1px', flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                  </div>

                  <div className="form-group">
                    <div style={{ position: 'relative' }}>
                      <i className="fa-solid fa-link" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                      <input 
                        type="text" placeholder="https://meusite.com/imagem.jpg" 
                        className="form-control"
                        style={{ padding: '14px 16px 14px 45px' }}
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA EXTRA: FICHA TÉCNICA (VINHOS) */}
              {activeTab === 'vinho' && productForm.type === 'adega' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeInTab 0.3s ease' }}>
                  
                  {/* SEÇÃO 1: CARACTERÍSTICAS BÁSICAS */}
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '20px', letterSpacing: '0.05em' }}>Características Principais</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>Uva(s)</label>
                        <input type="text" placeholder="Ex: Cabernet Sauvignon" className="form-control" style={{ padding: '14px' }}
                          value={productForm.uva || ''} onChange={(e) => setProductForm({ ...productForm, uva: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>Safra</label>
                        <input type="text" placeholder="Ex: 2019" className="form-control" style={{ padding: '14px' }}
                          value={productForm.safra || ''} onChange={(e) => setProductForm({ ...productForm, safra: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>País / Região</label>
                        <input type="text" placeholder="Ex: Mendoza, Argentina" className="form-control" style={{ padding: '14px' }}
                          value={productForm.origem || ''} onChange={(e) => setProductForm({ ...productForm, origem: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>Produtor / Vinícola</label>
                        <input type="text" placeholder="Ex: Catena Zapata" className="form-control" style={{ padding: '14px' }}
                          value={productForm.produtor || ''} onChange={(e) => setProductForm({ ...productForm, produtor: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>Enólogo</label>
                        <input type="text" placeholder="Ex: Alejandro Vigil" className="form-control" style={{ padding: '14px' }}
                          value={productForm.enologo || ''} onChange={(e) => setProductForm({ ...productForm, enologo: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>Volume</label>
                        <input type="text" placeholder="Ex: 750ml" className="form-control" style={{ padding: '14px' }}
                          value={productForm.volume || ''} onChange={(e) => setProductForm({ ...productForm, volume: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 2: SERVIÇO E GUARDA */}
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '20px', letterSpacing: '0.05em' }}>Serviço e Guarda</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>Teor Alcoólico</label>
                        <input type="text" placeholder="Ex: 13,5%" className="form-control" style={{ padding: '14px' }}
                          value={productForm.teor_alcoolico || ''} onChange={(e) => setProductForm({ ...productForm, teor_alcoolico: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>Temperatura de Serviço</label>
                        <input type="text" placeholder="Ex: 16°C a 18°C" className="form-control" style={{ padding: '14px' }}
                          value={productForm.temperatura || ''} onChange={(e) => setProductForm({ ...productForm, temperatura: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Potencial de Guarda</label>
                        <input type="text" placeholder="Ex: Até 10 anos" className="form-control" style={{ padding: '14px' }}
                          value={productForm.potencial_guarda || ''} onChange={(e) => setProductForm({ ...productForm, potencial_guarda: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Amadurecimento</label>
                        <textarea placeholder="Descreva como e onde o vinho maturou..." className="form-control" style={{ padding: '14px', minHeight: '80px', resize: 'vertical' }}
                          value={productForm.amadurecimento || ''} onChange={(e) => setProductForm({ ...productForm, amadurecimento: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 3: NOTAS DE DEGUSTAÇÃO */}
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '20px', letterSpacing: '0.05em' }}>Notas de Degustação</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>Visual</label>
                        <textarea placeholder="Ex: Vermelho rubi intenso..." className="form-control" style={{ padding: '14px', minHeight: '60px', resize: 'vertical' }}
                          value={productForm.visual || ''} onChange={(e) => setProductForm({ ...productForm, visual: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>Olfativo</label>
                        <textarea placeholder="Ex: Aromas de frutas vermelhas..." className="form-control" style={{ padding: '14px', minHeight: '60px', resize: 'vertical' }}
                          value={productForm.olfativo || ''} onChange={(e) => setProductForm({ ...productForm, olfativo: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>Gustativo</label>
                        <textarea placeholder="Ex: Taninos macios, final longo..." className="form-control" style={{ padding: '14px', minHeight: '60px', resize: 'vertical' }}
                          value={productForm.gustativo || ''} onChange={(e) => setProductForm({ ...productForm, gustativo: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>Harmonização</label>
                        <textarea placeholder="Ex: Carnes vermelhas, queijos maduros..." className="form-control" style={{ padding: '14px', minHeight: '60px', resize: 'vertical' }}
                          value={productForm.harmonizacao || ''} onChange={(e) => setProductForm({ ...productForm, harmonizacao: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: CATEGORIAS E SETOR */}
              {activeTab === 'categoria' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeInTab 0.3s ease' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>Setor Base do Produto</label>
                      <select 
                        className="form-control"
                        style={{ padding: '16px', backgroundColor: 'rgba(171, 144, 112, 0.05)', color: 'var(--primary)', fontWeight: 'bold', border: '1px solid var(--primary-light)' }}
                        value={productForm.type}
                        onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                      >
                        <option value="carnes_">🥩 Boutique de Carnes</option>
                        <option value="adega">🍷 Adega de Vinhos</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>Pontuação (Específico Vinhos)</label>
                      <input 
                        type="text" placeholder="Ex: RP95 | WS92" 
                        className="form-control"
                        style={{ padding: '16px', opacity: productForm.type === 'adega' ? 1 : 0.4 }}
                        value={productForm.pontuacao}
                        onChange={(e) => setProductForm({ ...productForm, pontuacao: e.target.value })}
                        disabled={productForm.type !== 'adega'}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em', marginBottom: '16px', display: 'block' }}>Vincular Categorias de Apresentação</label>
                    <div style={{ 
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', 
                      padding: '24px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', 
                      backgroundColor: 'rgba(0,0,0,0.2)', maxHeight: '350px', overflowY: 'auto' 
                    }}>
                      {categories.filter(c => c.type === (productForm.type === 'adega' ? 'sessoes_vinhos' : 'sessoes_carnes_')).map(cat => {
                        const isChecked = productForm.categoryIds.includes(cat.id);
                        return (
                          <label key={cat.id} style={{ 
                            display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer', 
                            color: isChecked ? 'white' : 'var(--text-muted)', 
                            backgroundColor: isChecked ? 'rgba(171, 144, 112, 0.1)' : 'rgba(255,255,255,0.02)', 
                            padding: '12px 16px', borderRadius: '8px', 
                            border: isChecked ? '1px solid var(--primary-light)' : '1px solid transparent', 
                            transition: 'all 0.2s', fontWeight: isChecked ? '600' : 'normal'
                          }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                const updated = isChecked 
                                  ? productForm.categoryIds.filter(id => id !== cat.id)
                                  : [...productForm.categoryIds, cat.id];
                                setProductForm({ ...productForm, categoryIds: updated });
                              }}
                              style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                            />
                            {cat.name}
                          </label>
                        );
                      })}
                      
                      {categories.filter(c => c.type === (productForm.type === 'adega' ? 'sessoes_vinhos' : 'sessoes_carnes_')).length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px' }}>Nenhuma categoria disponível para este setor.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 5: SEO E VISIBILIDADE */}
              {activeTab === 'seo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeInTab 0.3s ease' }}>
                  
                  <div style={{ 
                    backgroundColor: productForm.status === 'on' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
                    border: `1px solid ${productForm.status === 'on' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, 
                    borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '20px', transition: 'all 0.3s'
                  }}>
                    <div style={{ marginTop: '2px' }}>
                      <input 
                        type="checkbox" 
                        checked={productForm.status === 'on'}
                        onChange={(e) => setProductForm({ ...productForm, status: e.target.checked ? 'on' : 'off' })}
                        style={{ accentColor: productForm.status === 'on' ? '#22c55e' : '#ef4444', width: '28px', height: '28px', cursor: 'pointer' }}
                        id="status-check"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label htmlFor="status-check" style={{ fontSize: '18px', fontWeight: 'bold', color: productForm.status === 'on' ? '#4ade80' : '#fca5a5', cursor: 'pointer', marginBottom: '8px' }}>
                        {productForm.status === 'on' ? 'Produto Ativo e Visível' : 'Produto Oculto (Rascunho / Sem Estoque)'}
                      </label>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Desmarque esta opção para esconder este produto da loja. Ele continuará salvo no seu banco de dados, mas seus clientes não conseguirão vê-lo nem adicioná-lo ao carrinho.
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>URL Amigável (Slug Gerado)</label>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0 16px', overflow: 'hidden' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>antenorefilhos.com.br/produtos/</span>
                      <input 
                        type="text" 
                        style={{ flex: 1, padding: '16px 0', border: 'none', backgroundColor: 'transparent', color: 'var(--primary)', fontSize: '14px', fontFamily: 'monospace', outline: 'none' }}
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
        <div style={{ 
          padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', 
          display: 'flex', justifyContent: 'flex-end', gap: '16px', 
          backgroundColor: 'rgba(0,0,0,0.3)' 
        }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '14px' }}>
            Cancelar Alterações
          </button>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-check"></i> Salvar Produto no Catálogo
          </button>
        </div>

      </form>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInTab {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
