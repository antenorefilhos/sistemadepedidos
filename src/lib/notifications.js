// Implementação única de som + notificação nativa para novos pedidos.
// Antes existiam 2 cópias divergentes (tons diferentes, ícones diferentes) em
// admin/page.js e admin/components/LiveOrdersMonitor.js — este módulo é a fonte única.

export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch (err) {
    console.error('Audio API não suportada ou bloqueada pelo navegador:', err);
  }
}

export function showNativeNotification(order) {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const notification = new Notification('Novo Orçamento Recebido!', {
      body: `Cliente: ${order.customer_name}\nTelefone: ${order.customer_whatsapp || ''}`,
      icon: '/icons/icon-192.png',
      tag: `order-${order.id}`,
      requireInteraction: true,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.error('Erro ao exibir notificação nativa:', err);
  }
}
