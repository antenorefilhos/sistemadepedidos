'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// --- Country Flag Helpers ---
const COUNTRY_FLAG_MAP = {
  brasil: '🇧🇷',
  franca: '🇫🇷',
  italia: '🇮🇹',
  portugal: '🇵🇹',
  chile: '🇨🇱',
  argentina: '🇦🇷',
  espanha: '🇪🇸',
  uruguai: '🇺🇾',
  alemanha: '🇩🇪',
  eua: '🇺🇸',
};

const WINE_TYPE_SLUGS = ['tinto', 'branco', 'rose', 'espumante', 'rosé', 'rose-espumante'];

function getCountryBadge(categories) {
  if (!categories) return null;
  const countryCat = categories.find(c =>
    c.type === 'sessoes_vinho_' && !WINE_TYPE_SLUGS.includes(c.slug.toLowerCase())
  );
  if (!countryCat) return null;
  const flag = COUNTRY_FLAG_MAP[countryCat.slug.toLowerCase()] || '🍷';
  return { flag, name: countryCat.name.replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, '').trim(), slug: countryCat.slug };
}

function getWineType(categories) {
  if (!categories) return null;
  const typeCat = categories.find(c =>
    c.type === 'sessoes_vinho_' && WINE_TYPE_SLUGS.includes(c.slug.toLowerCase())
  );
  return typeCat ? typeCat.name : null;
}

// --- Description Parser for Wine Products ---
function parseWineDescription(product) {
  // Now relies exclusively on structured database fields
  const specs = {
    uvas: product.uva,
    produtor: product.produtor,
    regiao: product.origem,
    teor: product.teor_alcoolico,
    servico: product.temperatura,
    safra: product.safra,
    enologo: product.enologo,
    volume: product.volume,
    potencial_guarda: product.potencial_guarda,
    amadurecimento: product.amadurecimento
  };

  const details = {
    visual: product.visual,
    olfativo: product.olfativo,
    gustativo: product.gustativo,
    harmonizacao: product.harmonizacao
  };

  return { specs, details };
}

// --- Spec Card Component ---
function SpecCard({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="spec-card">
      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ fontSize: '12px' }}>{icon}</span>
        {label}
      </span>
      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.3' }}>
        {value}
      </span>
    </div>
  );
}

// --- Detail Block Component ---
function DetailBlock({ title, content }) {
  if (!content) return null;
  return (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--primary)',
        marginBottom: '8px',
        fontFamily: 'var(--font-sans)',
        fontWeight: '600',
        paddingBottom: '6px',
        borderBottom: '1px solid rgba(171,144,112,0.2)'
      }}>
        {title}
      </h4>
      <p style={{ fontSize: '14px', lineHeight: '1.75', color: 'var(--text-muted)' }}>
        {content}
      </p>
    </div>
  );
}

export default function ProductDetails({ product, relatedProducts }) {
  const [qty, setQty] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [isInCart, setIsInCart] = useState(false);

  useEffect(() => {
    const loadCart = () => {
      const cartStr = localStorage.getItem('jet_engine_store_carrinho') || '';
      if (cartStr.trim() !== '') {
        const ids = cartStr.split(',').filter(id => id.trim() !== '');
        setCartItems(ids);
        
        const count = ids.filter(id => id === String(product.id)).length;
        if (count > 0) {
          setQty(count);
          setIsInCart(true);
        } else {
          setQty(1);
          setIsInCart(false);
        }
      } else {
        setCartItems([]);
        setQty(1);
        setIsInCart(false);
      }
    };

    loadCart();

    const handleCartChange = () => loadCart();
    window.addEventListener('cart_changed', handleCartChange);

    return () => {
      window.removeEventListener('cart_changed', handleCartChange);
    };
  }, [product.id]);

  const updateCartQuantity = (newQty) => {
    if (newQty < 1) {
      const updated = cartItems.filter(id => id !== String(product.id));
      localStorage.setItem('jet_engine_store_carrinho', updated.join(','));
      setIsInCart(false);
      setQty(1);
    } else {
      const baseList = cartItems.filter(id => id !== String(product.id));
      for (let i = 0; i < newQty; i++) {
        baseList.push(String(product.id));
      }
      localStorage.setItem('jet_engine_store_carrinho', baseList.join(','));
      setIsInCart(true);
      setQty(newQty);
    }
    window.dispatchEvent(new Event('cart_changed'));
  };

  const handleAddToCart = () => {
    updateCartQuantity(qty);
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    const img = e.currentTarget.querySelector('img');
    if (img) {
      img.style.transform = 'scale(1.8)';
      img.style.transformOrigin = `${x}% ${y}%`;
    }
  };

  const handleMouseLeave = (e) => {
    const img = e.currentTarget.querySelector('img');
    if (img) {
      img.style.transform = 'scale(1)';
      img.style.transformOrigin = 'center center';
    }
  };

  // Meat product badges
  const breedCat = product.categories?.find(c => c.type === 'racas_carnes');
  const embalagemCat = product.categories?.find(c => c.type === 'embalagem_carnes');

  let breedLogo = null;
  if (breedCat) {
    const slug = breedCat.slug.toLowerCase();
    if (slug.includes('angus')) {
      breedLogo = '/novo/wp-content/uploads/CERTIFICADO-ANGUS.png';
    } else if (slug.includes('wagyu')) {
      breedLogo = '/novo/wp-content/uploads/WAGYU-BEEF-SELO.png';
    }
  }

  // Wine data
  const isWine = product.type === 'adega';
  const countryBadge = isWine ? getCountryBadge(product.categories) : null;
  const wineType = isWine ? getWineType(product.categories) : null;

  // Parse scores
  const parsedRatings = [];
  if (isWine && product.pontuacao) {
    product.pontuacao.split('|').forEach(part => {
      const match = part.match(/([a-zA-Z\s]+)(\d+)/);
      if (match) {
        parsedRatings.push({
          label: match[1].replace(/[^a-zA-Z]/g, '').trim(),
          score: match[2].trim()
        });
      } else {
        const clean = part.replace(/[^\w\s]/g, '').trim();
        if (clean) {
          parsedRatings.push({ label: '', score: clean });
        }
      }
    });
  }

  // Parse wine description
  const wineData = isWine ? parseWineDescription(product) : null;

  return (
    <div className="page-wrapper" style={{ paddingBottom: '40px' }}>
      <div className="container">
        
        {/* Breadcrumb */}
        <div style={{ marginBottom: '30px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--primary)' }}>Início</Link>
          <span style={{ margin: '0 8px' }}>&rsaquo;</span>
          <Link href={isWine ? '/adega' : '/boutique'} style={{ color: 'var(--primary)' }}>
            {isWine ? 'Adega de Vinhos' : 'Boutique de Carnes'}
          </Link>
          <span style={{ margin: '0 8px' }}>&rsaquo;</span>
          <span style={{ color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: product.title }} />
        </div>

        {/* Product Details Section */}
        <div className="product-details-container">
          
          {/* Left Column: Image with Magnifier Zoom */}
          <div>
            <div 
              className="product-zoom-container"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.title} 
                  className="product-zoom-image"
                  style={{ transition: 'transform 0.15s ease-out' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Sem Foto
                </div>
              )}
            </div>
            <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ marginRight: '6px' }}></i>
              Passe o mouse sobre a imagem para ampliar
            </p>
          </div>

          {/* Right Column: Information & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            {/* Country Badge (Wine) */}
            {isWine && countryBadge && (
              <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(171,144,112,0.1)',
                  border: '1px solid rgba(171,144,112,0.3)',
                  padding: '5px 12px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontWeight: '500'
                }}>
                  <span style={{ fontSize: '18px' }}>{countryBadge.flag}</span>
                  {countryBadge.name}
                </span>
                {wineType && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    padding: '5px 12px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    <i className="fa-solid fa-wine-glass" style={{ fontSize: '10px' }}></i>
                    {wineType}
                  </span>
                )}
              </div>
            )}

            {/* Meat Badges Row */}
            {!isWine && (
              <div className="product-meta-badge-row">
                {breedLogo && (
                  <img 
                    src={breedLogo} 
                    alt={breedCat.name} 
                    className="badge-breed-img"
                    style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
                  />
                )}
                {embalagemCat && (
                  <span className={`badge-tag badge-tag-${embalagemCat.slug.toLowerCase()}`}>
                    <i className="fa-solid fa-snowflake"></i> {embalagemCat.name}
                  </span>
                )}
              </div>
            )}

            {/* Title */}
            <h1 
              style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', color: 'var(--text-primary)', marginBottom: '12px', fontFamily: 'var(--font-serif)', lineHeight: '1.2' }}
              dangerouslySetInnerHTML={{ __html: product.title }}
            />

            {product.sku && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Código (EAN): <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 6px', color: 'var(--primary-hover)' }}>{product.sku}</code>
              </p>
            )}

            {/* WINE TOP DETAILS LIST */}
            {isWine && wineData && (
              <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {wineData.specs.produtor && (
                  <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <i className="fa-solid fa-leaf"></i> Produtor
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '500' }}>{wineData.specs.produtor}</span>
                  </div>
                )}
                {wineData.specs.regiao && (
                  <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <i className="fa-solid fa-globe"></i> Origem
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '500' }}>{wineData.specs.regiao}</span>
                  </div>
                )}
                {wineData.specs.uvas && (
                  <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <i className="fa-solid fa-seedling"></i> Uvas
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '500' }}>{wineData.specs.uvas}</span>
                  </div>
                )}
                {wineData.specs.enologo && (
                  <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <i className="fa-solid fa-user-tie"></i> Enólogo
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '500' }}>{wineData.specs.enologo}</span>
                  </div>
                )}
                
                {/* Volume Badge */}
                {wineData.specs.volume && (
                  <div style={{ marginTop: '10px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'transparent', border: '1px solid var(--primary)',
                      padding: '6px 14px', borderRadius: '99px', fontSize: '12px', color: 'var(--primary)'
                    }}>
                      <i className="fa-solid fa-wine-bottle"></i> {wineData.specs.volume}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Wine Score Badges (large cards row) */}
            {isWine && parsedRatings.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {parsedRatings.map((r, idx) => (
                  <div
                    key={idx}
                    className={`wine-score-badge${idx > 0 ? ' wine-score-badge-secondary' : ''}`}
                  >
                    <span style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-serif)', lineHeight: '1' }}>
                      {r.score}
                    </span>
                    {r.label && (
                      <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.2', textAlign: 'center' }}>
                        {r.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Price block */}
            <div style={{ 
              padding: '20px 0', 
              borderTop: '1px solid var(--border-color)', 
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '28px'
            }}>
              <span style={{ fontSize: '13px', textTransform: 'uppercase', display: 'block', color: 'var(--text-muted)', marginBottom: '5px' }}>
                Valor Unitário Estimado
              </span>
              <span style={{ fontSize: '32px', color: 'var(--primary)', fontWeight: 'bold' }}>
                {product.preco ? (
                  <>
                    <span style={{ fontSize: '0.65em', marginRight: '4px', fontWeight: 'normal' }}>R$</span>
                    {product.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </>
                ) : (
                  'Preço sob consulta'
                )}
              </span>
              {product.peso && (
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                  ({product.peso} {product.unidade_peso})
                </span>
              )}
            </div>

            {/* Description (non-wine only) */}
            {!isWine && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Descrição Detalhada
                </h3>
                <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-muted)' }}>
                  {product.description || 'Este item de alta qualidade foi criteriosamente selecionado pelos especialistas da Antenor & Filhos para garantir a melhor experiência gastronômica da Serra Imperial. Procedência garantida.'}
                </p>
              </div>
            )}

            {/* Actions: Add to Cart */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Quantity Selector */}
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                border: '1px solid var(--border-color)', 
                height: '48px',
                backgroundColor: 'rgba(0,0,0,0.15)'
              }}>
                <button 
                  onClick={() => {
                    const next = qty - 1;
                    if (next >= 1) {
                      setQty(next);
                      if (isInCart) updateCartQuantity(next);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    width: '40px',
                    height: '100%',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  -
                </button>
                <span style={{
                  minWidth: '35px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  color: 'var(--text-primary)'
                }}>
                  {qty}
                </span>
                <button 
                  onClick={() => {
                    const next = qty + 1;
                    setQty(next);
                    if (isInCart) updateCartQuantity(next);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    width: '40px',
                    height: '100%',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  +
                </button>
              </div>

              {/* Add Button */}
              <div style={{ flexGrow: 1 }}>
                {isInCart ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href="/carrinho" className="btn btn-primary" style={{ flexGrow: 1, height: '48px', fontSize: '13px' }}>
                      <i className="fa-solid fa-check" style={{ marginRight: '8px' }}></i> Ir para Orçamento
                    </Link>
                    <button 
                      onClick={() => updateCartQuantity(0)}
                      className="btn btn-secondary" 
                      style={{ 
                        borderColor: 'var(--danger)', 
                        color: 'var(--danger)', 
                        height: '48px', 
                        padding: '0 15px',
                        fontSize: '12px' 
                      }}
                      title="Remover do carrinho"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleAddToCart}
                    className="btn btn-primary" 
                    style={{ width: '100%', height: '48px', fontSize: '13px' }}
                  >
                    <i className="fa-solid fa-cart-plus" style={{ marginRight: '8px' }}></i>
                    Incluir
                  </button>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* ====================================================== */}
        {/* WINE PREMIUM DESCRIPTION — Mistral-style two columns   */}
        {/* ====================================================== */}
        {isWine && wineData && (
          <div className="wine-description-section">
            
            {/* Left Column: Sobre o Vinho + Ficha Técnica */}
            <div className="wine-desc-left">
              
              {/* Intro */}
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{
                  fontSize: '20px',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--text-primary)',
                  marginBottom: '14px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid rgba(171,144,112,0.25)'
                }}>
                  Sobre o Vinho
                </h2>
                <div 
                  className="html-description-content"
                  style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--text-muted)' }}
                  dangerouslySetInnerHTML={{ 
                    __html: product.description || 'Rótulo selecionado com critério pelos especialistas da Antenor & Filhos. Procedência garantida e qualidade certificada pelas principais revistas especializadas do mundo.'
                  }}
                />
              </div>

              {/* Ficha Técnica Grid */}
              {Object.values(wineData.specs).some(v => v) && (
                <div>
                  <h3 style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--text-muted)',
                    marginBottom: '14px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: '600'
                  }}>
                    Ficha Técnica
                  </h3>
                  <div className="wine-specs-grid">
                    {wineType && (
                      <SpecCard icon="🍷" label="Tipo" value={wineType} />
                    )}
                    <SpecCard icon="🫧" label="Uvas" value={wineData.specs.uvas} />
                    <SpecCard icon="🌡️" label="Temp. de Serviço" value={wineData.specs.servico} />
                    <SpecCard icon="📅" label="Safra" value={wineData.specs.safra} />
                    <SpecCard icon="⌛" label="Amadurecimento" value={wineData.specs.amadurecimento ? (wineData.specs.amadurecimento.length > 50 ? wineData.specs.amadurecimento.substring(0, 50) + '...' : wineData.specs.amadurecimento) : null} />
                    <SpecCard icon="⏳" label="Potencial de Guarda" value={wineData.specs.potencial_guarda} />
                    <SpecCard icon="🔥" label="Teor Alcoólico" value={wineData.specs.teor} />
                    <SpecCard icon="🍾" label="Volume" value={wineData.specs.volume} />
                  </div>
                </div>
              )}

              {/* Fallback if no specs found */}
              {!Object.values(wineData.specs).some(v => v) && (
                <div>
                  <h3 style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--text-muted)',
                    marginBottom: '14px',
                    fontWeight: '600'
                  }}>
                    Ficha Técnica
                  </h3>
                  <div className="wine-specs-grid">
                    {wineType && <SpecCard icon="🍷" label="Tipo" value={wineType} />}
                    {wineData.specs.volume && <SpecCard icon="🍾" label="Volume" value={wineData.specs.volume} />}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Detail blocks */}
            <div className="wine-desc-right">
              <h2 style={{
                fontSize: '20px',
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-primary)',
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(171,144,112,0.25)'
              }}>
                Notas de Degustação
              </h2>

              <DetailBlock title="Amadurecimento" content={wineData.specs.amadurecimento} />
              <DetailBlock title="Visual" content={wineData.details.visual} />
              <DetailBlock title="Olfativo" content={wineData.details.olfativo} />
              <DetailBlock title="Gustativo" content={wineData.details.gustativo} />
              <DetailBlock title="Harmonização" content={wineData.details.harmonizacao} />

              {/* If no detail blocks parsed, show the raw description elegantly */}
              {!Object.values(wineData.details).some(v => v) && product.description && (
                <div>
                  <div 
                    style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-muted)' }}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}

              {/* Scores in right column (detailed) */}
              {parsedRatings.length > 0 && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(171,144,112,0.2)' }}>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Pontuações da Crítica Especializada
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {parsedRatings.map((r, idx) => (
                      <div
                        key={idx}
                        className={`wine-score-badge${idx > 0 ? ' wine-score-badge-secondary' : ''}`}
                      >
                        <span style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'var(--font-serif)', lineHeight: '1' }}>
                          {r.score}
                        </span>
                        {r.label && (
                          <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', lineHeight: '1.2' }}>
                            {r.label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Related Products Showcase */}
        {relatedProducts.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '50px', marginTop: '40px' }}>
            <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '30px', fontFamily: 'var(--font-serif)' }}>
              Outros Rótulos & Cortes Recomendados
            </h2>
            <div className="product-grid">
              {relatedProducts.map(p => {
                const breed = p.categories?.find(c => c.type === 'racas_carnes');
                let logo = null;
                if (breed) {
                  const s = breed.slug.toLowerCase();
                  if (s.includes('angus')) logo = '/novo/wp-content/uploads/CERTIFICADO-ANGUS.png';
                  else if (s.includes('wagyu')) logo = '/novo/wp-content/uploads/WAGYU-BEEF-SELO.png';
                }
                const embalagem = p.categories?.find(c => c.type === 'embalagem_carnes');
                const pCountry = getCountryBadge(p.categories);

                // Parse related wine scores
                const relRatings = [];
                if (p.type === 'adega' && p.pontuacao) {
                  p.pontuacao.split('|').forEach(part => {
                    const match = part.match(/([a-zA-Z\s]+)(\d+)/);
                    if (match) relRatings.push({ label: match[1].replace(/[^a-zA-Z]/g, '').trim(), score: match[2].trim() });
                    else { const c = part.replace(/[^\w\s]/g, '').trim(); if (c) relRatings.push({ label: '', score: c }); }
                  });
                }

                return (
                  <div className="product-card" key={p.id}>
                    <Link href={`/produtos/${p.slug}`}>
                      <div className="product-image-container">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="product-image" loading="lazy" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#232936', fontSize: '12px', color: 'var(--text-muted)' }}>Sem Foto</div>
                        )}
                        {logo && (
                          <img src={logo} alt="" style={{ position: 'absolute', top: '10px', left: '10px', height: '60px', width: 'auto', zIndex: 2 }} />
                        )}
                        {embalagem && (
                          <span className={`product-badge badge-tag-${embalagem.slug.toLowerCase()}`} style={{ position: 'absolute', top: '10px', right: '10px', left: 'auto', zIndex: 2 }}>{embalagem.name}</span>
                        )}
                        {/* Wine related: country badge */}
                        {pCountry && (
                          <div style={{
                            position: 'absolute', top: '8px', left: '8px', zIndex: 2,
                            background: 'rgba(10,10,10,0.78)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255,255,255,0.12)', padding: '3px 7px',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            fontSize: '10px', color: 'rgba(255,255,255,0.88)'
                          }}>
                            <span style={{ fontSize: '14px' }}>{pCountry.flag}</span>
                            <span>{pCountry.name}</span>
                          </div>
                        )}
                        {/* Wine score badges */}
                        {relRatings.length > 0 && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', zIndex: 2 }}>
                            {relRatings.slice(0, 2).map((r, idx) => (
                              <div
                                key={idx}
                                className={`wine-score-badge${idx > 0 ? ' wine-score-badge-secondary' : ''}`}
                              >
                                <span style={{ fontSize: '17px', fontWeight: '700', fontFamily: 'var(--font-serif)', lineHeight: '1' }}>{r.score}</span>
                                {r.label && <span style={{ fontSize: '8px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center', lineHeight: '1.1' }}>{r.label}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="product-info" style={{ padding: '15px' }}>
                      <h3 className="product-title" style={{ fontSize: '14px', height: '38px' }}>
                        <Link 
                          href={`/produtos/${p.slug}`} 
                          style={{ color: 'inherit', textDecoration: 'none' }}
                          dangerouslySetInnerHTML={{ __html: p.title }}
                        />
                      </h3>
                      <div className="product-meta" style={{ marginTop: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.peso ? `${p.peso} ${p.unidade_peso}` : ''}</span>
                        <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold' }}>
                          {p.preco ? (
                            <>
                              <span style={{ fontSize: '0.7em', marginRight: '2px', fontWeight: 'normal' }}>R$</span>
                              {p.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </>
                          ) : (
                            'Preço sob consulta'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
