/**
 * Ojasvita - Food Master Model
 * 
 * This model defines the master food database schema.
 * Contains nutritional information for all foods in the system.
 * 
 * This is a READ-ONLY master table - foods are imported from CSV
 * and selected by users when logging meals. Nutritional data
 * is derived from this master table, not manually entered.
 * 
 * Fields:
 * - name: Food name
 * - calories: Energy content per serving
 * - carbs: Carbohydrate content in grams
 * - protein: Protein content in grams
 * - fats: Fat content in grams
 * - category: Food category (Breakfast, Rice Dish, Main Dish, etc.)
 * - foodType: Type (veg, egg, nonveg)
 * 
 * Dependencies:
 * - mongoose: MongoDB ODM for defining schemas and models
 */

const mongoose = require('mongoose');

/**
 * FoodMaster Schema Definition
 * 
 * Defines the structure for food documents in the master database.
 * Each food has nutritional information per standard serving.
 */
const foodMasterSchema = new mongoose.Schema({
  // Food name
  // Unique identifier for each food item
  // Indexed for fast search
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
    unique: true,
    index: true
  },

  // Calories per serving
  // Energy content in kilocalories (kcal)
  calories: {
    type: Number,
    required: [true, 'Calories are required'],
    min: [0, 'Calories cannot be negative'],
    max: [5000, 'Calories cannot exceed 5000']
  },

  // Carbohydrate content in grams
  // Primary energy source
  carbs: {
    type: Number,
    default: 0,
    min: [0, 'Carbs cannot be negative'],
    max: [500, 'Carbs cannot exceed 500g']
  },

  // Protein content in grams
  // Essential for muscle building and repair
  protein: {
    type: Number,
    default: 0,
    min: [0, 'Protein cannot be negative'],
    max: [300, 'Protein cannot exceed 300g']
  },

  // Fat content in grams
  // Essential for hormone production and nutrient absorption
  fats: {
    type: Number,
    default: 0,
    min: [0, 'Fats cannot be negative'],
    max: [300, 'Fats cannot exceed 300g']
  },

  // Food category
  // Helps filter foods by meal type
  // Examples: Breakfast, Rice Dish, Main Dish, Snack/FastFood, Sweet, Beverage
  // Indexed for efficient category-based queries
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },

  // Food type
  // Classification based on ingredients
  // Examples: veg, egg, nonveg
  foodType: {
    type: String,
    required: [true, 'Food type is required'],
    enum: ['veg', 'egg', 'nonveg'],
    default: 'veg'
  },

  // Serving size multiplier
  // Default serving size (can be adjusted by user)
  servingSize: {
    type: Number,
    default: 1,
    min: [0.25, 'Serving size cannot be less than 0.25'],
    max: [10, 'Serving size cannot exceed 10']
  },

  // Serving unit description
  // Describes what "1 serving" means (e.g., "1 piece", "1 cup")
  servingUnit: {
    type: String,
    default: '1 serving'
  }

}, {
  // Mongoose options
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual field for total macros
 * 
 * Calculates total macronutrients (protein + carbs + fats) for convenience.
 */
foodMasterSchema.virtual('totalMacros').get(function() {
  return (this.protein || 0) + (this.carbs || 0) + (this.fats || 0);
});

/**
 * Virtual field for macro percentage breakdown
 * 
 * Calculates percentage of each macro for pie charts and analysis.
 */
foodMasterSchema.virtual('macroPercentages').get(function() {
  const total = this.totalMacros;
  if (total === 0) return { protein: 0, carbs: 0, fats: 0 };
  
  return {
    protein: Math.round((this.protein / total) * 100),
    carbs: Math.round((this.carbs / total) * 100),
    fats: Math.round((this.fats / total) * 100)
  };
});

/**
 * Static method to search foods by name
 * 
 * Performs case-insensitive partial match search.
 * 
 * @param {string} query - Search query
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Array>} - Array of matching foods
 */
foodMasterSchema.statics.searchByName = function(query, limit = 20) {
  return this.find({
    name: { $regex: query, $options: 'i' }
  })
  .limit(limit)
  .sort({ name: 1 });
};

/**
 * Static method to get foods by category
 * 
 * Retrieves all foods in a specific category.
 * 
 * @param {string} category - Category name
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} - Array of foods in category
 */
foodMasterSchema.statics.getByCategory = function(category, limit = 50) {
  return this.find({ category: category })
    .limit(limit)
    .sort({ name: 1 });
};

/**
 * Static method to get available foods by calorie limit
 * 
 * Returns foods that fit within a remaining calorie budget.
 * This is used to filter foods that won't exceed daily targets.
 * 
 * CALORIE FILTERING LOGIC:
 * - Input: remainingCalories (budget remaining for the day)
 * - Process: Filter foods where food.calories <= remainingCalories
 * - Output: List of foods that can be consumed without exceeding limit
 * 
 * @param {number} remainingCalories - Calories remaining in budget
 * @param {string} searchQuery - Optional search query
 * @param {string} category - Optional category filter
 * @param {number} page - Page number for pagination
 * @param {number} limit - Results per page
 * @returns {Promise<Object>} - Paginated list of available foods
 */
foodMasterSchema.statics.getAvailableFoods = async function(
  remainingCalories,
  searchQuery = null,
  category = null,
  page = 1,
  limit = 20
) {
  // Build the base query
  // IMPORTANT: Filter by calories <= remainingCalories
  // This ensures users only see foods that fit their daily budget
  let query = {
    calories: { $lte: remainingCalories }
  };

  // Add search query if provided
  if (searchQuery && searchQuery.trim()) {
    query.name = { $regex: searchQuery.trim(), $options: 'i' };
  }

  // Add category filter if provided
  if (category && category.trim()) {
    query.category = category.trim();
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query with pagination
  const foods = await this.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const total = await this.countDocuments(query);

  return {
    foods,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Pre-save middleware for data validation
 * 
 * Ensures data consistency before saving to database.
 */
foodMasterSchema.pre('save', function(next) {
  // Ensure numeric values are not negative
  if (this.calories < 0) this.calories = 0;
  if (this.protein < 0) this.protein = 0;
  if (this.carbs < 0) this.carbs = 0;
  if (this.fats < 0) this.fats = 0;
  
  // Round values to 1 decimal place
  this.calories = Math.round(this.calories);
  this.protein = Math.round(this.protein * 10) / 10;
  this.carbs = Math.round(this.carbs * 10) / 10;
  this.fats = Math.round(this.fats * 10) / 10;
  
  next();
});

// Create compound indexes for common query patterns
foodMasterSchema.index({ name: 1, category: 1 });
foodMasterSchema.index({ category: 1, calories: 1 });

/**
 * FoodMaster Model
 * 
 * Mongoose model created from the foodMasterSchema.
 * This is the master food database - READ ONLY for users.
 * Foods are selected when logging meals, not manually entered.
 */
const FoodMaster = mongoose.model('FoodMaster', foodMasterSchema);

// Export the FoodMaster model
module.exports = FoodMaster;
