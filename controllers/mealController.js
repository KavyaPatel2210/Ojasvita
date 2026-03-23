/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Meal Controller
 * 
 * This controller handles all meal-related operations:
 * - Create meal entry
 * - Update meal entry
 * - Delete meal entry
 * - Get meals by date
 * - Get meals by date range
 * - Daily meal summary
 */

const MealEntry = require('../models/MealEntry');
const DailySummary = require('../models/DailySummary');
const StreakRecord = require('../models/StreakRecord');
const User = require('../models/User');
const { getDayBounds, getLastNDays, parseSafeDate } = require('../utils/helpers');
const { calculateRedistribution } = require('../utils/healthCalculations');

/**
 * @desc    Create a new meal entry
 * @route   POST /api/meals
 * @access  Private
 */
exports.createMeal = async (req, res) => {
  try {
    const { title, calories, protein, carbs, fats, quantity, category, date, mealTime, description, notes } = req.body;

    if (!title || !calories) {
      return res.status(400).json({
        success: false,
        message: 'Please provide meal title and calories'
      });
    }

    const mealDate = parseSafeDate(date);

    const meal = await MealEntry.create({
      user: req.user._id,
      title,
      calories,
      protein: protein || 0,
      carbs: carbs || 0,
      fats: fats || 0,
      quantity: quantity || 100,
      category: category || 'normal',
      date: mealDate,
      mealTime: mealTime || 'other',
      description: description || '',
      notes: notes || ''
    });

    const dailySummary = await updateDailySummary(req.user._id, mealDate);

    const streak = await StreakRecord.getOrCreate(req.user._id);
    await streak.updateStreak(mealDate);

    if (dailySummary && dailySummary.totalCalories > dailySummary.targetCalories) {
      await streak.breakStreakDueToCalorieLimit(mealDate);
    }

    res.status(201).json({
      success: true,
      message: 'Meal added successfully',
      meal: meal
    });

  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({ success: false, message: 'Server error creating meal' });
  }
};

/**
 * @desc    Get all meals for a specific date
 */
exports.getMealsByDate = async (req, res) => {
  try {
    const dateParam = req.query.date;
    const date = dateParam ? new Date(dateParam) : new Date();
    const { start, end } = getDayBounds(date);

    const meals = await MealEntry.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1, createdAt: -1 });

    const user = await User.findById(req.user._id);
    const baseTargetCalories = user?.targetDailyCalories || 2000;
    const effectiveTarget = await computeEffectiveTarget(req.user._id, date, baseTargetCalories);

    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    let summary = await DailySummary.findOne({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    res.json({
      success: true,
      date: date,
      meals: meals,
      totals: {
        ...totals,
        target: effectiveTarget,
        baseTarget: baseTargetCalories,
        isAdjusted: effectiveTarget !== baseTargetCalories,
        remaining: effectiveTarget - totals.calories,
        percentage: Math.round((totals.calories / (effectiveTarget || 1)) * 100)
      },
      summary: summary
    });
  } catch (error) {
    console.error('Get meals by date error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching meals' });
  }
};

/**
 * @desc    Get meals by date range
 */
exports.getMealsByRange = async (req, res) => {
  try {
    const { start: startParam, end: endParam } = req.query;
    if (!startParam || !endParam) {
      return res.status(400).json({ success: false, message: 'Please provide start and end dates' });
    }

    const start = new Date(startParam);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endParam);
    end.setHours(23, 59, 59, 999);

    const meals = await MealEntry.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1, createdAt: -1 });

    const mealsByDate = meals.reduce((acc, meal) => {
      const dateKey = meal.date.toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(meal);
      return acc;
    }, {});

    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    res.json({
      success: true,
      startDate: start,
      endDate: end,
      meals: meals,
      mealsByDate: mealsByDate,
      totals: totals,
      mealCount: meals.length
    });
  } catch (error) {
    console.error('Get meals by range error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get single meal by ID
 */
exports.getMealById = async (req, res) => {
  try {
    const meal = await MealEntry.findOne({ _id: req.params.id, user: req.user._id });
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found' });
    res.json({ success: true, meal: meal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Update a meal entry
 */
exports.updateMeal = async (req, res) => {
  try {
    const { title, calories, protein, carbs, fats, quantity, category, date, mealTime, description, notes } = req.body;
    let meal = await MealEntry.findOne({ _id: req.params.id, user: req.user._id });

    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found' });

    const oldDate = new Date(meal.date);

    if (title) meal.title = title;
    if (calories !== undefined) meal.calories = calories;
    if (protein !== undefined) meal.protein = protein;
    if (carbs !== undefined) meal.carbs = carbs;
    if (fats !== undefined) meal.fats = fats;
    if (quantity !== undefined) meal.quantity = quantity;
    if (category) meal.category = category;
    if (date) meal.date = parseSafeDate(date);
    if (mealTime) meal.mealTime = mealTime;
    if (description !== undefined) meal.description = description;
    if (notes !== undefined) meal.notes = notes;

    await meal.save();

    await updateDailySummary(req.user._id, oldDate);
    const dailySummary = await updateDailySummary(req.user._id, meal.date);

    if (dailySummary && dailySummary.totalCalories > dailySummary.targetCalories) {
      const streak = await StreakRecord.getOrCreate(req.user._id);
      await streak.breakStreakDueToCalorieLimit(meal.date);
    }

    res.json({ success: true, message: 'Meal updated successfully', meal: meal });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Delete a meal entry
 */
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await MealEntry.findOne({ _id: req.params.id, user: req.user._id });
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found' });

    const mealDate = new Date(meal.date);
    await meal.deleteOne();
    await updateDailySummary(req.user._id, mealDate);

    res.json({ success: true, message: 'Meal deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get recent meals
 */
exports.getRecentMeals = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const { category } = req.query;
    const query = { user: req.user._id };
    if (category) query.category = category;

    const meals = await MealEntry.find(query).sort({ date: -1, createdAt: -1 }).limit(limit);
    res.json({ success: true, meals: meals, count: meals.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get recent meal sessions
 */
exports.getRecentMealSessions = async (req, res) => {
  try {
    const rawSessions = await MealEntry.aggregate([
      { $match: { user: req.user._id, category: 'normal', mealTime: { $in: ['breakfast', 'lunch', 'dinner'] } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, mealTime: "$mealTime" },
          items: { $push: { title: "$title", calories: "$calories", protein: "$protein", carbs: "$carbs", fats: "$fats", quantity: "$quantity" } },
          totalCalories: { $sum: "$calories" },
          latestDate: { $max: "$date" }
        }
      },
      { $sort: { latestDate: -1 } }
    ]);

    const uniqueMeals = [];
    const seenCompositions = new Set();

    for (const session of rawSessions) {
      const composition = session.items.map(i => `${i.title.toLowerCase()}:${i.quantity || 100}`).sort().join('|');
      const signature = `${session._id.mealTime}:${composition}`;

      if (!seenCompositions.has(signature)) {
        seenCompositions.add(signature);
        uniqueMeals.push({
          mealTime: session._id.mealTime,
          date: session._id.date,
          items: session.items,
          totalCalories: session.totalCalories,
          lastEaten: session.latestDate
        });
      }
    }

    res.json({ success: true, sessions: uniqueMeals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get meals by category
 */
exports.getMealsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { start, end } = req.query;
    let query = { user: req.user._id, category: category };

    if (start && end) {
      query.date = { $gte: new Date(start), $lte: new Date(end) };
    }

    const meals = await MealEntry.find(query).sort({ date: -1 });
    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    res.json({ success: true, category: category, meals: meals, totals: totals, count: meals.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Create multiple meals from cart
 */
exports.createMultipleMeals = async (req, res) => {
  try {
    const { meals, date, mealTime } = req.body;
    if (!meals || !Array.isArray(meals) || meals.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of meals' });
    }

    const mealDate = parseSafeDate(date);
    const commonMealTime = mealTime || 'other';

    const createdMeals = await Promise.all(
      meals.map(meal =>
        MealEntry.create({
          user: req.user._id,
          title: meal.title,
          calories: meal.calories,
          protein: meal.protein || 0,
          carbs: meal.carbs || 0,
          fats: meal.fats || 0,
          quantity: meal.quantity || meal.grams || 100,
          category: meal.category || 'normal',
          date: mealDate,
          mealTime: meal.mealTime || commonMealTime,
          description: meal.description || '',
          notes: meal.notes || ''
        })
      )
    );

    const dailySummary = await updateDailySummary(req.user._id, mealDate);
    const streak = await StreakRecord.getOrCreate(req.user._id);
    await streak.updateStreak(mealDate);

    if (dailySummary && dailySummary.totalCalories > dailySummary.targetCalories) {
      await streak.breakStreakDueToCalorieLimit(mealDate);
    }

    res.status(201).json({ success: true, message: 'Meals added successfully', meals: createdMeals });
  } catch (error) {
    console.error('Bulk error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Helper function to update daily summary
 * Propagates target changes forward to correct future days' totals.
 */
async function updateDailySummary(userId, date, req_source = '') {
  const { start, end } = getDayBounds(date);

  const meals = await MealEntry.find({ user: userId, date: { $gte: start, $lte: end } });

  const totals = meals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fats: acc.fats + meal.fats
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const mealCounts = {
    normal: meals.filter(m => m.category === 'normal').length,
    cheat: meals.filter(m => m.category === 'cheat').length,
    event: meals.filter(m => m.category === 'event').length,
    total: meals.length
  };

  const user = await User.findById(userId);
  const baseTargetCalories = user?.targetDailyCalories || 2000;
  const effectiveTarget = await computeEffectiveTarget(userId, date, baseTargetCalories);
  const calorieDifference = totals.calories - effectiveTarget;
  const targetMet = Math.abs(calorieDifference) <= 50;
  const targetPercentage = effectiveTarget > 0 ? Math.round((totals.calories / effectiveTarget) * 100) : 0;

  let redistributionData = { redistributed: false, amount: 0, days: 0, dailyAmount: 0, startDate: null, endDate: null };
  if (totals.calories > effectiveTarget) {
    const excess = totals.calories - effectiveTarget;
    const redistribution = calculateRedistribution(excess, 5);
    if (redistribution.redistributed) {
      const startDate = new Date(start);
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(start);
      endDate.setDate(endDate.getDate() + 5);
      redistributionData = {
        redistributed: true,
        amount: redistribution.amount,
        days: redistribution.days,
        dailyAmount: redistribution.dailyAmount,
        startDate: startDate,
        endDate: endDate
      };
    }
  }

  let dailySummary = await DailySummary.findOne({ user: userId, date: { $gte: start, $lte: end } });
  if (!dailySummary) {
    dailySummary = new DailySummary({ user: userId, date: start, targetCalories: effectiveTarget });
  }

  dailySummary.totalCalories = totals.calories;
  dailySummary.totalProtein = Math.round(totals.protein * 10) / 10;
  dailySummary.totalCarbs = Math.round(totals.carbs * 10) / 10;
  dailySummary.totalFats = Math.round(totals.fats * 10) / 10;
  dailySummary.targetCalories = effectiveTarget;
  dailySummary.baseTargetCalories = baseTargetCalories;
  dailySummary.mealCounts = mealCounts;
  dailySummary.redistribution = redistributionData;

  await dailySummary.save();

  // Propagation to correct future days
  if (req_source !== 'propagation') {
    const propagationPromises = [];
    for (let i = 1; i <= 5; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        propagationPromises.push(updateDailySummary(userId, d, 'propagation'));
    }
    await Promise.all(propagationPromises);
  }

  return dailySummary;
}

/**
 * Compute the effective calorie target for a given day.
 */
async function computeEffectiveTarget(userId, date, baseTarget) {
  const { start: dayStart } = getDayBounds(date);
  const lookbackStart = new Date(dayStart);
  lookbackStart.setDate(lookbackStart.getDate() - 5);

  const pastSummaries = await DailySummary.find({
    user: userId,
    date: { $gte: lookbackStart, $lt: dayStart }
  });

  let totalReduction = 0;
  for (const summary of pastSummaries) {
    if (summary.totalCalories > summary.targetCalories) {
      const excess = summary.totalCalories - summary.targetCalories;
      const r = calculateRedistribution(excess, 5);
      
      if (r.redistributed) {
        const sDate = new Date(summary.date);
        sDate.setHours(0,0,0,0);
        
        const rStartDate = new Date(sDate);
        rStartDate.setDate(rStartDate.getDate() + 1);
        
        const rEndDate = new Date(sDate);
        rEndDate.setDate(rEndDate.getDate() + 5);
        
        if (dayStart >= rStartDate && dayStart <= rEndDate) {
          totalReduction += r.dailyAmount;
        }
      }
    }
  }

  return Math.max(baseTarget - totalReduction, 0);
}

module.exports.updateDailySummary = updateDailySummary;
module.exports.computeEffectiveTarget = computeEffectiveTarget;
