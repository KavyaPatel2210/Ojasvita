/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * MealEntry Model
 * 
 * This model defines the meal entry schema for tracking user's meals.
 * Each meal entry contains nutritional information and meal type.
 * 
 * Stored Data:
 * - Meal information (title, category, date, time)
 * - Nutritional values (calories, protein, carbs, fats)
 * - User reference for ownership
 * - Timestamps for tracking
 * 
 * Meal Categories:
 * - normal: Regular meals following diet plan
 * - cheat: Indulgent meals outside diet plan
 * - event: Special occasions (parties, holidays, etc.)
 * 
 * Dependencies:
 * - mongoose: MongoDB ODM for defining schemas and models
 */

const mongoose = require('mongoose');

/**
 * MealEntry Schema Definition
 * 
 * Defines the structure and validation rules for meal documents.
 * Each field has specific validation to ensure data integrity.
 */
const mealEntrySchema = new mongoose.Schema({
  // Reference to the User model
  // Each meal entry belongs to a specific user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true // Index for efficient user meal lookups
  },

  // Meal title/name
  // Descriptive name for the meal (e.g., "Chicken Salad", "Morning Oatmeal")
  title: {
    type: String,
    required: [true, 'Meal title is required'],
    trim: true,
    maxlength: [100, 'Meal title cannot exceed 100 characters']
  },

  // Meal category/type
  // Helps track different types of meals for analytics
  // - normal: Regular diet-compliant meals
  // - cheat: Indulgent meals (tracked but treated differently in calculations)
  // - event: Special occasions (birthdays, holidays, etc.)
  category: {
    type: String,
    required: [true, 'Meal category is required'],
    enum: ['normal', 'cheat', 'event'],
    default: 'normal',
    lowercase: true
  },

  // Meal date
  // Date when the meal was consumed
  // Indexed for efficient date-based queries
  date: {
    type: Date,
    required: [true, 'Meal date is required'],
    default: Date.now,
    index: true // Index for efficient date-based meal lookups
  },

  // Meal time
  // Time of day when meal was consumed
  // Helps categorize meals (breakfast, lunch, dinner, snack)
  mealTime: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'],
    lowercase: true,
    default: 'other'
  },

  // Calories in the meal
  // Total energy content in kilocalories (kcal)
  // Required for tracking daily calorie intake
  calories: {
    type: Number,
    required: [true, 'Calories are required'],
    min: [0, 'Calories cannot be negative'],
    max: [10000, 'Calories cannot exceed 10000'] // Reasonable upper limit
  },

  // Protein content in grams
  // Essential for muscle building and repair
  protein: {
    type: Number,
    default: 0,
    min: [0, 'Protein cannot be negative'],
    max: [500, 'Protein cannot exceed 500g']
  },

  // Carbohydrate content in grams
  // Primary energy source
  carbs: {
    type: Number,
    default: 0,
    min: [0, 'Carbs cannot be negative'],
    max: [1000, 'Carbs cannot exceed 1000g']
  },

  // Fat content in grams
  // Essential for hormone production and nutrient absorption
  fats: {
    type: Number,
    default: 0,
    min: [0, 'Fats cannot be negative'],
    max: [500, 'Fats cannot exceed 500g']
  },

  // Quantity/Weight in grams
  // Amount of meal consumed
  quantity: {
    type: Number,
    default: 100,
    min: [0, 'Quantity cannot be negative']
  },

  // Meal description/notes
  // Additional information about the meal
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },

  // Whether the meal was logged after the fact
  // Useful for tracking accuracy analysis
  isRetroactive: {
    type: Boolean,
    default: false
  },

  // User's notes for this specific meal
  // Personal notes, feelings about the meal, etc.
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot exceed 300 characters'],
    default: ''
  }
}, {
  // Mongoose options
  timestamps: true, // Automatically add createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual field for total macros
 * 
 * Calculates total macronutrients (protein + carbs + fats) for convenience.
 */
mealEntrySchema.virtual('totalMacros').get(function () {
  return (this.protein || 0) + (this.carbs || 0) + (this.fats || 0);
});

/**
 * Virtual field for macro percentage breakdown
 * 
 * Calculates percentage of each macro for pie charts and analysis.
 */
mealEntrySchema.virtual('macroPercentages').get(function () {
  const total = this.totalMacros;
  if (total === 0) return { protein: 0, carbs: 0, fats: 0 };

  return {
    protein: Math.round((this.protein / total) * 100),
    carbs: Math.round((this.carbs / total) * 100),
    fats: Math.round((this.fats / total) * 100)
  };
});

/**
 * Virtual field for calorie density
 * 
 * Calories per gram of food - useful for understanding meal heaviness.
 */
mealEntrySchema.virtual('calorieDensity').get(function () {
  const totalGrams = this.totalMacros;
  if (totalGrams === 0) return 0;
  return Math.round((this.calories / totalGrams) * 10) / 10;
});

/**
 * Pre-save middleware for data validation
 * 
 * Ensures data consistency before saving to database.
 */
mealEntrySchema.pre('save', function (next) {
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

/**
 * Indexes for efficient querying
 * 
 * Composite indexes for common query patterns:
 * - user + date: Get all meals for a user on a specific date
 * - user + category: Get meals by type for analysis
 * - user + createdAt: Get recent meals
 */
mealEntrySchema.index({ user: 1, date: -1 });
mealEntrySchema.index({ user: 1, category: 1 });
mealEntrySchema.index({ user: 1, createdAt: -1 });

/**
 * Static method to get meals by date range
 * 
 * Efficiently fetches meals within a date range for a user.
 * 
 * @param {ObjectId} userId - User's ID
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<Array>} - Array of meal entries
 */
mealEntrySchema.statics.getMealsByDateRange = function (userId, startDate, endDate) {
  return this.find({
    user: userId,
    date: {
      $gte: new Date(startDate).setHours(0, 0, 0, 0),
      $lte: new Date(endDate).setHours(23, 59, 59, 999)
    }
  }).sort({ date: -1, createdAt: -1 });
};

/**
 * Static method to get daily totals
 * 
 * Aggregates nutritional values for a specific date.
 * 
 * @param {ObjectId} userId - User's ID
 * @param {Date} date - Date to calculate totals for
 * @returns {Promise<Object>} - Aggregated totals
 */
mealEntrySchema.statics.getDailyTotals = async function (userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await this.aggregate([
    {
      $match: {
        user: userId,
        date: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: null,
        totalCalories: { $sum: '$calories' },
        totalProtein: { $sum: '$protein' },
        totalCarbs: { $sum: '$carbs' },
        totalFats: { $sum: '$fats' },
        mealCount: { $sum: 1 }
      }
    }
  ]);

  return result[0] || {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    mealCount: 0
  };
};

/**
 * MealEntry Model
 * 
 * Mongoose model created from the mealEntrySchema.
 * Used for CRUD operations on meal documents.
 */
const MealEntry = mongoose.model('MealEntry', mealEntrySchema);

// Export the MealEntry model
module.exports = MealEntry;
