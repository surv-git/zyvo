/**
 * Admin Reviews Routes
 * Routes for admin review management (Admin authentication required)
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllReviewsAdmin,
  getReviewAdmin,
  updateReviewStatus,
  updateAnyReview,
  deleteReviewAdmin,
  getReviewSummaryAdmin
} = require('../controllers/productReview.controller');

// Import middleware
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Import validation
const {
  validateReviewId,
  validateReviewQuery,
  validateUpdateReviewStatus,
  validateAdminUpdateReview
} = require('../middleware/reviewValidation');

// Apply admin authentication to all routes
router.use(authMiddleware);
router.use(authorize('admin'));

/**
 * @route   GET /api/v1/admin/reviews/summary
 * @desc    Get review summary statistics
 * @access  Admin only
 */
router.get('/summary', getReviewSummaryAdmin);

/**
 * @route   GET /api/v1/admin/reviews/list
 * @desc    Get all reviews (admin view) - alternative endpoint
 * @access  Admin only
 */
router.get('/list', validateReviewQuery, getAllReviewsAdmin);

/**
 * @route   GET /api/v1/admin/reviews
 * @desc    Get all reviews (admin view)
 * @access  Admin only
 */
router.get('/', validateReviewQuery, getAllReviewsAdmin);

/**
 * @route   GET /api/v1/admin/reviews/:reviewId
 * @desc    Get single review (admin view)
 * @access  Admin only
 */
router.get('/:reviewId', validateReviewId, getReviewAdmin);

/**
 * @route   PATCH /api/v1/admin/reviews/:reviewId/status
 * @desc    Update review status (approve/reject/flag)
 * @access  Admin only
 */
router.patch('/:reviewId/status', validateUpdateReviewStatus, updateReviewStatus);

/**
 * @route   PATCH /api/v1/admin/reviews/:reviewId
 * @desc    Update any review (admin)
 * @access  Admin only
 */
router.patch('/:reviewId', validateAdminUpdateReview, updateAnyReview);

/**
 * @route   DELETE /api/v1/admin/reviews/:reviewId
 * @desc    Delete review (admin - hard or soft delete)
 * @access  Admin only
 */
router.delete('/:reviewId', validateReviewId, deleteReviewAdmin);

module.exports = router;
