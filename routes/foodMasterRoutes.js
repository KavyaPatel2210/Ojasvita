/**
 * Ojasvita - Food Master Routes
 * 
 * This file defines all food master database API routes.
 * All routes are prefixed with /api/foods-master
 * 
 * IMPORTANT: This is a READ-ONLY master table.
 * Foods are imported from CSV and selected by users when logging meals.
 * Users CANNOT add, edit, or delete foods from this database.
 * 
 * Routes:
 * - GET /api/foods-master - Get all foods with pagination, search, filter
 * - GET /api/foods-master/available - Get foods that fit remaining calories
 * - GET /api/foods-master/categories - Get all unique categories
 * - GET /api/foods-master/types - Get all food types
 * - GET /api/foods-master/:id - Get single food by ID
 * 
 * Dependencies:
 * - express: Router for defining routes
 * - foodMasterController: Controller functions for food operations
 */

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getAllFoods,
  getAvailableFoods,
  getCategories,
  getFoodTypes,
  getFoodById
} = require('../controllers/foodMasterController');

/**
 * @route   GET /api/foods-master
 * @desc    Get all foods with pagination, search, and filters
 * @access  Public (no auth required for food list)
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * - search: Search query for food name
 * - category: Filter by category
 * - foodType: Filter by food type (veg, egg, nonveg)
 * 
 * Example:
 * GET /api/foods-master?page=1&limit=20&search=chicken&category=Main%20Dish
 */
router.get('/', getAllFoods);

/**
 * @route   GET /api/foods-master/available
 * @desc    Get available foods that fit within remaining calorie budget
 * @access  Public
 * 
 * Query params:
 * - remaining: Remaining calorie budget (REQUIRED)
 * - search: Search query for food name
 * - category: Filter by category
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * 
 * Example:
 * GET /api/foods-master/available?remaining=500&search=chicken&category=Main%20Dish
 */
router.get('/available', getAvailableFoods);

/**
 * @route   GET /api/foods-master/categories
 * @desc    Get all unique categories
 * @access  Public
 * 
 * Example:
 * GET /api/foods-master/categories
 */
router.get('/categories', getCategories);

/**
 * @route   GET /api/foods-master/types
 * @desc    Get all food types (veg, egg, nonveg)
 * @access  Public
 * 
 * Example:
 * GET /api/foods-master/types
 */
router.get('/types', getFoodTypes);

/**
 * @route   GET /api/foods-master/:id
 * @desc    Get single food by ID
 * @access  Public
 * 
 * Params:
 * - id: string (food ID)
 * 
 * Example:
 * GET /api/foods-master/65abc123def456789
 */
/**
 * @route   POST /api/foods-master
 * @desc    Create new food (Admin)
 * @access  Private/Admin
 */
router.post('/', protect, admin, async (req, res) => {
  try {
    const food = await require('../models/FoodMaster').create(req.body);
    res.status(201).json({ success: true, food });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   PUT /api/foods-master/:id
 * @desc    Update food (Admin)
 * @access  Private/Admin
 */
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const food = await require('../models/FoodMaster').findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!food) return res.status(404).json({ success: false, message: 'Food not found' });
    res.json({ success: true, food });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/foods-master/:id
 * @desc    Delete food (Admin)
 * @access  Private/Admin
 */
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const food = await require('../models/FoodMaster').findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: 'Food not found' });
    res.json({ success: true, message: 'Food deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Export the router
module.exports = router;
