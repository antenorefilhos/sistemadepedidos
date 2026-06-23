'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
        
        // Count how many of this product are in the cart
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
      // Remove product from cart
      const updated = cartItems.filter(id => id !== String(product.id));
      localStorage.setItem('jet_engine_store_carrinho', updated.join(','));
      setIsInCart(false);
      setQty(1);
    } else {
      // Clean previous instances and insert exactly newQty instances
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

  // Mapear selos/badges dinamicamente
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

  // Parse scores de vinhos
  const parsedRatings = [];
  if (product.type === 'adega' && product.pontuacao) {
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
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        
        {/* Breadcrumb */}
        <div style={{ marginBottom: '30px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--primary)' }}>Início</Link>
          <span style={{ margin: '0 8px' }}>&rsaquo;</span>
          <Link href={product.type === 'carnes_' ? '/boutique' : '/adega'} style={{ color: 'var(--primary)' }}>
            {product.type === 'carnes_' ? 'Boutique de Carnes' : 'Adega de Vinhos'}
          </Link>
          <span style={{ margin: '0 8px' }}>&rsaquo;</span>
          <span style={{ color: 'var(--text-primary)' }}>{product.title}</span>
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
              Passe o mouse sobre a imagem para ampliar o corte
            </p>
          </div>

          {/* Right Column: Information & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Badges Row */}
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
              {parsedRatings.map((r, idx) => (
                <span key={idx} className="badge-tag badge-tag-wine">
                  <i className="fa-solid fa-award"></i> {r.label ? `${r.label} ${r.score}` : r.score}
                </span>
              ))}
            </div>

            {/* Title & EAN */}
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', color: 'var(--text-primary)', marginBottom: '15px', fontFamily: 'var(--font-serif)', lineHeight: '1.2' }}>
              {product.title}
            </h1>

            {product.sku && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Código do Produto (EAN): <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 6px', color: 'var(--primary-hover)' }}>{product.sku}</code>
              </p>
            )}

            {/* Price block */}
            <div style={{ 
              padding: '20px 0', 
              borderTop: '1px solid var(--border-color)', 
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '30px'
            }}>
              <span style={{ fontSize: '13px', textTransform: 'uppercase', display: 'block', color: 'var(--text-muted)', marginBottom: '5px' }}>
                Valor Unitário Estimado
              </span>
              <span style={{ fontSize: '32px', color: 'var(--primary)', fontWeight: 'bold' }}>
                {product.preco ? `R$ ${product.preco.toFixed(2)}` : 'Preço sob consulta'}
              </span>
              {product.peso && (
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                  ({product.peso} {product.unidade_peso})
                </span>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Descrição Detalhada
              </h3>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-muted)' }}>
                {product.description || 'Este item de alta qualidade foi criteriosamente selecionado pelos especialistas da Antenor & Filhos para garantir a melhor experiência gastronômica da Serra Imperial. Procedência garantida.'}
              </p>
            </div>

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
                    Incluir no Orçamento
                  </button>
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
                          <img src={logo} alt="" style={{ position: 'absolute', top: '10px', left: '10px', height: '30px', width: 'auto', zIndex: 2 }} />
                        )}
                        {embalagem && (
                          <span className={`product-badge badge-tag-${embalagem.slug.toLowerCase()}`} style={{ position: 'absolute', top: '10px', right: '10px', left: 'auto', zIndex: 2 }}>{embalagem.name}</span>
                        )}
                      </div>
                    </Link>
                    <div className="product-info" style={{ padding: '15px' }}>
                      <h3 className="product-title" style={{ fontSize: '14px', height: '38px' }}>
                        <Link href={`/produtos/${p.slug}`} style={{ color: 'inherit' }}>{p.title}</Link>
                      </h3>
                      <div className="product-meta" style={{ marginTop: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.peso ? `${p.peso} ${p.unidade_peso}` : ''}</span>
                        <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold' }}>{p.preco ? `R$ ${p.preco.toFixed(2)}` : 'Preço sob consulta'}</span>
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
