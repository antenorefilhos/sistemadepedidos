'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getFingerprint, trackEvent } from '@/lib/telemetry';

export default function TelemetryProvider() {
  const pathname = usePathname();

  useEffect(() => {
    // Garante que o fingerprint seja criado assim que a aplicação montar
    const fingerprint = getFingerprint();
    
    if (fingerprint) {
      // Registra a visualização de página toda vez que a rota mudar
      trackEvent('page_view', {}, pathname);
    }
  }, [pathname]);

  return null; // Componente fantasma (Headless)
}
