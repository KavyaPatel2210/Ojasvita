/**
 * Ojasvita - Navbar Component
 * 
 * This is the top navigation bar component.
 * It shows the app logo, user info, and mobile menu toggle.
 * 
 * Dependencies:
 * - react-router-dom: For navigation
 * - useAuth: Custom hook for authentication
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationUtil } from '../utils/notificationUtil';
import { authAPI } from '../services/api';


/**
 * Navbar Component
 * 
 * Top navigation bar with logo, user dropdown, and mobile menu toggle.
 */
const Navbar = ({ onMenuClick }) => {
  // Get auth context
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Get notifications context
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    completeMeal,
    getNotificationMessage
  } = useNotifications();

  // State for user dropdown
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // State for notification dropdown
  const [notificationOpen, setNotificationOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('unread'); // 'unread' or 'read'

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  /**
   * Toggle dropdown
   */
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  /**
   * Close dropdown when clicking outside
   */
  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  /**
   * Toggle notification dropdown
   */
  const toggleNotifications = () => {
    setNotificationOpen(!notificationOpen);
  };

  /**
   * Close notification dropdown
   */
  const closeNotifications = () => {
    setNotificationOpen(false);
  };

  /**
   * Handle notification click
   */
  const handleNotificationClick = (notificationId) => {
    markAsRead(notificationId);
    closeNotifications();
    navigate('/meals');
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(n =>
    activeTab === 'unread' ? !n.isRead : n.isRead
  );

  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Left side - Menu button and Logo */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="mr-4 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none lg:hidden"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Logo */}
            <img src="/logo-main.png" alt="Logo" className="h-10 w-auto" />
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <div className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={closeNotifications} />

                  <div className="absolute right-0 z-20 mt-2 w-80 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <p className="text-sm font-semibold text-gray-900">Notifications</p>
                      <div className="flex gap-3">
                        {activeTab === 'unread' && unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                        <button
                          onClick={() => notifications.forEach(n => dismissNotification(n._id))}
                          className="text-xs text-gray-400 hover:text-gray-500 font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                      <button
                        onClick={() => setActiveTab('unread')}
                        className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'unread' ? 'border-b-2 border-primary-500 text-primary-600 bg-primary-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                      >
                        Unread {unreadCount > 0 && `(${unreadCount})`}
                      </button>
                      <button
                        onClick={() => setActiveTab('read')}
                        className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'read' ? 'border-b-2 border-primary-500 text-primary-600 bg-primary-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                      >
                        Read
                      </button>
                    </div>

                    {/* Notifications list */}
                    <div className="max-h-80 overflow-y-auto">
                      {filteredNotifications.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                          <p className="text-sm text-gray-400">No {activeTab} notifications</p>
                        </div>
                      ) : (
                        filteredNotifications.map((notification) => {
                          const { title, message, icon } = getNotificationMessage(notification);
                          return (
                            <div
                              key={notification._id}
                              onClick={() => handleNotificationClick(notification._id)}
                              className={`relative px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-primary-50/20' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-xl shrink-0">{icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1">
                                    <p className={`text-sm font-semibold leading-tight ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                      {title}
                                    </p>
                                    {!notification.isRead && (
                                      <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {message}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  {notification.type === 'meal' && activeTab === 'unread' && notification.data?.status !== 'upcoming' && notification.data?.mealId && (
                                    <div className="mt-2 flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          completeMeal(notification.data.mealId, notification._id);
                                        }}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-[10px] font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 transition-colors"
                                      >
                                        I ate it
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotification(notification._id);
                                  }}
                                  className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                      <Link
                        to="/notifications"
                        onClick={closeNotifications}
                        className="block text-center text-xs font-semibold text-primary-600 hover:text-primary-700 py-1"
                      >
                        View All Activity
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>



            {/* User dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={toggleDropdown}
              >
                <span className="sr-only">Open user menu</span>
                {/* User avatar */}
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={closeDropdown}
                  />

                  {/* Dropdown content */}
                  <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {/* User name */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>

                    </div>

                    {/* Menu items */}
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={closeDropdown}
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/bmi"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={closeDropdown}
                    >
                      BMI & Goals
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={closeDropdown}
                    >
                      Settings
                    </Link>

                    {/* Enable Notifications Button */}
                    <button
                      onClick={() => {
                        closeDropdown();
                        NotificationUtil.requestPermission().then(async granted => {
                          if (granted) {
                            // First show local notification
                            NotificationUtil.showNotification('🎉 Welcome!', 'Local notifications are active. Registering for server push...');
                            
                            // Then register for server-side push (works when app is closed)
                            const success = await NotificationUtil.subscribeUserToServer(authAPI);
                            if (success) {
                              NotificationUtil.showNotification('🚀 Ready!', 'Server-side push notifications are now active! You will get alerts even when the app is closed.');
                            } else {
                              console.error("Failed to register server push");
                            }
                          }
                        });
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-gray-100"
                    >
                      Enable Notifications
                    </button>

                    {/* Logout button */}
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
