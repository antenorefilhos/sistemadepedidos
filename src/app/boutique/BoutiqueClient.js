'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Fuse from 'fuse.js';
import ProductCard from '@/components/ProductCard';

export default function BoutiqueClient() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [mobileFiltersActive, setMobileFiltersActive] = useState(false);
  
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
        console.error('Error loading catalog data:', err);
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

  // Filtered products list (only carnes_)
  const filteredProducts = (() => {
    let result = products.filter(p => p.type === 'carnes_');
    
    // Filtro de Categoria
    if (selectedCategory !== '') {
      const meatSubcategories = ['bovinos', 'cordeiro', 'suinos', 'aves', 'linguicas', 'exoticas'];
      result = result.filter(p => 
        p.categories.some(cat => {
          if (selectedCategory === 'carnes') {
            return cat.slug === 'carnes' || meatSubcategories.includes(cat.slug);
          }
          return cat.slug === selectedCategory;
        })
      );
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

  const addToCart = (id) => {
    const updated = [...cartItems, String(id)];
    setCartItems(updated);
    localStorage.setItem('jet_engine_store_carrinho', updated.join(','));
    window.dispatchEvent(new Event('cart_changed'));
  };

  const removeFromCart = (id) => {
    const idx = cartItems.indexOf(String(id));
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
  const carnesCategories = categories.filter(c => c.type === 'sessoes_carnes_');
  const racasCategories = categories.filter(c => c.type === 'racas_carnes');
  const embalagemCategories = categories.filter(c => c.type === 'embalagem_carnes');

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
            <h1 style={{ fontSize: '32px', color: 'white' }}>Boutique de Carnes</h1>
            <p style={{ fontSize: '14px' }}>Cortes nobres, exóticos e especiais com qualidade garantida</p>
          </div>
          
          <div style={{ width: '100%', maxWidth: '350px' }}>
            <input 
              type="text" 
              placeholder="Pesquisar produto ou EAN..." 
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
              {carnesCategories.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ color: 'white', fontSize: '13px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.05em' }}>
                    Departamentos
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Todos os Produtos */}
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
                          gap: '8px'
                        }}
                      >
                        <i className="fa-solid fa-border-all" style={{ fontSize: '12px' }}></i> Todos os Produtos
                      </button>
                    </li>

                    {/* Carnes Parent Category */}
                    <li style={{ marginTop: '5px' }}>
                      <button 
                        onClick={() => setSelectedCategory('carnes')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: selectedCategory === 'carnes' ? 'var(--primary)' : 'white',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '13px',
                          textAlign: 'left',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          paddingBottom: '4px',
                          borderBottom: '1px solid #1a1e26'
                        }}
                      >
                        <i className="fa-solid fa-drumstick-bite" style={{ fontSize: '12px', color: 'var(--primary)' }}></i> Carnes
                      </button>
                      
                      {/* Carnes Subcategories */}
                      <ul style={{ listStyle: 'none', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        {[
                          { slug: 'bovinos', name: 'Bovinos' },
                          { slug: 'cordeiro', name: 'Cordeiro' },
                          { slug: 'suinos', name: 'Suínos' },
                          { slug: 'aves', name: 'Aves' },
                          { slug: 'linguicas', name: 'Linguiças' },
                          { slug: 'exoticas', name: 'Exóticas' }
                        ].map(sub => {
                          const isActive = selectedCategory === sub.slug;
                          return (
                            <li key={sub.slug}>
                              <button
                                onClick={() => setSelectedCategory(isActive ? '' : sub.slug)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                  fontWeight: isActive ? '600' : '400',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  textAlign: 'left',
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                {isActive ? (
                                  <i className="fa-solid fa-circle" style={{ fontSize: '5px', color: 'var(--primary)' }}></i>
                                ) : (
                                  <i className="fa-regular fa-circle" style={{ fontSize: '5px', color: 'var(--text-muted)' }}></i>
                                )}
                                {sub.name}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </li>

                    {/* Pescados Parent Category */}
                    <li style={{ marginTop: '10px' }}>
                      <button 
                        onClick={() => setSelectedCategory('pescados')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: selectedCategory === 'pescados' ? 'var(--primary)' : 'white',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '13px',
                          textAlign: 'left',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          paddingBottom: '4px',
                          borderBottom: '1px solid #1a1e26'
                        }}
                      >
                        <i className="fa-solid fa-fish" style={{ fontSize: '12px', color: 'var(--primary)' }}></i> Pescados
                      </button>
                    </li>
                  </ul>
                </div>
              )}

              {/* Raças Filter */}
              {racasCategories.length > 0 && (
                <div style={{ marginBottom: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <h4 style={{ color: 'white', fontSize: '13px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.05em' }}>
                    Raças
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {racasCategories.map(cat => (
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
                            width: '100%'
                          }}
                        >
                          {selectedCategory === cat.slug ? '🔸 ' : ''} {cat.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Embalagens Filter */}
              {embalagemCategories.length > 0 && (
                <div style={{ marginBottom: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <h4 style={{ color: 'white', fontSize: '13px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.05em' }}>
                    Embalagens
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {embalagemCategories.map(cat => (
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
                            width: '100%'
                          }}
                        >
                          {selectedCategory === cat.slug ? '🔸 ' : ''} {cat.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </aside>

          {/* Products Content */}
          <main>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
                Carregando catálogo Antenor & Filhos...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '36px', marginBottom: '15px', color: 'var(--text-muted)' }}></i>
                <p>Nenhum produto encontrado correspondente aos filtros.</p>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
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
