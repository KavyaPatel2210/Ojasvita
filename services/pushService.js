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
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinute = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    // Find all planned meals for today around this time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const dueMeals = await MealPlan.find({
      date: { $gte: startOfToday, $lte: endOfToday },
      scheduledTime: currentTime,
      status: 'planned',
      reminderSent: { $ne: true }
    }).populate('user');

    if (dueMeals.length > 0) {
      console.log(`[PushService] Found ${dueMeals.length} meals due at ${currentTime}`);
    }

    for (const meal of dueMeals) {
      if (meal.user && meal.user.preferences && meal.user.preferences.pushSubscription) {
        const subscription = meal.user.preferences.pushSubscription;
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
          console.log(`[PushService] Sent notification to user ${meal.user.email} for ${meal.mealTime}`);
          
          // Mark as reminder sent
          meal.reminderSent = true;
          await meal.save();
        } catch (error) {
          console.error(`[PushService] Error sending push to ${meal.user.email}:`, error);
          if (error.statusCode === 410 || error.statusCode === 404) {
            await User.findByIdAndUpdate(meal.user._id, {
              'preferences.pushSubscription': null
            });
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
