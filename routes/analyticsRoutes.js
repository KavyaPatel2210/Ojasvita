/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Analytics Routes
 * 
 * This file defines all analytics and reporting API routes.
 * All routes are prefixed with /api/analytics
 * 
 * Routes:
 * - GET /api/analytics/daily - Get daily summary
 * - GET /api/analytics/weekly - Get weekly summary
 * - GET /api/analytics/streak - Get streak information
 * - GET /api/analytics/health - Get BMI and health metrics
 * - GET /api/analytics/redistribution - Get redistribution data
 * - GET /api/analytics/progress - Get progress tracking data
 * - GET /api/analytics/categories - Get category distribution
 * - GET /api/analytics/dashboard - Get dashboard data
 * 
 * Dependencies:
 * - express: Router for defining routes
 * - analyticsController: Controller functions for analytics operations
 * - protect: Middleware to verify JWT authentication
 */

const express = require('express');
const router = express.Router();
const { 
  getDailySummary,
  getWeeklySummary,
  getStreakInfo,
  getHealthMetrics,
  getRedistributionData,
  getProgressData,
  getCategoryDistribution,
  getDashboardData
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/analytics/daily
 * @desc    Get daily summary for a specific date
 * @access  Private
 * 
 * Query params:
 * - date: string (YYYY-MM-DD), optional, defaults to today
 * 
 * Returns:
 * - Total calories consumed
 * - Macronutrient breakdown
 * - Progress towards daily target
 * - Meal count
 * - Category breakdown
 * - Motivation message
 */
router.get('/daily', getDailySummary);

/**
 * @route   GET /api/analytics/weekly
 * @desc    Get weekly summary
 * @access  Private
 * 
 * Query params:
 * - startDate: string (YYYY-MM-DD), optional
 * 
 * Returns:
 * - Daily breakdown for the week
 * - Weekly averages
 * - Total meals logged
 * - Goal achievement rate
 * - Streak information
 */
router.get('/weekly', getWeeklySummary);

/**
 * @route   GET /api/analytics/streak
 * @desc    Get streak information
 * @access  Private
 * 
 * Returns:
 * - Current streak count
 * - Longest streak
 * - Streak status
 * - Milestones achieved
 * - Motivation message
 * - Days to next milestone
 */
router.get('/streak', getStreakInfo);

/**
 * @route   GET /api/analytics/health
 * @desc    Get BMI and health metrics
 * @access  Private
 * 
 * Returns:
 * - Current BMI
 * - BMI category
 * - BMR
 * - Daily calorie needs
 * - Target calories based on goal
 */
router.get('/health', getHealthMetrics);

/**
 * @route   GET /api/analytics/redistribution
 * @desc    Get calorie redistribution data
 * @access  Private
 * 
 * Returns:
 * - Recent overage days
 * - Redistribution amounts
 * - Total redistributed calories
 * - Current target
 */
router.get('/redistribution', getRedistributionData);

/**
 * @route   GET /api/analytics/progress
 * @desc    Get progress tracking data
 * @access  Private
 * 
 * Query params:
 * - days: number (optional, default: 30)
 * 
 * Returns:
 * - Daily calorie data
 * - Trend analysis
 * - Achievement rate
 * - Average calories
 */
router.get('/progress', getProgressData);

/**
 * @route   GET /api/analytics/categories
 * @desc    Get meal category distribution
 * @access  Private
 * 
 * Query params:
 * - start: string (YYYY-MM-DD), optional
 * - end: string (YYYY-MM-DD), optional
 * - Default: last 30 days
 * 
 * Returns:
 * - Count by category
 * - Calories by category
 * - Percentage breakdown
 */
router.get('/categories', getCategoryDistribution);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard data
 * @access  Private
 * 
 * Returns all essential dashboard data in a single request:
 * - User info
 * - Today's summary
 * - Today's progress
 * - Streak info
 * - Weekly progress
 * - Recent meals
 */
router.get('/dashboard', getDashboardData);

// Export the router
module.exports = router;
