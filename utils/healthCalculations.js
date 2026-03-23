/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Health Calculations Utility
 * 
 * This file contains all health-related calculation functions.
 * These formulas are used throughout the application for:
 * - BMI calculation
 * - BMR (Basal Metabolic Rate) calculation
 * - Daily calorie needs (TDEE) calculation
 * - Goal-based calorie adjustments
 * - Macronutrient recommendations
 * 
 * All formulas are based on established nutritional science and research.
 * Formulas used:
 * - BMI: WHO standard formula
 * - BMR: Mifflin-St Jeor Equation (considered most accurate)
 * - TDEE: BMR × Activity Multiplier
 * 
 * Dependencies:
 * - None (pure JavaScript functions)
 */

/**
 * Calculate Body Mass Index (BMI)
 * 
 * BMI is a measure of body fat based on height and weight.
 * Formula: weight(kg) / height(m)²
 * 
 * BMI Categories (WHO):
 * - Underweight: < 18.5
 * - Normal: 18.5 - 24.9
 * - Overweight: 25 - 29.9
 * - Obese: ≥ 30
 * 
 * @param {number} weightKg - Weight in kilograms
 * @param {number} heightCm - Height in centimeters
 * @returns {Object} - BMI value and category
 */
const calculateBMI = (weightKg, heightCm) => {
  // Validate inputs
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return { bmi: null, category: 'Invalid input' };
  }

  // Convert height to meters
  const heightM = heightCm / 100;

  // Calculate BMI using formula: weight / height²
  const bmi = weightKg / (heightM * heightM);

  // Round to 1 decimal place
  const roundedBMI = Math.round(bmi * 10) / 10;

  // Determine category
  let category;
  if (roundedBMI < 18.5) {
    category = 'Underweight';
  } else if (roundedBMI < 25) {
    category = 'Normal';
  } else if (roundedBMI < 30) {
    category = 'Overweight';
  } else {
    category = 'Obese';
  }

  return {
    bmi: roundedBMI,
    category: category,
    // Additional info
    description: getBMIDescription(category)
  };
};

/**
 * Get BMI description based on category
 * 
 * @param {string} category - BMI category
 * @returns {string} - Description
 */
const getBMIDescription = (category) => {
  const descriptions = {
    'Underweight': 'You may be underweight. Consider consulting a nutritionist for a balanced diet plan.',
    'Normal': 'Great! Your weight is in the healthy range. Maintain your current lifestyle.',
    'Overweight': 'Your weight is above the healthy range. Consider diet and exercise modifications.',
    'Obese': 'Your weight indicates obesity. Please consult a healthcare provider for guidance.'
  };
  return descriptions[category] || '';
};

/**
 * Calculate Basal Metabolic Rate (BMR)
 * 
 * BMR is the number of calories your body burns at rest.
 * It represents the minimum energy needed to maintain vital functions.
 * 
 * Formula: Mifflin-St Jeor Equation
 * For men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
 * For women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
 * 
 * This formula is considered more accurate than Harris-Benedict.
 * 
 * @param {number} weightKg - Weight in kilograms
 * @param {number} heightCm - Height in centimeters
 * @param {number} age - Age in years
 * @param {string} gender - 'male' or 'female'
 * @returns {number} - BMR value in calories
 */
const calculateBMR = (weightKg, heightCm, age, gender) => {
  // Validate inputs
  if (!weightKg || !heightCm || !age || !gender) {
    return null;
  }

  let bmr;

  // Calculate based on gender using Mifflin-St Jeor Equation
  if (gender.toLowerCase() === 'male') {
    // Male formula: 10W + 6.25H - 5A + 5
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else if (gender.toLowerCase() === 'female') {
    // Female formula: 10W + 6.25H - 5A - 161
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  } else {
    // For 'other' gender, use average of male (+5) and female (-161) formulas = -78
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 78;
  }

  // Round to nearest whole number
  return Math.round(bmr);
};

/**
 * Activity Level Multipliers
 * 
 * These multipliers are used to calculate TDEE (Total Daily Energy Expenditure).
 * They represent the additional calories burned through physical activity.
 * 
 * Values based on:
 * - Sedentary: Desk job, little to no exercise (BMR × 1.2)
 * - Light: Light exercise 1-3 days/week (BMR × 1.375)
 * - Moderate: Moderate exercise 3-5 days/week (BMR × 1.55)
 * - Active: Hard exercise 6-7 days/week (BMR × 1.725)
 * - Very Active: Very hard exercise, physical job (BMR × 1.9)
 */
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * 
 * TDEE is the total number of calories you burn in a day.
 * It's calculated by multiplying BMR by the activity level multiplier.
 * 
 * This represents maintenance calories - what you need to maintain current weight.
 * 
 * @param {number} bmr - Basal Metabolic Rate
 * @param {string} activityLevel - Activity level key
 * @returns {number} - Daily calorie need
 */
const calculateTDEE = (bmr, activityLevel) => {
  if (!bmr || !activityLevel) {
    return null;
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel.toLowerCase()] || 1.55;
  return Math.round(bmr * multiplier);
};

/**
 * Diet Goal Adjustments
 * 
 * Calorie adjustments for different diet goals.
 * These values create a caloric deficit or surplus for weight management.
 * 
 * Weight loss: -500 calories/day ≈ 0.5kg (1lb) per week
 * Weight gain: +500 calories/day ≈ 0.5kg (1lb) per week
 * Maintenance: 0 calories (eat at TDEE)
 */
const GOAL_ADJUSTMENTS = {
  lose: -500,      // Calorie deficit for weight loss
  maintain: 0,    // Maintenance calories
  gain: 500       // Calorie surplus for weight gain
};

/**
 * Calculate target daily calories based on goal
 * 
 * @param {number} tdee - Total Daily Energy Expenditure
 * @param {string} goal - Diet goal ('lose', 'maintain', 'gain')
 * @returns {Object} - Target calories and adjustment info
 */
const calculateTargetCalories = (tdee, goal) => {
  if (!tdee || !goal) {
    return { target: null, adjustment: 0 };
  }

  const adjustment = GOAL_ADJUSTMENTS[goal.toLowerCase()] || 0;
  const target = tdee + adjustment;

  return {
    target: Math.round(target),
    adjustment: adjustment,
    weeklyChange: adjustment * 7, // Weekly calorie change
    expectedWeeklyWeightChange: (adjustment * 7) / 7700 // ~7700 calories = 1kg
  };
};

/**
 * Calculate recommended macronutrients
 * 
 * Based on the target daily calories and diet goal.
 * General guideline percentages:
 * - Protein: 30% (for muscle building/satiety)
 * - Carbs: 40% (for energy)
 * - Fats: 30% (for hormone production)
 * 
 * Alternative (bodybuilder): 40% protein, 35% carbs, 25% fats
 * 
 * @param {number} targetCalories - Target daily calories
 * @param {string} goal - Diet goal
 * @returns {Object} - Macro recommendations in grams
 */
const calculateMacros = (targetCalories, goal = 'maintain') => {
  if (!targetCalories) {
    return { protein: 0, carbs: 0, fats: 0 };
  }

  let proteinPercent, carbsPercent, fatsPercent;

  // Adjust macro ratios based on goal
  switch (goal.toLowerCase()) {
    case 'lose':
      // Higher protein for muscle preservation during weight loss
      proteinPercent = 0.35;
      carbsPercent = 0.35;
      fatsPercent = 0.30;
      break;
    case 'gain':
      // Higher carbs for energy during muscle building
      proteinPercent = 0.25;
      carbsPercent = 0.50;
      fatsPercent = 0.25;
      break;
    default:
      // Balanced for maintenance
      proteinPercent = 0.30;
      carbsPercent = 0.40;
      fatsPercent = 0.30;
  }

  // Calculate grams (protein & carbs = 4 cal/g, fat = 9 cal/g)
  const protein = Math.round((targetCalories * proteinPercent) / 4);
  const carbs = Math.round((targetCalories * carbsPercent) / 4);
  const fats = Math.round((targetCalories * fatsPercent) / 9);

  return {
    protein: protein,
    carbs: carbs,
    fats: fats,
    proteinPercent: Math.round(proteinPercent * 100),
    carbsPercent: Math.round(carbsPercent * 100),
    fatsPercent: Math.round(fatsPercent * 100)
  };
};

/**
 * Calculate calorie redistribution
 * 
 * When daily calories exceed target, redistribute excess across future days.
 * This helps maintain overall calorie balance without extreme restrictions.
 * 
 * @param {number} excessCalories - Calories over target
 * @param {number} daysToDistribute - Number of days to spread excess (default: 3)
 * @returns {Object} - Redistribution details
 */
const calculateRedistribution = (excessCalories, daysToDistribute = 3) => {
  if (excessCalories <= 0) {
    return {
      redistributed: false,
      amount: 0,
      dailyAmount: 0,
      days: 0
    };
  }

  // Don't redistribute if excess is very small (less than 10 calories makes daily reduction < 2)
  if (excessCalories < 10) {
    return {
      redistributed: false,
      amount: 0,
      dailyAmount: 0,
      days: 0
    };
  }

  const dailyAmount = Math.round(excessCalories / daysToDistribute);

  return {
    redistributed: true,
    amount: excessCalories,
    dailyAmount: dailyAmount,
    days: daysToDistribute,
    // Calculate adjusted targets for next few days
    adjustedTargets: Array.from({ length: daysToDistribute }, (_, i) => ({
      day: i + 1,
      reduction: dailyAmount
    }))
  };
};

/**
 * Calculate progress percentage
 * 
 * @param {number} consumed - Calories consumed
 * @param {number} target - Target calories
 * @returns {Object} - Progress details
 */
const calculateProgress = (consumed, target) => {
  if (!target || target === 0) {
    return { percentage: 0, remaining: 0, status: 'no_target' };
  }

  const percentage = Math.round((consumed / target) * 100);
  const remaining = target - consumed;
  
  let status;
  if (percentage < 80) {
    status = 'under';
  } else if (percentage <= 100) {
    status = 'on_track';
  } else {
    status = 'over';
  }

  return {
    percentage: percentage,
    remaining: remaining,
    consumed: consumed,
    target: target,
    status: status,
    isOverTarget: consumed > target
  };
};

/**
 * Calculate weekly averages
 * 
 * @param {Array} dailyData - Array of daily calorie data
 * @returns {Object} - Weekly averages
 */
const calculateWeeklyAverages = (dailyData) => {
  if (!dailyData || dailyData.length === 0) {
    return {
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFats: 0,
      daysLogged: 0
    };
  }

  const total = dailyData.reduce((acc, day) => ({
    calories: acc.calories + (day.calories || 0),
    protein: acc.protein + (day.protein || 0),
    carbs: acc.carbs + (day.carbs || 0),
    fats: acc.fats + (day.fats || 0)
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const daysLogged = dailyData.length;

  return {
    avgCalories: Math.round(total.calories / daysLogged),
    avgProtein: Math.round(total.protein / daysLogged),
    avgCarbs: Math.round(total.carbs / daysLogged),
    avgFats: Math.round(total.fats / daysLogged),
    daysLogged: daysLogged
  };
};

/**
 * Get activity level description
 * 
 * @param {string} activityLevel - Activity level key
 * @returns {string} - Description
 */
const getActivityDescription = (activityLevel) => {
  const descriptions = {
    sedentary: 'Little or no exercise. Desk job.',
    light: 'Light exercise 1-3 days per week.',
    moderate: 'Moderate exercise 3-5 days per week.',
    active: 'Hard exercise 6-7 days per week.',
    very_active: 'Very hard exercise, physical job, or training.'
  };
  return descriptions[activityLevel.toLowerCase()] || '';
};

/**
 * Get goal description
 * 
 * @param {string} goal - Diet goal
 * @returns {Object} - Goal details
 */
const getGoalInfo = (goal) => {
  const goals = {
    lose: {
      description: 'Lose weight',
      weeklyRate: '~0.5 kg per week',
      adjustment: -500
    },
    maintain: {
      description: 'Maintain weight',
      weeklyRate: 'No change',
      adjustment: 0
    },
    gain: {
      description: 'Gain weight',
      weeklyRate: '~0.5 kg per week',
      adjustment: 500
    }
  };
  return goals[goal.toLowerCase()] || goals.maintain;
};

// Export all calculation functions
module.exports = {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  calculateRedistribution,
  calculateProgress,
  calculateWeeklyAverages,
  getActivityDescription,
  getGoalInfo,
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS
};
