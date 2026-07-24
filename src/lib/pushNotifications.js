export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendNativeNotification(title, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        icon: '/icon.png',
        badge: '/icon.png',
        tag: options.tag || 'antenor-order',
        requireInteraction: true,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        }
        notification.close();
      };
    } catch (e) {
      console.error('Error triggering push notification:', e);
    }
  }
}
