/**
 * Ojasvita - Profile Page
 * User profile management page
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
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
