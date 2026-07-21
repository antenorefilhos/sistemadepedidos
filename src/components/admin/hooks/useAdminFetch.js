'use client';

import { useCallback, useEffect, useState } from 'react';

export class AdminFetchError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AdminFetchError';
    this.status = status;
  }
}

// Função pura: monta a URL autenticada (?auth=...), define Content-Type quando há body
// e lança AdminFetchError em respostas não-ok. Uso direto fora de componentes React.
export async function adminFetch(path, { password, method = 'GET', body, headers } = {}) {
  const separator = path.includes('?') ? '&' : '?';
  const url = `${path}${separator}auth=${encodeURIComponent(password || '')}`;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const finalHeaders = { ...headers };
  let finalBody = body;

  if (body !== undefined && !isFormData) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, { method, headers: finalHeaders, body: finalBody });
  } catch (err) {
    throw new AdminFetchError('Erro de conexão. Verifique sua internet e tente novamente.', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // resposta sem corpo JSON (ex.: 204) — segue com data = null
  }

  if (!res.ok) {
    const message = data?.error || `Erro inesperado (status ${res.status}).`;
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[adminFetch] ${method} ${path} -> ${res.status}: ${message}`);
    }
    throw new AdminFetchError(message, res.status);
  }

  return data;
}

// Hook de conveniência: busca ao montar (ou quando `path`/deps mudam) e expõe {data, loading, error, refetch}.
export function useAdminFetch(path, { password, skip = false, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (skip || !password) return;
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch(path, { password });
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, password, skip, ...deps]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// Hook de mutação (POST/PUT/DELETE) — não busca automaticamente, só expõe `mutate`.
export function useAdminMutation(path, { password, method = 'POST' } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (body, overridePath) => {
      setLoading(true);
      setError(null);
      try {
        return await adminFetch(overridePath || path, { password, method, body });
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [path, password, method]
  );

  return { mutate, loading, error };
}
