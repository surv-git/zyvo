/**
 * Admin Favorite Routes
 * Routes for favorites management (Admin only)
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllFavoritesAdmin,
  getFavoritesStatsAdmin,
  getUserFavoritesAdmin
} = require('../controllers/favorite.controller');

// Import middleware
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Import validation
const {
  validateAdminFavoritesQuery,
  validateUserIdParam,
  validateFavoritesStatsQuery
} = require('../middleware/favoriteValidation');

// Apply admin authentication to all routes
router.use(authMiddleware);
router.use(authorize('admin'));

/**
 * @route   GET /api/v1/admin/favorites
 * @desc    Get all favorites across the system with filtering
 * @access  Admin only
 */
router.get('/', validateAdminFavoritesQuery, getAllFavoritesAdmin);

/**
 * @route   GET /api/v1/admin/favorites/stats
 * @desc    Get comprehensive favorites statistics
 * @access  Admin only
 */
router.get('/stats', validateFavoritesStatsQuery, getFavoritesStatsAdmin);

/**
 * @route   GET /api/v1/admin/favorites/user/:userId
 * @desc    Get specific user's favorites
 * @access  Admin only
 */
router.get('/user/:userId', validateUserIdParam, getUserFavoritesAdmin);

module.exports = router;
