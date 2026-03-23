/**
 * Ojasvita - API Service
 * 
 * Central API service for making HTTP requests.
 * Standardized with cache-busting for all critical data fetch operations.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (config.method === 'get') {
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      const publicPathnames = ['/', '/login', '/register'];
      if (!publicPathnames.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  updatePassword: (data) => api.put('/auth/password', data),
  recalculateMetrics: () => api.post('/auth/recalculate')
};

export const mealsAPI = {
  createMeal: (mealData) => api.post('/meals', mealData),
  getMealsByDate: (date) => api.get('/meals', { params: { date, _t: Date.now() } }),
  getMealsByRange: (start, end) => api.get('/meals/range', { params: { start, end, _t: Date.now() } }),
  getMeal: (id) => api.get(`/meals/${id}`),
  updateMeal: (id, mealData) => api.put(`/meals/${id}`, mealData),
  deleteMeal: (id) => api.delete(`/meals/${id}`),
  getRecentMeals: (limit, category) => api.get('/meals/recent', { params: { limit, category, _t: Date.now() } }),
  getRecentMealSessions: () => api.get('/meals/sessions', { params: { _t: Date.now() } }),
  getMealsByCategory: (category, start, end) => api.get(`/meals/category/${category}`, { params: { start, end, _t: Date.now() } })
};

export const analyticsAPI = {
  getDailySummary: (date) => api.get('/analytics/daily', { params: { date, _t: Date.now() } }),
  getWeeklySummary: (startDate) => api.get('/analytics/weekly', { params: { startDate, _t: Date.now() } }),
  getStreakInfo: () => api.get('/analytics/streak', { params: { _t: Date.now() } }),
  getHealthMetrics: () => api.get('/analytics/health', { params: { _t: Date.now() } }),
  getRedistributionData: () => api.get('/analytics/redistribution', { params: { _t: Date.now() } }),
  getProgressData: (days) => api.get('/analytics/progress', { params: { days, _t: Date.now() } }),
  getCategoryDistribution: (start, end) => api.get('/analytics/categories', { params: { start, end, _t: Date.now() } }),
  getDashboardData: () => api.get('/analytics/dashboard', { params: { _t: Date.now() } })
};

export const foodMasterAPI = {
  getAllFoods: (params) => api.get('/foods-master', { params: { ...params, _t: Date.now() } }),
  getAvailableFoods: (remaining, params) => api.get('/foods-master/available', { params: { remaining, ...params, _t: Date.now() } }),
  getCategories: () => api.get('/foods-master/categories'),
  getFoodTypes: () => api.get('/foods-master/types'),
  getFoodById: (id) => api.get(`/foods-master/${id}`)
};

export const mealsBulkAPI = {
  createMultipleMeals: (mealsData) => api.post('/meals/bulk', mealsData)
};

export const waterIntakeAPI = {
  addWaterLog: (data) => api.post('/water/add', data),
  getTodayIntake: () => api.get('/water/today', { params: { _t: Date.now() } }),
  getIntakeByDate: (date) => api.get('/water', { params: { date, _t: Date.now() } }),
  getIntakeByRange: (start, end) => api.get('/water/range', { params: { start, end, _t: Date.now() } }),
  getWeeklyStats: () => api.get('/water/weekly', { params: { _t: Date.now() } }),
  updateDailyGoal: (goalData) => api.put('/water/goal', goalData),
  deleteWaterLog: (logId) => api.delete(`/water/${logId}`)
};

export const notificationAPI = {
  getAllNotifications: () => api.get('/notifications', { params: { _t: Date.now() } }),
  getNotificationSummary: () => api.get('/notifications/summary', { params: { _t: Date.now() } }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  dismissNotification: (id) => api.put(`/notifications/${id}/dismiss`)
};

export const mealPlanAPI = {
  createMealPlan: (planData) => api.post('/meal-plans', planData),
  getMealPlansByDate: (date) => api.get('/meal-plans', { params: { date, _t: Date.now() } }),
  getMealPlansByRange: (start, end) => api.get('/meal-plans/range', { params: { start, end, _t: Date.now() } }),
  getPendingMealPlans: () => api.get('/meal-plans/pending', { params: { _t: Date.now() } }),
  getUpcomingMeals: () => api.get('/meal-plans/upcoming', { params: { _t: Date.now() } }),
  getMealPlan: (id) => api.get(`/meal-plans/${id}`),
  updateMealPlan: (id, planData) => api.put(`/meal-plans/${id}`, planData),
  updateMealPlanStatus: (id, statusData) => api.put(`/meal-plans/${id}/status`, statusData),
  deleteMealPlan: (id) => api.delete(`/meal-plans/${id}`),
  linkMealToPlan: (planId, mealId) => api.post(`/meal-plans/${planId}/link-meal`, { mealId })
};

export default api;
