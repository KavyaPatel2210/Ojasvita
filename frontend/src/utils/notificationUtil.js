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
  
  // Public VAPID key (must match backend)
  VAPID_PUBLIC_KEY: 'BAvO6xNo1j7eO1fW8-tQ7r7_r7YvN6-68n-2SW_vddUZ_BAvO6xNo1j',

  /**
   * Register the device with the backend for real server-side push
   * This is the "Gold Standard" that works on closed apps
   */
  subscribeUserToServer: async (authAPI) => {
    if (!NotificationUtil.isSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe the user
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: NotificationUtil.urlBase64ToUint8Array(NotificationUtil.VAPID_PUBLIC_KEY)
        });
        console.log("New Push Subscription created:", subscription);
      }

      // Send subscription and timezone to backend
      const timezoneOffset = -new Date().getTimezoneOffset(); // in minutes
      const response = await authAPI.subscribe({ subscription, timezoneOffset });
      return response.data.success;
    } catch (error) {
      console.error("Error subscribing to server push:", error);
      return false;
    }
  },

  /**
   * Helper to convert VAPID key
   */
  urlBase64ToUint8Array: (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
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
  },

  /**
   * Schedule a notification for a specific time today
   * Uses TimestampTrigger for true background delivery (where supported), or graceful fallback
   */
  scheduleNotification: async (id, title, body, scheduledTimeStr) => {
    if (!NotificationUtil.isSupported() || Notification.permission !== 'granted') return;
    
    // Parse time like "14:30"
    const [hours, minutes] = scheduledTimeStr.split(':').map(Number);
    const targetDate = new Date();
    targetDate.setHours(hours, minutes, 0, 0);

    const timeUntil = targetDate.getTime() - Date.now();
    
    // If time has passed, don't schedule
    if (timeUntil <= 0) return;

    try {
      // Feature check for Notification Triggers API
      if ('showTrigger' in Notification.prototype && navigator.serviceWorker) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          tag: id, // unique tag prevents duplicates
          body: body,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200],
          // @ts-ignore
          showTrigger: new TimestampTrigger(targetDate.getTime())
        });
      } else {
        // Fallback for desktop/iOS or Dev Mode: Fire if the app tab happens to be alive
        setTimeout(() => {
          NotificationUtil.showNotification(title, body, '/logo.png');
        }, timeUntil);
      }
    } catch (err) {
      console.warn("Could not schedule background notification:", err);
      // Failsafe fallback
      setTimeout(() => {
        NotificationUtil.showNotification(title, body, '/logo.png');
      }, timeUntil);
    }
  }
};
