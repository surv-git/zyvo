/**
 * Admin Authorization Middleware
 * Checks if authenticated user has admin role
 * Should be used after authMiddleware
 */

/**
 * Middleware to check if user has admin role
 * Requires authMiddleware to be run first to populate req.user
 */
const adminAuthMiddleware = (req, res, next) => {
  try {
    // Check if user object exists (should be populated by authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authorization.'
    });
  }
};

module.exports = {
  adminAuthMiddleware
};
