'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const [activeSeller, setActiveSeller] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Update seller from localStorage
  const updateSellerFromStorage = () => {
    try {
      const stored = localStorage.getItem('ref_seller');
      if (stored) {
        setActiveSeller(JSON.parse(stored));
      } else {
        setActiveSeller(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update cart count from localStorage
  const updateCartCountFromStorage = () => {
    try {
      const cartStr = localStorage.getItem('jet_engine_store_carrinho') || '';
      if (cartStr.trim() === '') {
        setCartCount(0);
      } else {
        const ids = cartStr.split(',').filter(id => id.trim() !== '');
        setCartCount(ids.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    updateSellerFromStorage();
    updateCartCountFromStorage();

    // Listen to custom events
    const handleSellerChange = () => updateSellerFromStorage();
    const handleCartChange = () => updateCartCountFromStorage();

    window.addEventListener('seller_changed', handleSellerChange);
    window.addEventListener('cart_changed', handleCartChange);

    // Also check periodically for cart modifications
    const interval = setInterval(() => {
      updateCartCountFromStorage();
    }, 1500);

    return () => {
      window.removeEventListener('seller_changed', handleSellerChange);
      window.removeEventListener('cart_changed', handleCartChange);
      clearInterval(interval);
    };
  }, []);

  const clearSeller = () => {
    localStorage.removeItem('ref_seller');
    setActiveSeller(null);
    window.dispatchEvent(new Event('seller_changed'));
  };

  return (
    <header className="navbar glass">
      <div className="container nav-container">
        <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', padding: '5px 0' }}>
          <img 
            src="https://antenorefilhos.com.br/img/logo.png" 
            alt="Antenor & Filhos" 
            style={{ height: '70px', width: 'auto', display: 'block' }}
          />
        </Link>
        
        <nav style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <ul className="nav-links">
            <li>
              <Link href="/" className={pathname === '/' ? 'active' : ''}>
                Início
              </Link>
            </li>
            <li>
              <Link href="/boutique" className={pathname === '/boutique' ? 'active' : ''}>
                Boutique de Carnes
              </Link>
            </li>
            <li>
              <Link href="/adega" className={pathname === '/adega' ? 'active' : ''}>
                Adega de Vinhos
              </Link>
            </li>
            <li>
              <Link href="/cardapio" className={pathname === '/cardapio' ? 'active' : ''}>
                Cardápio
              </Link>
            </li>
            <li>
              <Link href="/entregas" className={pathname === '/entregas' ? 'active' : ''}>
                Entregas
              </Link>
            </li>
            <li>
              <Link href="/distribuidora" className={pathname === '/distribuidora' ? 'active' : ''}>
                Distribuidora
              </Link>
            </li>
          </ul>

          {activeSeller && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '11px',
              padding: '6px 12px',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)'
            }}>
              <span>Vendedor: <b>{activeSeller.name}</b></span>
              <button 
                onClick={clearSeller}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  fontWeight: 'bold'
                }}
                title="Comprar direto com a loja"
              >
                (Sair)
              </button>
            </div>
          )}

          <Link href="/carrinho" className="btn btn-secondary" style={{ padding: '8px 16px', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-cart-shopping"></i> Orçamento
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: 'var(--primary)',
                color: '#111',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cartCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
