/**
 * Ojasvita - Notifications Page
 * 
 * This page displays all meal notifications and reminders.
 * Users can view their notification history and manage them.
 * 
 * Dependencies:
 * - mealPlanAPI: For fetching meal plans from database
 * - react-router-dom: For navigation
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mealPlanAPI } from '../services/api';

/**
 * Notifications Page Component
 * 
 * Displays all meal notifications with filtering and management options.
 */
const Notifications = () => {
  // State for meal plans from database
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filter
  const [filter, setFilter] = useState('all'); // 'all', 'planned', 'completed', 'overdue'

  /**
   * Fetch meal plans for today from database
   */
  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const response = await mealPlanAPI.getMealPlansByDate(today);
        
        if (response.data.success) {
          // Process meal plans and add notification status
          const processedPlans = response.data.mealPlans.map(plan => {
            const now = new Date();
            const [hours, minutes] = plan.scheduledTime.split(':').map(Number);
            const scheduledDateTime = new Date();
            scheduledDateTime.setHours(hours, minutes, 0, 0);
            
            const timeDiff = scheduledDateTime - now;
            const minutesUntil = Math.floor(timeDiff / (1000 * 60));
            
            let notificationStatus = 'upcoming';
            let isOverdue = false;
            
            if (plan.status === 'completed') {
              notificationStatus = 'completed';
            } else if (minutesUntil < 0) {
              notificationStatus = 'overdue';
              isOverdue = true;
            } else if (minutesUntil <= 30) {
              notificationStatus = 'due';
            } else if (minutesUntil <= 60) {
              notificationStatus = 'soon';
            }
            
            return {
              ...plan,
              notificationStatus,
              isOverdue,
              minutesUntil,
              isRead: plan.status === 'completed' || plan.reminderSent
            };
          });
          
          setMealPlans(processedPlans);
        }
      } catch (err) {
        console.error('Error fetching meal plans:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchMealPlans();
    
    // Refresh every minute
    const interval = setInterval(fetchMealPlans, 60000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Filter meal plans based on selected filter
   */
  const filteredMealPlans = mealPlans.filter(plan => {
    if (filter === 'all') return true;
    if (filter === 'planned') return plan.status === 'planned';
    if (filter === 'completed') return plan.status === 'completed';
    if (filter === 'overdue') return plan.notificationStatus === 'overdue' || plan.notificationStatus === 'due';
    return true;
  });

  /**
   * Get status badge color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'due':
        return 'bg-orange-100 text-orange-800';
      case 'soon':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  /**
   * Get status label
   */
  const getStatusLabel = (status, minutesUntil) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'overdue':
        return `Overdue by ${Math.abs(minutesUntil)} min`;
      case 'due':
        return 'Due Now';
      case 'soon':
        return `In ${minutesUntil} min`;
      default:
        return 'Upcoming';
    }
  };

  /**
   * Get notification icon based on meal time
   */
  const getMealIcon = (mealTime) => {
    switch (mealTime) {
      case 'breakfast':
        return '🍳';
      case 'lunch':
        return '🍽️';
      case 'dinner':
        return '🌙';
      default:
        return '🍴';
    }
  };

  /**
   * Get notification message
   */
  const getNotificationMessage = (plan) => {
    const mealName = plan.mealTime.charAt(0).toUpperCase() + plan.mealTime.slice(1);
    const calories = plan.plannedCalories;
    const items = plan.items.map(item => item.title).join(', ');
    
    if (plan.status === 'completed') {
      return {
        title: `${mealName} Completed`,
        message: `You consumed ${plan.actualCalories || calories} calories. Items: ${items}`,
        icon: getMealIcon(plan.mealTime)
      };
    } else if (plan.notificationStatus === 'overdue') {
      return {
        title: `${mealName} Overdue!`,
        message: `Scheduled for ${plan.scheduledTime}. You have ${calories} calories planned. Items: ${items}`,
        icon: '⚠️'
      };
    } else if (plan.notificationStatus === 'due') {
      return {
        title: `Time for ${mealName}!`,
        message: `It's ${plan.scheduledTime}. You have ${calories} calories planned. Items: ${items}`,
        icon: '🍽️'
      };
    } else if (plan.notificationStatus === 'soon') {
      return {
        title: `${mealName} Coming Up`,
        message: `In ${plan.minutesUntil} minutes (${plan.scheduledTime}) - ${calories} calories planned`,
        icon: '⏰'
      };
    }
    
    return {
      title: `${mealName} Scheduled`,
      message: `At ${plan.scheduledTime} - ${calories} calories planned. Items: ${items}`,
      icon: '📅'
    };
  };

  /**
   * Mark meal as completed
   */
  const handleCompleteMeal = async (planId) => {
    try {
      await mealPlanAPI.updateMealPlanStatus(planId, { status: 'completed' });
      // Refresh the list
      const today = new Date().toISOString().split('T')[0];
      const response = await mealPlanAPI.getMealPlansByDate(today);
      if (response.data.success) {
        setMealPlans(response.data.mealPlans);
      }
    } catch (err) {
      console.error('Error completing meal:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your meal reminders and notifications
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            to="/meals"
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <svg className="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Plan a Meal
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Meals Today</dt>
                  <dd className="text-lg font-medium text-gray-900">{mealPlans.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-md bg-green-100 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mealPlans.filter(p => p.status === 'completed').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-md bg-orange-100 flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Due / Overdue</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mealPlans.filter(p => p.notificationStatus === 'due' || p.notificationStatus === 'overdue').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-md bg-purple-100 flex items-center justify-center">
                  <span className="text-2xl">🔥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Planned Calories</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mealPlans.reduce((acc, p) => acc + p.plannedCalories, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto pb-1" aria-label="Tabs">
          {[
            { id: 'all', label: 'All', count: mealPlans.length },
            { id: 'planned', label: 'Planned', count: mealPlans.filter(p => p.status === 'planned').length },
            { id: 'completed', label: 'Completed', count: mealPlans.filter(p => p.status === 'completed').length },
            { id: 'overdue', label: 'Due / Overdue', count: mealPlans.filter(p => p.notificationStatus === 'overdue' || p.notificationStatus === 'due').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                ${filter === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  filter === tab.id ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-red-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading notifications</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
          </div>
        ) : filteredMealPlans.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No meal plans</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? "You don't have any meal plans for today. Create a meal plan to get notifications!"
                : `No ${filter} meals found.`
              }
            </p>
            <div className="mt-6">
              <Link
                to="/meals"
                className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <svg className="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Plan a Meal
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredMealPlans.map((plan) => {
              const { title, message, icon } = getNotificationMessage(plan);
              return (
                <li 
                  key={plan._id}
                  className={`relative flex items-center gap-x-4 px-4 py-5 hover:bg-gray-50 sm:px-6 ${
                    plan.notificationStatus === 'due' || plan.notificationStatus === 'overdue' ? 'bg-red-50' : 
                    plan.notificationStatus === 'soon' ? 'bg-yellow-50' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <span className="text-3xl">{icon}</span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-auto">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold leading-6 break-words ${
                          plan.notificationStatus === 'due' || plan.notificationStatus === 'overdue' ? 'text-red-700' : 
                          plan.status === 'completed' ? 'text-green-700' : 'text-gray-900'
                        }`}>
                          {title}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-gray-500 break-words">
                          {message}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-gray-500">
                          <span className="flex items-center gap-x-1 whitespace-nowrap">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {plan.scheduledTime}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className={`inline-flex whitespace-nowrap items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(plan.notificationStatus)}`}>
                            {getStatusLabel(plan.notificationStatus, plan.minutesUntil)}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-gray-400 whitespace-nowrap">
                            {plan.plannedCalories} cal
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-x-2 mt-2 sm:mt-0 shrink-0">
                        {plan.status === 'planned' && (
                          <button
                            onClick={() => handleCompleteMeal(plan._id)}
                            className="rounded-md bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100"
                          >
                            Complete
                          </button>
                        )}
                        <Link
                          to="/meals"
                          className="rounded-md bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
