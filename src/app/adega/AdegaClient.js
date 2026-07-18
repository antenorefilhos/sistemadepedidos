'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Fuse from 'fuse.js';

// Map country slugs to flag emojis
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
  return { flag, name: countryCat.name.replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, '').trim() };
}

function getMaxScore(pontuacao) {
  if (!pontuacao) return 0;
  const matches = pontuacao.match(/\d+/g);
  if (!matches) return 0;
  return Math.max(...matches.map(Number));
}

export default function AdegaClient() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [mobileFiltersActive, setMobileFiltersActive] = useState(false);
  const [priceRange, setPriceRange] = useState('');
  const [selectedScore, setSelectedScore] = useState('');
  
  // Cart State (stored in localStorage.jet_engine_store_carrinho)
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    // 1. Fetch products & categories from APIs
    const fetchData = async () => {
      try {
        const prodRes = await fetch('/api/products');
        const catRes = await fetch('/api/categories');
        
        if (prodRes.ok && catRes.ok) {
          const prods = await prodRes.json();
          const cats = await catRes.json();
          setProducts(prods);
          setCategories(cats);
        }
      } catch (err) {
        console.error('Error loading adega data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 2. Load initial cart from localStorage
    const loadCart = () => {
      const cartStr = localStorage.getItem('jet_engine_store_carrinho') || '';
      if (cartStr.trim() !== '') {
        const ids = cartStr.split(',').filter(id => id.trim() !== '');
        setCartItems(ids);
      } else {
        setCartItems([]);
      }
    };
    
    loadCart();
    
    // Listen to custom events
    const handleCartChange = () => loadCart();
    window.addEventListener('cart_changed', handleCartChange);
    
    return () => {
      window.removeEventListener('cart_changed', handleCartChange);
    };
  }, []);

  // Filtered products list (only adega)
  const filteredProducts = (() => {
    let result = products.filter(p => p.type === 'adega');
    
    // Filtro de Categoria
    if (selectedCategory !== '') {
      result = result.filter(p => p.categories.some(cat => cat.slug === selectedCategory));
    }

    // Filtro de Faixa de Preço
    if (priceRange !== '') {
      if (priceRange === '150') {
        result = result.filter(p => p.preco && p.preco <= 150);
      } else if (priceRange === '500') {
        result = result.filter(p => p.preco && p.preco > 150 && p.preco <= 500);
      } else if (priceRange === 'above_500') {
        result = result.filter(p => p.preco && p.preco > 500);
      }
    }

    // Filtro de Pontuação
    if (selectedScore !== '') {
      result = result.filter(p => {
        const maxScore = getMaxScore(p.pontuacao);
        return maxScore >= Number(selectedScore);
      });
    }
    
    // Filtro de Busca (Fuzzy Search)
    if (search.trim() !== '') {
      const FuseClass = typeof Fuse === 'function' ? Fuse : (Fuse.default || Fuse);
      const fuse = new FuseClass(result, {
        keys: ['title', 'description', 'sku'],
        threshold: 0.4
      });
      result = fuse.search(search).map(item => item.item);
    }
    
    return result;
  })();

  const [selectedUnits, setSelectedUnits] = useState({});

  const addToCart = (id, unit = 'garrafa') => {
    const key = unit === 'garrafa' ? String(id) : `${id}_${unit}`;
    const updated = [...cartItems, key];
    setCartItems(updated);
    localStorage.setItem('jet_engine_store_carrinho', updated.join(','));
    window.dispatchEvent(new Event('cart_changed'));
  };

  const removeFromCart = (id, unit = 'garrafa') => {
    const key = unit === 'garrafa' ? String(id) : `${id}_${unit}`;
    const idx = cartItems.indexOf(key);
    if (idx > -1) {
      const updated = [...cartItems];
      updated.splice(idx, 1);
      setCartItems(updated);
      localStorage.setItem('jet_engine_store_carrinho', updated.join(','));
      window.dispatchEvent(new Event('cart_changed'));
    }
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('jet_engine_store_carrinho');
    window.dispatchEvent(new Event('cart_changed'));
  };

  // Group categories by type for display
  const adegaCategories = categories.filter(c => c.type === 'sessoes_vinho_');
  const wineTypes = adegaCategories.filter(c => ['tinto', 'branco', 'rose', 'espumante'].includes(c.slug.toLowerCase()));
  const wineCountries = adegaCategories.filter(c => !['tinto', 'branco', 'rose', 'espumante'].includes(c.slug.toLowerCase()));

  return (
    <div className="page-wrapper" style={{ minHeight: '80vh', paddingBottom: '40px' }}>
      <div className="container">
        
        {/* Page Title & Search bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: '20px', 
          marginBottom: '40px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '32px', color: 'white' }}>Adega de Vinhos</h1>
            <p style={{ fontSize: '14px' }}>Rótulos finos e selecionados das melhores vinícolas</p>
          </div>
          
          <div style={{ width: '100%', maxWidth: '350px' }}>
            <input 
              type="text" 
              placeholder="Pesquisar vinho ou EAN..." 
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Mobile Filters Toggle Button */}
        <button 
          className="mobile-filters-toggle" 
          onClick={() => setMobileFiltersActive(!mobileFiltersActive)}
          style={{ marginBottom: '20px' }}
        >
          {mobileFiltersActive ? 'Fechar Filtros ✕' : 'Filtrar Categorias ☰'}
        </button>

        <div className="catalog-layout">
          
          {/* Filters Sidebar */}
          <aside className="filters-sidebar">
            <div className={`filters-content-wrapper ${mobileFiltersActive ? 'active' : ''}`}>
              
              {/* Category Filter */}
              {adegaCategories.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  {wineTypes.length > 0 && (
                    <>
                      <h4 style={{ color: 'white', fontSize: '13px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.05em' }}>
                        Tipos de Vinho
                      </h4>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
                        <li>
                          <button 
                            onClick={() => setSelectedCategory('')}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: selectedCategory === '' ? 'var(--primary)' : 'var(--text-secondary)',
                              fontWeight: selectedCategory === '' ? '600' : '400',
                              cursor: 'pointer',
                              fontSize: '13px',
                              textAlign: 'left',
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <i className="fa-solid fa-wine-glass" style={{ fontSize: '12px' }}></i> Todos os Vinhos
                          </button>
                        </li>
                        {wineTypes.map(cat => (
                          <li key={cat.id}>
                            <button 
                              onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: selectedCategory === cat.slug ? 'var(--primary)' : 'var(--text-secondary)',
                                fontWeight: selectedCategory === cat.slug ? '600' : '400',
                                cursor: 'pointer',
                                fontSize: '13px',
                                textAlign: 'left',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {selectedCategory === cat.slug ? (
                                <i className="fa-solid fa-circle-chevron-right" style={{ fontSize: '11px', color: 'var(--primary)' }}></i>
                              ) : (
                                <i className="fa-solid fa-circle" style={{ fontSize: '4px', color: 'var(--text-muted)' }}></i>
                              )}
                              {cat.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {wineCountries.length > 0 && (
                    <>
                      <h4 style={{ color: 'white', fontSize: '13px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.05em', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        Países / Regiões
                      </h4>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {wineCountries.map(cat => (
                          <li key={cat.id}>
                            <button 
                              onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: selectedCategory === cat.slug ? 'var(--primary)' : 'var(--text-secondary)',
                                fontWeight: selectedCategory === cat.slug ? '600' : '400',
                                cursor: 'pointer',
                                fontSize: '13px',
                                textAlign: 'left',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {selectedCategory === cat.slug ? (
                                <i className="fa-solid fa-circle-chevron-right" style={{ fontSize: '11px', color: 'var(--primary)' }}></i>
                              ) : (
                                <i className="fa-solid fa-circle" style={{ fontSize: '4px', color: 'var(--text-muted)' }}></i>
                              )}
                              {cat.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {/* Filtro de Faixa de Preço */}
              <div style={{ marginBottom: '30px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                <h4 style={{ color: 'white', fontSize: '13px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.05em' }}>
                  Faixa de Preço
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => setPriceRange(priceRange === '150' ? '' : '150')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: priceRange === '150' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: priceRange === '150' ? '600' : '400',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textAlign: 'left',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {priceRange === '150' ? (
                      <i className="fa-solid fa-circle-chevron-right" style={{ fontSize: '11px', color: 'var(--primary)' }}></i>
                    ) : (
                      <i className="fa-solid fa-circle" style={{ fontSize: '4px', color: 'var(--text-muted)' }}></i>
                    )}
                    Até R$ 150
                  </button>
                  <button 
                    onClick={() => setPriceRange(priceRange === '500' ? '' : '500')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: priceRange === '500' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: priceRange === '500' ? '600' : '400',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textAlign: 'left',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {priceRange === '500' ? (
                      <i className="fa-solid fa-circle-chevron-right" style={{ fontSize: '11px', color: 'var(--primary)' }}></i>
                    ) : (
                      <i className="fa-solid fa-circle" style={{ fontSize: '4px', color: 'var(--text-muted)' }}></i>
                    )}
                    R$ 150 a R$ 500
                  </button>
                  <button 
                    onClick={() => setPriceRange(priceRange === 'above_500' ? '' : 'above_500')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: priceRange === 'above_500' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: priceRange === 'above_500' ? '600' : '400',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textAlign: 'left',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {priceRange === 'above_500' ? (
                      <i className="fa-solid fa-circle-chevron-right" style={{ fontSize: '11px', color: 'var(--primary)' }}></i>
                    ) : (
                      <i className="fa-solid fa-circle" style={{ fontSize: '4px', color: 'var(--text-muted)' }}></i>
                    )}
                    Acima de R$ 500
                  </button>
                </div>
              </div>

              {/* Filtro de Pontuação */}
              <div style={{ marginBottom: '30px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                <h4 style={{ color: 'white', fontSize: '13px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.05em' }}>
                  Pontuação e Destaques
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => setSelectedScore(selectedScore === '90' ? '' : '90')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: selectedScore === '90' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: selectedScore === '90' ? '600' : '400',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textAlign: 'left',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {selectedScore === '90' ? (
                      <i className="fa-solid fa-circle-chevron-right" style={{ fontSize: '11px', color: 'var(--primary)' }}></i>
                    ) : (
                      <i className="fa-solid fa-circle" style={{ fontSize: '4px', color: 'var(--text-muted)' }}></i>
                    )}
                    Rótulos 90+ Pontos
                  </button>
                  <button 
                    onClick={() => setSelectedScore(selectedScore === '95' ? '' : '95')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: selectedScore === '95' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: selectedScore === '95' ? '600' : '400',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textAlign: 'left',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {selectedScore === '95' ? (
                      <i className="fa-solid fa-circle-chevron-right" style={{ fontSize: '11px', color: 'var(--primary)' }}></i>
                    ) : (
                      <i className="fa-solid fa-circle" style={{ fontSize: '4px', color: 'var(--text-muted)' }}></i>
                    )}
                    Rótulos Premium 95+ Pontos
                  </button>
                </div>
              </div>

              {/* Botão de Limpar Filtros */}
              {(selectedCategory !== '' || priceRange !== '' || selectedScore !== '' || search !== '') && (
                <button 
                  onClick={() => {
                    setSelectedCategory('');
                    setPriceRange('');
                    setSelectedScore('');
                    setSearch('');
                  }}
                  className="btn btn-outline font-bold"
                  style={{
                    width: '100%',
                    borderColor: 'rgba(255,255,255,0.12)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    color: 'var(--text-secondary)',
                    marginTop: '10px',
                    height: '38px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Limpar Filtros
                </button>
              )}

            </div>
          </aside>

          {/* Products Content */}
          <main>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
                Carregando adega Antenor & Filhos...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '36px', marginBottom: '15px', color: 'var(--text-muted)' }}></i>
                <p>Nenhum rótulo encontrado correspondente aos filtros.</p>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product, idx) => {
                  const unit = selectedUnits[product.id] || 'garrafa';
                  const cartKey = unit === 'garrafa' ? String(product.id) : `${product.id}_${unit}`;
                  const itemsInCart = cartItems.filter(id => id === cartKey).length;
                  
                  let displayPrice = product.preco || 0;
                  let unitSuffix = 'garrafa';
                  if (unit === 'c6') {
                    displayPrice = displayPrice * 6;
                    unitSuffix = 'caixa (6un)';
                  } else if (unit === 'c12') {
                    displayPrice = displayPrice * 12;
                    unitSuffix = 'caixa (12un)';
                  }
                  
                  // Parse multiple ratings (e.g. "RP100 | WS98")
                  const parsedRatings = [];
                  if (product.pontuacao) {
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

                  return (
                    <div className="product-card" key={product.id}>
                      <Link href={`/produtos/${product.slug}`} style={{ display: 'block' }}>
                        <div className="product-image-container">
                          {product.image_url ? (
                            <Image 
                              src={product.image_url} 
                              alt={product.title} 
                              className="product-image"
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              priority={idx < 4}
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ 
                              width: '100%', 
                              height: '100%', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              backgroundColor: 'var(--border-color)',
                              color: 'var(--text-muted)',
                              fontSize: '12px'
                            }}>
                              Sem Foto
                            </div>
                          )}
                          
                          {/* Wine Scores Badges - top right */}
                          {parsedRatings.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '5px',
                              alignItems: 'flex-end',
                              zIndex: 2
                            }}>
                              {parsedRatings.map((r, idx) => (
                                <div
                                  key={idx}
                                  className={`wine-score-badge${idx > 0 ? ' wine-score-badge-secondary' : ''}`}
                                >
                                  <span style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'var(--font-serif)', lineHeight: '1' }}>
                                    {r.score}
                                  </span>
                                  {r.label && (
                                    <span style={{ fontSize: '9px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: '1.2', textAlign: 'center' }}>
                                      {r.label}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Country Flag Badge - top left */}
                          {(() => {
                            const country = getCountryBadge(product.categories);
                            return country ? (
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                zIndex: 2,
                                background: 'rgba(10,10,10,0.78)',
                                backdropFilter: 'blur(6px)',
                                WebkitBackdropFilter: 'blur(6px)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                padding: '4px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.9)',
                                fontWeight: '500',
                                letterSpacing: '0.02em',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.35)'
                              }}>
                                <span style={{ fontSize: '16px', lineHeight: '1' }}>{country.flag}</span>
                                <span>{country.name}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </Link>
                      
                      <div className="product-info">
                        <h3 className="product-title" title={product.title}>
                          <Link 
                            href={`/produtos/${product.slug}`} 
                            style={{ color: 'inherit', textDecoration: 'none' }} 
                            dangerouslySetInnerHTML={{ __html: product.title }} 
                          />
                        </h3>
                        
                        <div 
                          className="product-desc" 
                          title={product.description}
                          dangerouslySetInnerHTML={{ __html: product.description || 'Vinho selecionado de altíssima qualidade.' }}
                        />
                        
                        <div className="product-meta">
                          <span className="product-weight">
                            {product.peso ? `${product.peso} ${product.unidade_peso}` : ''}
                          </span>
                          <span className="product-price">
                            {product.preco ? (
                              <>
                                <span style={{ fontSize: '0.7em', marginRight: '2px', fontWeight: 'normal' }}>R$</span>
                                {product.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </>
                            ) : (
                              'Preço sob consulta'
                            )}
                          </span>
                        </div>
                        
                        {/* Seletor Segmentado de Unidade (Garrafa / Caixa 6 / Caixa 12) */}
                        <div style={{
                          display: 'flex',
                          gap: '2px',
                          marginTop: '12px',
                          width: '100%',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          padding: '2px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(255,255,255,0.06)'
                        }}>
                          <button 
                            onClick={() => setSelectedUnits({...selectedUnits, [product.id]: 'garrafa'})}
                            style={{
                              flex: 1,
                              fontSize: '9.5px',
                              padding: '5px 2px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              transition: 'all 0.2s',
                              backgroundColor: (unit === 'garrafa') ? 'var(--primary)' : 'transparent',
                              color: (unit === 'garrafa') ? 'white' : 'var(--text-muted)'
                            }}
                          >
                            Garrafa
                          </button>
                          <button 
                            onClick={() => setSelectedUnits({...selectedUnits, [product.id]: 'c6'})}
                            style={{
                              flex: 1,
                              fontSize: '9.5px',
                              padding: '5px 2px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              transition: 'all 0.2s',
                              backgroundColor: (unit === 'c6') ? 'var(--primary)' : 'transparent',
                              color: (unit === 'c6') ? 'white' : 'var(--text-muted)'
                            }}
                          >
                            Cx 6un
                          </button>
                          <button 
                            onClick={() => setSelectedUnits({...selectedUnits, [product.id]: 'c12'})}
                            style={{
                              flex: 1,
                              fontSize: '9.5px',
                              padding: '5px 2px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              transition: 'all 0.2s',
                              backgroundColor: (unit === 'c12') ? 'var(--primary)' : 'transparent',
                              color: (unit === 'c12') ? 'white' : 'var(--text-muted)'
                            }}
                          >
                            Cx 12un
                          </button>
                        </div>

                        {/* Informação do preço adaptado se for caixa */}
                        {unit !== 'garrafa' && product.preco && (
                          <div style={{ fontSize: '11px', color: 'var(--primary)', textAlign: 'right', marginTop: '6px', fontWeight: '500' }}>
                            Preço {unitSuffix}: R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}

                        {/* Botões de Ação */}
                        <div style={{ marginTop: '12px', width: '100%' }}>
                          {itemsInCart > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
                              <button 
                                onClick={() => removeFromCart(product.id, unit)}
                                className="btn btn-secondary" 
                                style={{ width: '40px', padding: '10px', fontWeight: 'bold' }}
                              >
                                -
                              </button>
                              <div style={{ flexGrow: 1, textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: 'white' }}>
                                {itemsInCart} {itemsInCart === 1 ? 'no orçamento' : 'no orçamento'}
                              </div>
                              <button 
                                onClick={() => addToCart(product.id, unit)}
                                className="btn btn-secondary" 
                                style={{ width: '40px', padding: '10px', fontWeight: 'bold' }}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart(product.id, unit)}
                              className="btn btn-primary product-action" 
                              style={{ width: '100%' }}
                            >
                              Incluir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Cart Bar */}
      <div className={`cart-floating-bar ${cartItems.length > 0 ? 'active' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <i className="fa-solid fa-cart-shopping" style={{ fontSize: '20px', color: 'var(--primary)' }}></i>
          <div>
            <h4 style={{ color: 'white', fontSize: '15px' }}>Meu Orçamento</h4>
            <p style={{ fontSize: '12px' }}>{cartItems.length} {cartItems.length === 1 ? 'item selecionado' : 'itens selecionados'}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={clearCart}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Limpar
          </button>
          <Link href="/carrinho" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
            Finalizar Lista &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
