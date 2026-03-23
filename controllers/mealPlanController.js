/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * MealPlan Controller
 * 
 * This controller handles all meal plan related operations:
 * - Create meal plan
 * - Get meal plans by date
 * - Update meal plan status
 * - Delete meal plan
 * - Get pending meal plans (for reminders)
 * 
 * Dependencies:
 * - MealPlan model: For meal plan CRUD operations
 * - MealEntry model: For linking actual meals
 */

const MealPlan = require('../models/MealPlan');
const MealEntry = require('../models/MealEntry');
const DailySummary = require('../models/DailySummary');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getDayBounds, getUTCDayBounds } = require('../utils/helpers');

/**
 * Helper function to update daily summary after meal changes
 * @param {ObjectId} userId - User's ID
 * @param {Date} date - Date to update summary for
 */
async function updateDailySummary(userId, date) {
  const { start, end } = getUTCDayBounds(date);

  // Get all meals for the day
  const meals = await MealEntry.find({
    user: userId,
    date: { $gte: start, $lte: end }
  });

  // Calculate totals
  const totals = meals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fats: acc.fats + meal.fats
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  // Get meal counts by category
  const mealCounts = {
    normal: meals.filter(m => m.category === 'normal').length,
    cheat: meals.filter(m => m.category === 'cheat').length,
    event: meals.filter(m => m.category === 'event').length,
    total: meals.length
  };

  // Get user's target calories
  const user = await User.findById(userId);
  const targetCalories = user?.targetDailyCalories || 2000;

  // Calculate calorie difference
  const calorieDifference = totals.calories - targetCalories;

  // Determine if target is met (within ±50 calories)
  const targetMet = Math.abs(calorieDifference) <= 50;

  // Calculate target percentage
  const targetPercentage = targetCalories > 0
    ? Math.round((totals.calories / targetCalories) * 100)
    : 0;

  // Update or create daily summary
  await DailySummary.findOneAndUpdate(
    { user: userId, date: { $gte: start, $lte: end } },
    {
      user: userId,
      date: start,
      totalCalories: totals.calories,
      totalProtein: Math.round(totals.protein * 10) / 10,
      totalCarbs: Math.round(totals.carbs * 10) / 10,
      totalFats: Math.round(totals.fats * 10) / 10,
      targetCalories: targetCalories,
      calorieDifference: calorieDifference,
      targetPercentage: targetPercentage,
      mealCounts: mealCounts,
      targetMet: targetMet
    },
    { upsert: true, new: true }
  );
}


/**
 * @desc    Create a new meal plan
 * @route   POST /api/meal-plans
 * @access  Private
 */
exports.createMealPlan = async (req, res) => {
  try {
    const { date, mealTime, scheduledTime, items, notes } = req.body;

    // Validate required fields
    if (!date || !mealTime || !scheduledTime || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date, mealTime, scheduledTime, and at least one item'
      });
    }

    // Validate mealTime is one of the allowed values
    const validMealTimes = ['breakfast', 'lunch', 'dinner'];
    if (!validMealTimes.includes(mealTime.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Meal time must be breakfast, lunch, or dinner'
      });
    }

    // Calculate totals from items
    const totals = items.reduce((acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fats: acc.fats + (item.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    // Create meal plan
    const mealPlan = await MealPlan.create({
      user: req.user._id,
      date: new Date(date),
      mealTime: mealTime.toLowerCase(),
      scheduledTime,
      items,
      plannedCalories: totals.calories,
      plannedProtein: totals.protein,
      plannedCarbs: totals.carbs,
      plannedFats: totals.fats,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Meal plan created successfully',
      mealPlan
    });

  } catch (error) {
    console.error('Create meal plan error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A meal plan already exists for this date and meal time'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating meal plan'
    });
  }
};

/**
 * @desc    Get meal plans for a specific date
 * @route   GET /api/meal-plans?date=YYYY-MM-DD
 * @access  Private
 */
exports.getMealPlansByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a date'
      });
    }

    const mealPlans = await MealPlan.getMealPlansByDate(req.user._id, date);

    // Calculate totals
    const totals = mealPlans.reduce((acc, plan) => ({
      plannedCalories: acc.plannedCalories + plan.plannedCalories,
      plannedProtein: acc.plannedProtein + plan.plannedProtein,
      plannedCarbs: acc.plannedCarbs + plan.plannedCarbs,
      plannedFats: acc.plannedFats + plan.plannedFats,
      actualCalories: acc.actualCalories + plan.actualCalories,
      completedMeals: acc.completedMeals + (plan.status === 'completed' ? 1 : 0),
      incompleteMeals: acc.incompleteMeals + (plan.status === 'incomplete' ? 1 : 0)
    }), {
      plannedCalories: 0,
      plannedProtein: 0,
      plannedCarbs: 0,
      plannedFats: 0,
      actualCalories: 0,
      completedMeals: 0,
      incompleteMeals: 0
    });

    // Get actual meals consumed for this date
    const { start, end } = getDayBounds(new Date(date));
    const actualMeals = await MealEntry.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    const actualTotals = actualMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    res.json({
      success: true,
      date: date,
      mealPlans: mealPlans,
      plannedTotals: {
        calories: totals.plannedCalories,
        protein: totals.plannedProtein,
        carbs: totals.plannedCarbs,
        fats: totals.plannedFats,
        completedMeals: totals.completedMeals,
        incompleteMeals: totals.incompleteMeals,
        totalMeals: mealPlans.length
      },
      achievedTotals: actualTotals
    });

  } catch (error) {
    console.error('Get meal plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching meal plans'
    });
  }
};

/**
 * @desc    Get pending meal plans (for reminders)
 * @route   GET /api/meal-plans/pending
 * @access  Private
 */
exports.getPendingMealPlans = async (req, res) => {
  try {
    const pendingPlans = await MealPlan.getPendingMealPlans(req.user._id);

    res.json({
      success: true,
      pendingPlans: pendingPlans,
      count: pendingPlans.length
    });

  } catch (error) {
    console.error('Get pending meal plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pending meal plans'
    });
  }
};

/**
 * @desc    Get single meal plan by ID
 * @route   GET /api/meal-plans/:id
 * @access  Private
 */
exports.getMealPlanById = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    res.json({
      success: true,
      mealPlan: mealPlan
    });

  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching meal plan'
    });
  }
};

/**
 * @desc    Update meal plan
 * @route   PUT /api/meal-plans/:id
 * @access  Private
 */
exports.updateMealPlan = async (req, res) => {
  try {
    const { items, scheduledTime, notes, status } = req.body;

    let mealPlan = await MealPlan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Store original status and date for later use
    const wasCompleted = mealPlan.status === 'completed';
    const planDate = new Date(mealPlan.date);

    // Update fields if provided
    if (items) {
      const totals = items.reduce((acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fats: acc.fats + (item.fats || 0)
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

      mealPlan.items = items;
      mealPlan.plannedCalories = totals.calories;
      mealPlan.plannedProtein = totals.protein;
      mealPlan.plannedCarbs = totals.carbs;
      mealPlan.plannedFats = totals.fats;
    }

    if (scheduledTime) mealPlan.scheduledTime = scheduledTime;
    if (notes !== undefined) mealPlan.notes = notes;
    if (status) {
      mealPlan.status = status;
      if (status === 'completed' || status === 'incomplete' || status === 'skipped') {
        mealPlan.completedAt = new Date();
      }
    }

    await mealPlan.save();

    // If status changed to completed, automatically create meal entries if they don't exist
    if (status === 'completed' && (!mealPlan.completedMealIds || mealPlan.completedMealIds.length === 0)) {
      const mealEntries = await Promise.all(
        mealPlan.items.map(item => MealEntry.create({
          user: req.user._id,
          title: item.title,
          category: 'normal',
          date: mealPlan.date,
          mealTime: mealPlan.mealTime,
          calories: item.calories,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fats: item.fats || 0,
          quantity: item.quantity || 100,
          notes: mealPlan.notes || 'Automatically logged from meal plan update'
        }))
      );

      mealPlan.completedMealIds = mealEntries.map(entry => entry._id);
      await mealPlan.save();

      // Update daily summary
      await updateDailySummary(req.user._id, mealPlan.date);
    }

    // If plan was completed and has linked meal entries, update/recreate them
    if (wasCompleted && mealPlan.completedMealIds && mealPlan.completedMealIds.length > 0 && items) {
      // Simplest way is to remove old ones and create new ones to match current items
      await MealEntry.deleteMany({ _id: { $in: mealPlan.completedMealIds } });

      const mealEntries = await Promise.all(
        items.map(item => MealEntry.create({
          user: req.user._id,
          title: item.title,
          category: 'normal',
          date: mealPlan.date,
          mealTime: mealPlan.mealTime,
          calories: item.calories,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fats: item.fats || 0,
          quantity: item.quantity || 100,
          notes: mealPlan.notes || 'Automatically updated from meal plan'
        }))
      );

      mealPlan.completedMealIds = mealEntries.map(entry => entry._id);
      await mealPlan.save();

      // Update daily summary
      await updateDailySummary(req.user._id, planDate);
    }

    res.json({
      success: true,
      message: 'Meal plan updated successfully',
      mealPlan
    });

  } catch (error) {
    console.error('Update meal plan error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating meal plan'
    });
  }
};

/**
 * @desc    Mark meal plan as completed or incomplete
 * @route   PUT /api/meal-plans/:id/status
 * @access  Private
 */
exports.updateMealPlanStatus = async (req, res) => {
  try {
    const { status, actualCalories, actualProtein, actualCarbs, actualFats, notes } = req.body;

    // Validate status
    const validStatuses = ['completed', 'incomplete', 'skipped', 'partially_completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (completed, incomplete, skipped, partially_completed)'
      });
    }

    let mealPlan = await MealPlan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Update status
    mealPlan.status = status;
    mealPlan.completedAt = new Date();

    // Update actual calories if provided
    if (actualCalories !== undefined) mealPlan.actualCalories = actualCalories;
    if (actualProtein !== undefined) mealPlan.actualProtein = actualProtein;
    if (actualCarbs !== undefined) mealPlan.actualCarbs = actualCarbs;
    if (actualFats !== undefined) mealPlan.actualFats = actualFats;
    if (notes !== undefined) mealPlan.notes = notes;

    await mealPlan.save();

    // If status is completed, automatically create meal entries if they don't exist
    if (status === 'completed' && (!mealPlan.completedMealIds || mealPlan.completedMealIds.length === 0)) {
      const mealEntries = await Promise.all(
        mealPlan.items.map(item => MealEntry.create({
          user: req.user._id,
          title: item.title,
          category: 'normal',
          date: mealPlan.date,
          mealTime: mealPlan.mealTime,
          calories: item.calories,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fats: item.fats || 0,
          quantity: item.quantity || 100,
          notes: notes || mealPlan.notes || 'Automatically logged from meal plan'
        }))
      );

      mealPlan.completedMealIds = mealEntries.map(entry => entry._id);
      await mealPlan.save();

      // Update daily summary
      await updateDailySummary(req.user._id, mealPlan.date);
    }

    // Mark associated notification as read
    await Notification.findOneAndUpdate(
      { _id_str: `meal_${mealPlan._id}`, user: req.user._id },
      { isRead: true }
    );

    res.json({
      success: true,
      message: `Meal plan marked as ${status}`,
      mealPlan
    });

  } catch (error) {
    console.error('Update meal plan status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating meal plan status'
    });
  }
};

/**
 * @desc    Delete meal plan
 * @route   DELETE /api/meal-plans/:id
 * @access  Private
 */
exports.deleteMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Store date for summary update
    const planDate = new Date(mealPlan.date);

    // If plan was completed and has linked meal entries, delete them
    if (mealPlan.completedMealIds && mealPlan.completedMealIds.length > 0) {
      await MealEntry.deleteMany({ _id: { $in: mealPlan.completedMealIds } });
      // Update daily summary after deleting linked meals
      await updateDailySummary(req.user._id, planDate);
    }

    await mealPlan.deleteOne();

    res.json({
      success: true,
      message: 'Meal plan deleted successfully'
    });

  } catch (error) {
    console.error('Delete meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting meal plan'
    });
  }
};


/**
 * @desc    Get meal plans by date range
 * @route   GET /api/meal-plans/range?start=YYYY-MM-DD&end=YYYY-MM-DD
 * @access  Private
 */
exports.getMealPlansByRange = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Please provide start and end dates'
      });
    }

    const mealPlans = await MealPlan.getMealPlansByRange(req.user._id, start, end);

    // Group by date
    const plansByDate = mealPlans.reduce((acc, plan) => {
      const dateKey = new Date(plan.date).toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(plan);
      return acc;
    }, {});

    // Calculate totals
    const totals = mealPlans.reduce((acc, plan) => ({
      plannedCalories: acc.plannedCalories + plan.plannedCalories,
      actualCalories: acc.actualCalories + plan.actualCalories,
      completedMeals: acc.completedMeals + (plan.status === 'completed' ? 1 : 0),
      totalMeals: acc.totalMeals + 1
    }), {
      plannedCalories: 0,
      actualCalories: 0,
      completedMeals: 0,
      totalMeals: 0
    });

    res.json({
      success: true,
      startDate: start,
      endDate: end,
      mealPlans: mealPlans,
      plansByDate: plansByDate,
      totals: totals,
      count: mealPlans.length
    });

  } catch (error) {
    console.error('Get meal plans by range error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching meal plans'
    });
  }
};

/**
 * @desc    Link an actual meal entry to a meal plan
 * @route   POST /api/meal-plans/:id/link-meal
 * @access  Private
 */
exports.linkMealToPlan = async (req, res) => {
  try {
    const { mealId } = req.body;

    if (!mealId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a meal ID'
      });
    }

    // Find the meal plan
    let mealPlan = await MealPlan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Find the meal entry
    const meal = await MealEntry.findOne({
      _id: mealId,
      user: req.user._id
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal entry not found'
      });
    }

    // Store date for summary update
    const planDate = new Date(mealPlan.date);

    // Link the meal (note: currently links single meal, may need update for multi-link UI)
    mealPlan.completedMealIds = [meal._id];
    mealPlan.actualCalories = meal.calories;
    mealPlan.actualProtein = meal.protein;
    mealPlan.actualCarbs = meal.carbs;
    mealPlan.actualFats = meal.fats;
    mealPlan.status = 'completed';
    mealPlan.completedAt = new Date();

    await mealPlan.save();

    // Mark associated notification as read
    await Notification.findOneAndUpdate(
      { _id_str: `meal_${mealPlan._id}`, user: req.user._id },
      { isRead: true }
    );

    // Update daily summary after linking meal
    await updateDailySummary(req.user._id, planDate);

    res.json({
      success: true,
      message: 'Meal linked to plan successfully',
      mealPlan
    });

  } catch (error) {
    console.error('Link meal to plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error linking meal to plan'
    });
  }
};

/**
 * @desc    Get upcoming meal plans for today (for notifications)
 * @route   GET /api/meal-plans/upcoming
 * @access  Private
 */
exports.getUpcomingMeals = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get current time in HH:MM format
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    const { start, end } = getUTCDayBounds(now);

    // Find all planned meals for today
    const upcomingMeals = await MealPlan.find({
      user: req.user._id,
      date: { $gte: start, $lte: end },
      status: 'planned'
    }).sort({ scheduledTime: 1 });

    // Add notification status to each meal
    const mealsWithNotificationStatus = upcomingMeals.map(meal => {
      const mealTime = meal.scheduledTime;
      const [mealHour, mealMinute] = mealTime.split(':').map(Number);

      // Check if it's time for this meal (within 30 minutes before or at scheduled time)
      const mealDateTime = new Date(today);
      mealDateTime.setHours(mealHour, mealMinute, 0, 0);

      const timeDiff = mealDateTime - now;
      const minutesUntilMeal = Math.floor(timeDiff / (1000 * 60));

      let notificationStatus = 'upcoming';
      let isDue = false;

      if (minutesUntilMeal <= 0 && minutesUntilMeal > -60) {
        // Meal is due now or was due within last hour
        notificationStatus = 'due';
        isDue = true;
      } else if (minutesUntilMeal > 0 && minutesUntilMeal <= 30) {
        // Meal is coming up within 30 minutes
        notificationStatus = 'soon';
      }

      return {
        ...meal.toObject(),
        notificationStatus,
        isDue,
        minutesUntilMeal
      };
    });

    // Filter to show only meals that are due or coming up soon
    const notifications = mealsWithNotificationStatus.filter(meal =>
      meal.notificationStatus === 'due' || meal.notificationStatus === 'soon'
    );

    res.json({
      success: true,
      upcomingMeals: mealsWithNotificationStatus,
      notifications: notifications,
      currentTime: currentTime,
      count: notifications.length
    });

  } catch (error) {
    console.error('Get upcoming meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching upcoming meals'
    });
  }
};
