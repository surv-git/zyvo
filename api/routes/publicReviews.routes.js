/**
 * Public Reviews Routes
 * Routes for public review access (No authentication required)
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getVariantReviews,
  getProductRatingSummary
} = require('../controllers/productReview.controller');

// Import validation
const {
  validateProductVariantId,
  validateProductId,
  validateReviewQuery
} = require('../middleware/reviewValidation');

/**
 * @route   GET /api/v1/products/:productVariantId/reviews
 * @desc    Get reviews for a product variant
 * @access  Public
 */
router.get('/:productVariantId/reviews', 
  validateProductVariantId, 
  validateReviewQuery, 
  getVariantReviews
);

/**
 * @route   GET /api/v1/products/:productId/reviews/summary
 * @desc    Get aggregated rating summary for a product
 * @access  Public
 */
router.get('/:productId/reviews/summary', 
  validateProductId, 
  getProductRatingSummary
);

module.exports = router;
