'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const [activeSeller, setActiveSeller] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for glass intensity
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const updateSellerFromStorage = () => {
    try {
      const stored = localStorage.getItem('ref_seller');
      setActiveSeller(stored ? JSON.parse(stored) : null);
    } catch (e) {}
  };

  const updateCartCountFromStorage = () => {
    try {
      const cartStr = localStorage.getItem('jet_engine_store_carrinho') || '';
      const ids = cartStr.split(',').filter(id => id.trim() !== '');
      setCartCount(ids.length);
    } catch (e) {}
  };

  useEffect(() => {
    updateSellerFromStorage();
    updateCartCountFromStorage();

    try {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      setTheme(savedTheme);
      if (savedTheme === 'light') document.documentElement.classList.add('light-theme');
      else document.documentElement.classList.remove('light-theme');
    } catch (e) {}

    window.addEventListener('seller_changed', updateSellerFromStorage);
    window.addEventListener('cart_changed', updateCartCountFromStorage);
    const interval = setInterval(updateCartCountFromStorage, 1500);

    return () => {
      window.removeEventListener('seller_changed', updateSellerFromStorage);
      window.removeEventListener('cart_changed', updateCartCountFromStorage);
      clearInterval(interval);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
      if (next === 'light') document.documentElement.classList.add('light-theme');
      else document.documentElement.classList.remove('light-theme');
    } catch (e) {}
  };

  const clearSeller = () => {
    localStorage.removeItem('ref_seller');
    setActiveSeller(null);
    window.dispatchEvent(new Event('seller_changed'));
  };

  const menuLinks = [
    { href: '/', label: 'Início' },
    { href: '/boutique', label: 'Boutique' },
    { href: '/adega', label: 'Adega' },
    { href: '/cardapio', label: 'Cardápio' },
    { href: '/entregas', label: 'Entregas' },
    { href: '/distribuidora', label: 'Distribuidora' },
  ];

  return (
    <>
      <header className={`navbar${scrolled ? ' navbar-scrolled' : ''}`}>
        {/* Subtle top golden shimmer line */}
        <div className="navbar-shimmer" />

        <div className="container nav-container">
          {/* Logo */}
          <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', padding: '5px 0' }} onClick={() => setMobileMenuOpen(false)}>
            <img
              src="/novo/wp-content/uploads/DELI-LOGO-PALHA.png"
              alt="Antenor & Filhos"
              className="navbar-logo-img"
            />
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Desktop menu */}
            <ul className="nav-links hide-mobile">
              {menuLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`nav-link${isActive ? ' active' : ''}`}
                    >
                      {link.label}
                      <span className="nav-link-underline" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Divider */}
            <div className="nav-divider hide-mobile" />

            {/* Seller Badge */}
            {activeSeller && (
              <div className="seller-badge hide-mobile">
                <span className="seller-dot" />
                <span>Vendedor: <b>{activeSeller.name}</b></span>
                <button onClick={clearSeller} className="seller-exit" title="Comprar direto com a loja">
                  ✕
                </button>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="nav-icon-btn"
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              aria-label="Alternar tema"
            >
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
            </button>

            {/* Cart Button */}
            <Link href="/carrinho" className="cart-btn" onClick={() => setMobileMenuOpen(false)}>
              <i className="fa-solid fa-cart-shopping" />
              <span className="hide-mobile">Orçamento</span>
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </Link>

            {/* Hamburger for Mobile */}
            <button
              className="nav-icon-btn show-mobile"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <i className="fa-solid fa-bars" />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={`mobile-drawer-overlay${mobileMenuOpen ? ' open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Drawer */}
      <aside className={`mobile-drawer${mobileMenuOpen ? ' open' : ''}`}>
        <div className="mobile-drawer-header">
          <img
            src="/novo/wp-content/uploads/DELI-LOGO-PALHA.png"
            alt="Antenor & Filhos"
            style={{ height: '36px', width: 'auto' }}
          />
          <button
            className="nav-icon-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar menu"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {activeSeller && (
          <div className="seller-badge" style={{ marginBottom: '20px', width: '100%' }}>
            <span className="seller-dot" />
            <span style={{ flex: 1 }}>Atendimento: <b>{activeSeller.name}</b></span>
            <button
              onClick={() => { clearSeller(); setMobileMenuOpen(false); }}
              className="seller-exit"
            >✕</button>
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

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(171,144,112,0.15)' }}>
          <button onClick={toggleTheme} className="nav-icon-btn" style={{ gap: '10px', fontSize: '13px', width: '100%', justifyContent: 'flex-start', paddingLeft: 0 }}>
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
            {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
          </button>
        </div>
      </aside>
    </>
  );
}
