/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * WaterIntake Model
 * 
 * This model tracks user's daily water intake.
 * Helps users stay hydrated and meet their hydration goals.
 * 
 * Stored Data:
 * - Daily water consumption in milliliters
 * - Individual water logs with timestamps
 * - Daily goal progress
 * 
 * Dependencies:
 * - mongoose: MongoDB ODM for defining schemas and models
 */

const mongoose = require('mongoose');

/**
 * WaterLog Schema
 * 
 * Individual water consumption entry.
 */
const waterLogSchema = new mongoose.Schema({
  // Amount of water in milliliters
  amount: {
    type: Number,
    required: [true, 'Water amount is required'],
    min: [1, 'Water amount must be at least 1 ml'],
    max: [5000, 'Water amount cannot exceed 5000 ml']
  },
  
  // Time when water was consumed
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Optional note for the log
  note: {
    type: String,
    default: '',
    maxlength: [200, 'Note cannot exceed 200 characters']
  }
}, {
  _id: true
});

/**
 * WaterIntake Schema Definition
 * 
 * Tracks daily water intake for each user.
 * One record per user per day.
 */
const waterIntakeSchema = new mongoose.Schema({
  // Reference to the User model
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },

  // Date for the water intake record
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },

  // Individual water logs for the day
  logs: [waterLogSchema],

  // Total water consumed in milliliters for the day
  totalIntake: {
    type: Number,
    default: 0,
    min: 0
  },

  // Daily water goal in milliliters
  // Default: 2000ml (8 glasses)
  dailyGoal: {
    type: Number,
    default: 2000,
    min: [500, 'Daily goal must be at least 500 ml'],
    max: [10000, 'Daily goal cannot exceed 10000 ml']
  },

  // Number of times the goal has been met
  goalMetCount: {
    type: Number,
    default: 0
  },

  // Whether the daily goal was met
  goalMet: {
    type: Boolean,
    default: false
  },

  // Last log timestamp
  lastLogTime: {
    type: Date,
    default: null
  }
}, {
  // Mongoose options
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Compound index for efficient queries
 * Ensures one record per user per day
 */
waterIntakeSchema.index({ user: 1, date: 1 }, { unique: true });

/**
 * Virtual field for progress percentage
 * 
 * Returns percentage of daily goal achieved.
 */
waterIntakeSchema.virtual('progressPercentage').get(function() {
  if (this.dailyGoal <= 0) return 0;
  return Math.min(100, Math.round((this.totalIntake / this.dailyGoal) * 100));
});

/**
 * Virtual field for remaining water
 * 
 * Returns milliliters remaining to reach goal.
 */
waterIntakeSchema.virtual('remaining').get(function() {
  return Math.max(0, this.dailyGoal - this.totalIntake);
});

/**
 * Virtual field for glasses count
 * 
 * Returns approximate number of 250ml glasses consumed.
 */
waterIntakeSchema.virtual('glassesCount').get(function() {
  return Math.floor(this.totalIntake / 250);
});

/**
 * Pre-save middleware to update goalMet status
 */
waterIntakeSchema.pre('save', function(next) {
  this.goalMet = this.totalIntake >= this.dailyGoal;
  
  // Update lastLogTime from the most recent log
  if (this.logs && this.logs.length > 0) {
    const sortedLogs = [...this.logs].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    this.lastLogTime = sortedLogs[0].timestamp;
  }
  
  next();
});

/**
 * Instance method to add a water log
 * 
 * @param {Number} amount - Amount of water in ml
 * @param {String} note - Optional note
 * @returns {Object} - Updated water intake record
 */
waterIntakeSchema.methods.addLog = async function(amount, note = '') {
  this.logs.push({
    amount: amount,
    timestamp: new Date(),
    note: note
  });
  
  // Update total intake
  this.totalIntake += amount;
  
  // Check if goal just became met
  const wasGoalMet = this.goalMet;
  await this.save();
  
  return {
    waterIntake: this,
    goalJustMet: !wasGoalMet && this.goalMet
  };
};

/**
 * Static method to get or create today's water intake
 * 
 * @param {ObjectId} userId - User's ID
 * @returns {Promise<Object>} - Water intake record
 */
waterIntakeSchema.statics.getTodayIntake = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let waterIntake = await this.findOne({
    user: userId,
    date: today
  });
  
  if (!waterIntake) {
    // Get user's water goal from preferences if available
    // For now, use default 2000ml
    waterIntake = await this.create({
      user: userId,
      date: today,
      dailyGoal: 2000
    });
  }
  
  return waterIntake;
};

/**
 * Static method to get water intake for a date range
 * 
 * @param {ObjectId} userId - User's ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Array of water intake records
 */
waterIntakeSchema.statics.getIntakeByRange = async function(userId, startDate, endDate) {
  return await this.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

/**
 * Static method to get weekly water intake stats
 * 
 * @param {ObjectId} userId - User's ID
 * @returns {Promise<Object>} - Weekly statistics
 */
waterIntakeSchema.statics.getWeeklyStats = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const records = await this.find({
    user: userId,
    date: { $gte: weekAgo, $lte: today }
  }).sort({ date: 1 });
  
  const totalIntake = records.reduce((sum, r) => sum + r.totalIntake, 0);
  const daysLogged = records.length;
  const goalsMet = records.filter(r => r.goalMet).length;
  
  return {
    records: records,
    totalIntake: totalIntake,
    averageIntake: daysLogged > 0 ? Math.round(totalIntake / daysLogged) : 0,
    daysLogged: daysLogged,
    goalsMet: goalsMet,
    goalAchievementRate: daysLogged > 0 ? Math.round((goalsMet / daysLogged) * 100) : 0
  };
};

/**
 * WaterIntake Model
 * 
 * Mongoose model for water intake tracking.
 */
const WaterIntake = mongoose.model('WaterIntake', waterIntakeSchema);

// Export the WaterIntake model
module.exports = WaterIntake;
