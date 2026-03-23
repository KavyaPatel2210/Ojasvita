/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Main Server File
 * 
 * This is the entry point for the backend application.
 * It sets up Express server, connects to MongoDB, and configures middleware and routes.
 * 
 * Dependencies:
 * - express: Web framework for Node.js
 * - cors: Enable Cross-Origin Resource Sharing
 * - dotenv: Load environment variables
 * - mongoose: MongoDB ODM for database operations
 */

// Import required modules
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Import custom modules
const connectDB = require('./config/db');
const { errorMiddleware } = require('./middleware/errorMiddleware');

// Load environment variables from .env file
// This provides configuration values like MONGO_URI, PORT, JWT_SECRET
dotenv.config();

/**
 * Initialize Express application
 * Express is a minimal and flexible Node.js web application framework
 * that provides robust features for web and mobile applications
 */
const app = express();

// Middleware Configuration

// CORS (Cross-Origin Resource Sharing) middleware
// Allows frontend running on different origin to access backend APIs
// This is essential for development when frontend and backend run on different ports
// Also allows mobile devices on same network to access the backend
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and any local network IP (for mobile testing)
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      'http://localhost:5179',
      'http://localhost:5180',
      'http://localhost:5181',
      'http://localhost:5182',
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,  // Any local network IP
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/, // Private network
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3}:\d+$/ // Private network
    ];

    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));


// Express.json() middleware
// Parses incoming requests with JSON payloads
// This is necessary for handling POST/PUT requests with JSON body data
app.use(express.json());

// Express.urlencoded() middleware
// Parses incoming requests with URL-encoded payloads
// extended: true allows parsing of rich objects and arrays
app.use(express.urlencoded({ extended: true }));

// API Routes
// These routes handle different parts of the application

// Auth routes - User registration, login, profile management
app.use('/api/auth', require('./routes/authRoutes'));

// Meal routes - CRUD operations for meal entries
app.use('/api/meals', require('./routes/mealRoutes'));

// Meal Plan routes - Meal planning with scheduled times
app.use('/api/meal-plans', require('./routes/mealPlanRoutes'));

// Analytics routes - Daily/weekly summaries, streaks, health calculations
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Food Master routes - Master food database for meal logging
app.use('/api/foods-master', require('./routes/foodMasterRoutes'));

// Water Intake routes - Water consumption tracking
app.use('/api/water', require('./routes/waterIntakeRoutes'));

// Notification routes - All notification types (water, streak, goal)
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Admin routes - Analytics and system management
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve static files from frontend build in production
// This allows the backend to serve the React application
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Handle React routing - send all non-API requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Root endpoint - Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Ojasvita API',
    version: '1.0.0',
    status: 'running'
  });
});

// Error Handling Middleware
// This must be defined AFTER all other middleware and routes
// Catches and handles any errors that occur in the application
app.use(errorMiddleware);

/**
 * Start the server
 * 
 * The server will only start after successful database connection.
 * This ensures the application is fully functional before accepting requests.
 */
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
// connectDB is called to establish database connection first
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Ojasvita Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: MongoDB Local - ojasvita`);
  });
}).catch((err) => {
  console.error('Failed to start server due to database connection failure:');
  console.error(err.message);
  process.exit(1);
});

// Export app for testing purposes
module.exports = app;
