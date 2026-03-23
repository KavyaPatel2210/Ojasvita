const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  _id_str: {
    type: String,
    required: true,
    unique: true // This matches the generateNotificationId format
  },
  type: {
    type: String,
    enum: ['meal', 'water', 'streak', 'goal', 'info'],
    required: true
  },
  subType: String,
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  icon: String,
  isRead: {
    type: Boolean,
    default: false
  },
  dismissed: {
    type: Boolean,
    default: false
  },
  data: Object, // Extra data like calories, time, etc.
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 7 // Expire after 7 days
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
