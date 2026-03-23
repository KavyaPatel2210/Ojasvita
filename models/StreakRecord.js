/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * StreakRecord Model
 * 
 * This model tracks user streaks for continuous meal logging.
 * Streaks motivate users to maintain consistent tracking habits.
 * 
 * Stored Data:
 * - Current streak count
 * - Longest streak ever achieved
 * - Streak start and end dates
 * - Streak status (active, broken)
 * - Last log date
 * 
 * Streak Rules:
 * - A streak is maintained by logging at least one meal per day
 * - Missing a day breaks the streak
 * - Each day with a meal adds to the streak count
 * 
 * Dependencies:
 * - mongoose: MongoDB ODM for defining schemas and models
 */

const mongoose = require('mongoose');

/**
 * StreakRecord Schema Definition
 * 
 * Tracks the user's meal logging streaks for motivation.
 * One record per user.
 */
const streakRecordSchema = new mongoose.Schema({
  // Reference to the User model
  // One streak record per user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true,
    index: true
  },

  // Current active streak count
  // Number of consecutive days with at least one meal logged
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },

  // Longest streak ever achieved
  // Preserved even after streak is broken
  longestStreak: {
    type: Number,
    default: 0,
    min: 0
  },

  // Date when current streak started
  // Null if no active streak
  streakStartDate: {
    type: Date,
    default: null
  },

  // Date of last meal log
  // Used to determine if streak should continue or break
  lastLogDate: {
    type: Date,
    default: null
  },

  // Total days logged in history
  totalDaysLogged: {
    type: Number,
    default: 0
  },

  // Current streak status
  // 'active' - user is currently maintaining streak
  // 'broken' - user missed a day, streak was reset
  streakStatus: {
    type: String,
    enum: ['active', 'broken', 'none'],
    default: 'none'
  },

  // Streak milestones achieved
  // Tracks special achievements (7 days, 30 days, 100 days, etc.)
  milestones: {
    threeDays: { type: Boolean, default: false },
    sevenDays: { type: Boolean, default: false },
    fourteenDays: { type: Boolean, default: false },
    thirtyDays: { type: Boolean, default: false },
    sixtyDays: { type: Boolean, default: false },
    hundredDays: { type: Boolean, default: false }
  },

  // History of broken streaks
  // Stores previous streak information for analytics
  streakHistory: [{
    startDate: Date,
    endDate: Date,
    length: Number,
    reason: String
  }],

  // Weekly streak data for detailed tracking
  weeklyLogs: {
    type: Map,
    of: Boolean,
    default: {}
  }
}, {
  // Mongoose options
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual field for streak message
 * 
 * Returns motivational message based on current streak.
 */
streakRecordSchema.virtual('streakMessage').get(function() {
  if (this.currentStreak === 0) {
    return "Start your streak today! Log your first meal.";
  }
  if (this.currentStreak < 3) {
    return "Great start! Keep it going!";
  }
  if (this.currentStreak < 7) {
    return `${this.currentStreak} days strong! You're building a habit!`;
  }
  if (this.currentStreak < 14) {
    return `Amazing! ${this.currentStreak} days of consistency!`;
  }
  if (this.currentStreak < 30) {
    return `Incredible dedication! ${this.currentStreak} days and counting!`;
  }
  if (this.currentStreak < 60) {
    return `You're a streak master! ${this.currentStreak} days!`;
  }
  return `Legendary! ${this.currentStreak} days of perfect tracking!`;
});

/**
 * Virtual field for days until next milestone
 * 
 * Returns number of days until next achievement milestone.
 */
streakRecordSchema.virtual('daysToNextMilestone').get(function() {
  const milestones = [3, 7, 14, 30, 60, 100];
  for (const milestone of milestones) {
    if (this.currentStreak < milestone) {
      return milestone - this.currentStreak;
    }
  }
  return 0;
});

/**
 * Method to update streak on new meal log
 * 
 * Called when user logs a new meal.
 * Updates streak count, dates, and checks for milestones.
 * 
 * @param {Date} logDate - Date of the new meal log
 * @returns {Object} - Updated streak information
 */
streakRecordSchema.methods.updateStreak = async function(logDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const logDay = new Date(logDate);
  logDay.setHours(0, 0, 0, 0);
  
  // If this is the first log ever
  if (!this.lastLogDate) {
    this.currentStreak = 1;
    this.longestStreak = Math.max(1, this.longestStreak);
    this.streakStartDate = logDay;
    this.lastLogDate = logDay;
    this.streakStatus = 'active';
    this.totalDaysLogged = 1;
    this.checkMilestones();
    await this.save();
    return this;
  }
  
  const lastLogDay = new Date(this.lastLogDate);
  lastLogDay.setHours(0, 0, 0, 0);
  
  // Calculate days since last log
  const daysDiff = Math.floor((logDay - lastLogDay) / (1000 * 60 * 60 * 24));
  
  // If logging for today (already logged today)
  if (daysDiff === 0) {
    // Just update the timestamp, don't increment streak
    this.lastLogDate = logDay;
    await this.save();
    return this;
  }
  
  // If logging for yesterday (continuing streak)
  if (daysDiff === 1) {
    this.currentStreak += 1;
    this.lastLogDate = logDay;
    
    // Update longest streak if needed
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
    
    this.streakStatus = 'active';
    this.checkMilestones();
  }
  // If logging for a day before yesterday (streak broken)
  else if (daysDiff > 1) {
    // Save old streak to history before resetting
    if (this.currentStreak > 0) {
      this.streakHistory.push({
        startDate: this.streakStartDate,
        endDate: this.lastLogDate,
        length: this.currentStreak,
        reason: 'missed_days'
      });
    }
    
    // Reset streak
    this.currentStreak = 1;
    this.streakStartDate = logDay;
    this.lastLogDate = logDay;
    this.streakStatus = 'active';
  }
  
  this.totalDaysLogged += 1;
  await this.save();
  return this;
};

/**
 * Method to check and unlock milestones
 * 
 * Automatically checks if new milestones should be unlocked.
 */
streakRecordSchema.methods.checkMilestones = function() {
  if (this.currentStreak >= 3) this.milestones.threeDays = true;
  if (this.currentStreak >= 7) this.milestones.sevenDays = true;
  if (this.currentStreak >= 14) this.milestones.fourteenDays = true;
  if (this.currentStreak >= 30) this.milestones.thirtyDays = true;
  if (this.currentStreak >= 60) this.milestones.sixtyDays = true;
  if (this.currentStreak >= 100) this.milestones.hundredDays = true;
};

/**
 * Method to check and potentially break streak
 * 
 * Called during daily tasks to check if streak should be broken.
 * 
 * @returns {Boolean} - True if streak was broken
 */
streakRecordSchema.methods.checkAndBreakStreak = async function() {
  if (!this.lastLogDate || this.streakStatus !== 'active') {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastLogDay = new Date(this.lastLogDate);
  lastLogDay.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today - lastLogDay) / (1000 * 60 * 60 * 24));
  
  // If more than 1 day has passed, break the streak
  if (daysDiff > 1) {
    // Save to history
    this.streakHistory.push({
      startDate: this.streakStartDate,
      endDate: this.lastLogDate,
      length: this.currentStreak,
      reason: 'missed_days'
    });
    
    this.streakStatus = 'broken';
    this.streakStartDate = null;
    // Keep currentStreak as reference but status shows broken
    await this.save();
    return true;
  }
  
  return false;
};

/**
 * Method to break streak due to calorie limit exceeded
 * 
 * Called when user exceeds their daily calorie target.
 * Breaks the streak and records the reason.
 * 
 * @param {Date} date - Date when calorie limit was exceeded
 * @returns {Boolean} - True if streak was broken
 */
streakRecordSchema.methods.breakStreakDueToCalorieLimit = async function(date) {
  // Only break if there's an active streak
  if (this.streakStatus !== 'active' || this.currentStreak === 0) {
    return false;
  }
  
  const breakDate = new Date(date);
  breakDate.setHours(0, 0, 0, 0);
  
  // Save to history
  this.streakHistory.push({
    startDate: this.streakStartDate,
    endDate: breakDate,
    length: this.currentStreak,
    reason: 'calorie_limit_exceeded'
  });
  
  // Reset streak
  this.currentStreak = 0;
  this.streakStatus = 'broken';
  this.streakStartDate = null;
  this.lastLogDate = null;
  
  await this.save();
  return true;
};


/**
 * Static method to get or create streak record
 * 
 * Ensures user has a streak record, creates if not exists.
 * 
 * @param {ObjectId} userId - User's ID
 * @returns {Promise<Object>} - Streak record
 */
streakRecordSchema.statics.getOrCreate = async function(userId) {
  let streak = await this.findOne({ user: userId });
  
  if (!streak) {
    streak = await this.create({ user: userId });
  }
  
  return streak;
};

/**
 * StreakRecord Model
 * 
 * Mongoose model for streak tracking.
 */
const StreakRecord = mongoose.model('StreakRecord', streakRecordSchema);

// Export the StreakRecord model
module.exports = StreakRecord;
