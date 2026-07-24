// Regras de preço compartilhadas entre carrinho, card de produto e servidor de pedidos.
// Fonte única de verdade para o desconto de volume da Adega — evita divergência
// entre o que o cliente vê e o que é cobrado no checkout (autoritativo no servidor).

// Config padrão do desconto (usada quando não há configuração salva em app_settings).
export const DEFAULT_DISCOUNT_CONFIG = { enabled: true, cx6: 5, cx12: 10 };

// Normaliza o value salvo em app_settings (key 'adega_discount') numa config previsível.
export function parseDiscountConfig(value) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_DISCOUNT_CONFIG };
  return {
    enabled: value.enabled !== false,
    cx6: Number(value.cx6 ?? DEFAULT_DISCOUNT_CONFIG.cx6) || 0,
    cx12: Number(value.cx12 ?? DEFAULT_DISCOUNT_CONFIG.cx12) || 0,
  };
}

// Taxa de desconto (0..1) por quantidade de garrafas — só para vinhos (type === 'adega')
// e apenas se habilitado. Os percentuais vêm da config (ex.: 5 → 0.05).
export function adegaVolumeDiscountRate(quantity, config = DEFAULT_DISCOUNT_CONFIG) {
  const cfg = config || DEFAULT_DISCOUNT_CONFIG;
  if (cfg.enabled === false) return 0;
  const q = Number(quantity) || 0;
  if (q >= 12) return (Number(cfg.cx12) || 0) / 100;
  if (q >= 6) return (Number(cfg.cx6) || 0) / 100;
  return 0;
}

// Resolve a taxa de desconto (0..1) considerando o override INDIVIDUAL do produto,
// que PREVALECE sobre o global, por tier. Campo individual vazio/null = herda o global.
export function resolveDiscountRate(product, quantity, globalConfig = DEFAULT_DISCOUNT_CONFIG) {
  if (product?.type !== 'adega') return 0;
  const g = globalConfig || DEFAULT_DISCOUNT_CONFIG;
  const q = Number(quantity) || 0;
  const pick = (individual, globalPct) => {
    if (individual !== null && individual !== undefined && individual !== '') {
      return (Number(individual) || 0) / 100; // override individual (prevalece)
    }
    return g.enabled === false ? 0 : (Number(globalPct) || 0) / 100; // herda o global
  };
  if (q >= 12) return pick(product?.discount_cx12, g.cx12);
  if (q >= 6) return pick(product?.discount_cx6, g.cx6);
  return 0;
}

// Preço unitário já com o desconto aplicado. Preço cheio para produtos que não são da Adega.
export function discountedUnitPrice(product, quantity, globalConfig = DEFAULT_DISCOUNT_CONFIG) {
  const base = Number(product?.preco || 0);
  return base * (1 - resolveDiscountRate(product, quantity, globalConfig));
}
