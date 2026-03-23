/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Error Handling Middleware
 * 
 * This middleware handles errors throughout the application.
 * It provides consistent error responses and logs errors for debugging.
 * 
 * Error Handling Patterns:
 * - Mongoose validation errors
 * - Mongoose duplicate key errors
 * - Mongoose cast errors (invalid ObjectId)
 * - Custom application errors
 * - Unhandled errors
 * 
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */

const errorMiddleware = (err, req, res, next) => {
  // Default error status and message
  let errorStatusCode = 500;
  let errorMessage = 'Server Error';
  let errorDetails = null;

  // Log error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Mongoose bad ObjectId (CastError)
  // Occurs when passing an invalid MongoDB ObjectId
  if (err.name === 'CastError') {
    errorStatusCode = 400;
    errorMessage = 'Resource not found. Invalid ID format.';
  }

  // Mongoose duplicate key error
  // Occurs when trying to create a document with a field that must be unique
  if (err.code === 11000) {
    errorStatusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    errorMessage = `${field} already exists. Please use a different ${field}.`;
  }

  // Mongoose validation error
  // Occurs when document validation fails
  if (err.name === 'ValidationError') {
    errorStatusCode = 400;
    errorMessage = 'Validation failed';
    
    // Extract validation error messages
    const validationErrors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    errorDetails = validationErrors;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorStatusCode = 401;
    errorMessage = 'Invalid token. Please login again.';
  }

  if (err.name === 'TokenExpiredError') {
    errorStatusCode = 401;
    errorMessage = 'Session expired. Please login again.';
  }

  // Custom application error
  // Use this for throwing custom errors with status codes
  if (err.statusCode) {
    errorStatusCode = err.statusCode;
    errorMessage = err.message;
  }

  // Handle Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    errorStatusCode = 400;
    errorMessage = 'File too large. Maximum size is 5MB.';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    errorStatusCode = 400;
    errorMessage = 'Unexpected file field.';
  }

  // Send error response
  res.status(errorStatusCode).json({
    success: false,
    message: errorMessage,
    errorDetails: errorDetails,
    // Include stack trace in development only
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * Not Found middleware - Handle 404 errors
 * 
 * This middleware catches requests that don't match any route.
 * Should be placed after all other routes.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Async handler wrapper
 * 
 * Wrapper to catch async errors in route handlers.
 * Eliminates need for try-catch blocks in every controller.
 * 
 * Usage:
 * asyncHandler(async (req, res, next) => {
 *   const user = await User.findById(req.params.id);
 *   if (!user) throw new Error('User not found');
 *   res.json(user);
 * });
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function with error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom Error class
 * 
 * Extends built-in Error class with statusCode property.
 * Use this to throw errors with specific HTTP status codes.
 * 
 * Usage:
 * throw new ErrorClass('User not found', 404);
 */
class ErrorClass extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Export all error handling utilities
module.exports = {
  errorMiddleware,
  notFound,
  asyncHandler,
  ErrorClass
};
