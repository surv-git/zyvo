/**
 * Favorite Routes
 * Routes for user favorites management (User authentication required)
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  addFavorite,
  getFavorites,
  removeFavorite,
  updateFavoriteNotes,
  checkFavorite,
  getFavoriteStats,
  bulkAddFavorites,
  getMostFavorited
} = require('../controllers/favorite.controller');

// Import middleware
const { authMiddleware } = require('../middleware/auth.middleware');

// Import validation
const {
  validateAddFavorite,
  validateUpdateFavoriteNotes,
  validateProductVariantId,
  validateFavoritesQuery,
  validateBulkAddFavorites,
  validatePopularQuery
} = require('../middleware/favoriteValidation');

// Apply user authentication to protected routes
// Note: getMostFavorited is public and doesn't need authentication

/**
 * @route   GET /api/v1/favorites/popular
 * @desc    Get most favorited product variants (public)
 * @access  Public
 */
router.get('/popular', validatePopularQuery, getMostFavorited);

// Apply user authentication to all other routes
router.use(authMiddleware);

/**
 * @route   POST /api/v1/user/favorites
 * @desc    Add product variant to favorites
 * @access  User only
 */
router.post('/', validateAddFavorite, addFavorite);

/**
 * @route   GET /api/v1/user/favorites
 * @desc    Get user's favorite product variants
 * @access  User only
 */
router.get('/', validateFavoritesQuery, getFavorites);

/**
 * @route   GET /api/v1/user/favorites/stats
 * @desc    Get user's favorite statistics
 * @access  User only
 */
router.get('/stats', getFavoriteStats);

/**
 * @route   POST /api/v1/user/favorites/bulk
 * @desc    Bulk add favorites
 * @access  User only
 */
router.post('/bulk', validateBulkAddFavorites, bulkAddFavorites);

/**
 * @route   GET /api/v1/user/favorites/:productVariantId/check
 * @desc    Check if product variant is favorited
 * @access  User only
 */
router.get('/:productVariantId/check', validateProductVariantId, checkFavorite);

/**
 * @route   PATCH /api/v1/user/favorites/:productVariantId/notes
 * @desc    Update favorite notes
 * @access  User only
 */
router.patch('/:productVariantId/notes', validateUpdateFavoriteNotes, updateFavoriteNotes);

/**
 * @route   DELETE /api/v1/user/favorites/:productVariantId
 * @desc    Remove product variant from favorites (unfavorite)
 * @access  User only
 */
router.delete('/:productVariantId', validateProductVariantId, removeFavorite);

module.exports = router;
