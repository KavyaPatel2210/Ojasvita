/**
 * Ojasvita - Analytics Page
 * Charts and statistics page
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../services/api';

const Analytics = () => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [weeklyRes, progressRes, categoryRes] = await Promise.all([
        analyticsAPI.getWeeklySummary(),
        analyticsAPI.getProgressData(30),
        analyticsAPI.getCategoryDistribution()
      ]);

      if (weeklyRes.data.success) setWeeklyData(weeklyRes.data);
      if (progressRes.data.success) setProgressData(progressRes.data);
      if (categoryRes.data.success) setCategoryData(categoryRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const targetCalories = user?.targetDailyCalories || 2000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Track your progress and patterns</p>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">This Week's Average</p>
          <p className="text-2xl font-bold text-gray-900">{weeklyData?.averages?.avgCalories || 0}</p>
          <p className="text-sm text-gray-500">calories/day</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Days Logged</p>
          <p className="text-2xl font-bold text-gray-900">{weeklyData?.stats?.daysLogged || 0}</p>
          <p className="text-sm text-gray-500">of 7 days</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">On Target</p>
          <p className="text-2xl font-bold text-gray-900">{weeklyData?.stats?.daysOnTarget || 0}</p>
          <p className="text-sm text-gray-500">days</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Achievement Rate</p>
          <p className="text-2xl font-bold text-gray-900">{weeklyData?.stats?.achievementRate || 0}%</p>
          <p className="text-sm text-gray-500">of goals met</p>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Overview</h2>
        <div className="space-y-3">
          {weeklyData?.dailyData?.map((day, index) => {
            const currentTarget = day.target || targetCalories;
            const percentage = (day.calories / currentTarget) * 100;
            return (
              <div key={index} className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-16">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <div className="flex-1">
                  <div className="progress-bar">
                    <div 
                      className={`progress-bar-fill ${
                        percentage > 100 ? 'bg-red-500' : 
                        percentage > 80 ? 'bg-primary-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-20 text-right">
                  {day.calories} cal
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 30-Day Progress */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">30-Day Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Days</p>
            <p className="text-xl font-bold text-gray-900">{progressData?.progress?.summary?.totalDays || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Days on Target</p>
            <p className="text-xl font-bold text-gray-900">{progressData?.progress?.summary?.daysOnTarget || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Achievement Rate</p>
            <p className="text-xl font-bold text-gray-900">{progressData?.progress?.summary?.achievementRate || 0}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Calories</p>
            <p className="text-xl font-bold text-gray-900">{progressData?.progress?.summary?.averageCalories || 0}</p>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Meal Category Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categoryData?.distribution?.map((cat, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-3 w-3 rounded-full ${
                  cat.category === 'normal' ? 'bg-green-500' :
                  cat.category === 'cheat' ? 'bg-amber-500' : 'bg-purple-500'
                }`}></div>
                <p className="font-medium text-gray-900 capitalize">{cat.category} Meals</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{cat.count}</p>
              <p className="text-sm text-gray-500">{cat.calories} today's calories</p>

              <p className="text-sm text-gray-500">{cat.percentage}% of calories</p>

            </div>
          ))}
        </div>
      </div>

      {/* Macronutrients Summary */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Average Daily Macros</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{weeklyData?.averages?.avgProtein || 0}g</p>
            <p className="text-sm text-gray-600">Protein</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{weeklyData?.averages?.avgCarbs || 0}g</p>
            <p className="text-sm text-gray-600">Carbs</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{weeklyData?.averages?.avgFats || 0}g</p>
            <p className="text-sm text-gray-600">Fats</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
