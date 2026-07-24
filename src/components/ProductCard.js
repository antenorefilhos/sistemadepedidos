'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { discountedUnitPrice } from '@/lib/pricing';

// Helper for formatting prices in BRL
export function formatPrice(value) {
  if (value === null || value === undefined || isNaN(value)) return 'Consulte';
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

// Map country slugs to flag emojis
const COUNTRY_FLAG_MAP = {
  brasil: '🇧🇷',
  franca: '🇫🇷',
  italia: '🇮🇹',
  portugal: '🇵🇹',
  chile: '🇨🇱',
  argentina: '🇦🇷',
  espanha: '🇪🇸',
  uruguai: '🇺🇾',
  alemanha: '🇩🇪',
  eua: '🇺🇸',
};

const WINE_TYPE_SLUGS = ['tinto', 'branco', 'rose', 'espumante', 'rosé', 'rose-espumante'];

function getCountryBadge(categories) {
  if (!categories) return null;
  const countryCat = categories.find(c =>
    c.type === 'sessoes_vinho_' && !WINE_TYPE_SLUGS.includes(c.slug.toLowerCase())
  );
  if (!countryCat) return null;
  const flag = COUNTRY_FLAG_MAP[countryCat.slug.toLowerCase()] || '🍷';
  return { flag, name: countryCat.name.replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, '').trim() };
}

export default function ProductCard({ product, showWineBadges = false }) {
  const { addToCart, isInCart } = useCart();
  const [selectedPackOption, setSelectedPackOption] = useState('single'); // 'single', 'cx6', 'cx12'
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!product) return null;

  const inCart = isInCart(product.id);
  const countryBadge = showWineBadges ? getCountryBadge(product.categories) : null;

  // Quantidade física de garrafas conforme a opção de embalagem escolhida
  let multiplier = 1;
  if (selectedPackOption === 'cx6') {
    multiplier = 6;
  } else if (selectedPackOption === 'cx12') {
    multiplier = 12;
  }

  // Preço total exibido: usa o mesmo desconto de volume aplicado (autoritativamente) no servidor
  const displayPrice = discountedUnitPrice(product, multiplier) * multiplier;

  const handleAdd = () => {
    addToCart(product.id, multiplier);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  return (
    <div 
      className="product-card card" 
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)'
      }}
    >
      {/* Country Badge */}
      {countryBadge && (
        <div 
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 2,
            background: 'rgba(8, 9, 14, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '4px 10px',
            borderRadius: '4px',
            border: '1px solid rgba(171, 144, 112, 0.3)',
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>{countryBadge.flag}</span>
          <span>{countryBadge.name}</span>
        </div>
      )}

      {/* Product Image Link */}
      <Link 
        href={`/produtos/${product.slug}`}
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          aspectRatio: '1',
          background: 'rgba(255,255,255,0.02)',
          overflow: 'hidden'
        }}
      >
        <Image
          src={product.image_url || '/logo/DELI-LOGO-BRANCO.png'}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          style={{
            objectFit: 'contain',
            padding: '16px',
            transition: 'transform 0.4s ease'
          }}
          className="product-card-img"
        />
      </Link>

      {/* Product Details */}
      <div 
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justify: 'space-between'
        }}
      >
        <div>
          <Link href={`/produtos/${product.slug}`} style={{ textDecoration: 'none' }}>
            <h3 
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '8px',
                lineHeight: '1.3',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {product.title}
            </h3>
          </Link>

          {product.description && (
            <p 
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                marginBottom: '16px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.4'
              }}
            >
              {product.description.replace(/<[^>]*>?/gm, '')}
            </p>
          )}
        </div>

        <div>
          {/* Price Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '15px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {product.peso ? `${product.peso} ${product.unidade_peso || 'kg'}` : (product.volume || 'Unidade')}
            </span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>
              {formatPrice(displayPrice)}
            </span>
          </div>

          {/* Wine Pack Selection (Optional) */}
          {showWineBadges && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setSelectedPackOption('single')}
                style={{
                  padding: '5px 2px',
                  fontSize: '10px',
                  fontWeight: '600',
                  border: selectedPackOption === 'single' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: selectedPackOption === 'single' ? 'var(--primary-light)' : 'transparent',
                  color: selectedPackOption === 'single' ? 'var(--primary)' : 'var(--text-muted)',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                GARRAFA
              </button>
              <button
                type="button"
                onClick={() => setSelectedPackOption('cx6')}
                style={{
                  padding: '5px 2px',
                  fontSize: '10px',
                  fontWeight: '600',
                  border: selectedPackOption === 'cx6' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: selectedPackOption === 'cx6' ? 'var(--primary-light)' : 'transparent',
                  color: selectedPackOption === 'cx6' ? 'var(--primary)' : 'var(--text-muted)',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                CX 6UN
              </button>
              <button
                type="button"
                onClick={() => setSelectedPackOption('cx12')}
                style={{
                  padding: '5px 2px',
                  fontSize: '10px',
                  fontWeight: '600',
                  border: selectedPackOption === 'cx12' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: selectedPackOption === 'cx12' ? 'var(--primary-light)' : 'transparent',
                  color: selectedPackOption === 'cx12' ? 'var(--primary)' : 'var(--text-muted)',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                CX 12UN
              </button>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleAdd}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: addedAnimation 
                ? '#25D366' 
                : (inCart ? 'rgba(171, 144, 112, 0.2)' : 'var(--primary)'),
              color: addedAnimation ? '#ffffff' : (inCart ? 'var(--primary)' : '#000000'),
              fontWeight: '700',
              fontSize: '13px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.25s ease'
            }}
          >
            {addedAnimation ? (
              <>
                <i className="fa-solid fa-check"></i> ADICIONADO!
              </>
            ) : inCart ? (
              <>
                <i className="fa-solid fa-cart-shopping"></i> NO CARRINHO
              </>
            ) : (
              <>
                <i className="fa-solid fa-plus"></i> INCLUIR
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
