'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Fuse from 'fuse.js';
import ProductCard from '@/components/ProductCard';

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
  const [showAllCountries, setShowAllCountries] = useState(false);
  
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

  // Exibe 5 países por padrão; expande automaticamente se o país selecionado estiver além da 5ª posição
  const selectedIsHiddenCountry = !!selectedCategory && wineCountries.findIndex(c => c.slug === selectedCategory) >= 5;
  const countriesExpanded = showAllCountries || selectedIsHiddenCountry;
  const visibleCountries = countriesExpanded ? wineCountries : wineCountries.slice(0, 5);

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
                        {visibleCountries.map(cat => (
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
                      {wineCountries.length > 5 && !selectedIsHiddenCountry && (
                        <button
                          onClick={() => setShowAllCountries(!showAllCountries)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginTop: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {showAllCountries
                            ? '− Ver menos países'
                            : `+ Ver mais países (${wineCountries.length - 5})`}
                        </button>
                      )}
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
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} showWineBadges={true} />
                ))}
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
