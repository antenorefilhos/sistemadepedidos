'use client';

import { useEffect, useCallback } from 'react';
import fpPromise from '@fingerprintjs/fingerprintjs';

// Variável global para cachear o sessionId na mesma janela, evitando requisições excessivas
let globalSessionId = null;

export function useTelemetry() {
  
  const initSession = useCallback(async () => {
    if (globalSessionId) return globalSessionId;
    
    try {
      const fp = await fpPromise.load();
      const result = await fp.get();
      const visitorId = result.visitorId;

      const res = await fetch('/api/telemetry/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          visitorId,
          userAgent: window.navigator.userAgent,
          ip: '' // A API pode tentar pegar pelos headers se necessário, mas mandaremos null do cliente
        })
      });
      
      const data = await res.json();
      if (data.sessionId) {
        globalSessionId = data.sessionId;
        return data.sessionId;
      }
    } catch (err) {
      console.warn('Telemetry init failed:', err);
    }
    return null;
  }, []);

  const trackEvent = useCallback(async (eventType, eventData = {}) => {
    try {
      let sId = globalSessionId;
      if (!sId) {
        sId = await initSession();
      }
      
      if (sId) {
        await fetch('/api/telemetry/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sId,
            eventType,
            eventData
          })
        });
      }
    } catch (err) {
      console.warn('Telemetry track failed:', err);
    }
  }, [initSession]);

  return { initSession, trackEvent };
}
