/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Database Configuration File
 * 
 * This file handles the MongoDB database connection using Mongoose ODM.
 * The connection is essential for storing:
 * - User profiles and authentication data
 * - Meal entries (normal, cheat, event meals)
 * - Daily and weekly summaries
 * - Streak records for motivation tracking
 * - Analytics data for charts and progress
 * 
 * Required Database: MongoDB Local (not Atlas/cloud)
 * Connection String: mongodb://localhost:27017/ojasvita
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * 
 * This async function establishes connection to the MongoDB database
 * using the connection string from environment variables.
 * 
 * Connection process:
 * 1. Attempts to connect to MongoDB using Mongoose
 * 2. Logs successful connection with database name
 * 3. Handles connection errors appropriately
 * 4. Uses connection pooling for better performance
 * 
 * @returns {Promise} - Resolves when connected, rejects on error
 */
const connectDB = async () => {
  try {
    // Construct connection string from environment variable
    // Fallback to default local MongoDB string if not provided
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ojasvita';
    
    // Mongoose connection options for better performance and reliability
    const options = {
      // Maximum time in milliseconds to wait for connection
      serverSelectionTimeoutMS: 5000,
      // Maximum time in milliseconds to wait for socket operations
      socketTimeoutMS: 45000,
      // Use new URL parser (recommended)
      useNewUrlParser: true,
      // Use unified topology (recommended for new deployments)
      useUnifiedTopology: true,
      // Connection pool size
      maxPoolSize: 10,
      // Enable retry for initial connection
      retryWrites: true,
      // Retry interval in milliseconds
      retryReads: true
    };

    // Attempt to connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    // Log successful connection details
    console.log('========================================');
    console.log('MongoDB Connection Established');
    console.log('========================================');
    console.log(`Database Host: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(`Database Port: ${conn.connection.port}`);
    console.log('========================================');

    // Event listeners for connection status
    
    // Listen for connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB Connection Error:', err.message);
    });

    // Listen for disconnection events
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB Connection Disconnected');
    });

    // Listen for reconnection attempts
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB Reconnected');
    });

    // Return the mongoose connection object
    return conn;

  } catch (error) {
    // Handle connection errors
    console.error('========================================');
    console.error('MongoDB Connection Failed');
    console.error('========================================');
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error('Please ensure:');
    console.error('1. MongoDB is installed and running locally');
    console.error('2. MongoDB service is started (mongod)');
    console.error('3. Connection string is correct in .env file');
    console.error('========================================');
    
    // Exit process with failure code
    // Server should not start without database connection
    process.exit(1);
  }
};

/**
 * Close MongoDB connection
 * 
 * Utility function to gracefully close the database connection.
 * Useful during application shutdown or testing.
 * 
 * @returns {Promise} - Resolves when disconnected
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
    throw error;
  }
};

// Export connection functions
module.exports = connectDB;

// Also export disconnect for graceful shutdown
module.exports.disconnectDB = disconnectDB;
