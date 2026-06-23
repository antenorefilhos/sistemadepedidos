'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const [activeSeller, setActiveSeller] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    // Load initial theme
    try {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    } catch (e) {
      console.error(e);
    }

    // Listen to custom events
    const handleSellerChange = () => updateSellerFromStorage();
    const handleCartChange = () => updateCartCountFromStorage();

    window.addEventListener('seller_changed', handleSellerChange);
    window.addEventListener('cart_changed', handleCartChange);

    // Check periodically for cart modifications
    const interval = setInterval(() => {
      updateCartCountFromStorage();
    }, 1500);

    return () => {
      window.removeEventListener('seller_changed', handleSellerChange);
      window.removeEventListener('cart_changed', handleCartChange);
      clearInterval(interval);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('theme', nextTheme);
      if (nextTheme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearSeller = () => {
    localStorage.removeItem('ref_seller');
    setActiveSeller(null);
    window.dispatchEvent(new Event('seller_changed'));
  };

  const logoSrc = '/novo/wp-content/uploads/DELI-LOGO-PALHA.png';

  const menuLinks = [
    { href: '/', label: 'Início' },
    { href: '/boutique', label: 'Boutique de Carnes' },
    { href: '/adega', label: 'Adega de Vinhos' },
    { href: '/cardapio', label: 'Cardápio' },
    { href: '/entregas', label: 'Entregas' },
    { href: '/distribuidora', label: 'Distribuidora' },
  ];

  return (
    <>
      <header className="navbar glass">
        <div className="container nav-container">
          {/* Logo (local path, responsive to theme) */}
          <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', padding: '5px 0' }} onClick={() => setMobileMenuOpen(false)}>
            <img 
              src={logoSrc} 
              alt="Antenor & Filhos" 
              className="navbar-logo-img"
            />
          </Link>
          
          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Desktop menu */}
            <ul className="nav-links">
              {menuLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className={pathname === link.href ? 'active' : ''}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Seller Badge */}
            {activeSeller && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                padding: '6px 12px',
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)'
              }} className="hide-mobile">
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

            {/* Theme Toggle Switch */}
            <button 
              onClick={toggleTheme} 
              className="theme-toggle-btn"
              title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <i className="fa-solid fa-sun"></i>
              ) : (
                <i className="fa-solid fa-moon"></i>
              )}
            </button>

            {/* Cart Button (Collapsed to icon on mobile) */}
            <Link 
              href="/carrinho" 
              className="btn btn-secondary" 
              style={{ 
                padding: '8px 16px', 
                position: 'relative', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fa-solid fa-cart-shopping"></i>
              <span className="hide-mobile">Orçamento</span>
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

            {/* Hamburger Button for Mobile */}
            <button 
              className="hamburger-btn" 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`mobile-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      ></div>

      {/* Mobile Drawer */}
      <aside className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <button 
          className="mobile-drawer-close"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Fechar menu"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {activeSeller && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '12px',
            padding: '12px',
            backgroundColor: 'var(--primary-light)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            marginBottom: '10px'
          }}>
            <span>Atendimento por: <b>{activeSeller.name}</b></span>
            <button 
              onClick={() => { clearSeller(); setMobileMenuOpen(false); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--danger)',
                cursor: 'pointer',
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                textAlign: 'left'
              }}
            >
              Comprar com a loja (Sair)
            </button>
          </div>
        )}

        <ul className="mobile-drawer-links">
          {menuLinks.map(link => (
            <li key={link.href}>
              <Link 
                href={link.href} 
                className={pathname === link.href ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
