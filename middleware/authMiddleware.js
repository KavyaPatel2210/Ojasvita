/**
 * Ojasvita - Personalized Diet and Calorie Monitoring System
 * Authentication Middleware
 * 
 * This middleware handles JWT (JSON Web Token) authentication for protected routes.
 * It verifies user identity and ensures only authenticated users can access certain endpoints.
 * 
 * How JWT Authentication Works:
 * 1. User logs in with credentials
 * 2. Server validates and returns a JWT token
 * 3. Client stores the token (usually in localStorage)
 * 4. Client sends token in Authorization header for protected requests
 * 5. This middleware verifies the token and attaches user to request
 * 
 * Dependencies:
 * - jsonwebtoken: For JWT token creation and verification
 * - User model: For fetching user data from database
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware - Verify JWT token and authenticate user
 * 
 * This function runs before protected routes.
 * It extracts the token from the request header and verifies it.
 * If valid, it attaches the user to the request object.
 * 
 * Request Headers Expected:
 * - Authorization: "Bearer <token>"
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from "Bearer <token>" format
      token = req.headers.authorization.split(' ')[1];

      // Verify the JWT token
      // This decodes the token and checks:
      // - Token signature (using JWT_SECRET)
      // - Token expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from database using the ID in the token
      // Exclude password field for security
      // Fallback check to Admin model if not found in User
      const User = require('../models/User');
      const Admin = require('../models/Admin');
      
      let user = await User.findById(decoded.id).select('-password');
      if (!user) {
        user = await Admin.findById(decoded.id).select('-password');
      }
      
      req.user = user;

      // Check if user still exists
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please login again.'
        });
      }

      // User authenticated successfully
      // Continue to the next middleware/controller
      next();

    } catch (error) {
      // Handle different JWT verification errors
      let errorMessage = 'Authentication failed';

      if (error.name === 'TokenExpiredError') {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.name === 'JsonWebTokenError') {
        errorMessage = 'Invalid token. Please login again.';
      }

      return res.status(401).json({
        success: false,
        message: errorMessage
      });
    }
  }

  // No token provided
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login.'
    });
  }
};

/**
 * Admin middleware - Verify user is an admin
 * 
 * This function runs after the protect middleware.
 * It checks if the authenticated user has admin privileges.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const admin = (req, res, next) => {
  // First check if user is authenticated (protect middleware should run before this)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please login.'
    });
  }

  // Check if user has admin role
  // Note: You can add an 'isAdmin' field to User model if needed
  // For now, we just verify the user exists
  if (req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized as an admin.'
    });
  }
};

/**
 * Optional auth middleware - Attach user if token provided, otherwise continue
 * 
 * Similar to protect but doesn't require authentication.
 * Useful for routes that can work with or without authentication.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Silently continue without user - token is optional
      req.user = null;
    }
  }

  next();
};

/**
 * Generate JWT token
 * 
 * Utility function to create JWT token for authenticated users.
 * 
 * @param {string} userId - User's MongoDB ID
 * @returns {string} - JWT token
 */
const generateToken = (userId) => {
  // Create JWT payload
  // Contains user ID for identification
  const payload = {
    id: userId
  };

  // Sign the token with secret key
  // Expires in 30 days for convenience
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });

  return token;
};

/**
 * Generate refresh token
 * 
 * Utility function to create a shorter-lived token for token refresh.
 * 
 * @param {string} userId - User's MongoDB ID
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (userId) => {
  const payload = {
    id: userId,
    type: 'refresh'
  };

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  return refreshToken;
};

module.exports = {
  protect,
  admin,
  optionalAuth,
  generateToken,
  generateRefreshToken
};
