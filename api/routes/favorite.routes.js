/**
 * Favorite Routes
 * Routes for user favorites management (User authentication required)
 */

const express = require('express');
const router = express.Router();

// DEBUG: Log all requests that reach this router
router.use((req, res, next) => {
  console.log('\n🔴 FAVORITE ROUTER DEBUG:');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Path:', req.path);
  console.log('Request reached favorite router!');
  next();
});

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
  validateGenericId,
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
router.use((req, res, next) => {
  console.log('🔵 About to apply authMiddleware...');
  next();
});
router.use(authMiddleware);
router.use((req, res, next) => {
  console.log('🔵 AuthMiddleware passed, user:', req.user ? 'Present' : 'Missing');
  next();
});

/**
 * @route   POST /api/v1/user/favorites
 * @desc    Add product variant to favorites
 * @access  User only
 */
router.post('/', 
  (req, res, next) => {
    console.log('🟡 POST route matched! About to validate...');
    next();
  },
  validateAddFavorite, 
  (req, res, next) => {
    console.log('🟡 Validation passed! About to call controller...');
    next();
  },
  addFavorite
);

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
 * @route   DELETE /api/v1/user/favorites/:id
 * @desc    Remove product variant from favorites (unfavorite)
 * @access  User only
 * @param   {string} id - Either product_variant_id or product_id
 * @query   {string} [type] - Optional: 'product' or 'variant' to specify ID type
 */
router.delete('/:id', validateGenericId, removeFavorite);

module.exports = router;
