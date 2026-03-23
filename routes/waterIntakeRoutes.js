/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Water Intake Routes
 * 
 * This file defines all water intake API routes.
 * All routes are protected and require authentication.
 * 
 * Routes:
 * - POST /api/water/add - Add water log
 * - GET /api/water/today - Get today's water intake
 * - GET /api/water - Get water intake by date
 * - GET /api/water/range - Get water intake by date range
 * - GET /api/water/weekly - Get weekly water stats
 * - PUT /api/water/goal - Update daily goal
 * - DELETE /api/water/:logId - Delete a water log
 * 
 * Dependencies:
 * - express: Web framework
 * - waterIntakeController: Controller for water intake operations
 * - authMiddleware: Middleware for authentication
 */

const express = require('express');
const router = express.Router();

const {
  addWaterLog,
  getTodayIntake,
  getIntakeByDate,
  getIntakeByRange,
  getWeeklyStats,
  updateDailyGoal,
  deleteWaterLog
} = require('../controllers/waterIntakeController');

const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Route to add water log
router.post('/add', addWaterLog);

// Route to get today's water intake
router.get('/today', getTodayIntake);

// Route to get water intake by date
router.get('/', getIntakeByDate);

// Route to get water intake by date range
router.get('/range', getIntakeByRange);

// Route to get weekly water statistics
router.get('/weekly', getWeeklyStats);

// Route to update daily water goal
router.put('/goal', updateDailyGoal);

// Route to delete a water log
router.delete('/:logId', deleteWaterLog);

// Export the router
module.exports = router;
