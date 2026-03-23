const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const MealEntry = require('../models/MealEntry');
const DailySummary = require('../models/DailySummary');
const StreakRecord = require('../models/StreakRecord');

// Get comprehensive Admin Analytics
router.get('/analytics', protect, admin, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now).setHours(0,0,0,0);
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const thisMonthStart = new Date(now);
    thisMonthStart.setMonth(thisMonthStart.getMonth() - 1);

    const [
      totalUsers,
      totalAdmins,
      totalMeals,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      dailyActiveUsersIds,
      weeklyActiveUsersIds
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'admin' }),
      MealEntry.countDocuments(),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: todayStart } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: thisWeekStart } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: thisMonthStart } }),
      MealEntry.distinct('user', { date: { $gte: todayStart } }),
      MealEntry.distinct('user', { date: { $gte: thisWeekStart } })
    ]);

    const dailyActiveUsers = dailyActiveUsersIds.length;
    const weeklyActiveUsers = weeklyActiveUsersIds.length;

    const oldUsers = totalUsers - newUsersMonth;
    const growthTrend = oldUsers > 0 ? ((newUsersMonth / oldUsers) * 100).toFixed(1) : (newUsersMonth > 0 ? 100 : 0);

    // Food Consumption Analytics
    const foodConsumption = await MealEntry.aggregate([
      {
        $group: {
          _id: "$title",
          count: { $sum: 1 },
          category: { $first: "$category" }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    let mostConsumedFoods = foodConsumption.slice(0, 5);
    let leastConsumedFoods = foodConsumption.slice().reverse().slice(0, 5);
    let frequentlyLoggedMeals = mostConsumedFoods;

    const categorySplitAgg = await MealEntry.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);
    let categorySplit = { normal: 0, cheat: 0, event: 0 };
    categorySplitAgg.forEach(c => {
      if (c._id) categorySplit[c._id.toLowerCase()] = c.count;
    });

    // Calorie Behavior Insights
    const calorieInsights = await DailySummary.aggregate([
      {
        $group: {
          _id: null,
          avgDailyIntake: { $avg: "$totalCalories" },
          totalSummaries: { $sum: 1 },
          exceedingLimits: { $sum: { $cond: [{ $gt: ["$calorieDifference", 0] }, 1, 0] } },
          withinLimits: { $sum: { $cond: [{ $lte: ["$calorieDifference", 0] }, 1, 0] } }
        }
      }
    ]);
    
    let avgDailyIntake = 0;
    let percentExceeding = 0;
    let percentWithin = 0;
    if (calorieInsights.length > 0) {
      const ins = calorieInsights[0];
      avgDailyIntake = Math.round(ins.avgDailyIntake || 0);
      percentExceeding = ins.totalSummaries > 0 ? Math.round((ins.exceedingLimits / ins.totalSummaries) * 100) : 0;
      percentWithin = ins.totalSummaries > 0 ? Math.round((ins.withinLimits / ins.totalSummaries) * 100) : 0;
    }

    const dayWisePattern = await DailySummary.aggregate([
      {
        $project: {
          dayOfWeek: { $dayOfWeek: "$date" },
          totalCalories: 1
        }
      },
      {
        $group: {
          _id: {
            $cond: [{ $in: ["$dayOfWeek", [1, 7]] }, "weekend", "weekday"]
          },
          avgCalories: { $avg: "$totalCalories" }
        }
      }
    ]);
    
    let avgWeekdayCalories = 0;
    let avgWeekendCalories = 0;
    dayWisePattern.forEach(d => {
      if (d._id === 'weekday') avgWeekdayCalories = Math.round(d.avgCalories);
      if (d._id === 'weekend') avgWeekendCalories = Math.round(d.avgCalories);
    });

    // User Engagement Analytics
    const streakInsights = await StreakRecord.aggregate([
      {
        $group: {
          _id: null,
          avgStreak: { $avg: "$currentStreak" },
          highestStreak: { $max: "$longestStreak" }
        }
      }
    ]);
    
    let avgStreak = 0;
    let highestStreak = 0;
    if (streakInsights.length > 0) {
      avgStreak = Math.round(streakInsights[0].avgStreak || 0);
      highestStreak = streakInsights[0].highestStreak || 0;
    }

    // Retention Trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const retainedUsersObj = await MealEntry.aggregate([
      { $match: { date: { $gte: thisWeekStart } } },
      { $group: { _id: "$user" } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      { $unwind: "$userInfo" },
      { $match: { "userInfo.createdAt": { $lte: thirtyDaysAgo } } }
    ]);
    
    const usersOlderThan30Days = await User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $lte: thirtyDaysAgo } });
    const retainedUsers = retainedUsersObj.length;
    const retentionRate = usersOlderThan30Days > 0 ? Math.round((retainedUsers / usersOlderThan30Days) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalMeals,
        activeUsers: weeklyActiveUsers,
        platform: {
          totalUsers,
          newUsersToday,
          newUsersWeek,
          newUsersMonth,
          dailyActiveUsers,
          weeklyActiveUsers,
          growthTrend
        },
        food: {
          mostConsumedFoods: mostConsumedFoods.map(f => ({ name: f._id, count: f.count })),
          leastConsumedFoods: leastConsumedFoods.map(f => ({ name: f._id, count: f.count })),
          frequentlyLoggedMeals: frequentlyLoggedMeals.map(f => ({ name: f._id, count: f.count })),
          categorySplit
        },
        calories: {
          avgDailyIntake,
          percentExceeding,
          percentWithin,
          avgWeekdayCalories,
          avgWeekendCalories
        },
        engagement: {
          avgStreak,
          highestStreak,
          retentionRate,
          dailyActiveUsers,
          dailyInactiveUsers: totalUsers - dailyActiveUsers
        }
      }
    });

  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get all users for admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get user details by ID for admin
router.get('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const meals = await MealEntry.find({ user: user._id }).sort({ date: -1, createdAt: -1 }).limit(50);
    
    res.json({
      success: true,
      user,
      meals
    });
  } catch (error) {
    console.error('Fetch user details error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
