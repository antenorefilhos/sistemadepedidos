'use client';

import { usePathname } from 'next/navigation';

export default function ProgressiveBlur() {
  const pathname = usePathname();

  // Oculta o blur progressivo no painel administrativo
  if (pathname && pathname.startsWith('/admin')) return null;

  return (
    <>
      {/* Blur Progressivo no Topo */}
      <div className="progressive-blur-container progressive-blur-top">
        <div className="progressive-blur-layer p-blur-top-1" />
        <div className="progressive-blur-layer p-blur-top-2" />
        <div className="progressive-blur-layer p-blur-top-3" />
        <div className="progressive-blur-layer p-blur-top-4" />
      </div>

      {/* Blur Progressivo no Rodapé */}
      <div className="progressive-blur-container progressive-blur-bottom">
        <div className="progressive-blur-layer p-blur-bottom-1" />
        <div className="progressive-blur-layer p-blur-bottom-2" />
        <div className="progressive-blur-layer p-blur-bottom-3" />
        <div className="progressive-blur-layer p-blur-bottom-4" />
      </div>
    </>
  );
}
