/**
 * Ojasvita - Register Page
 * User registration form with profile setup
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Local loading state for the register button
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activityLevel: 'moderate',
    dietGoal: 'maintain',
    role: 'user'
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Set local loading state
    setLoading(true);
    setError('');

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      age: parseInt(formData.age),
      gender: formData.gender,
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      activityLevel: formData.activityLevel,
      dietGoal: formData.dietGoal,
      role: formData.role
    };

    const result = await register(userData);

    setLoading(false);

    if (result.success) {
      if (formData.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError(result.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-200 opacity-30 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary-200 opacity-30 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-8">
          <img src="/logo-main.png" alt="Logo" className="mx-auto h-16 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">Start your personalized diet and calorie tracking journey</p>
        </div>


        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}



            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="label">Full Name</label>
                <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className="input-field" placeholder="John Doe" />
              </div>
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="input-field" placeholder="you@example.com" />
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="input-field" placeholder="••••••••" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} className="input-field" placeholder="••••••••" />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Body Metrics</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label htmlFor="age" className="label">Age (years)</label>
                  <input id="age" name="age" type="number" required min="13" max="120" value={formData.age} onChange={handleChange} className="input-field" placeholder="25" />
                </div>
                <div>
                  <label htmlFor="gender" className="label">Gender</label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="height" className="label">Height (cm)</label>
                  <input id="height" name="height" type="number" required min="50" max="300" value={formData.height} onChange={handleChange} className="input-field" placeholder="170" />
                </div>
                <div>
                  <label htmlFor="weight" className="label">Weight (kg)</label>
                  <input id="weight" name="weight" type="number" required min="20" max="500" value={formData.weight} onChange={handleChange} className="input-field" placeholder="70" />
                </div>
                <div>
                  <label htmlFor="activityLevel" className="label">Activity Level</label>
                  <select id="activityLevel" name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="input-field">
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="active">Active</option>
                    <option value="very_active">Very Active</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="dietGoal" className="label">Diet Goal</label>
                  <select id="dietGoal" name="dietGoal" value={formData.dietGoal} onChange={handleChange} className="input-field">
                    <option value="lose">Lose Weight</option>
                    <option value="maintain">Maintain Weight</option>
                    <option value="gain">Gain Weight</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
