/**
 * A utility class to handle browser Push Notifications and permissions
 * Designed specifically for frontend-triggered local push alerts via Service Worker
 */
export const NotificationUtil = {
  /**
   * Check if notifications are supported by the browser
   */
  isSupported: () => {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  },

  /**
   * Request permission from the user
   */
  requestPermission: async () => {
    if (!NotificationUtil.isSupported()) {
      alert("Push notifications are not supported in this browser.");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert("✅ Notifications enabled successfully!");
        return true;
      } else {
        alert("❌ Notification permission denied.");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  },

  /**
   * Send a local frontend-triggered notification via the active Service Worker
   * @param {string} title - The notification title
   * @param {string} body - The notification message
   * @param {string} icon - URL to the icon image (optional)
   */
  showNotification: async (title, body, icon = '/logo.png') => {
    if (!NotificationUtil.isSupported()) return;

    if (Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          // Trigger via Service Worker (appears dynamically even on mobile)
          await registration.showNotification(title, {
            body: body,
            icon: icon,
            badge: '/logo.png',
            vibrate: [200, 100, 200]
          });
        } else {
          // Fallback if Service Worker is not fully registered yet
          new Notification(title, { body, icon });
        }
      } catch (error) {
        // Fallback for desktop browsers without SW control
        console.warn('Falling back to basic notification API', error);
        new Notification(title, { body, icon });
      }
    } else {
      console.log("No notification permission granted.");
    }
  }
};
