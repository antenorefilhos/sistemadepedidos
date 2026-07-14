'use client';

import { useState, useEffect } from 'react';

export default function RecipeImage({ src, alt, className, iconSizeClass = 'text-4xl' }) {
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!src) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => setError(false);
    img.onerror = () => setError(true);
  }, [src]);

  // Durante a renderização do SSR inicial (servidor), renderiza a tag básica.
  // No cliente, se houver erro, substitui pela div de fallback.
  if (mounted && (error || !src)) {
    return (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-[#111] animate-[fadeIn_0.3s_ease]">
        <i className={`fa-solid fa-utensils ${iconSizeClass} text-[var(--color-gold)]/30`}></i>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
