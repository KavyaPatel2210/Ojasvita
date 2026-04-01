const User = require('../models/User');

/**
 * @desc    Save push subscription for current user
 * @route   POST /api/auth/subscribe
 * @access  Private
 */
exports.subscribe = async (req, res) => {
  try {
    let { subscription, timezoneOffset } = req.body;
    
    // Safety check: sometimes subscription might be double-wrapped
    if (subscription && subscription.subscription) {
      timezoneOffset = subscription.timezoneOffset;
      subscription = subscription.subscription;
    }

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: 'A valid Push Subscription with an endpoint is required'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Save subscription to user preferences
    user.preferences.pushSubscription = subscription;
    if (timezoneOffset !== undefined) {
      user.preferences.timezoneOffset = timezoneOffset;
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Push subscription saved successfully'
    });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error saving push subscription'
    });
  }
};

/**
 * @desc    Remove push subscription for current user
 * @route   POST /api/auth/unsubscribe
 * @access  Private
 */
exports.unsubscribe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.preferences.pushSubscription = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Push subscription removed successfully'
    });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing push subscription'
    });
  }
};

/**
 * @desc    Send test push notification to current user
 * @route   POST /api/auth/test-push
 * @access  Private
 */
exports.sendTestNotification = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    if (!user || !user.preferences.pushSubscription) {
      return res.status(400).json({
        success: false,
        message: 'No push subscription found for this user. Please enable notifications first.'
      });
    }

    const webpush = require('web-push');
    // Ensure VAPID details are set (if not already by the service)
    if (!process.env.VAPID_PUBLIC_KEY) {
      const vapid = require('../vapid.json');
      webpush.setVapidDetails(
        'mailto:ojasvita.app@gmail.com',
        vapid.publicKey,
        vapid.privateKey
      );
    }

    const payload = JSON.stringify({
      title: '🎉 Ojasvita Test Alert!',
      body: 'Your push notifications are set up correctly! You will now receive meal reminders even when the app is closed.',
      data: { url: '/dashboard' },
      tag: 'test-push',
      renotify: true
    });

    await webpush.sendNotification(user.preferences.pushSubscription, payload);

    res.json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    console.error('Test push error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification: ' + error.message
    });
  }
};
