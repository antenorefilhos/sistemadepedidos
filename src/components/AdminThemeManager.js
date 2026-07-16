'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminThemeManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && pathname.startsWith('/admin')) {
      document.body.classList.add('admin-body');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.add('light-theme');
    } else {
      document.body.classList.remove('admin-body');
      document.documentElement.classList.remove('light-theme');
      // Restaura o tema salvo pelo usuário
      try {
        const savedTheme = localStorage.getItem('site_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'light') {
          document.documentElement.classList.add('light-theme');
        }
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }
  }, [pathname]);

  return null;
}
