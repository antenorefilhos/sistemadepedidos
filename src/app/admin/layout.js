'use client';

import { useState, useEffect } from 'react';

export default function AdminLayout({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('admin_theme') || 'light';
      setTheme(savedTheme);
    } catch (e) {}

    // Escuta eventos de alteração de tema no painel de configurações para preview em tempo real
    const handleStorageChange = () => {
      try {
        const savedTheme = localStorage.getItem('admin_theme') || 'light';
        setTheme(savedTheme);
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorageChange);
    // Também podemos disparar um evento customizado se salvarmos no mesmo documento
    window.addEventListener('admin_theme_changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('admin_theme_changed', handleStorageChange);
    };
  }, []);

  const darkThemes = ['dark', 'synthwave', 'halloween', 'forest', 'black', 'luxury', 'dracula', 'business', 'night', 'coffee', 'dim', 'sunset'];
  const isDark = darkThemes.includes(theme);

  const adminThemeStyles = {
    '--color-primary': '#ab9070',
    '--color-primary-hover': '#d7b994',
    '--color-primary-content': '#ffffff',
    '--color-success': '#10b981',
    '--color-warning': '#f59e0b',
    '--color-error': '#ef4444',
    
    // Restaurar arredondamentos do DaisyUI 5
    '--radius-field': '6px',
    '--radius-box': '8px',
    '--radius-selector': '9999px',

    // Restaurar arredondamentos padrão do Tailwind v4
    '--radius-sm': '4px',
    '--radius-md': '6px',
    '--radius-lg': '8px',
    '--radius-round': '9999px',

    // Forçar a fonte padrão limpa do sistema/Inter no escopo do admin
    'font-family': 'var(--font-inter), sans-serif',

    // Escala Tipográfica Compacta Global (Tier S)
    '--text-xs': '11px',
    '--text-sm': '13px',
    '--text-base': '14.5px',
    '--text-lg': '16px',
    '--text-xl': '18px',
    '--text-2xl': '22px',
    '--text-3xl': '28px',
  };

  // Se for tema claro, adicionamos as cores base claras premium específicas para o painel admin
  if (!isDark) {
    adminThemeStyles['--color-base-100'] = '#ffffff';
    adminThemeStyles['--color-base-200'] = '#f8fafc';
    adminThemeStyles['--color-base-300'] = '#e2e8f0';
    adminThemeStyles['--color-base-content'] = '#0f172a';
  }

  return (
    <div className="bg-base-200 text-base-content min-h-screen p-0 md:p-6 flex items-center justify-center w-full" style={adminThemeStyles}>
      <div className="w-full max-w-[1680px] mx-auto bg-base-100 rounded-box shadow-2xl border border-base-300 min-h-[calc(100vh-3rem)] flex flex-col md:flex-row overflow-hidden">
        {children}
      </div>
    </div>
  );
}

