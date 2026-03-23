/**
 * Ojasvita - Analytics Controller
 * 
 * Handles all analytics and reporting operations.
 * Optimized for data consistency with the shared Meal Controller logic.
 */

const DailySummary = require('../models/DailySummary');
const MealEntry = require('../models/MealEntry');
const StreakRecord = require('../models/StreakRecord');
const User = require('../models/User');
const { computeEffectiveTarget } = require('./mealController');
const { 
  getDayBounds, 
  getLastNDays, 
  getWeekBounds,
  getMotivationMessage 
} = require('../utils/helpers');
const { 
  calculateBMI, 
  calculateProgress,
  calculateWeeklyAverages,
  calculateRedistribution 
} = require('../utils/healthCalculations');

/**
 * @desc    Get daily summary for a specific date
 */
exports.getDailySummary = async (req, res) => {
  try {
    const dateParam = req.query.date;
    const date = dateParam ? new Date(dateParam) : new Date();
    const { start, end } = getDayBounds(date);

    const user = await User.findById(req.user._id);
    const baseTargetCalories = user?.targetDailyCalories || 2000;
    const effectiveTarget = await computeEffectiveTarget(req.user._id, date, baseTargetCalories);

    let summary = await DailySummary.findOne({ user: req.user._id, date: { $gte: start, $lte: end } });

    if (!summary) {
        const meals = await MealEntry.find({ user: req.user._id, date: { $gte: start, $lte: end } });
        const totals = meals.reduce((acc, m) => ({
            calories: acc.calories + m.calories,
            protein: acc.protein + m.protein,
            carbs: acc.carbs + m.carbs,
            fats: acc.fats + m.fats
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

        summary = {
            totalCalories: totals.calories,
            totalProtein: totals.protein,
            totalCarbs: totals.carbs,
            totalFats: totals.fats,
            targetCalories: effectiveTarget,
            baseTargetCalories: baseTargetCalories,
            mealCounts: {
                normal: meals.filter(m => m.category === 'normal').length,
                cheat: meals.filter(m => m.category === 'cheat').length,
                event: meals.filter(m => m.category === 'event').length,
                total: meals.length
            }
        };
    }

    const displayTarget = summary.targetCalories || effectiveTarget;
    const progress = calculateProgress(summary.totalCalories, displayTarget);
    const motivation = getMotivationMessage(progress.status);

    res.json({
      success: true,
      date: date,
      summary: {
        ...(summary.toObject ? summary.toObject() : summary),
        progress: progress,
        motivation: motivation
      }
    });

  } catch (error) {
    console.error('Daily summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get weekly summary
 */
exports.getWeeklySummary = async (req, res) => {
  try {
    let startDateParam = req.query.startDate;
    let startDate = startDateParam ? new Date(startDateParam) : new Date();
    const { start, end } = getWeekBounds(startDate);

    const summaries = await DailySummary.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const user = await User.findById(req.user._id);
    const baseTargetCalories = user?.targetDailyCalories || 2000;

    const weeklyData = summaries.map(s => ({
      date: s.date,
      calories: s.totalCalories,
      target: s.targetCalories,
      protein: s.totalProtein,
      carbs: s.totalCarbs,
      fats: s.totalFats,
      targetMet: s.targetMet
    }));

    const averages = calculateWeeklyAverages(weeklyData);
    const daysWithMeals = summaries.length;
    const daysOnTarget = summaries.filter(s => s.targetMet).length;
    const achievementRate = daysWithMeals > 0 ? Math.round((daysOnTarget / daysWithMeals) * 100) : 0;

    const streak = await StreakRecord.getOrCreate(req.user._id);

    const totals = summaries.reduce((acc, s) => ({
      calories: acc.calories + s.totalCalories,
      protein: acc.protein + s.totalProtein,
      carbs: acc.carbs + s.totalCarbs,
      fats: acc.fats + s.totalFats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    res.json({
      success: true,
      week: { startDate: start, endDate: end },
      dailyData: weeklyData,
      totals: totals,
      averages: averages,
      stats: {
        daysLogged: daysWithMeals,
        daysOnTarget: daysOnTarget,
        achievementRate: achievementRate,
        targetCalories: baseTargetCalories
      },
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        streakMessage: streak.streakMessage
      }
    });

  } catch (error) {
    console.error('Weekly summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get streak information
 */
exports.getStreakInfo = async (req, res) => {
  try {
    const streak = await StreakRecord.getOrCreate(req.user._id);
    await streak.checkAndBreakStreak();

    const today = new Date();
    const { start, end } = getDayBounds(today);
    
    const todaySummary = await DailySummary.findOne({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    if (todaySummary && todaySummary.totalCalories > todaySummary.targetCalories) {
      await streak.breakStreakDueToCalorieLimit(today);
    }

    res.json({
      success: true,
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        streakStatus: streak.streakStatus,
        streakStartDate: streak.streakStartDate,
        lastLogDate: streak.lastLogDate,
        totalDaysLogged: streak.totalDaysLogged,
        streakMessage: streak.streakMessage,
        daysToNextMilestone: streak.daysToNextMilestone,
        milestones: streak.milestones,
        streakHistory: streak.streakHistory.slice(-5)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get BMI and health metrics
 */
exports.getHealthMetrics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let bmi = user.bmi;
    let bmiCategory = user.bmiCategory;
    if (!bmi) {
      const bmiResult = calculateBMI(user.weight, user.height);
      bmi = bmiResult.bmi;
      bmiCategory = bmiResult.category;
    }

    res.json({
      success: true,
      healthMetrics: {
        bmi: bmi,
        bmiCategory: bmiCategory,
        bmr: user.bmr,
        dailyCalorieNeed: user.dailyCalorieNeed,
        targetDailyCalories: user.targetDailyCalories,
        weight: user.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
        activityLevel: user.activityLevel,
        dietGoal: user.dietGoal
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get calorie redistribution data
 */
exports.getRedistributionData = async (req, res) => {
  try {
    const { start } = getLastNDays(7);
    const summaries = await DailySummary.find({
      user: req.user._id,
      date: { $gte: start }
    }).sort({ date: -1 });

    const user = await User.findById(req.user._id);
    const targetCalories = user?.targetDailyCalories || 2000;

    const overTargetDays = summaries.filter(s => s.totalCalories > s.targetCalories);

    const redistributionData = overTargetDays.map(day => {
      const excess = day.totalCalories - day.targetCalories;
      const redistribution = calculateRedistribution(excess, 5); // Standardized to 5
      return {
        date: day.date,
        consumed: day.totalCalories,
        target: day.targetCalories,
        excess: excess,
        redistribution: redistribution
      };
    });

    const totalRedistributed = redistributionData.reduce((sum, day) => sum + day.redistribution.amount, 0);

    res.json({
      success: true,
      redistribution: {
        recentOverages: redistributionData,
        totalRedistributed: totalRedistributed,
        daysWithOverage: overTargetDays.length,
        currentTarget: targetCalories
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get progress tracking data
 */
exports.getProgressData = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dates = getLastNDays(days);
    const start = dates[0];

    const summaries = await DailySummary.find({
      user: req.user._id,
      date: { $gte: start }
    }).sort({ date: 1 });

    const user = await User.findById(req.user._id);
    const baseTargetCalories = user?.targetDailyCalories || 2000;

    const dailyData = summaries.map(s => ({
      date: s.date,
      calories: s.totalCalories,
      target: s.targetCalories || baseTargetCalories,
      protein: s.totalProtein,
      carbs: s.totalCarbs,
      fats: s.totalFats,
      targetMet: s.targetMet
    }));

    const totalDays = dailyData.length;
    const daysOnTarget = dailyData.filter(d => d.targetMet).length;
    const averageCalories = totalDays > 0 ? Math.round(dailyData.reduce((sum, d) => sum + d.calories, 0) / totalDays) : 0;
    
    res.json({
      success: true,
      progress: {
        dailyData: dailyData,
        summary: {
          totalDays: totalDays,
          daysOnTarget: daysOnTarget,
          achievementRate: totalDays > 0 ? Math.round((daysOnTarget / totalDays) * 100) : 0,
          averageCalories: averageCalories,
          targetCalories: baseTargetCalories
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get category distribution
 */
exports.getCategoryDistribution = async (req, res) => {
  try {
    const { date: dateParam } = req.query;
    const date = dateParam ? new Date(dateParam) : new Date();
    const { start, end } = getDayBounds(date);

    const meals = await MealEntry.find({ user: req.user._id, date: { $gte: start, $lte: end } });
    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

    const categories = ['normal', 'cheat', 'event'];
    const distribution = categories.map(category => {
      const categoryMeals = meals.filter(m => m.category === category);
      const categoryCalories = categoryMeals.reduce((sum, m) => sum + m.calories, 0);

      return {
        category: category,
        count: categoryMeals.length,
        calories: categoryCalories,
        percentage: totalCalories > 0 ? Math.round((categoryCalories / totalCalories) * 100) : 0
      };
    });

    res.json({
      success: true,
      date: date,
      distribution: distribution,
      totalMeals: meals.length,
      totalCalories: totalCalories
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get dashboard data
 */
exports.getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    const { start, end } = getDayBounds(today);
    const weekDates = getLastNDays(7);
    const weekStart = weekDates[0];

    const user = await User.findById(req.user._id);

    const todayMeals = await MealEntry.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    }).sort({ createdAt: -1 });

    const todayTotals = todayMeals.reduce((acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fats: acc.fats + m.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const streak = await StreakRecord.getOrCreate(req.user._id);
    await streak.checkAndBreakStreak();

    const todaySummary = await DailySummary.findOne({ user: req.user._id, date: { $gte: start, $lte: end } });
    if (todaySummary && todaySummary.totalCalories > todaySummary.targetCalories) {
      await streak.breakStreakDueToCalorieLimit(today);
    }

    const weeklySummaries = await DailySummary.find({
      user: req.user._id,
      date: { $gte: weekStart, $lte: end }
    }).sort({ date: -1 });

    const recentMeals = await MealEntry.find({ user: req.user._id }).sort({ date: -1, createdAt: -1 }).limit(5);

    const baseTargetCalories = user?.targetDailyCalories || 2000;
    const targetCalories = await computeEffectiveTarget(req.user._id, today, baseTargetCalories);
    const isTargetAdjusted = targetCalories !== baseTargetCalories;
    const progress = calculateProgress(todayTotals.calories, targetCalories);

    res.json({
      success: true,
      user: { name: user?.name, targetCalories: targetCalories, baseTargetCalories: baseTargetCalories, isTargetAdjusted: isTargetAdjusted },
      today: { meals: todayMeals, totals: todayTotals, progress: progress, mealCount: todayMeals.length },
      streak: { currentStreak: streak.currentStreak, longestStreak: streak.longestStreak, streakMessage: streak.streakMessage },
      weekly: {
        summaries: weeklySummaries,
        daysLogged: weeklySummaries.length,
        averageCalories: Math.round(weeklySummaries.reduce((sum, s) => sum + s.totalCalories, 0) / (weeklySummaries.length || 1))
      },
      recentMeals: recentMeals
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
