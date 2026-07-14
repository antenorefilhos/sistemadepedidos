'use client';

import { useState, useEffect } from 'react';

export default function RecipeImage({ src, alt, className, iconSizeClass = 'text-4xl' }) {
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!src || (mounted && error)) {
    return (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-[#111] animate-[fadeIn_0.3s_ease]" style={{ minHeight: '200px', width: '100%', height: '100%' }}>
        <i className={`fa-solid fa-utensils ${iconSizeClass} text-[var(--color-gold)]/30`}></i>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        console.log('RecipeImage error loading src:', src);
        setError(true);
      }}
    />
  );
}
