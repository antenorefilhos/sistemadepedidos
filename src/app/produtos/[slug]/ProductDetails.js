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
  const [selectedUnit, setSelectedUnit] = useState('garrafa');
  const [qty, setQty] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [isInCart, setIsInCart] = useState(false);
  
  // Reviews States
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ customer_name: '', rating: 5, comment: '' });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (product?.id) {
      setReviewsLoading(true);
      fetch(`/api/reviews?product_id=${product.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setReviews(data);
        })
        .catch(err => console.error(err))
        .finally(() => setReviewsLoading(false));
    }
  }, [product?.id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.customer_name || !reviewForm.rating) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          customer_name: reviewForm.customer_name,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment
        })
      });
      if (res.ok) {
        setReviewSubmitted(true);
        setReviewForm({ customer_name: '', rating: 5, comment: '' });
      }
    } catch (err) {
      console.error(err);
    }
    setSubmittingReview(false);
  };

  const cartKey = selectedUnit === 'garrafa' ? String(product.id) : `${product.id}_${selectedUnit}`;

  useEffect(() => {
    const loadCart = () => {
      const cartStr = localStorage.getItem('jet_engine_store_carrinho') || '';
      if (cartStr.trim() !== '') {
        const ids = cartStr.split(',').filter(id => id.trim() !== '');
        setCartItems(ids);
        
        const count = ids.filter(id => id === cartKey).length;
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
  }, [product.id, cartKey]);

  const updateCartQuantity = (newQty) => {
    if (newQty < 1) {
      const updated = cartItems.filter(id => id !== cartKey);
      localStorage.setItem('jet_engine_store_carrinho', updated.join(','));
      setIsInCart(false);
      setQty(1);
    } else {
      const baseList = cartItems.filter(id => id !== cartKey);
      for (let i = 0; i < newQty; i++) {
        baseList.push(cartKey);
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

  // Calculate Price per KG for meats
  let precoPorKg = null;
  if (!isWine && product.preco && product.peso) {
    const pesoNum = parseFloat(product.peso);
    if (!isNaN(pesoNum) && pesoNum > 0) {
      if (product.unidade_peso?.toLowerCase() === 'g') {
        precoPorKg = (product.preco / pesoNum) * 1000;
      } else if (product.unidade_peso?.toLowerCase() === 'kg') {
        precoPorKg = product.preco / pesoNum;
      }
    }
  }

  // Calculate dynamic price based on selected variation (for wine)
  let displayPrice = product.preco || 0;
  let unitLabelText = 'Valor Unitário Estimado';
  let totalLabelText = 'garrafa';
  if (isWine && product.preco) {
    if (selectedUnit === 'c6') {
      displayPrice = product.preco * 6;
      unitLabelText = 'Valor Estimado (Caixa com 6un)';
      totalLabelText = 'caixa com 6 unidades';
    } else if (selectedUnit === 'c12') {
      displayPrice = product.preco * 12;
      unitLabelText = 'Valor Estimado (Caixa com 12un)';
      totalLabelText = 'caixa com 12 unidades';
    } else {
      displayPrice = product.preco;
      unitLabelText = 'Valor Estimado (Garrafa)';
      totalLabelText = 'garrafa individual';
    }
  }

  const galleryImages = Array.from(new Set([
    product.image_url,
    ...(Array.isArray(product.gallery_urls) ? product.gallery_urls : (typeof product.gallery_urls === 'string' ? JSON.parse(product.gallery_urls || '[]') : []))
  ])).filter(Boolean);

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const currentImg = galleryImages[activeImgIndex] || product.image_url;

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
          
          {/* Left Column: Image with Magnifier Zoom & Multi-Image Gallery */}
          <div>
            <div 
              className="product-zoom-container"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {currentImg ? (
                <img 
                  src={currentImg} 
                  alt={product.title} 
                  className="product-zoom-image"
                  fetchPriority="high"
                  loading="eager"
                  style={{ transition: 'transform 0.15s ease-out' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Sem Foto
                </div>
              )}
            </div>

            {/* Thumbnails Gallery */}
            {galleryImages.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: activeImgIndex === idx ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
            )}

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
                      padding: '6px 14px', borderRadius: 'var(--radius-round)', fontSize: '12px', color: 'var(--primary)'
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
                {isWine ? unitLabelText : 'Valor Unitário Estimado'}
              </span>
              <span style={{ fontSize: '32px', color: 'var(--primary)', fontWeight: 'bold' }}>
                {product.preco ? (
                  <>
                    <span style={{ fontSize: '0.65em', marginRight: '4px', fontWeight: 'normal' }}>R$</span>
                    {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </>
                ) : (
                  'Preço sob consulta'
                )}
              </span>
              {precoPorKg && (
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '12px', fontWeight: '500' }}>
                  (R$ {precoPorKg.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / kg)
                </span>
              )}
              {isWine && product.preco && selectedUnit !== 'garrafa' && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Equivalente a R$ {product.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por garrafa
                </div>
              )}
              {product.peso && !isWine ? (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    backgroundColor: 'rgba(171, 144, 112, 0.15)',
                    border: '1px solid rgba(171, 144, 112, 0.3)',
                    color: 'var(--primary)', padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: '500'
                  }}>
                    <i className="fa-solid fa-scale-balanced"></i>
                    Peça com peso aproximado de {product.peso} {product.unidade_peso}
                  </span>
                </div>
              ) : product.peso ? (
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                  ({product.peso} {product.unidade_peso})
                </span>
              ) : null}
            </div>

            {/* Seletor Segmentado de Unidade (Somente para Adega/Vinhos) */}
            {isWine && (
              <div style={{ marginBottom: '28px' }}>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', display: 'block', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  Unidade de Venda
                </span>
                <div style={{
                  display: 'flex',
                  gap: '3px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  padding: '3px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  maxWidth: '360px'
                }}>
                  <button 
                    onClick={() => setSelectedUnit('garrafa')}
                    style={{
                      flex: 1,
                      fontSize: '11px',
                      padding: '7px 4px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s',
                      backgroundColor: (selectedUnit === 'garrafa') ? 'var(--primary)' : 'transparent',
                      color: (selectedUnit === 'garrafa') ? 'white' : 'var(--text-muted)'
                    }}
                  >
                    Garrafa
                  </button>
                  <button 
                    onClick={() => setSelectedUnit('c6')}
                    style={{
                      flex: 1,
                      fontSize: '11px',
                      padding: '7px 4px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s',
                      backgroundColor: (selectedUnit === 'c6') ? 'var(--primary)' : 'transparent',
                      color: (selectedUnit === 'c6') ? 'white' : 'var(--text-muted)'
                    }}
                  >
                    Caixa 6un
                  </button>
                  <button 
                    onClick={() => setSelectedUnit('c12')}
                    style={{
                      flex: 1,
                      fontSize: '11px',
                      padding: '7px 4px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s',
                      backgroundColor: (selectedUnit === 'c12') ? 'var(--primary)' : 'transparent',
                      color: (selectedUnit === 'c12') ? 'white' : 'var(--text-muted)'
                    }}
                  >
                    Caixa 12un
                  </button>
                </div>
              </div>
            )}

            {/* Description (non-wine only) */}
            {!isWine && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Descrição Detalhada
                </h3>
                <div 
                  style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-muted)' }}
                  dangerouslySetInnerHTML={{ 
                    __html: product.description || 'Este item de alta qualidade foi criteriosamente selecionado pelos especialistas da Antenor & Filhos para garantir a melhor experiência gastronômica da Serra Imperial. Procedência garantida.'
                  }}
                />
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

              {/* Empty state or specific notes like Amadurecimento are handled above */}

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

        {/* Seção de Avaliações */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '50px', marginTop: '40px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '30px', fontFamily: 'var(--font-serif)' }}>
            Avaliações dos Clientes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Listagem de avaliações */}
            <div className="md:col-span-2">
              {reviewsLoading ? (
                <p className="text-base-content/60 italic">Carregando avaliações...</p>
              ) : reviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '14px' }}>Este produto ainda não possui avaliações. Seja o primeiro a avaliar!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {reviews.map(r => (
                    <div key={r.id} className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>{r.customer_name}</span>
                        <div style={{ display: 'flex', gap: '2px', color: '#fbbf24' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <i key={i} className={i < r.rating ? "fa-solid fa-star text-xs" : "fa-regular fa-star text-xs"}></i>
                          ))}
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{r.comment}</p>}
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '10px' }}>
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulário de envio */}
            <div>
              <div className="glass" style={{ padding: '25px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '20px', fontWeight: 'bold' }}>Avaliar este produto</h3>
                
                {reviewSubmitted ? (
                  <div className="alert alert-success text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80', padding: '15px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '10px', alignItems: 'start' }}>
                    <i className="fa-solid fa-circle-check text-lg" style={{ marginTop: '2px' }}></i>
                    <div>
                      <h4 className="font-bold">Obrigado!</h4>
                      <p className="text-[11px] opacity-80 mt-1" style={{ lineHeight: '1.4' }}>Sua avaliação foi enviada com sucesso e está pendente de aprovação pela equipe do Antenor & Filhos.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seu Nome</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: Carlos Silva" 
                        className="form-control"
                        style={{ height: '40px', fontSize: '13px' }}
                        value={reviewForm.customer_name}
                        onChange={e => setReviewForm({ ...reviewForm, customer_name: e.target.value })}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classificação</label>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const val = idx + 1;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: val })}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              <i 
                                className={val <= reviewForm.rating ? "fa-solid fa-star" : "fa-regular fa-star"} 
                                style={{ fontSize: '20px', color: val <= reviewForm.rating ? '#fbbf24' : 'var(--text-muted)' }}
                              ></i>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comentário (Opcional)</label>
                      <textarea 
                        rows="3" 
                        placeholder="O que achou deste corte ou rótulo?" 
                        className="form-control"
                        style={{ fontSize: '13px', padding: '10px' }}
                        value={reviewForm.comment}
                        onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={submittingReview} 
                      className="btn btn-primary w-full"
                      style={{ height: '42px', fontSize: '13px', fontWeight: 'bold' }}
                    >
                      {submittingReview ? 'Enviando...' : 'Enviar Avaliação'}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>

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
                          <img src={p.image_url} alt={`Imagem do produto ${p.title}`} className="product-image" loading="lazy" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>Sem Foto</div>
                        )}
                        {logo && (
                          <img src={logo} alt="" aria-hidden="true" style={{ position: 'absolute', top: '10px', left: '10px', height: '60px', width: 'auto', zIndex: 2 }} />
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
