import { NextResponse } from 'next/server';

/**
 * Valida a autenticação administrativa e retorna a role ('admin' | 'manager' | null).
 * NÃO possui senhas hardcoded.
 */
export function getRole(request) {
  const adminPass = process.env.ADMIN_PASSWORD;
  const managerPass = process.env.MANAGER_PASSWORD;

  let password = null;

  // 1. Tenta extrair do cabeçalho Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    password = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  }

  // 2. Tenta extrair da query param ?auth=
  if (!password) {
    try {
      const { searchParams } = new URL(request.url);
      password = searchParams.get('auth');
    } catch (e) {
      // Ignora erro de parse da URL
    }
  }

  if (!password) return null;

  if (adminPass && password === adminPass) return 'admin';
  if (managerPass && password === managerPass) return 'manager';

  return null;
}

/**
 * Valida a autenticação de admin (ou manager se permitido).
 */
export function verifyAdmin(request, options = { allowManager: false }) {
  const role = getRole(request);

  if (!process.env.ADMIN_PASSWORD) {
    console.error('[SECURITY ERROR] Variável de ambiente ADMIN_PASSWORD não configurada no servidor.');
    return { 
      authorized: false, 
      error: 'Erro de configuração de segurança no servidor.', 
      status: 500 
    };
  }

  if (role === 'admin' || (options.allowManager && role === 'manager')) {
    return { authorized: true, role };
  }

  return { 
    authorized: false, 
    error: 'Não autorizado.', 
    status: 401 
  };
}

export function unauthorizedResponse(authResult) {
  return NextResponse.json(
    { error: authResult?.error || 'Não autorizado.' },
    { status: authResult?.status || 401 }
  );
}
