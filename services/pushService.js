const webpush = require('web-push');
const MealPlan = require('../models/MealPlan');
const User = require('../models/User');

// Configure web-push with VAPID keys from environment
try {
  webpush.setVapidDetails(
    'mailto:ojasvita.app@gmail.com',
    process.env.VAPID_PUBLIC_KEY || 'BFm7QyxLfPL6JVSFyZgV9VaYhLluCIsvwg-z8OaGkWUp6ac0_82X-7c_UTVW1k68IM50sVRRWWWat3iwIbsq-zs',
    process.env.VAPID_PRIVATE_KEY || 'jqCdgjXWrWzzSslhjzDtmE98qOAY9dQN7-OxZy3EUaw'
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
    // console.log(`[PushService] Running check at ${nowUTC.toISOString()}`);
    
    // 1. Find all users with active push subscriptions
    const users = await User.find({ 
      'preferences.pushSubscription': { $ne: null },
      'preferences.remindMeals': true 
    });

    if (users.length === 0) {
      // console.log('[PushService] No active subscriptions to check');
      return;
    }

    for (const user of users) {
      // Calculate this specific user's current local time
      const offsetInMs = (user.preferences.timezoneOffset || 330) * 60 * 1000;
      const userLocalTime = new Date(nowUTC.getTime() + offsetInMs);
      
      const currentHour = String(userLocalTime.getUTCHours()).padStart(2, '0');
      const currentMinute = String(userLocalTime.getUTCMinutes()).padStart(2, '0');
      const userCurrentTimeString = `${currentHour}:${currentMinute}`;

      // console.log(`[PushService] Checking user ${user.email} (Local Time: ${userCurrentTimeString})`);

      // 2. Find planned meals for this specific user at THEIR current local time
      const startOfUserDay = new Date(userLocalTime);
      startOfUserDay.setUTCHours(0, 0, 0, 0);
      
      const endOfUserDay = new Date(userLocalTime);
      endOfUserDay.setUTCHours(23, 59, 59, 999);

      const dueMeals = await MealPlan.find({
        user: user._id,
        date: { $gte: startOfUserDay, $lte: endOfUserDay },
        scheduledTime: { $lte: userCurrentTimeString }, // Check anything due up to the current minute
        status: 'planned',
        reminderSent: { $ne: true }
      });

      if (dueMeals.length > 0) {
        console.log(`[PushService] Found ${dueMeals.length} due meals for ${user.email} at ${userCurrentTimeString}`);
      }

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
          console.log(`✅ [PushService] Notification sent successfully to ${user.email}`);
          
          meal.reminderSent = true;
          meal.reminderSentAt = new Date();
          await meal.save();
        } catch (error) {
          console.error(`❌ [PushService] Error sending to ${user.email}:`, error.message);
          
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[PushService] Unsubscribing ${user.email} due to expired/invalid token`);
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
