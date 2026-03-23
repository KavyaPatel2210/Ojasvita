/**
 * Ojasvita - Dashboard Page
 * Main dashboard showing daily progress, streaks, and quick stats
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, mealPlanAPI } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nextMeal, setNextMeal] = useState(null);
  const [showNextMealPopup, setShowNextMealPopup] = useState(false);
  const [showCaloriesPopup, setShowCaloriesPopup] = useState(false);
  const [showTargetPopup, setShowTargetPopup] = useState(false);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [showMealsPopup, setShowMealsPopup] = useState(false);


  const { fetchAllNotifications } = useNotifications();


  useEffect(() => {
    fetchDashboardData();
    fetchNextMeal();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsAPI.getDashboardData();
      if (response.data.success) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextMeal = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await mealPlanAPI.getMealPlansByDate(today);

      if (response.data.success && response.data.mealPlans.length > 0) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const upcomingMeals = response.data.mealPlans
          .filter(plan => plan.status === 'planned')
          .map(plan => {
            const [hours, minutes] = plan.scheduledTime.split(':').map(Number);
            const planTime = hours * 60 + minutes;
            return { ...plan, planTime };
          })
          .filter(plan => plan.planTime > currentTime)
          .sort((a, b) => a.planTime - b.planTime);

        if (upcomingMeals.length > 0) {
          setNextMeal(upcomingMeals[0]);
        } else {
          const plannedMeals = response.data.mealPlans.filter(plan => plan.status === 'planned');
          if (plannedMeals.length > 0) {
            setNextMeal(plannedMeals[0]);
          } else {
            setNextMeal(null);
          }
        }
      } else {
        setNextMeal(null);
      }
    } catch (err) {
      console.error('Failed to fetch next meal:', err);
    }
  };

  const handleDashboardCompleteMeal = async (planId) => {
    try {
      await mealPlanAPI.updateMealPlanStatus(planId, { status: 'completed' });
      setShowNextMealPopup(false);
      // Refresh all data
      fetchDashboardData();
      fetchNextMeal();
      fetchAllNotifications();
    } catch (err) {
      console.error('Failed to complete meal:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const today = dashboardData?.today || {};
  const streak = dashboardData?.streak || {};
  const weekly = dashboardData?.weekly || {};
  // Use effective (redistribution-adjusted) target from API; fall back to user profile
  const targetCalories = dashboardData?.user?.targetCalories || user?.targetDailyCalories || 2000;
  const baseTargetCalories = dashboardData?.user?.baseTargetCalories || targetCalories;
  const isTargetAdjusted = dashboardData?.user?.isTargetAdjusted || false;
  const progress = today?.progress || {};
  const percentage = progress?.percentage || 0;

  const generateWeekData = () => {
    const weekData = [];
    const now = new Date();

    const getLocalDateString = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const dateString = getLocalDateString(date);

      const existingData = weekly?.summaries?.find(s => {
        const serverDate = new Date(s.date);
        const serverDateString = getLocalDateString(serverDate);
        return serverDateString === dateString;
      });

      if (existingData) {
        weekData.push({
          date: date,
          totalCalories: existingData.totalCalories,
          targetCalories: existingData.targetCalories || targetCalories,
          hasData: true
        });
      } else {
        weekData.push({
          date: date,
          totalCalories: 0,
          targetCalories: targetCalories,
          hasData: false
        });
      }
    }

    return weekData;
  };

  const weekData = generateWeekData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
          <p className="text-gray-600">Here's your daily overview</p>
        </div>
        <Link to="/meals" className="btn-primary mt-4 sm:mt-0">
          + Add Meal
        </Link>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Calories Card */}
        <div
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowCaloriesPopup(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Calories</p>
              <p className="text-2xl font-bold text-gray-900">
                {today?.totals?.calories || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {progress?.remaining > 0
                ? `${progress.remaining} cal remaining`
                : `${Math.abs(progress.remaining)} cal over`
              }
            </p>
          </div>
        </div>




        {/* Target Card */}
        <div
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowTargetPopup(true)}
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">Daily Target</p>
              <p className="text-2xl font-bold text-gray-900">{targetCalories}</p>
              {isTargetAdjusted && (
                <p className="text-xs text-orange-600 font-medium mt-0.5">⚠️ Adjusted (was {baseTargetCalories})</p>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-secondary-100 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {progress?.remaining > 0
                ? `${progress.remaining} cal remaining`
                : `${Math.abs(progress.remaining)} cal over`
              }
            </p>
          </div>
        </div>

        {/* Streak Card */}
        <div
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowStreakPopup(true)}
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{streak?.currentStreak || 0} days</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">{streak?.streakMessage || 'Start logging to build your streak!'}</p>
          </div>
        </div>

        {/* Meals Card */}
        <div
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowMealsPopup(true)}
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">Today's Meals</p>
              <p className="text-2xl font-bold text-gray-900">{today?.mealCount || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Weekly avg: {weekly?.averageCalories || 0} cal
            </p>
          </div>
        </div>

        {/* Next Meal Card */}
        <div
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => nextMeal && setShowNextMealPopup(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Next Meal</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {nextMeal ? nextMeal.mealTime : 'No plans'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl">🕐</span>
            </div>
          </div>
          <div className="mt-4">
            {nextMeal ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  {nextMeal.scheduledTime} • {nextMeal.plannedCalories} cal
                </p>
                <p className="text-xs text-gray-500">
                  {nextMeal.items?.length || 0} items planned
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No upcoming meals</p>
            )}
          </div>
        </div>
      </div>

      {/* Calories Popup Modal */}
      {showCaloriesPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Calorie Details</h2>
              <button
                onClick={() => setShowCaloriesPopup(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Consumed</span>
                <span className="text-xl font-bold text-gray-900">{today?.totals?.calories || 0} cal</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Daily Target</span>
                <span className="text-xl font-bold text-gray-900">{targetCalories} cal</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Remaining</span>
                <span className={`text-xl font-bold ${progress?.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {progress?.remaining > 0 ? `${progress.remaining} cal` : `${Math.abs(progress.remaining)} cal over`}
                </span>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-center">
              <div className="relative h-32 w-32">
                <svg className="h-32 w-32 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    className="text-gray-200"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  {/* Progress circle */}
                  <path
                    className={`${percentage > 100 ? 'text-red-500' : percentage > 80 ? 'text-primary-500' : 'text-amber-500'}`}
                    strokeDasharray={`${Math.min(percentage, 100)}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
                  <span className="text-xs text-gray-500">Progress</span>
                </div>
              </div>
            </div>


            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Today's Meals</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {today?.meals?.length > 0 ? (
                  today.meals.map((meal, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{meal.title}</span>
                      <span className="text-sm font-semibold text-gray-900">{meal.calories} cal</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-2">No meals logged today</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                to="/meals"
                onClick={() => setShowCaloriesPopup(false)}
                className="flex-1 btn-primary text-center"
              >
                Log Meal
              </Link>
              <button
                onClick={() => setShowCaloriesPopup(false)}
                className="flex-1 btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Popup Modal */}
      {showTargetPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Daily Target</h2>
              <button
                onClick={() => setShowTargetPopup(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="h-20 w-20 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-4xl">🎯</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{targetCalories}</p>
              <p className="text-gray-500">calories per day</p>
              {isTargetAdjusted && (
                <div className="mt-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-700">
                    ⚠️ Adjusted from {baseTargetCalories} cal — excess from a recent day is being spread over 5 days.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Current Status</span>
                <span className={`font-semibold ${progress?.remaining > 0 ? 'text-green-600' : progress?.remaining < 0 ? 'text-red-600' : 'text-primary-600'}`}>
                  {progress?.remaining > 0 ? 'Under Target' : progress?.remaining < 0 ? 'Over Target' : 'On Target'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Calories Left</span>
                <span className="font-semibold text-gray-900">
                  {progress?.remaining > 0 ? `${progress.remaining} cal` : '0 cal'}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-3">Macronutrient Targets (Estimated)</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{Math.round(targetCalories * 0.3 / 4)}g</p>
                  <p className="text-xs text-gray-500">Protein</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{Math.round(targetCalories * 0.4 / 4)}g</p>
                  <p className="text-xs text-gray-500">Carbs</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-lg font-bold text-yellow-600">{Math.round(targetCalories * 0.3 / 9)}g</p>
                  <p className="text-xs text-gray-500">Fats</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                to="/bmi"
                onClick={() => setShowTargetPopup(false)}
                className="flex-1 btn-primary text-center"
              >
                Update Target
              </Link>
              <button
                onClick={() => setShowTargetPopup(false)}
                className="flex-1 btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Popup Modal */}
      {showStreakPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Streak Details</h2>
              <button
                onClick={() => setShowStreakPopup(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-4xl">⚡</span>
              </div>
              <p className="text-4xl font-bold text-gray-900">{streak?.currentStreak || 0}</p>
              <p className="text-gray-500">day{streak?.currentStreak !== 1 ? 's' : ''} current streak</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Current Streak</span>
                <span className="text-xl font-bold text-amber-600">{streak?.currentStreak || 0} days</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Longest Streak</span>
                <span className="text-xl font-bold text-gray-900">{streak?.longestStreak || streak?.currentStreak || 0} days</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800 font-medium mb-1">💪 Motivation</p>
                <p className="text-sm text-gray-600">{streak?.streakMessage || 'Start logging to build your streak!'}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                to="/meals"
                onClick={() => setShowStreakPopup(false)}
                className="flex-1 btn-primary text-center"
              >
                Log Meal
              </Link>
              <button
                onClick={() => setShowStreakPopup(false)}
                className="flex-1 btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meals Popup Modal */}
      {showMealsPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Today's Meals</h2>
              <button
                onClick={() => setShowMealsPopup(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <span className="text-3xl">🍽️</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{today?.mealCount || 0}</p>
              <p className="text-gray-500">meals logged today</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Meal Details</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {today?.meals?.length > 0 ? (
                  today.meals.map((meal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${meal.category === 'cheat' ? 'bg-amber-500' :
                            meal.category === 'event' ? 'bg-purple-500' : 'bg-green-500'
                          }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{meal.title}</p>
                          <p className="text-xs text-gray-500">
                            {meal.protein}g P • {meal.carbs}g C • {meal.fats}g F
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">{meal.calories} cal</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No meals logged today</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Weekly Average</span>
                <span className="font-bold text-gray-900">{weekly?.averageCalories || 0} cal/day</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                to="/meals"
                onClick={() => setShowMealsPopup(false)}
                className="flex-1 btn-primary text-center"
              >
                Add Meal
              </Link>
              <button
                onClick={() => setShowMealsPopup(false)}
                className="flex-1 btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Meal Popup Modal */}
      {showNextMealPopup && nextMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 capitalize">
                {nextMeal.mealTime} Plan
              </h2>
              <button
                onClick={() => setShowNextMealPopup(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Scheduled Time</p>
              <p className="text-lg font-semibold text-gray-900">{nextMeal.scheduledTime}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Planned Items ({nextMeal.items?.length || 0})</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {nextMeal.items && nextMeal.items.length > 0 ? (
                  nextMeal.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          {item.protein}g protein • {item.carbs}g carbs • {item.fats}g fats
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900">{item.calories} cal</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No items in this meal plan</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Calories</span>
                <span className="text-xl font-bold text-primary-600">{nextMeal.plannedCalories} cal</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleDashboardCompleteMeal(nextMeal._id)}
                className="flex-1 btn-primary"
              >
                I ate it
              </button>
              <button
                onClick={() => setShowNextMealPopup(false)}
                className="flex-1 btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Meals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Meals</h2>
            <Link to="/meals" className="text-sm text-primary-600 hover:text-primary-500">View all</Link>
          </div>

          {today?.meals?.length > 0 ? (
            <div className="space-y-3">
              {today.meals.slice(0, 5).map((meal, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${meal.category === 'cheat' ? 'bg-amber-500' :
                        meal.category === 'event' ? 'bg-purple-500' : 'bg-green-500'
                      }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{meal.title}</p>
                      <p className="text-sm text-gray-500">
                        {meal.protein}g protein • {meal.carbs}g carbs • {meal.fats}g fats
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">{meal.calories} cal</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No meals logged today</p>
              <Link to="/meals" className="btn-primary">
                Add Your First Meal
              </Link>
            </div>
          )}
        </div>

        {/* Weekly Summary - Vertical Bar Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">This Week</h2>
            <Link to="/analytics" className="text-sm text-primary-600 hover:text-primary-500">View details</Link>
          </div>

          {weekData.length > 0 ? (
            <div className="space-y-4">
              {/* Vertical Bar Chart */}
              <div className="flex items-end justify-between h-48 gap-2">
                {weekData.map((day, index) => {
                  const maxCalories = Math.max(...weekData.map(d => d.totalCalories), targetCalories);
                  const barHeight = maxCalories > 0 ? (day.totalCalories / maxCalories) * 100 : 0;
                  const targetHeight = maxCalories > 0 ? ((day.targetCalories || targetCalories) / maxCalories) * 100 : 0;
                  const isOverTarget = day.totalCalories > (day.targetCalories || targetCalories);

                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      {/* Calorie value on top */}
                      <span className="text-xs text-gray-600 mb-1">
                        {day.hasData ? day.totalCalories : ''}
                      </span>

                      {/* Bar container */}
                      <div className="relative w-full flex items-end justify-center" style={{ height: '120px' }}>
                        {/* Target line */}
                        <div
                          className="absolute w-full border-t-2 border-dashed border-gray-400 z-10"
                          style={{ bottom: `${targetHeight}%` }}
                        ></div>

                        {/* Calorie bar - show gray if no data */}
                        <div
                          className={`w-8 rounded-t-md transition-all duration-300 ${!day.hasData ? 'bg-gray-200' :
                              isOverTarget ? 'bg-red-500' :
                                day.totalCalories > (day.targetCalories || targetCalories) * 0.8 ? 'bg-primary-500' : 'bg-amber-500'
                            }`}
                          style={{ height: `${Math.min(barHeight, 100)}%` }}
                        ></div>
                      </div>

                      {/* Day label */}
                      <span className="text-xs text-gray-500 mt-2">
                        {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>


              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary-500 rounded"></div>
                  <span>On Target</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-amber-500 rounded"></div>
                  <span>Below 80%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Over Target</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 border-t-2 border-dashed border-gray-400"></div>
                  <span>Target</span>
                </div>
              </div>
            </div>

          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No weekly data yet</p>
            </div>
          )}


        </div>

      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/meals" className="card flex items-center gap-4 hover:border-primary-300 border border-transparent">
          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <span className="text-xl">➕</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">Log a Meal</p>
            <p className="text-sm text-gray-500">Track what you eat</p>
          </div>
        </Link>

        <Link to="/analytics" className="card flex items-center gap-4 hover:border-secondary-300 border border-transparent">
          <div className="h-10 w-10 rounded-lg bg-secondary-100 flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">View Analytics</p>
            <p className="text-sm text-gray-500">See your progress</p>
          </div>
        </Link>

        <Link to="/bmi" className="card flex items-center gap-4 hover:border-amber-300 border border-transparent">
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <span className="text-xl">⚖️</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">Check BMI</p>
            <p className="text-sm text-gray-500">Update your metrics</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
