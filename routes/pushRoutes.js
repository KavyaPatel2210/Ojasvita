const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/push/subscribe
 * @desc    Subscribe a user device to Web Push notifications
 * @access  Private
 */
router.post('/subscribe', protect, async (req, res) => {
  try {
    const subscription = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription object' });
    }

    const user = await User.findById(req.user._id);
    
    // Check if device already subscribed
    const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.status(201).json({ success: true, message: 'Push subscription saved' });
  } catch (error) {
    console.error('Push Subscribe Error:', error);
    res.status(500).json({ success: false, message: 'Server error saving subscription' });
  }
});

module.exports = router;
