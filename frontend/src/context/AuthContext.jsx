/**
 * Ojasvita - Authentication Context
 * 
 * This context provides authentication state and methods to all components.
 * It manages user login, logout, and registration state.
 * 
 * State:
 * - user: Current user object (null if not logged in)
 * - token: JWT token for API authentication
 * - isAuthenticated: Boolean indicating login status
 * - loading: Boolean for async operations
 * 
 * Methods:
 * - login(email, password): Authenticate user
 * - register(userData): Register new user
 * - logout(): Clear auth state
 * - updateUser(userData): Update user profile
 * 
 * Dependencies:
 * - React: Context API
 * - api: API service for backend calls
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Create authentication context
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * 
 * Wraps the app and provides authentication context to all children.
 * Checks for existing token on mount to restore session.
 */
export const AuthProvider = ({ children }) => {
  // State for user data
  const [user, setUser] = useState(null);
  // State for JWT token
  const [token, setToken] = useState(localStorage.getItem('token'));
  // State for loading status - start true to prevent flash of content
  const [loading, setLoading] = useState(true);
  // State to track if initial auth check is complete
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  /**
   * Set auth token in API headers
   * Called whenever token changes
   */
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  /**
   * Check for existing session on mount
   * Validates token and fetches user data
   */
  useEffect(() => {
    const checkAuth = async () => {
      // If no token, immediately set loading to false
      if (!token) {
        setUser(null);
        setLoading(false);
        setIsAuthChecked(true);
        return;
      }

      try {
        // Fetch user profile using token
        const response = await api.get('/auth/profile');
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          // Token invalid, clear auth
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        // Token invalid or expired
        console.error('Auth check failed:', error);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
        setIsAuthChecked(true);
      }
    };

    checkAuth();
  }, [token]);

  /**
   * Login user
   * 
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} role - User's role
   * @returns {Promise} - Response data
   */
  const login = useCallback(async (email, password, role = 'user') => {
    try {
      const response = await api.post('/auth/login', { email, password, role });
      
      if (response.data.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  }, []);

  /**
   * Register new user
   * 
   * @param {Object} userData - User registration data
   * @returns {Promise} - Response data
   */
  const register = useCallback(async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  }, []);

  /**
   * Logout user
   * Clears all auth state
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Update user profile
   * 
   * @param {Object} userData - Updated user data
   * @returns {Promise} - Response data
   */
  const updateUser = useCallback(async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed';
      return { success: false, message };
    }
  }, []);

  // Context value
  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    isAuthChecked,
    login,
    register,
    logout,
    updateUser,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 * 
 * @returns {Object} - Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
