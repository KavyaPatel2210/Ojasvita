import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationAPI, mealPlanAPI, authAPI } from '../services/api';
import { NotificationUtil } from '../utils/notificationUtil';

// Create the notification context
const NotificationContext = createContext();

/**
 * NotificationProvider Component
 * 
 * Wraps the app and provides notification state to all children.
 */
export const NotificationProvider = ({ children }) => {
  // State for notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  /**
   * Fetch all notifications from the backend
   */
  const fetchAllNotifications = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all notifications from the new backend endpoint (perists them)
      const response = await notificationAPI.getAllNotifications();

      if (response.data.success) {
        const fetchedNotifications = response.data.notifications || [];

        setNotifications(prev => {
          // Identify notifications that were already marked as dismissed locally but not yet synced
          const dismissedIds = new Set(prev.filter(n => n.dismissed).map(n => n._id));

          // Filter out fetched notifications that we've already dismissed
          const filteredFetched = fetchedNotifications.filter(n => !dismissedIds.has(n._id));

          // Use a Map to keep track of the most up-to-date state (favoring fetched but merging with local if needed)
          const notificationMap = new Map();

          // 1. Start with fetched data (most reliable)
          filteredFetched.forEach(n => notificationMap.set(n._id, n));

          return Array.from(notificationMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });
      }

      setLastChecked(new Date());
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
    );

    try {
      await notificationAPI.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  /**
   * Mark all as read
   */
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
    if (unreadIds.length === 0) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    try {
      await Promise.all(unreadIds.map(id => notificationAPI.markAsRead(id)));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [notifications]);

  /**
   * Dismiss a notification
   */
  const dismissNotification = useCallback(async (notificationId) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n._id === notificationId ? { ...n, dismissed: true } : n)
    );

    try {
      await notificationAPI.dismissNotification(notificationId);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }, []);

  /**
   * Complete a meal from a notification
   */
  const completeMeal = useCallback(async (mealId, notificationId) => {
    // Optimistic reading
    setNotifications(prev =>
      prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
    );

    try {
      await mealPlanAPI.updateMealPlanStatus(mealId, { status: 'completed' });
      // Refresh to get updated notification state (title/message)
      await fetchAllNotifications();
    } catch (error) {
      console.error('Error completing meal:', error);
    }
  }, [fetchAllNotifications]);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(async () => {
    const ids = notifications.map(n => n._id);
    setNotifications([]);

    try {
      await Promise.all(ids.map(id => notificationAPI.dismissNotification(id)));
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }, [notifications]);

  /**
   * Get formatted notification message based on notification type
   */
  const getNotificationMessage = (notification) => {
    return {
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info',
      icon: notification.icon || '🔔'
    };
  };

  /**
   * Update unread count whenever notifications change
   */
  useEffect(() => {
    const count = notifications.filter(n => !n.isRead && !n.dismissed).length;
    setUnreadCount(count);
  }, [notifications]);

  const { isAuthenticated, user } = useAuth();

  /**
   * Automatically subscribe user to server-side push if they are authenticated 
   * and don't have a subscription stored in their profile yet.
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        NotificationUtil.subscribeUserToServer(authAPI);
      }
    }
  }, [isAuthenticated, user]);

  /**
   * Initial fetch and periodic checking
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllNotifications();

      const interval = setInterval(() => {
        fetchAllNotifications();
      }, 60000); // 60 seconds

      return () => clearInterval(interval);
    }
  }, [fetchAllNotifications, isAuthenticated]);

  // Context value
  const value = {
    notifications: notifications.filter(n => !n.dismissed),
    unreadCount,
    loading,
    lastChecked,
    fetchAllNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
    completeMeal,
    getNotificationMessage
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
