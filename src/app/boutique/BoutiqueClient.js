'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  const filteredProducts = products.filter(p => {
    if (p.type !== 'carnes_') return false;
    
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
                          (p.sku && p.sku.includes(search));
                          
    const meatSubcategories = ['bovinos', 'cordeiro', 'suinos', 'aves', 'linguicas', 'exoticas'];
    const matchesCategory = selectedCategory === '' || 
                            p.categories.some(cat => {
                              if (selectedCategory === 'carnes') {
                                return cat.slug === 'carnes' || meatSubcategories.includes(cat.slug);
                              }
                              return cat.slug === selectedCategory;
                            });
                            
    return matchesSearch && matchesCategory;
  });

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
    <div className="page-wrapper" style={{ minHeight: '80vh', padding: '40px 0' }}>
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
                {filteredProducts.map(product => {
                  const itemsInCart = cartItems.filter(id => id === String(product.id)).length;
                  
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

                  return (
                    <div className="product-card" key={product.id}>
                      <Link href={`/produtos/${product.slug}`} style={{ display: 'block' }}>
                        <div className="product-image-container">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.title} 
                              className="product-image"
                              loading="lazy"
                            />
                          ) : (
                            <div style={{ 
                              width: '100%', 
                              height: '100%', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              backgroundColor: '#232936',
                              color: 'var(--text-muted)',
                              fontSize: '12px'
                            }}>
                              Sem Foto
                            </div>
                          )}
                          
                          {/* Breed Seal Tag */}
                          {breedLogo && (
                            <img 
                              src={breedLogo} 
                              alt={breedCat.name} 
                              style={{
                                position: 'absolute',
                                top: '10px',
                                left: '10px',
                                height: '70px',
                                width: 'auto',
                                zIndex: 2,
                                filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))'
                              }}
                            />
                          )}

                          {/* Packaging Badge */}
                          {embalagemCat && (
                            <span 
                              className={`product-badge badge-tag-${embalagemCat.slug.toLowerCase()}`}
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                left: 'auto',
                                zIndex: 2
                              }}
                            >
                              {embalagemCat.name}
                            </span>
                          )}
                        </div>
                      </Link>
                      
                      <div className="product-info">
                        <h3 className="product-title" title={product.title}>
                          <Link href={`/produtos/${product.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {product.title}
                          </Link>
                        </h3>
                        
                        <p className="product-desc" title={product.description}>
                          {product.description || 'Produto artesanal selecionado de altíssima qualidade.'}
                        </p>
                        
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
                        
                        {itemsInCart > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: '15px', gap: '8px' }}>
                            <button 
                              onClick={() => removeFromCart(product.id)}
                              className="btn btn-secondary" 
                              style={{ width: '40px', padding: '10px', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <div style={{ flexGrow: 1, textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: 'white' }}>
                              {itemsInCart} no orçamento
                            </div>
                            <button 
                              onClick={() => addToCart(product.id)}
                              className="btn btn-secondary" 
                              style={{ width: '40px', padding: '10px', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => addToCart(product.id)}
                            className="btn btn-primary product-action"
                          >
                            Incluir no Orçamento
                          </button>
                        )}
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
      <div className={`cart-floating-bar glass ${cartItems.length > 0 ? 'active' : ''}`}>
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
