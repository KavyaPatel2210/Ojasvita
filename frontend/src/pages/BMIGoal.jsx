/**
 * Ojasvita - BMI & Goals Page
 * BMI calculator and diet goal management page
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, authAPI } from '../services/api';

const BMIGoal = () => {
  const { user, updateUser } = useAuth();
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const [formData, setFormData] = useState({
    weight: user?.weight || '',
    height: user?.height || '',
    activityLevel: user?.activityLevel || 'moderate',
    dietGoal: user?.dietGoal || 'maintain'
  });

  useEffect(() => {
    fetchHealthMetrics();
  }, []);

  const fetchHealthMetrics = async () => {
    try {
      const response = await analyticsAPI.getHealthMetrics();
      if (response.data.success) {
        setHealthMetrics(response.data.healthMetrics);
      }
    } catch (err) {
      console.error('Failed to fetch health metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      await updateUser({
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        activityLevel: formData.activityLevel,
        dietGoal: formData.dietGoal
      });
      fetchHealthMetrics();
    } catch (err) {
      console.error('Failed to recalculate:', err);
    } finally {
      setCalculating(false);
    }
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return 'N/A';
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (bmi < 25) return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-50' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'Obese', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const bmiInfo = getBMICategory(healthMetrics?.bmi);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">BMI & Goals</h1>
        <p className="text-gray-600">Track your health metrics and adjust your goals</p>
      </div>

      {/* BMI Card */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your BMI</h2>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
              <circle 
                cx="64" cy="64" r="56" 
                stroke={healthMetrics?.bmi < 18.5 ? '#3b82f6' : healthMetrics?.bmi < 25 ? '#10b981' : healthMetrics?.bmi < 30 ? '#f59e0b' : '#ef4444'} 
                strokeWidth="12" 
                fill="none"
                strokeDasharray={`${(healthMetrics?.bmi || 0) * 3.5} 351`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{healthMetrics?.bmi?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className={`text-xl font-semibold ${bmiInfo?.color}`}>{bmiInfo?.label}</p>
            <p className="text-gray-600 mt-2">
              {healthMetrics?.bmi < 18.5 && 'Your BMI indicates you may be underweight. Consider consulting a nutritionist.'}
              {healthMetrics?.bmi >= 18.5 && healthMetrics?.bmi < 25 && 'Your BMI is in the healthy range. Keep up the good work!'}
              {healthMetrics?.bmi >= 25 && healthMetrics?.bmi < 30 && 'Your BMI indicates you may be overweight. Consider adjusting your diet and exercise.'}
              {healthMetrics?.bmi >= 30 && 'Your BMI indicates obesity. Please consult a healthcare provider for guidance.'}
            </p>
          </div>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Basal Metabolic Rate</p>
          <p className="text-2xl font-bold text-gray-900">{healthMetrics?.bmr || 0}</p>
          <p className="text-sm text-gray-500">calories/day at rest</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Daily Calorie Need</p>
          <p className="text-2xl font-bold text-gray-900">{healthMetrics?.dailyCalorieNeed || 0}</p>
          <p className="text-sm text-gray-500">based on activity level</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Target Calories</p>
          <p className="text-2xl font-bold text-primary-600">{healthMetrics?.targetDailyCalories || 0}</p>
          <p className="text-sm text-gray-500">based on your goal</p>
        </div>
      </div>

      {/* Update Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Your Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Current Weight (kg)</label>
            <input
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleChange}
              className="input-field"
              placeholder="70"
            />
          </div>
          <div>
            <label className="label">Current Height (cm)</label>
            <input
              name="height"
              type="number"
              value={formData.height}
              onChange={handleChange}
              className="input-field"
              placeholder="170"
            />
          </div>
          <div>
            <label className="label">Activity Level</label>
            <select
              name="activityLevel"
              value={formData.activityLevel}
              onChange={handleChange}
              className="input-field"
            >
              <option value="sedentary">Sedentary (little or no exercise)</option>
              <option value="light">Light (exercise 1-3 days/week)</option>
              <option value="moderate">Moderate (exercise 3-5 days/week)</option>
              <option value="active">Active (exercise 6-7 days/week)</option>
              <option value="very_active">Very Active (hard exercise daily)</option>
            </select>
          </div>
          <div>
            <label className="label">Diet Goal</label>
            <select
              name="dietGoal"
              value={formData.dietGoal}
              onChange={handleChange}
              className="input-field"
            >
              <option value="lose">Lose Weight (-500 cal/day)</option>
              <option value="maintain">Maintain Weight</option>
              <option value="gain">Gain Weight (+500 cal/day)</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={handleRecalculate}
            disabled={calculating}
            className="btn-primary"
          >
            {calculating ? 'Calculating...' : 'Recalculate My Metrics'}
          </button>
        </div>
      </div>

      {/* BMI Chart Reference */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">BMI Reference Chart</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Underweight</p>
              <p className="text-sm text-gray-500">Less than 18.5</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Normal</p>
              <p className="text-sm text-gray-500">18.5 - 24.9</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 rounded bg-amber-500"></div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Overweight</p>
              <p className="text-sm text-gray-500">25 - 29.9</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Obese</p>
              <p className="text-sm text-gray-500">30 or greater</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BMIGoal;
