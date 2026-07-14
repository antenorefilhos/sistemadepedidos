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
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('light-theme');
    }
  }, [pathname]);

  return null;
}
