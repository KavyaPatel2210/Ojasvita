/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Notification Controller
 * 
 * This controller handles all notification generation operations:
 * - Water intake reminders
 * - Streak notifications (milestones, at risk, broken)
 * - Goal achievement notifications
 * 
 * Dependencies:
 * - WaterIntake model: For water tracking
 * - StreakRecord model: For streak tracking
 * - DailySummary model: For goal tracking
 * - MealPlan model: For meal reminders
 */

const WaterIntake = require('../models/WaterIntake');
const StreakRecord = require('../models/StreakRecord');
const DailySummary = require('../models/DailySummary');
const MealPlan = require('../models/MealPlan');
const Notification = require('../models/Notification');
const { getDayBounds, getLastNDays, getUTCDayBounds } = require('../utils/helpers');

/**
 * Generate unique notification ID
 */
const generateNotificationId = (type, subType, date) => {
  return `${type}_${subType}_${date}`;
};

/**
 * @desc    Get all notifications for today
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getAllNotifications = async (req, res) => {
  try {
    const { start, end } = getUTCDayBounds(new Date());
    const now = new Date();
    const todayStr = start.toISOString().split('T')[0];

    // --- 1. GENERATE POTENTIAL NOTIFICATIONS ---
    const potentialNotifications = [];

    // Meal notifications
    const meals = await MealPlan.find({
      user: req.user._id,
      date: { $gte: start, $lte: end },
      status: 'planned'
    }).sort({ scheduledTime: 1 });

    meals.forEach(meal => {
      const [mealHour, mealMinute] = meal.scheduledTime.split(':').map(Number);
      const mealDateTime = new Date(now);
      mealDateTime.setHours(mealHour, mealMinute, 0, 0);
      const minutesUntilMeal = Math.floor((mealDateTime - now) / (1000 * 60));

      let status = 'upcoming';
      if (minutesUntilMeal <= 0 && minutesUntilMeal > -60) status = 'due';
      else if (minutesUntilMeal > 0 && minutesUntilMeal <= 30) status = 'soon';
      else if (minutesUntilMeal <= -60) status = 'past';

      const mealName = meal.mealTime.charAt(0).toUpperCase() + meal.mealTime.slice(1);
      let title = `${mealName} Plan`;
      let message = `Scheduled at ${meal.scheduledTime}`;
      let icon = '🍽️';

      if (status === 'due') {
        title = `Time for ${mealName}!`;
        message = `It's ${meal.scheduledTime}. Time to log your meal.`;
        icon = '🔔';
      } else if (status === 'soon') {
        title = `${mealName} Coming Up`;
        message = `In ${minutesUntilMeal} min (${meal.scheduledTime}).`;
        icon = '⏰';
      } else if (status === 'past') {
        title = `Missed ${mealName}?`;
        message = `Scheduled for ${meal.scheduledTime}.`;
        icon = '⚠️';
      }

      potentialNotifications.push({
        _id_str: `meal_${meal._id}`, // Stable ID
        type: 'meal',
        subType: meal.mealTime,
        title,
        message,
        icon,
        data: { mealId: meal._id, scheduledTime: meal.scheduledTime, plannedCalories: meal.plannedCalories, status }
      });
    });

    // Water notifications
    const waterIntake = await WaterIntake.getTodayIntake(req.user._id);
    if (waterIntake.progressPercentage >= 100 && !waterIntake.goalMetNotificationSent) {
      potentialNotifications.push({
        _id_str: generateNotificationId('water', 'goal_met', todayStr),
        type: 'water',
        subType: 'goal_met',
        title: '💧 Water Goal!',
        message: `Goal of ${waterIntake.dailyGoal}ml reached!`,
        icon: '💧'
      });
    }

    // Streak notifications
    const streak = await StreakRecord.getOrCreate(req.user._id);
    if (streak.currentStreak > 0 && now.getHours() >= 10) {
      potentialNotifications.push({
        _id_str: generateNotificationId('streak', 'at_risk', todayStr),
        type: 'streak',
        subType: 'at_risk',
        title: '🔥 Keep Your Streak!',
        message: `${streak.currentStreak} days. Log today!`,
        icon: '🔥'
      });
    }

    // --- 2. PERSIST/UPDATE NOTIFICATIONS ---
    for (const n of potentialNotifications) {
      const existing = await Notification.findOne({ _id_str: n._id_str, user: req.user._id });
      if (!existing) {
        await Notification.create({ ...n, user: req.user._id });
      } else {
        const titleChanged = existing.title !== n.title;
        await Notification.updateOne(
          { _id: existing._id },
          {
            ...n,
            isRead: titleChanged ? false : existing.isRead
          }
        );
      }
    }

    // --- 3. FETCH ALL PERSISTED NOTIFICATIONS ---
    const notifications = await Notification.find({
      user: req.user._id,
      dismissed: false,
      createdAt: { $gte: start }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications: notifications
    });

  } catch (error) {
    console.error('Get all notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      // It might be a frontend-only ID, return success anyway
      return res.json({ success: true, message: 'Marked as read' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Dismiss notification
 * @route   PUT /api/notifications/:id/dismiss
 * @access  Private
 */
exports.dismissNotification = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { dismissed: true }
    );
    res.json({ success: true, message: 'Notification dismissed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get notification summary
 */
exports.getNotificationSummary = async (req, res) => {
  try {
    const { start } = getUTCDayBounds(new Date());

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
      dismissed: false,
      createdAt: { $gte: start }
    });

    res.json({
      success: true,
      summary: { total: unreadCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

