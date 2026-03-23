/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Water Intake Controller
 * 
 * This controller handles all water intake related operations:
 * - Add water log
 * - Get today's water intake
 * - Get water intake by date range
 * - Get weekly statistics
 * - Update daily goal
 * 
 * Dependencies:
 * - WaterIntake model: For water intake CRUD operations
 */

const WaterIntake = require('../models/WaterIntake');
const { getDayBounds } = require('../utils/helpers');

/**
 * @desc    Add water intake log
 * @route   POST /api/water/add
 * @access  Private
 */
exports.addWaterLog = async (req, res) => {
  try {
    const { amount, note } = req.body;

    // Validate required fields
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid water amount (minimum 1ml)'
      });
    }

    // Get or create today's water intake
    const waterIntake = await WaterIntake.getTodayIntake(req.user._id);

    // Add the log
    const result = await waterIntake.addLog(amount, note || '');

    res.json({
      success: true,
      message: result.goalJustMet 
        ? 'Water log added! Daily goal achieved! 🎉' 
        : 'Water log added successfully',
      waterIntake: {
        totalIntake: result.waterIntake.totalIntake,
        dailyGoal: result.waterIntake.dailyGoal,
        progressPercentage: result.waterIntake.progressPercentage,
        remaining: result.waterIntake.remaining,
        goalMet: result.waterIntake.goalMet,
        glassesCount: result.waterIntake.glassesCount
      },
      goalJustMet: result.goalJustMet
    });

  } catch (error) {
    console.error('Add water log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding water log'
    });
  }
};

/**
 * @desc    Get today's water intake
 * @route   GET /api/water/today
 * @access  Private
 */
exports.getTodayIntake = async (req, res) => {
  try {
    const waterIntake = await WaterIntake.getTodayIntake(req.user._id);

    res.json({
      success: true,
      waterIntake: {
        totalIntake: waterIntake.totalIntake,
        dailyGoal: waterIntake.dailyGoal,
        progressPercentage: waterIntake.progressPercentage,
        remaining: waterIntake.remaining,
        goalMet: waterIntake.goalMet,
        glassesCount: waterIntake.glassesCount,
        logs: waterIntake.logs,
        lastLogTime: waterIntake.lastLogTime
      }
    });

  } catch (error) {
    console.error('Get today intake error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching today\'s water intake'
    });
  }
};

/**
 * @desc    Get water intake by date
 * @route   GET /api/water?date=YYYY-MM-DD
 * @access  Private
 */
exports.getIntakeByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a date'
      });
    }

    const requestDate = new Date(date);
    const { start, end } = getDayBounds(requestDate);

    let waterIntake = await WaterIntake.findOne({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    if (!waterIntake) {
      // Return empty intake if no record exists
      waterIntake = {
        totalIntake: 0,
        dailyGoal: 2000,
        progressPercentage: 0,
        remaining: 2000,
        goalMet: false,
        glassesCount: 0,
        logs: []
      };
    }

    res.json({
      success: true,
      date: date,
      waterIntake: {
        totalIntake: waterIntake.totalIntake,
        dailyGoal: waterIntake.dailyGoal,
        progressPercentage: waterIntake.progressPercentage,
        remaining: waterIntake.remaining,
        goalMet: waterIntake.goalMet,
        glassesCount: waterIntake.glassesCount,
        logs: waterIntake.logs
      }
    });

  } catch (error) {
    console.error('Get intake by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching water intake by date'
    });
  }
};

/**
 * @desc    Get water intake by date range
 * @route   GET /api/water/range?start=YYYY-MM-DD&end=YYYY-MM-DD
 * @access  Private
 */
exports.getIntakeByRange = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Please provide start and end dates'
      });
    }

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const records = await WaterIntake.getIntakeByRange(req.user._id, startDate, endDate);

    res.json({
      success: true,
      startDate: start,
      endDate: end,
      records: records.map(r => ({
        date: r.date,
        totalIntake: r.totalIntake,
        dailyGoal: r.dailyGoal,
        progressPercentage: r.progressPercentage,
        goalMet: r.goalMet,
        glassesCount: r.glassesCount
      })),
      count: records.length
    });

  } catch (error) {
    console.error('Get intake by range error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching water intake by range'
    });
  }
};

/**
 * @desc    Get weekly water intake statistics
 * @route   GET /api/water/weekly
 * @access  Private
 */
exports.getWeeklyStats = async (req, res) => {
  try {
    const stats = await WaterIntake.getWeeklyStats(req.user._id);

    res.json({
      success: true,
      weeklyStats: {
        totalIntake: stats.totalIntake,
        averageIntake: stats.averageIntake,
        daysLogged: stats.daysLogged,
        goalsMet: stats.goalsMet,
        goalAchievementRate: stats.goalAchievementRate,
        records: stats.records.map(r => ({
          date: r.date,
          totalIntake: r.totalIntake,
          dailyGoal: r.dailyGoal,
          progressPercentage: r.progressPercentage,
          goalMet: r.goalMet
        }))
      }
    });

  } catch (error) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching weekly water stats'
    });
  }
};

/**
 * @desc    Update daily water goal
 * @route   PUT /api/water/goal
 * @access  Private
 */
exports.updateDailyGoal = async (req, res) => {
  try {
    const { dailyGoal } = req.body;

    // Validate
    if (!dailyGoal || dailyGoal < 500 || dailyGoal > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid daily goal (500-10000 ml)'
      });
    }

    const waterIntake = await WaterIntake.getTodayIntake(req.user._id);
    waterIntake.dailyGoal = dailyGoal;
    await waterIntake.save();

    res.json({
      success: true,
      message: 'Daily water goal updated successfully',
      waterIntake: {
        totalIntake: waterIntake.totalIntake,
        dailyGoal: waterIntake.dailyGoal,
        progressPercentage: waterIntake.progressPercentage,
        remaining: waterIntake.remaining,
        goalMet: waterIntake.goalMet
      }
    });

  } catch (error) {
    console.error('Update daily goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating daily water goal'
    });
  }
};

/**
 * @desc    Delete a water log
 * @route   DELETE /api/water/:logId
 * @access  Private
 */
exports.deleteWaterLog = async (req, res) => {
  try {
    const { logId } = req.params;

    const waterIntake = await WaterIntake.getTodayIntake(req.user._id);

    // Find and remove the log
    const logIndex = waterIntake.logs.findIndex(
      log => log._id.toString() === logId
    );

    if (logIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Water log not found'
      });
    }

    // Subtract the amount from total
    const removedAmount = waterIntake.logs[logIndex].amount;
    waterIntake.totalIntake = Math.max(0, waterIntake.totalIntake - removedAmount);
    
    // Remove the log
    waterIntake.logs.splice(logIndex, 1);
    
    await waterIntake.save();

    res.json({
      success: true,
      message: 'Water log deleted successfully',
      waterIntake: {
        totalIntake: waterIntake.totalIntake,
        dailyGoal: waterIntake.dailyGoal,
        progressPercentage: waterIntake.progressPercentage,
        remaining: waterIntake.remaining,
        goalMet: waterIntake.goalMet,
        glassesCount: waterIntake.glassesCount
      }
    });

  } catch (error) {
    console.error('Delete water log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting water log'
    });
  }
};
