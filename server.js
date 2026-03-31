/**
 * Ojasvita - Backend Server (Production Ready)
 */

// Import required modules
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import custom modules
const connectDB = require('./config/db');
const { errorMiddleware } = require('./middleware/errorMiddleware');
const { initPushScheduler } = require('./services/pushService');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();


// =======================
// 🔹 MIDDLEWARE
// =======================

// Simple CORS (works for Railway + Vercel + Mobile)
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// =======================
// 🔹 ROUTES
// =======================

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/meals', require('./routes/mealRoutes'));
app.use('/api/meal-plans', require('./routes/mealPlanRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/foods-master', require('./routes/foodMasterRoutes'));
app.use('/api/water', require('./routes/waterIntakeRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));


// =======================
// 🔹 ROOT ROUTE (IMPORTANT)
// =======================

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Ojasvita API',
    version: '1.0.0',
    status: 'running'
  });
});


// =======================
// 🔹 ERROR HANDLER (LAST)
// =======================

app.use(errorMiddleware);


// =======================
// 🔹 SERVER START
// =======================

const PORT = process.env.PORT || 5000;

// Connect DB and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ MongoDB connected`);
      
      // Initialize Push Notification Scheduler
      initPushScheduler();
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });


// Export app
module.exports = app;