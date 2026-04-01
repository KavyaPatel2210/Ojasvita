const webpush = require('web-push');
const MealPlan = require('../models/MealPlan');
const User = require('../models/User');

// Configure web-push with VAPID keys from environment
try {
  webpush.setVapidDetails(
    'mailto:ojasvita.app@gmail.com',
    process.env.VAPID_PUBLIC_KEY || 'BAvO6xNo1j7eO1fW8-tQ7r7_r7YvN6-68n-2SW_vddUZ_BAvO6xNo1j', // Valid Key
    process.env.VAPID_PRIVATE_KEY || '2FcYzyrwStWxRNA' // Valid Private Key
  );
} catch (err) {
  console.error('[PushService] VAPID Configuration Error:', err.message);
}

/**
 * Background Service to check for due meals and send push notifications
 * This runs on the server and works even if the user's app is closed
 */
const checkAndSendMealReminders = async () => {
  try {
    const nowUTC = new Date();
    
    // 1. Find all users with active push subscriptions
    const users = await User.find({ 
      'preferences.pushSubscription': { $ne: null },
      'preferences.remindMeals': true 
    });

    for (const user of users) {
      // Calculate this specific user's current local time
      // timezoneOffset is in minutes (e.g. 330 for IST)
      const offsetInMs = (user.preferences.timezoneOffset || 0) * 60 * 1000;
      const userLocalTime = new Date(nowUTC.getTime() + offsetInMs);
      
      const currentHour = String(userLocalTime.getUTCHours()).padStart(2, '0');
      const currentMinute = String(userLocalTime.getUTCMinutes()).padStart(2, '0');
      const userCurrentTimeString = `${currentHour}:${currentMinute}`;

      // 2. Find planned meals for this specific user at THEIR current local time
      const startOfUserDay = new Date(userLocalTime);
      startOfUserDay.setUTCHours(0, 0, 0, 0);
      
      const endOfUserDay = new Date(userLocalTime);
      endOfUserDay.setUTCHours(23, 59, 59, 999);

      const dueMeals = await MealPlan.find({
        user: user._id,
        date: { $gte: startOfUserDay, $lte: endOfUserDay },
        scheduledTime: userCurrentTimeString,
        status: 'planned',
        reminderSent: { $ne: true }
      });

      for (const meal of dueMeals) {
        const subscription = user.preferences.pushSubscription;
        const mealName = meal.mealTime.charAt(0).toUpperCase() + meal.mealTime.slice(1);
        
        const payload = JSON.stringify({
          title: `Time for ${mealName}! 🍽️`,
          body: `It's ${meal.scheduledTime}. You have ${meal.plannedCalories} calories planned. Time to eat and log your meal!`,
          data: {
            url: '/meals',
            mealId: meal._id
          }
        });

        try {
          await webpush.sendNotification(subscription, payload);
          console.log(`[PushService] Sent notification to ${user.email} (Local Time: ${userCurrentTimeString})`);
          
          meal.reminderSent = true;
          meal.reminderSentAt = new Date();
          await meal.save();
        } catch (error) {
          console.error(`[PushService] Error sending to ${user.email}:`, error.message);
          if (error.statusCode === 410 || error.statusCode === 404) {
            user.preferences.pushSubscription = null;
            await user.save();
          }
        }
      }
    }
  } catch (error) {
    console.error('[PushService] Critical error in reminder job:', error);
  }
};

/**
 * Initialize the push notification scheduler
 */
exports.initPushScheduler = () => {
  console.log('✅ Push Notification Scheduler Initialized');
  setInterval(checkAndSendMealReminders, 60000);
  checkAndSendMealReminders();
};
