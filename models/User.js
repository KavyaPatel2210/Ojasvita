/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * User Model
 * 
 * This model defines the user schema for the application.
 * Users can register, login, and manage their diet profiles.
 * 
 * Stored Data:
 * - Authentication credentials (email, password)
 * - Personal information (name, age, gender)
 * - Physical metrics (height, weight)
 * - Activity level and diet goals
 * - Calculated health metrics (BMI, BMR, daily calorie needs)
 * 
 * Dependencies:
 * - mongoose: MongoDB ODM for defining schemas and models
 * - bcryptjs: Password hashing for secure storage
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema Definition
 * 
 * Defines the structure and validation rules for user documents in MongoDB.
 * Each field has specific validation to ensure data integrity.
 */
const userSchema = new mongoose.Schema({
  // User's email address - unique identifier for authentication
  // Required for login and password reset functionality
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },

  // User's password - stored as hashed for security
  // Minimum 6 characters required
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Exclude from queries by default for security
  },

  // User's full name
  // Display name shown throughout the application
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },

  // User's age in years
  // Used for BMR (Basal Metabolic Rate) calculation
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [13, 'Age must be at least 13'],
    max: [120, 'Age cannot exceed 120']
  },

  // User's gender
  // Used for BMR calculation (different formulas for male/female)
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other'],
    lowercase: true
  },

  // User's height in centimeters
  // Used for BMI calculation and BMR estimation
  height: {
    type: Number,
    required: [true, 'Height is required'],
    min: [50, 'Height must be at least 50 cm'],
    max: [300, 'Height cannot exceed 300 cm']
  },

  // User's weight in kilograms
  // Used for BMI calculation and calorie needs
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [20, 'Weight must be at least 20 kg'],
    max: [500, 'Weight cannot exceed 500 kg']
  },

  // User's activity level
  // Multiplier for calculating daily calorie needs
  // Options:
  // - sedentary: little or no exercise (BMR × 1.2)
  // - light: light exercise 1-3 days/week (BMR × 1.375)
  // - moderate: moderate exercise 3-5 days/week (BMR × 1.55)
  // - active: hard exercise 6-7 days/week (BMR × 1.725)
  // - very_active: very hard exercise & physical job (BMR × 1.9)
  activityLevel: {
    type: String,
    required: [true, 'Activity level is required'],
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    default: 'moderate'
  },

  // User's diet goal
  // Determines calorie adjustment for weight management
  // Options:
  // - lose: calorie deficit for weight loss
  // - maintain: maintenance calories for weight maintenance
  // - gain: calorie surplus for weight gain
  dietGoal: {
    type: String,
    required: [true, 'Diet goal is required'],
    enum: ['lose', 'maintain', 'gain'],
    default: 'maintain'
  },

  // User's role
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // Calculated BMI (Body Mass Index)
  // Formula: weight(kg) / height(m)^2
  // Stored for quick access and historical tracking
  bmi: {
    type: Number,
    default: null
  },

  // Calculated BMR (Basal Metabolic Rate)
  // Estimated calories burned at rest
  // Used as baseline for daily calorie calculation
  bmr: {
    type: Number,
    default: null
  },

  // Daily calorie requirement based on activity level
  // This is the maintenance calories (TDEE - Total Daily Energy Expenditure)
  dailyCalorieNeed: {
    type: Number,
    default: null
  },

  // Target daily calories based on diet goal
  // Calculated from dailyCalorieNeed with goal adjustment
  // Default: -500 for lose, 0 for maintain, +500 for gain
  targetDailyCalories: {
    type: Number,
    default: null
  },

  // User preferences for notifications and reminders
  preferences: {
    remindMeals: { type: Boolean, default: true },
    remindWater: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: true },
    pushSubscription: { type: Object, default: null }
  },

  // Account creation timestamp
  createdAt: {
    type: Date,
    default: Date.now
  },

  // Last profile update timestamp
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Mongoose options
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Pre-save middleware to hash password
 * 
 * Automatically hashes the password before saving to database.
 * Uses bcryptjs for secure password hashing.
 * Only hashes if password has been modified.
 */
userSchema.pre('save', async function(next) {
  // Skip if password is not modified
  if (!this.isModified('password')) {
    next();
  }

  // Generate salt for hashing
  // Salt adds random data to the password before hashing
  // This protects against rainbow table attacks
  const salt = await bcrypt.genSalt(10);
  
  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Pre-save middleware to calculate health metrics
 * 
 * Automatically calculates BMI, BMR, and daily calorie needs
 * when user profile is created or updated.
 */
userSchema.pre('save', async function(next) {
  // Update timestamp
  this.updatedAt = Date.now();

  // Calculate BMI if not set or if weight/height changed
  if (this.isModified('weight') || this.isModified('height') || !this.bmi) {
    const heightInMeters = this.height / 100;
    this.bmi = Math.round((this.weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }

  // Calculate BMR if not set or if relevant fields changed
  if (this.isModified('weight') || this.isModified('height') || 
      this.isModified('age') || this.isModified('gender') || !this.bmr) {
    // Mifflin-St Jeor Equation (more accurate than Harris-Benedict)
    // For men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
    // For women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
    if (this.gender === 'male') {
      this.bmr = Math.round(10 * this.weight + 6.25 * this.height - 5 * this.age + 5);
    } else {
      this.bmr = Math.round(10 * this.weight + 6.25 * this.height - 5 * this.age - 161);
    }
  }

  // Calculate daily calorie need (TDEE) if not set or if relevant fields changed
  if (this.isModified('activityLevel') || !this.dailyCalorieNeed) {
    // Activity level multipliers
    const activityMultipliers = {
      'sedentary': 1.2,      // Little or no exercise
      'light': 1.375,        // Light exercise 1-3 days/week
      'moderate': 1.55,      // Moderate exercise 3-5 days/week
      'active': 1.725,       // Hard exercise 6-7 days/week
      'very_active': 1.9     // Very hard exercise & physical job
    };
    
    const multiplier = activityMultipliers[this.activityLevel] || 1.55;
    this.dailyCalorieNeed = Math.round(this.bmr * multiplier);
  }

  // Calculate target daily calories based on diet goal
  if (this.isModified('dietGoal') || this.isModified('dailyCalorieNeed') || !this.targetDailyCalories) {
    // Calorie adjustment based on goal
    // Lose: -500 calories/day (~0.5kg/week weight loss)
    // Maintain: 0 calories
    // Gain: +500 calories/day (~0.5kg/week weight gain)
    const goalAdjustments = {
      'lose': -500,
      'maintain': 0,
      'gain': 500
    };
    
    const adjustment = goalAdjustments[this.dietGoal] || 0;
    this.targetDailyCalories = this.dailyCalorieNeed + adjustment;
  }

  next();
});

/**
 * Instance method to compare passwords
 * 
 * Used during login to verify user credentials.
 * Compares provided password with stored hashed password.
 * 
 * @param {string} enteredPassword - The password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  // Use bcrypt.compare for secure password comparison
  // This compares the plain password with the hashed version
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Virtual field for user's diet goal display text
 * 
 * Provides a human-readable version of the diet goal.
 */
userSchema.virtual('dietGoalText').get(function() {
  const goalTexts = {
    'lose': 'Lose Weight',
    'maintain': 'Maintain Weight',
    'gain': 'Gain Weight'
  };
  return goalTexts[this.dietGoal] || 'Maintain Weight';
});

/**
 * Virtual field for BMI category
 * 
 * Categorizes BMI into standard health categories.
 */
userSchema.virtual('bmiCategory').get(function() {
  if (!this.bmi) return 'Not Calculated';
  if (this.bmi < 18.5) return 'Underweight';
  if (this.bmi < 25) return 'Normal';
  if (this.bmi < 30) return 'Overweight';
  return 'Obese';
});

// Create indexes for frequently queried fields
// Email index for fast login lookups
userSchema.index({ email: 1 });
// CreatedAt index for sorting by registration date
userSchema.index({ createdAt: -1 });

/**
 * User Model
 * 
 * Mongoose model created from the userSchema.
 * Used for CRUD operations on user documents.
 */
const User = mongoose.model('User', userSchema);

// Export the User model
module.exports = User;
