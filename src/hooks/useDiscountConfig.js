'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_DISCOUNT_CONFIG, parseDiscountConfig } from '@/lib/pricing';

// Cache em nível de módulo: garante UM único fetch de /api/settings compartilhado
// por todas as instâncias (vários ProductCard + carrinho), mesmo montando juntas.
let cachedConfig = null;
let inflight = null;

async function loadConfig() {
  if (cachedConfig) return cachedConfig;
  if (!inflight) {
    inflight = fetch('/api/settings')
      .then((r) => r.json())
      .then((rows) => {
        const row = Array.isArray(rows) ? rows.find((s) => s.key === 'adega_discount') : null;
        cachedConfig = parseDiscountConfig(row?.value);
        return cachedConfig;
      })
      .catch(() => DEFAULT_DISCOUNT_CONFIG);
  }
  return inflight;
}

// Retorna a config de desconto de caixa da Adega (com o default enquanto carrega).
export function useDiscountConfig() {
  const [config, setConfig] = useState(cachedConfig || DEFAULT_DISCOUNT_CONFIG);

  useEffect(() => {
    let active = true;
    loadConfig().then((c) => {
      if (active) setConfig(c);
    });
    return () => {
      active = false;
    };
  }, []);

  return config;
}
