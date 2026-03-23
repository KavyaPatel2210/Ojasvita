/**
 * Ojasvita - Main App Component
 * 
 * This is the root component of the Ojasvita application.
 * It sets up routing and provides authentication context.
 * 
 * Routes:
 * - / - Redirects to dashboard or login
 * - /login - Login page
 * - /register - Registration page
 * - /dashboard - Main dashboard (protected)
 * - /meals - Meal logging (protected)
 * - /analytics - Analytics and charts (protected)
 * - /profile - User profile (protected)
 * - /bmi - BMI and goals (protected)
 * 
 * Dependencies:
 * - react-router-dom: For client-side routing
 * - AuthContext: For authentication state management
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';


// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Meals from './pages/Meals';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import BMIGoal from './pages/BMIGoal';
import Notifications from './pages/Notifications';


// Import layout
import MainLayout from './layouts/MainLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import FoodList from './pages/admin/FoodList';

/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication.
 * Redirects to login if user is not authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * Admin Route Component
 * 
 * Wraps routes that require admin authentication.
 */
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * Public Route Component
 * 
 * Wraps routes that should only be accessible when not logged in.
 * Redirects to dashboard if user is already authenticated.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * Catch All Redirect Component
 * 
 * Handles all unknown routes and redirects based on auth status
 */
const CatchAllRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Redirect to dashboard if authenticated, otherwise to landing page
  return <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />;
};

/**
 * Session Manager Component
 * 
 * Forces the user to the landing page on first session load
 * (e.g. when opening a new tab or starting the server)
 */
const SessionManager = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If it's a completely new browser tab session, send to landing page
    if (!sessionStorage.getItem('app_initialized')) {
      sessionStorage.setItem('app_initialized', 'true');
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    }
  }, [location, navigate]);

  return children;
};

/**
 * App Component
 * 
 * The root component that wraps everything with providers
 * and defines the routing structure.
 */
function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <SessionManager>
            <Routes>

              {/* Landing page - always visible so user can start here */}
              <Route
                path="/"
                element={<LandingPage />}
              />

            {/* Public Routes - Only accessible when not logged in */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Routes - Require authentication */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
            </Route>

            <Route
              path="/meals"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Meals />} />
            </Route>

            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Analytics />} />
            </Route>

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Profile />} />
            </Route>

            <Route
              path="/bmi"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<BMIGoal />} />
            </Route>

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Notifications />} />
            </Route>

            {/* Admin Routes - Require Admin role */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <MainLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
            </Route>

            <Route
              path="/admin/foods"
              element={
                <AdminRoute>
                  <MainLayout />
                </AdminRoute>
              }
            >
              <Route index element={<FoodList />} />
            </Route>

            {/* Catch all - Redirect based on auth status */}
            <Route path="*" element={<CatchAllRedirect />} />
          </Routes>
          </SessionManager>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}


export default App;
