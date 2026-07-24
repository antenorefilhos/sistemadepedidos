import crypto from 'crypto';

// Token de acesso do cliente: stateless, assinado por HMAC-SHA256.
// Não exige tabela no banco. Expira em 15 minutos.

const TOKEN_TTL_MS = 15 * 60 * 1000;

function getSecret() {
  // Segredo dedicado; cai para SYNC_TOKEN apenas como último recurso.
  return process.env.AUTH_SECRET || process.env.SYNC_TOKEN || null;
}

// Remove qualquer caractere não numérico (o WhatsApp é gravado sem padronização no checkout).
export function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

// Considera dois telefones equivalentes ignorando o código de país (55) inicial.
export function phonesMatch(a, b) {
  const strip = (d) => (d.length > 11 && d.startsWith('55') ? d.slice(2) : d);
  const na = strip(normalizePhone(a));
  const nb = strip(normalizePhone(b));
  return na.length >= 8 && na === nb;
}

// Gera um token assinado vinculado ao telefone normalizado. Retorna null se não houver segredo.
export function createAccessToken(normalizedPhone) {
  const secret = getSecret();
  if (!secret || !normalizedPhone) return null;
  const payload = { phone: normalizedPhone, exp: Date.now() + TOKEN_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

// Valida assinatura + expiração. Retorna o telefone normalizado ou null.
export function verifyAccessToken(token) {
  const secret = getSecret();
  if (!secret || !token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.phone || !payload.exp || Date.now() > payload.exp) return null;
    return payload.phone;
  } catch {
    return null;
  }
}
