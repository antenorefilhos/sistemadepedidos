// Sanitização leve e sem dependência nova para HTML gerado por markdown (marked.parse()).
// Remove os vetores mais óbvios de XSS (script/iframe/object/embed, atributos on*, javascript:).
// Não substitui uma biblioteca dedicada (ex.: DOMPurify) para HTML arbitrário de terceiros —
// suficiente aqui porque a origem é sempre texto gerado pela IA (Hermes), nunca HTML de usuário
// externo, mas o conteúdo da IA pode refletir dados internos (ex.: notas de pedido) que um
// operador mal-intencionado poderia tentar manipular indiretamente.
export function sanitizeHtml(html) {
  return String(html)
    .replace(/<(script|iframe|object|embed|link|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|iframe|object|embed|link|style)[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:.*?\2/gi, '$1="#"');
}
