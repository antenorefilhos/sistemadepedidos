'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminThemeManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && pathname.startsWith('/admin')) {
      document.body.classList.add('admin-body');
      try {
        const theme = localStorage.getItem('admin_theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        const darkThemes = ['dark', 'synthwave', 'halloween', 'forest', 'black', 'luxury', 'dracula', 'business', 'night', 'coffee', 'dim', 'sunset'];
        if (darkThemes.indexOf(theme) === -1) {
          document.documentElement.classList.add('light-theme');
        } else {
          document.documentElement.classList.remove('light-theme');
        }
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.add('light-theme');
      }
    } else {
      document.body.classList.remove('admin-body');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.remove('light-theme');
    }
  }, [pathname]);

  return null;
}
