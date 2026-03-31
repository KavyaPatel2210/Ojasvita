/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Authentication Routes
 * 
 * This file defines all authentication-related API routes.
 * All routes are prefixed with /api/auth
 * 
 * Routes:
 * - POST /api/auth/register - Register new user
 * - POST /api/auth/login - Login user
 * - GET /api/auth/profile - Get current user profile
 * - PUT /api/auth/profile - Update user profile
 * - PUT /api/auth/password - Update password
 * - POST /api/auth/recalculate - Recalculate health metrics
 * 
 * Dependencies:
 * - express: Router for defining routes
 * - authController: Controller functions for auth operations
 * - protect: Middleware to verify JWT authentication
 */

const express = require('express');
const router = express.Router();
const { 
  updatePassword,
  recalculateMetrics
} = require('../controllers/authController');
const { subscribe, unsubscribe } = require('../controllers/pushController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * 
 * Request body:
 * {
 *   name: string (required),
 *   email: string (required),
 *   password: string (required),
 *   age: number (required),
 *   gender: string (required),
 *   height: number (required),
 *   weight: number (required),
 *   activityLevel: string (optional, default: 'moderate'),
 *   dietGoal: string (optional, default: 'maintain')
 * }
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * 
 * Request body:
 * {
 *   email: string (required),
 *   password: string (required)
 * }
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 * 
 * Headers:
 * Authorization: Bearer <token>
 */
router.get('/profile', protect, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 * 
 * Headers:
 * Authorization: Bearer <token>
 * 
 * Request body (all fields optional):
 * {
 *   name: string,
 *   age: number,
 *   gender: string,
 *   height: number,
 *   weight: number,
 *   activityLevel: string,
 *   dietGoal: string,
 *   preferences: object
 * }
 */
router.put('/profile', protect, updateProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Update user password
 * @access  Private
 * 
 * Headers:
 * Authorization: Bearer <token>
 * 
 * Request body:
 * {
 *   currentPassword: string (required),
 *   newPassword: string (required)
 * }
 */
router.put('/password', protect, updatePassword);

/**
 * @route   POST /api/auth/recalculate
 * @desc    Recalculate health metrics
 * @access  Private
 * 
 * Headers:
 * Authorization: Bearer <token>
 */
router.post('/recalculate', protect, recalculateMetrics);

/**
 * @route   POST /api/auth/subscribe
 * @desc    Save push subscription
 */
router.post('/subscribe', protect, subscribe);

/**
 * @route   POST /api/auth/unsubscribe
 * @desc    Remove push subscription
 */
router.post('/unsubscribe', protect, unsubscribe);

// Export the router
module.exports = router;
