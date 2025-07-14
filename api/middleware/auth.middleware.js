/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user information to request object
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyAccessToken } = require('../utils/generateTokens');

/**
 * Middleware to authenticate JWT tokens
 * Extracts token from Authorization header and validates it
 * Attaches user information to req.user for subsequent middleware/routes
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token using utility function
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }
    
    // Find user by ID from token payload
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User account is inactive.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Protection middleware - alias for authMiddleware
 * Standard name used in many Express.js applications
 */
const protect = authMiddleware;

/**
 * Authorization middleware - role-based access control
 * Checks if authenticated user has the required role
 * @param {...string} roles - Required roles (e.g., 'admin', 'user')
 * @returns {Function} Middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Similar to authMiddleware but doesn't require authentication
 * If token is provided and valid, user is attached to req.user
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token using utility function
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      // Invalid token, continue without authentication
      return next();
    }
    
    // Find user by ID from token payload
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      // Attach user to request object if valid
      req.user = user;
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

module.exports = {
  authMiddleware,
  protect,
  authorize,
  restrictTo: authorize, // Alias for authorize
  optionalAuthMiddleware
};
