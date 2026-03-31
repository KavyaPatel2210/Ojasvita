/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Authentication Controller
 * 
 * This controller handles all authentication-related operations:
 * - User registration
 * - User login
 * - Profile management
 * - Password management
 * 
 * All operations use async/await with proper error handling.
 * 
 * Dependencies:
 * - User model: For user data operations
 * - bcryptjs: For password hashing and comparison
 * - jsonwebtoken: For JWT token generation
 * - healthCalculations: For calculating health metrics
 */

const User = require('../models/User');
const Admin = require('../models/Admin');
const { generateToken } = require('../middleware/authMiddleware');
const { 
  calculateBMI, 
  calculateBMR, 
  calculateTDEE, 
  calculateTargetCalories 
} = require('../utils/healthCalculations');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 * 
 * Process:
 * 1. Validate input data
 * 2. Check if user already exists
 * 3. Create new user (password is hashed in User model pre-save)
 * 4. Generate JWT token
 * 5. Return user data and token
 */
exports.register = async (req, res) => {
  try {
    // Extract user data from request body
    const { name, email, password, age, gender, height, weight, activityLevel, dietGoal, role } = req.body;

    if (role === 'admin') {
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide name, email, and password for admin'
        });
      }

      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Admin with this email already exists'
        });
      }

      const admin = await Admin.create({
        name,
        email,
        password,
        role: 'admin'
      });

      if (!admin) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create admin'
        });
      }

      const token = generateToken(admin._id);

      return res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        token: token,
        user: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt
        }
      });
    }

    // Validate required fields for normal user
    if (!name || !email || !password || !age || !gender || !height || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    // The User model's pre-save middleware will:
    // - Hash the password
    // - Calculate BMI, BMR, daily calorie need, and target calories
    const user = await User.create({
      name,
      email,
      password,
      age,
      gender,
      height,
      weight,
      activityLevel: activityLevel || 'moderate',
      dietGoal: dietGoal || 'maintain',
      role: 'user'
    });

    // Check if user was created successfully
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create user'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return success response with user data
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activityLevel,
        dietGoal: user.dietGoal,
        bmi: user.bmi,
        bmiCategory: user.bmiCategory,
        bmr: user.bmr,
        dailyCalorieNeed: user.dailyCalorieNeed,
        targetDailyCalories: user.targetDailyCalories,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 * 
 * Process:
 * 1. Validate input data
 * 2. Find user by email
 * 3. Compare password
 * 4. Generate JWT token
 * 5. Return user data and token
 */
exports.login = async (req, res) => {
  try {
    // Extract credentials from request body
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password and role'
      });
    }

    // Find user by email based on role
    // Note: We need to select password because it's excluded by default
    let account;
    
    if (role === 'admin') {
      account = await Admin.findOne({ email }).select('+password');
    } else {
      account = await User.findOne({ email }).select('+password');
    }
    
    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (account.role !== role) {
      return res.status(401).json({
        success: false,
        message: `Account is not assigned to ${role} role.`
      });
    }

    // Compare password
    const isMatch = await account.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(account._id);

    // Return success response based on role
    if (role === 'admin') {
      return res.json({
        success: true,
        message: 'Login successful',
        token: token,
        user: {
          _id: account._id,
          name: account.name,
          email: account.email,
          role: account.role,
          createdAt: account.createdAt
        }
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        _id: account._id,
        name: account.name,
        email: account.email,
        age: account.age,
        gender: account.gender,
        height: account.height,
        weight: account.weight,
        activityLevel: account.activityLevel,
        dietGoal: account.dietGoal,
        bmi: account.bmi,
        bmiCategory: account.bmiCategory,
        bmr: account.bmr,
        dailyCalorieNeed: account.dailyCalorieNeed,
        targetDailyCalories: account.targetDailyCalories,
        role: account.role,
        preferences: account.preferences,
        createdAt: account.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 * 
 * Process:
 * 1. User is already attached to request by auth middleware
 * 2. Return user data
 */
exports.getProfile = async (req, res) => {
  try {
    // Get user from database with latest data
    const user = await User.findById(req.user._id) || await Admin.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }

    // Return user profile
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activityLevel,
        dietGoal: user.dietGoal,
        bmi: user.bmi,
        bmiCategory: user.bmiCategory,
        bmr: user.bmr,
        dailyCalorieNeed: user.dailyCalorieNeed,
        targetDailyCalories: user.targetDailyCalories,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 * 
 * Process:
 * 1. Validate input data
 * 2. Check if email is being changed (and if it's available)
 * 3. Update user fields
 * 4. Save user (this triggers health calculations)
 * 5. Return updated user data
 */
exports.updateProfile = async (req, res) => {
  try {
    // Extract update data from request body
    const { 
      name, 
      age, 
      gender, 
      height, 
      weight, 
      activityLevel, 
      dietGoal,
      preferences 
    } = req.body;

    // Get current user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = req.body.email;
    }

    // Update user fields if provided
    if (name) user.name = name;
    if (age) user.age = age;
    if (gender) user.gender = gender;
    if (height) user.height = height;
    if (weight) user.weight = weight;
    if (activityLevel) user.activityLevel = activityLevel;
    if (dietGoal) user.dietGoal = dietGoal;
    
    // Update preferences if provided
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      };
    }

    // Save user - this triggers pre-save middleware
    // Which recalculates BMI, BMR, TDEE, and target calories
    await user.save();

    // Return updated user data
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activityLevel,
        dietGoal: user.dietGoal,
        bmi: user.bmi,
        bmiCategory: user.bmiCategory,
        bmr: user.bmr,
        dailyCalorieNeed: user.dailyCalorieNeed,
        targetDailyCalories: user.targetDailyCalories,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/password
 * @access  Private
 * 
 * Process:
 * 1. Validate current password
 * 2. Update to new password
 * 3. Save user (triggers password hashing)
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Return success message
    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating password'
    });
  }
};

/**
 * @desc    Recalculate health metrics
 * @route   POST /api/auth/recalculate
 * @access  Private
 * 
 * Process:
 * 1. Force recalculation of health metrics
 * 2. Return updated values
 */
exports.recalculateMetrics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Force recalculation by touching the record
    // This triggers pre-save middleware
    user.markModified('weight'); // Force re-evaluation
    await user.save();

    res.json({
      success: true,
      message: 'Health metrics recalculated',
      metrics: {
        bmi: user.bmi,
        bmiCategory: user.bmiCategory,
        bmr: user.bmr,
        dailyCalorieNeed: user.dailyCalorieNeed,
        targetDailyCalories: user.targetDailyCalories
      }
    });

  } catch (error) {
    console.error('Recalculate metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recalculating metrics'
    });
  }
};
