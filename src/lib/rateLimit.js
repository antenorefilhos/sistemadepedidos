// Rate limiter simples, em memória (janela deslizante por chave).
//
// LIMITAÇÃO: o estado vive na memória da instância serverless, então em cenários
// com muitas instâncias o limite é aplicado por instância (best-effort). Serve como
// primeira camada contra abuso/força-bruta. Para limite distribuído robusto,
// migrar para Upstash Redis (@upstash/ratelimit).

const buckets = new Map();
const MAX_KEYS = 10000; // trava de segurança contra crescimento ilimitado da memória

// Retorna { allowed: boolean, retryAfter?: number(segundos) }
export function rateLimit(key, { limit = 10, windowMs = 60000 } = {}) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((ts) => now - ts < windowMs);

  if (hits.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - hits[0])) / 1000);
    buckets.set(key, hits);
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  }

  hits.push(now);
  buckets.set(key, hits);

  // Limpeza oportunista para não vazar memória.
  if (buckets.size > MAX_KEYS) {
    for (const [k, arr] of buckets) {
      if (arr.every((ts) => now - ts >= windowMs)) buckets.delete(k);
    }
  }

  return { allowed: true };
}

// Extrai o IP do cliente a partir dos headers de proxy (Vercel/edge).
export function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
