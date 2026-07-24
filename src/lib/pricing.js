// Regras de preço compartilhadas entre carrinho, card de produto e servidor de pedidos.
// Fonte única de verdade para o desconto de volume da Adega — evita divergência
// entre o que o cliente vê e o que é cobrado no checkout (autoritativo no servidor).

// Desconto por quantidade de garrafas, aplicado APENAS a vinhos (type === 'adega').
export function adegaVolumeDiscountRate(quantity) {
  const q = Number(quantity) || 0;
  if (q >= 12) return 0.10; // 10% a partir de 12 garrafas (caixa fechada)
  if (q >= 6) return 0.05; // 5% a partir de 6 garrafas
  return 0;
}

// Preço unitário já com o desconto de volume aplicado.
// Retorna o preço cheio para produtos que não são da Adega.
export function discountedUnitPrice(product, quantity) {
  const base = Number(product?.preco || 0);
  const rate = product?.type === 'adega' ? adegaVolumeDiscountRate(quantity) : 0;
  return base * (1 - rate);
}
