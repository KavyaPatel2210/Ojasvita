/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Meal Routes
 * 
 * This file defines all meal-related API routes.
 * All routes are prefixed with /api/meals
 * 
 * Routes:
 * - POST /api/meals - Create a new meal
 * - GET /api/meals - Get meals by date
 * - GET /api/meals/range - Get meals by date range
 * - GET /api/meals/:id - Get single meal
 * - PUT /api/meals/:id - Update a meal
 * - DELETE /api/meals/:id - Delete a meal
 * - GET /api/meals/recent - Get recent meals
 * - GET /api/meals/category/:category - Get meals by category
 * 
 * Dependencies:
 * - express: Router for defining routes
 * - mealController: Controller functions for meal operations
 * - protect: Middleware to verify JWT authentication
 */

const express = require('express');
const router = express.Router();
const {
  createMeal,
  getMealsByDate,
  getMealsByRange,
  getMealById,
  updateMeal,
  deleteMeal,
  getRecentMeals,
  getRecentMealSessions,
  getMealsByCategory,
  createMultipleMeals
} = require('../controllers/mealController');

const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/meals
 * @desc    Create a new meal entry
 * @access  Private
 * 
 * Request body:
 * {
 *   title: string (required),
 *   calories: number (required),
 *   protein: number (optional),
 *   carbs: number (optional),
 *   fats: number (optional),
 *   category: string (optional, default: 'normal'),
 *   date: string (optional, default: now),
 *   mealTime: string (optional),
 *   description: string (optional),
 *   notes: string (optional)
 * }
 */
router.post('/', createMeal);

/**
 * @route   POST /api/meals/bulk
 * @desc    Create multiple meal entries from cart
 * @access  Private
 * 
 * Request body:
 * {
 *   meals: array of meal objects (required),
 *   date: string (optional),
 *   mealTime: string (optional)
 * }
 */
router.post('/bulk', createMultipleMeals);


/**
 * @route   GET /api/meals
 * @desc    Get meals by date
 * @access  Private
 * 
 * Query params:
 * - date: string (YYYY-MM-DD), optional, defaults to today
 */
router.get('/', getMealsByDate);

/**
 * @route   GET /api/meals/range
 * @desc    Get meals by date range
 * @access  Private
 * 
 * Query params:
 * - start: string (YYYY-MM-DD) (required)
 * - end: string (YYYY-MM-DD) (required)
 */
router.get('/range', getMealsByRange);

/**
 * @route   GET /api/meals/recent
 * @desc    Get recent meals
 * @access  Private
 * 
 * Query params:
 * - limit: number (optional, default: 10)
 */
router.get('/recent', getRecentMeals);
router.get('/sessions', getRecentMealSessions);

/**
 * @route   GET /api/meals/category/:category
 * @desc    Get meals by category
 * @access  Private
 * 
 * Params:
 * - category: string (normal, cheat, event)
 * 
 * Query params:
 * - start: string (YYYY-MM-DD) (optional)
 * - end: string (YYYY-MM-DD) (optional)
 */
router.get('/category/:category', getMealsByCategory);

/**
 * @route   GET /api/meals/:id
 * @desc    Get single meal by ID
 * @access  Private
 * 
 * Params:
 * - id: string (meal ID)
 */
router.get('/:id', getMealById);

/**
 * @route   PUT /api/meals/:id
 * @desc    Update a meal
 * @access  Private
 * 
 * Params:
 * - id: string (meal ID)
 * 
 * Request body (all fields optional):
 * {
 *   title: string,
 *   calories: number,
 *   protein: number,
 *   carbs: number,
 *   fats: number,
 *   category: string,
 *   date: string,
 *   mealTime: string,
 *   description: string,
 *   notes: string
 * }
 */
router.put('/:id', updateMeal);

/**
 * @route   DELETE /api/meals/:id
 * @desc    Delete a meal
 * @access  Private
 * 
 * Params:
 * - id: string (meal ID)
 */
router.delete('/:id', deleteMeal);

// Export the router
module.exports = router;
