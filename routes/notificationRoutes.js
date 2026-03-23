/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Notification Routes
 * 
 * This file defines all notification API routes.
 * All routes are protected and require authentication.
 * 
 * Routes:
 * - GET /api/notifications - Get all notifications for today
 * - GET /api/notifications/summary - Get notification summary/counts
 * - PUT /api/notifications/:id/read - Mark notification as read
 * - PUT /api/notifications/:id/dismiss - Dismiss notification
 * 
 * Dependencies:
 * - express: Web framework
 * - notificationController: Controller for notification operations
 * - authMiddleware: Middleware for authentication
 */

const express = require('express');
const router = express.Router();

const {
  getAllNotifications,
  getNotificationSummary,
  markAsRead,
  dismissNotification
} = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Route to get all notifications
router.get('/', getAllNotifications);

// Route to get notification summary
router.get('/summary', getNotificationSummary);

// Route to mark notification as read
router.put('/:id/read', markAsRead);

// Route to dismiss notification
router.put('/:id/dismiss', dismissNotification);

// Export the router
module.exports = router;
