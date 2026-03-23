/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * DailySummary Model
 * 
 * This model stores daily aggregated data for each user.
 * It provides quick access to daily statistics without recalculating from meal entries.
 * 
 * Stored Data:
 * - Date reference for the summary
 * - Total calories consumed
 * - Macronutrient totals (protein, carbs, fats)
 * - Meal counts by category (normal, cheat, event)
 * - Target vs actual comparison
 * - Calorie redistribution information
 * 
 * Purpose:
 * - Optimize dashboard queries (avoid aggregating meal entries on each request)
 * - Track daily progress against targets
 * - Store redistribution data for smart diet logic
 * 
 * Dependencies:
 * - mongoose: MongoDB ODM for defining schemas and models
 */

const mongoose = require('mongoose');

/**
 * DailySummary Schema Definition
 * 
 * Defines the structure for daily aggregated data.
 * One summary document per user per day.
 */
const dailySummarySchema = new mongoose.Schema({
  // Reference to the User model
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },

  // Date for this summary
  // One entry per day per user
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },

  // Total calories consumed on this day
  totalCalories: {
    type: Number,
    default: 0,
    min: 0
  },

  // Total protein consumed (in grams)
  totalProtein: {
    type: Number,
    default: 0,
    min: 0
  },

  // Total carbohydrates consumed (in grams)
  totalCarbs: {
    type: Number,
    default: 0,
    min: 0
  },

  // Total fats consumed (in grams)
  totalFats: {
    type: Number,
    default: 0,
    min: 0
  },

  // User's calorie target for this day
  targetCalories: {
    type: Number,
    required: [true, 'Target calories is required']
  },

  // User's base calorie target (before any redistribution)
  baseTargetCalories: {
    type: Number,
    default: 0
  },

  // Calorie difference (actual - target)
  // Positive means over target, negative means under target
  calorieDifference: {
    type: Number,
    default: 0
  },

  // Percentage of target achieved
  targetPercentage: {
    type: Number,
    default: 0,
    min: 0
  },

  // Meal count by category
  mealCounts: {
    normal: { type: Number, default: 0 },
    cheat: { type: Number, default: 0 },
    event: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },

  // Whether user met their calorie target
  // Considered met if within ±50 calories of target
  targetMet: {
    type: Boolean,
    default: false
  },

  // Calorie redistribution information
  // Used when daily calories exceed target
  redistribution: {
    // Whether calories were redistributed
    redistributed: { type: Boolean, default: false },
    // Amount redistributed to future days
    amount: { type: Number, default: 0 },
    // Days over which amount was redistributed
    days: { type: Number, default: 0 },
    // Daily redistribution amount
    dailyAmount: { type: Number, default: 0 },
    // Start date of redistribution
    startDate: { type: Date, default: null },
    // End date of redistribution
    endDate: { type: Date, default: null }
  },

  // Water intake tracking (in glasses, 250ml each)
  waterIntake: {
    type: Number,
    default: 0,
    min: 0
  },

  // User's mood/feeling for the day
  // Optional field for tracking emotional eating patterns
  mood: {
    type: String,
    enum: ['great', 'good', 'okay', 'bad', 'terrible', ''],
    default: ''
  },

  // Notes for the day
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  }
}, {
  // Mongoose options
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual field for over/under target status
 * 
 * Returns 'over', 'under', or 'on_track' based on calorie difference.
 */
dailySummarySchema.virtual('status').get(function() {
  if (this.targetMet) return 'on_track';
  return this.calorieDifference > 0 ? 'over' : 'under';
});

/**
 * Virtual field for remaining calories
 * 
 * Calculates calories remaining for the day.
 */
dailySummarySchema.virtual('remainingCalories').get(function() {
  return this.targetCalories - this.totalCalories;
});

/**
 * Pre-save middleware for calculations
 * 
 * Automatically calculates derived fields before saving.
 */
dailySummarySchema.pre('save', function(next) {
  // Calculate calorie difference
  this.calorieDifference = this.totalCalories - this.targetCalories;
  
  // Calculate target percentage
  if (this.targetCalories > 0) {
    this.targetPercentage = Math.round((this.totalCalories / this.targetCalories) * 100);
  } else {
    this.targetPercentage = 0;
  }
  
  // Determine if target is met (±50 calories tolerance)
  this.targetMet = Math.abs(this.calorieDifference) <= 50;
  
  // Calculate total meal count
  this.mealCounts.total = 
    (this.mealCounts.normal || 0) + 
    (this.mealCounts.cheat || 0) + 
    (this.mealCounts.event || 0);
  
  next();
});

/**
 * Compound index for efficient queries
 * 
 * Ensures one summary per user per day.
 */
dailySummarySchema.index({ user: 1, date: -1 }, { unique: true });

/**
 * Static method to get summaries by date range
 * 
 * @param {ObjectId} userId - User's ID
 * @param {Date} startDate - Start of range
 * @param {Date} endDate - End of range
 * @returns {Promise<Array>} - Array of daily summaries
 */
dailySummarySchema.statics.getSummariesByRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    date: {
      $gte: new Date(startDate).setHours(0, 0, 0, 0),
      $lte: new Date(endDate).setHours(23, 59, 59, 999)
    }
  }).sort({ date: -1 });
};

/**
 * Static method to calculate weekly average
 * 
 * @param {ObjectId} userId - User's ID
 * @param {Date} startDate - Start of week
 * @returns {Promise<Object>} - Weekly averages
 */
dailySummarySchema.statics.getWeeklyAverage = async function(userId, startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  
  const result = await this.aggregate([
    {
      $match: {
        user: userId,
        date: {
          $gte: new Date(startDate).setHours(0, 0, 0, 0),
          $lte: new Date(endDate).setHours(23, 59, 59, 999)
        }
      }
    },
    {
      $group: {
        _id: null,
        avgCalories: { $avg: '$totalCalories' },
        avgProtein: { $avg: '$totalProtein' },
        avgCarbs: { $avg: '$totalCarbs' },
        avgFats: { $avg: '$totalFats' },
        daysLogged: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || {
    avgCalories: 0,
    avgProtein: 0,
    avgCarbs: 0,
    avgFats: 0,
    daysLogged: 0
  };
};

/**
 * DailySummary Model
 * 
 * Mongoose model for daily aggregated data.
 */
const DailySummary = mongoose.model('DailySummary', dailySummarySchema);

// Export the DailySummary model
module.exports = DailySummary;
