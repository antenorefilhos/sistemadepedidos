import { v4 as uuidv4 } from 'uuid';

/**
 * TELEMETRY & FINGERPRINTING SYSTEM
 * 
 * Gera um UUID persistente (Device ID) para usuários anônimos
 * e provê métodos para enviar eventos de tracking ao Supabase
 * ou logá-los para o Hermes Analytics.
 */

const FINGERPRINT_KEY = 'antenor_device_fingerprint';

// Obtém ou cria o fingerprint atual do dispositivo
export const getFingerprint = () => {
  if (typeof window === 'undefined') return null; // Previne erro no SSR

  let fp = localStorage.getItem(FINGERPRINT_KEY);
  if (!fp) {
    fp = uuidv4();
    localStorage.setItem(FINGERPRINT_KEY, fp);
  }
  return fp;
};

// Envia um evento genérico (Page View, Add to Cart, etc)
export const trackEvent = async (eventType, eventData = {}, pageUrl = '') => {
  if (typeof window === 'undefined') return;

  const fingerprint = getFingerprint();
  if (!fingerprint) return;

  try {
    // Nós criaremos uma rota /api/telemetry em breve para receber isso
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fingerprint,
        event_type: eventType,
        event_data: eventData,
        page_url: pageUrl || window.location.pathname
      })
    });
  } catch (err) {
    // Falha silenciosa para não quebrar a UI
    console.error('Falha ao enviar telemetria:', err);
  }
};
