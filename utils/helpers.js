/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Helper Utilities
 * 
 * This file contains general helper functions used throughout the application.
 * These utilities support various tasks like date handling, validation, formatting, etc.
 * 
 * Dependencies:
 * - None (pure JavaScript functions)
 */

/**
 * Format date to readable string
 * 
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'iso')
 * @returns {string} - Formatted date string
 */
const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'iso':
      return d.toISOString().split('T')[0];
    case 'short':
    default:
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
  }
};

/**
 * Get start and end of day
 * 
 * @param {Date} date - Date to process
 * @returns {Object} - Start and end of day
 */
const getDayBounds = (date = new Date()) => {
  const start = parseSafeDate(date);
  const end = new Date(start);
  end.setUTCHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Parse a date string safely to local midnight
 * This prevents timezone shifts (e.g. from UTC parsing)
 * 
 * @param {string|Date} date - Date string in YYYY-MM-DD or Date object
 * @returns {Date} - Normalized local Date
 */
const parseSafeDate = (date) => {
  if (!date) {
    const d = new Date();
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  // If already a Date, normalize it to UTC midnight
  if (date instanceof Date) {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  // Handle ISO string or YYYY-MM-DD
  if (typeof date === 'string') {
    const parts = date.split('T')[0].split('-').map(Number);
    if (parts.length === 3) {
      return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    }
  }

  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

/**
 * Get start and end of week
 * 
 * @param {Date} date - Reference date
 * @param {number} weekStartsOn - Day week starts on (0=Sunday, 1=Monday)
 * @returns {Object} - Start and end of week
 */
const getWeekBounds = (date = new Date(), weekStartsOn = 1) => {
  const d = parseSafeDate(date);
  const day = d.getUTCDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - diff);
  
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Get start and end of month
 * 
 * @param {Date} date - Reference date
 * @returns {Object} - Start and end of month
 */
const getMonthBounds = (date = new Date()) => {
  const d = new Date(date);
  
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Get date range array
 * 
 * Returns array of dates between start and end
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Array of date strings
 */
const getDateRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

/**
 * Get last N days
 * 
 * @param {number} n - Number of days
 * @param {Date} endDate - End date (default: today)
 * @returns {Array} - Array of dates
 */
const getLastNDays = (n, endDate = new Date()) => {
  const dates = [];
  const current = new Date(endDate);
  
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(current);
    date.setDate(current.getDate() - i);
    dates.push(date);
  }
  
  return dates;
};

/**
 * Format number with commas
 * 
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Round number to decimal places
 * 
 * @param {number} num - Number to round
 * @param {number} decimals - Decimal places
 * @returns {number} - Rounded number
 */
const roundNumber = (num, decimals = 1) => {
  if (num === null || num === undefined) return 0;
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * 
 * Requirements:
 * - At least 6 characters
 * - At least one letter
 * 
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result
 */
const validatePassword = (password) => {
  const result = {
    valid: true,
    errors: []
  };
  
  if (!password) {
    result.valid = false;
    result.errors.push('Password is required');
    return result;
  }
  
  if (password.length < 6) {
    result.valid = false;
    result.errors.push('Password must be at least 6 characters');
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    result.valid = false;
    result.errors.push('Password must contain at least one letter');
  }
  
  return result;
};

/**
 * Generate random string
 * 
 * @param {number} length - Length of string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sanitize string (prevent XSS)
 * 
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Get meal time suggestions based on hour
 * 
 * @param {number} hour - Hour of day (0-23)
 * @returns {string} - Suggested meal time
 */
const getSuggestedMealTime = (hour) => {
  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 18) return 'snack';
  if (hour >= 18 && hour < 22) return 'dinner';
  return 'snack';
};

/**
 * Get category color
 * 
 * @param {string} category - Meal category
 * @returns {string} - Color code
 */
const getCategoryColor = (category) => {
  const colors = {
    normal: '#10B981',  // Green
    cheat: '#F59E0B',   // Amber
    event: '#8B5CF6'    // Purple
  };
  return colors[category.toLowerCase()] || colors.normal;
};

/**
 * Get category icon
 * 
 * @param {string} category - Meal category
 * @returns {string} - Icon name
 */
const getCategoryIcon = (category) => {
  const icons = {
    normal: '🥗',
    cheat: '🍕',
    event: '🎉'
  };
  return icons[category.toLowerCase()] || icons.normal;
};

/**
 * Paginate array
 * 
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} - Paginated result
 */
const paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const results = array.slice(startIndex, endIndex);
  
  return {
    data: results,
    pagination: {
      total: array.length,
      page: page,
      limit: limit,
      pages: Math.ceil(array.length / limit),
      hasNext: endIndex < array.length,
      hasPrev: page > 1
    }
  };
};

/**
 * Sleep/wait function
 * 
 * Utility for adding delays in async functions
 * 
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} - Resolves after delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Debounce function
 * 
 * Limits function execution rate
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Group array by key
 * 
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} - Grouped object
 */
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Calculate percentage change
 * 
 * @param {number} oldValue - Previous value
 * @param {number} newValue - Current value
 * @returns {number} - Percentage change
 */
const percentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100);
};

/**
 * Get motivation message based on performance
 * 
 * @param {string} status - Performance status
 * @param {number} streak - Current streak
 * @returns {string} - Motivation message
 */
const getMotivationMessage = (status, streak = 0) => {
  const messages = {
    on_track: [
      "You're doing amazing! Keep up the great work! 🌟",
      "Perfect! You're right on target! 🎯",
      "Excellent progress! Stay consistent! 💪"
    ],
    under: [
      "Good start! You can reach your goal! 🔥",
      "Keep going! Every meal counts! 💯",
      "You're building great habits! 🌱"
    ],
    over: [
      "No worries! Tomorrow is a fresh start! 🌅",
      "One day won't ruin your progress! Stay positive! ⭐",
      "Learn and move forward! You've got this! 🚀"
    ]
  };

  const statusMessages = messages[status] || messages.under;
  return statusMessages[Math.floor(Math.random() * statusMessages.length)];
};

// Export all helper functions
/**
 * Get start and end of day in UTC
 * This helps with timezone-independent date queries
 * 
 * @param {Date} date - Date to process
 * @returns {Object} - Start and end of day in UTC
 */
const getUTCDayBounds = (date = new Date()) => {
  const d = new Date(date);
  
  // Get start of day in UTC
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  
  // Get end of day in UTC
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  
  return { start, end };
};

/**
 * Get start and end of day in local timezone
 * This is useful for displaying dates to users in their local timezone
 * 
 * @param {Date} date - Date to process
 * @returns {Object} - Start and end of day in local timezone
 */
const getLocalDayBounds = (date = new Date()) => {
  const d = new Date(date);
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

// Export all helper functions
module.exports = {
  formatDate,
  getDayBounds,
  parseSafeDate,
  getUTCDayBounds,
  getLocalDayBounds,
  getWeekBounds,
  getMonthBounds,
  getDateRange,
  getLastNDays,
  formatNumber,
  roundNumber,
  isValidEmail,
  validatePassword,
  generateRandomString,
  sanitizeString,
  getSuggestedMealTime,
  getCategoryColor,
  getCategoryIcon,
  paginate,
  sleep,
  debounce,
  groupBy,
  percentageChange,
  getMotivationMessage
};
