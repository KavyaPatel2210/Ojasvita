/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * MealPlan Routes
 * 
 * This file defines all meal plan related API routes.
 * All routes are prefixed with /api/meal-plans
 * 
 * Routes:
 * - POST /api/meal-plans - Create a new meal plan
 * - GET /api/meal-plans - Get meal plans by date
 * - GET /api/meal-plans/pending - Get pending meal plans (for reminders)
 * - GET /api/meal-plans/range - Get meal plans by date range
 * - GET /api/meal-plans/:id - Get single meal plan
 * - PUT /api/meal-plans/:id - Update meal plan
 * - PUT /api/meal-plans/:id/status - Update meal plan status
 * - DELETE /api/meal-plans/:id - Delete meal plan
 * - POST /api/meal-plans/:id/link-meal - Link meal entry to plan
 * 
 * Dependencies:
 * - express: Router for defining routes
 * - mealPlanController: Controller functions for meal plan operations
 * - protect: Middleware to verify JWT authentication
 */

const express = require('express');
const router = express.Router();
const {
  createMealPlan,
  getMealPlansByDate,
  getMealPlansByRange,
  getMealPlanById,
  updateMealPlan,
  updateMealPlanStatus,
  deleteMealPlan,
  getPendingMealPlans,
  linkMealToPlan,
  getUpcomingMeals
} = require('../controllers/mealPlanController');


const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/meal-plans
 * @desc    Create a new meal plan
 * @access  Private
 * 
 * Request body:
 * {
 *   date: string (YYYY-MM-DD) (required),
 *   mealTime: string (breakfast|lunch|dinner) (required),
 *   scheduledTime: string (HH:MM) (required),
 *   items: array of {
 *     title: string,
 *     calories: number,
 *     protein: number,
 *     carbs: number,
 *     fats: number,
 *     quantity: number
 *   } (required),
 *   notes: string (optional)
 * }
 */
router.post('/', createMealPlan);

/**
 * @route   GET /api/meal-plans
 * @desc    Get meal plans by date
 * @access  Private
 * 
 * Query params:
 * - date: string (YYYY-MM-DD) (required)
 */
router.get('/', getMealPlansByDate);

/**
 * @route   GET /api/meal-plans/pending
 * @desc    Get pending meal plans (for reminders)
 * @access  Private
 */
router.get('/pending', getPendingMealPlans);

/**
 * @route   GET /api/meal-plans/upcoming
 * @desc    Get upcoming meal plans for today (for notifications)
 * @access  Private
 */
router.get('/upcoming', getUpcomingMeals);


/**
 * @route   GET /api/meal-plans/range
 * @desc    Get meal plans by date range
 * @access  Private
 * 
 * Query params:
 * - start: string (YYYY-MM-DD) (required)
 * - end: string (YYYY-MM-DD) (required)
 */
router.get('/range', getMealPlansByRange);

/**
 * @route   GET /api/meal-plans/:id
 * @desc    Get single meal plan by ID
 * @access  Private
 * 
 * Params:
 * - id: string (meal plan ID)
 */
router.get('/:id', getMealPlanById);

/**
 * @route   PUT /api/meal-plans/:id
 * @desc    Update a meal plan
 * @access  Private
 * 
 * Params:
 * - id: string (meal plan ID)
 * 
 * Request body (all fields optional):
 * {
 *   items: array,
 *   scheduledTime: string,
 *   notes: string,
 *   status: string
 * }
 */
router.put('/:id', updateMealPlan);

/**
 * @route   PUT /api/meal-plans/:id/status
 * @desc    Update meal plan status (completed/incomplete/skipped)
 * @access  Private
 * 
 * Params:
 * - id: string (meal plan ID)
 * 
 * Request body:
 * {
 *   status: string (required) - completed, incomplete, skipped, partially_completed
 *   actualCalories: number (optional),
 *   actualProtein: number (optional),
 *   actualCarbs: number (optional),
 *   actualFats: number (optional),
 *   notes: string (optional)
 * }
 */
router.put('/:id/status', updateMealPlanStatus);

/**
 * @route   DELETE /api/meal-plans/:id
 * @desc    Delete a meal plan
 * @access  Private
 * 
 * Params:
 * - id: string (meal plan ID)
 */
router.delete('/:id', deleteMealPlan);

/**
 * @route   POST /api/meal-plans/:id/link-meal
 * @desc    Link an actual meal entry to a meal plan
 * @access  Private
 * 
 * Params:
 * - id: string (meal plan ID)
 * 
 * Request body:
 * {
 *   mealId: string (required) - ID of the MealEntry to link
 * }
 */
router.post('/:id/link-meal', linkMealToPlan);

// Export the router
module.exports = router;
