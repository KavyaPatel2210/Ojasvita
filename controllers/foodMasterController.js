/* Getting categories list**
 * Ojasvita - Food Master Controller
 * 
 * This controller handles all food master database operations.
 * 
 * IMPORTANT: This is a READ-ONLY master table.
 * Foods are imported from CSV and selected by users when logging meals.
 * Users CANNOT add, edit, or delete foods from this database.
 * 
 * Endpoints:
 * - GET /api/foods-master - Get all foods with pagination, search, filter
 * - GET /api/foods-master/available - Get foods that fit remaining calories
 * - GET /api/foods-master/categories - Get all unique categories
 * - GET /api/foods-master/:id - Get single food by ID
 * 
 * Dependencies:
 * - FoodMaster model: For food database operations
 */

const FoodMaster = require('../models/FoodMaster');

/**
 * @desc    Get all foods with pagination, search, and filters
 * @route   GET /api/foods-master
 * @access  Public (no auth required for food list)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * - search: Search query for food name
 * - category: Filter by category
 * - foodType: Filter by food type (veg, egg, nonveg)
 * 
 * Example:
 * GET /api/foods-master?page=1&limit=20&search=chicken&category=Main%20Dish
 */
exports.getAllFoods = async (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
    const search = req.query.search || null;
    const category = req.query.category || null;
    const foodType = req.query.foodType || null;

    // Build query
    let query = {};

    // Add search filter (case-insensitive partial match)
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    // Add category filter
    if (category && category.trim()) {
      query.category = category.trim();
    }

    // Add food type filter
    if (foodType) {
      query.foodType = foodType;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const foods = await FoodMaster.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await FoodMaster.countDocuments(query);

    res.json({
      success: true,
      foods: foods,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all foods error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching foods'
    });
  }
};

/**
 * @desc    Get available foods that fit within remaining calorie budget
 * @route   GET /api/foods-master/available
 * @access  Public
 * 
 * CALORIE FILTERING LOGIC:
 * ========================
 * This endpoint filters foods based on the user's remaining calorie budget.
 * 
 * Formula:
 * remainingCalories = dailyTarget - caloriesAlreadyConsumed - redistributedCarryOver
 * 
 * The endpoint then filters:
 * foods where food.calories <= remainingCalories
 * 
 * This ensures users only see foods that won't exceed their daily target.
 * 
 * Query Parameters:
 * - remaining: Remaining calorie budget (REQUIRED)
 * - search: Search query for food name
 * - category: Filter by category
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * 
 * Example:
 * GET /api/foods-master/available?remaining=500&search=chicken&category=Main%20Dish
 */
exports.getAvailableFoods = async (req, res) => {
  try {
    // Get remaining calories from query (REQUIRED)
    const remaining = parseInt(req.query.remaining);

    // Validate remaining calories
    if (!remaining || remaining < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid remaining calorie value (remaining=XXX)'
      });
    }

    // Parse optional query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search || null;
    const category = req.query.category || null;

    // Use the model's static method for calorie filtering
    // This method handles the logic: foods where calories <= remaining
    const result = await FoodMaster.getAvailableFoods(
      remaining,
      search,
      category,
      page,
      limit
    );

    res.json({
      success: true,
      foods: result.foods,
      pagination: result.pagination,
      filter: {
        remainingCalories: remaining,
        search: search,
        category: category
      }
    });

  } catch (error) {
    console.error('Get available foods error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching available foods'
    });
  }
};

/**
 * @desc    Get all unique categories
 * @route   GET /api/foods-master/categories
 * @access  Public
 * 
 * Returns a list of all unique food categories in the database.
 * Useful for populating category filter dropdowns.
 * 
 * Example:
 * GET /api/foods-master/categories
 */
exports.getCategories = async (req, res) => {
  try {
    // Get distinct categories
    const categories = await FoodMaster.distinct('category');

    // Sort alphabetically
    categories.sort();

    res.json({
      success: true,
      categories: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories'
    });
  }
};

/**
 * @desc    Get single food by ID
 * @route   GET /api/foods-master/:id
 * @access  Public
 * 
 * Returns a single food item by its MongoDB ID.
 * 
 * Example:
 * GET /api/foods-master/65abc123def456789
 */
exports.getFoodById = async (req, res) => {
  try {
    const food = await FoodMaster.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found'
      });
    }

    res.json({
      success: true,
      food: food
    });

  } catch (error) {
    console.error('Get food by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Food not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching food'
    });
  }
};

/**
 * @desc    Get food types
 * @route   GET /api/foods-master/types
 * @access  Public
 * 
 * Returns all food types (veg, egg, nonveg).
 * Useful for populating food type filter dropdowns.
 * 
 * Example:
 * GET /api/foods-master/types
 */
exports.getFoodTypes = async (req, res) => {
  try {
    const foodTypes = await FoodMaster.distinct('foodType');
    
    // Sort alphabetically
    foodTypes.sort();

    res.json({
      success: true,
      foodTypes: foodTypes
    });

  } catch (error) {
    console.error('Get food types error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching food types'
    });
  }
};
