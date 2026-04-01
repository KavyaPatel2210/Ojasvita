/**
 * Ojasvita - Profile Page
 * User profile management page
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { NotificationUtil } from '../utils/notificationUtil';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    gender: user?.gender || 'male',
    height: user?.height || '',
    weight: user?.weight || '',
    activityLevel: user?.activityLevel || 'moderate',
    dietGoal: user?.dietGoal || 'maintain'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const result = await updateUser({
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      activityLevel: formData.activityLevel,
      dietGoal: formData.dietGoal
    });

    setLoading(false);

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to update profile' });
    }
  };

  const handleTestPush = async () => {
    try {
      setMessage({ type: 'success', text: '🚀 Sending test notification... Please wait.' });
      const response = await authAPI.testPush();
      if (response.data.success) {
        setMessage({ type: 'success', text: '✅ Test push sent! If you do not see it, check your browser permissions.' });
      }
    } catch (error) {
      console.error('Test push error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to send test push. Make sure notifications are enabled.' 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              NotificationUtil.requestPermission().then(async granted => {
                if (granted) {
                  const success = await NotificationUtil.subscribeUserToServer(authAPI);
                  if (success) {
                    setMessage({ type: 'success', text: '🔔 Notifications re-synced successfully!' });
                  }
                }
              });
            }}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Re-sync Notifications
          </button>
          <button 
            onClick={handleTestPush}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Test Push Alert
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`px-4 py-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500 truncate max-w-[200px] sm:max-w-xs">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="btn-secondary"
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Full Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Age (years)</label>
                <input
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Height (cm)</label>
                <input
                  name="height"
                  type="number"
                  value={formData.height}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input
                  name="weight"
                  type="number"
                  value={formData.weight}
                  onChange={handleChange}
                  className="input-field"
                  required
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
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                  <option value="very_active">Very Active</option>
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
                  <option value="lose">Lose Weight</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Gain Weight</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-medium text-gray-900">{user?.age} years</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium text-gray-900 capitalize">{user?.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Height</p>
              <p className="font-medium text-gray-900">{user?.height} cm</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Weight</p>
              <p className="font-medium text-gray-900">{user?.weight} kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Activity Level</p>
              <p className="font-medium text-gray-900 capitalize">{user?.activityLevel?.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Diet Goal</p>
              <p className="font-medium text-gray-900 capitalize">{user?.dietGoal}</p>
            </div>
          </div>
        )}
      </div>

      {/* Health Metrics Card */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">BMI</p>
            <p className="text-2xl font-bold text-gray-900">{user?.bmi?.toFixed(1) || 'N/A'}</p>
            <p className="text-xs text-gray-500">{user?.bmiCategory || 'Not calculated'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">BMR</p>
            <p className="text-2xl font-bold text-gray-900">{user?.bmr || 'N/A'}</p>
            <p className="text-xs text-gray-500">calories/day</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Daily Need</p>
            <p className="text-2xl font-bold text-gray-900">{user?.dailyCalorieNeed || 'N/A'}</p>
            <p className="text-xs text-gray-500">calories</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Target</p>
            <p className="text-2xl font-bold text-primary-600">{user?.targetDailyCalories || 'N/A'}</p>
            <p className="text-xs text-gray-500">calories</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
