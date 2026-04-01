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
