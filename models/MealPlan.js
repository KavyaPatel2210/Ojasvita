/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * MealPlan Model
 * 
 * This model defines the meal plan schema for tracking user's meal plans.
 */

const mongoose = require('mongoose');

const mealPlanItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  calories: {
    type: Number,
    required: true,
    min: [0, 'Calories cannot be negative']
  },
  protein: {
    type: Number,
    default: 0,
    min: 0
  },
  carbs: {
    type: Number,
    default: 0,
    min: 0
  },
  fats: {
    type: Number,
    default: 0,
    min: 0
  },
  quantity: {
    type: Number,
    default: 100,
    min: [1, 'Quantity must be at least 1 gram']
  },
  foodMasterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodMaster',
    default: null
  }
}, { _id: true });

const mealPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  mealTime: {
    type: String,
    required: [true, 'Meal time is required'],
    enum: ['breakfast', 'lunch', 'dinner'],
    lowercase: true
  },
  scheduledTime: {
    type: String,
    required: [true, 'Scheduled time is required']
  },
  items: {
    type: [mealPlanItemSchema],
    default: [],
    validate: {
      validator: function (v) {
        return v.length > 0;
      },
      message: 'At least one item is required in the meal plan'
    }
  },
  plannedCalories: {
    type: Number,
    required: true,
    min: [0, 'Planned calories cannot be negative']
  },
  plannedProtein: {
    type: Number,
    default: 0,
    min: 0
  },
  plannedCarbs: {
    type: Number,
    default: 0,
    min: 0
  },
  plannedFats: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['planned', 'completed', 'incomplete', 'skipped', 'partially_completed'],
    default: 'planned',
    lowercase: true
  },
  actualCalories: {
    type: Number,
    default: 0,
    min: 0
  },
  actualProtein: {
    type: Number,
    default: 0,
    min: 0
  },
  actualCarbs: {
    type: Number,
    default: 0,
    min: 0
  },
  actualFats: {
    type: Number,
    default: 0,
    min: 0
  },
  completedMealIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealEntry'
  }],
  completedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot exceed 300 characters'],
    default: ''
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

mealPlanSchema.virtual('completionPercentage').get(function () {
  if (this.plannedCalories === 0) return 0;
  return Math.round((this.actualCalories / this.plannedCalories) * 100);
});

mealPlanSchema.virtual('calorieDifference').get(function () {
  return this.actualCalories - this.plannedCalories;
});

mealPlanSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    const totals = this.items.reduce((acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fats: acc.fats + (item.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    this.plannedCalories = totals.calories;
    this.plannedProtein = totals.protein;
    this.plannedCarbs = totals.carbs;
    this.plannedFats = totals.fats;
  }

  this.plannedCalories = Math.round(this.plannedCalories);
  this.plannedProtein = Math.round(this.plannedProtein * 10) / 10;
  this.plannedCarbs = Math.round(this.plannedCarbs * 10) / 10;
  this.plannedFats = Math.round(this.plannedFats * 10) / 10;

  next();
});

mealPlanSchema.index({ user: 1, date: 1, mealTime: 1 }, { unique: true });
mealPlanSchema.index({ user: 1, status: 1, date: 1 });

mealPlanSchema.statics.getMealPlansByDate = function (userId, date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return this.find({
    user: userId,
    date: { $gte: start, $lte: end }
  }).sort({ scheduledTime: 1 });
};

mealPlanSchema.statics.getPendingMealPlans = function (userId) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.find({
    user: userId,
    status: 'planned',
    $or: [
      { date: { $lt: today } },
      { date: today, scheduledTime: { $lte: currentTime } }
    ]
  }).sort({ date: -1, scheduledTime: 1 });
};

mealPlanSchema.statics.getMealPlansByRange = function (userId, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return this.find({
    user: userId,
    date: { $gte: start, $lte: end }
  }).sort({ date: -1, scheduledTime: 1 });
};

mealPlanSchema.statics.upsertMealPlan = async function (userId, date, mealTime, planData) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  return this.findOneAndUpdate(
    { user: userId, date: start, mealTime },
    { ...planData, user: userId, date: start, mealTime },
    { upsert: true, new: true, runValidators: true }
  );
};

mealPlanSchema.statics.getDailyPlannedTotals = async function (userId, date) {
  const plans = await this.getMealPlansByDate(userId, date);

  return plans.reduce((acc, plan) => ({
    plannedCalories: acc.plannedCalories + plan.plannedCalories,
    plannedProtein: acc.plannedProtein + plan.plannedProtein,
    plannedCarbs: acc.plannedCarbs + plan.plannedCarbs,
    plannedFats: acc.plannedFats + plan.plannedFats,
    completedMeals: acc.completedMeals + (plan.status === 'completed' ? 1 : 0),
    incompleteMeals: acc.incompleteMeals + (plan.status === 'incomplete' ? 1 : 0),
    totalMeals: acc.totalMeals + 1
  }), {
    plannedCalories: 0,
    plannedProtein: 0,
    plannedCarbs: 0,
    plannedFats: 0,
    completedMeals: 0,
    incompleteMeals: 0,
    totalMeals: 0
  });
};

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

module.exports = MealPlan;
