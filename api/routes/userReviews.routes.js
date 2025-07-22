/**
 * User Reviews Routes
 * Routes for user review management (User authentication required)
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  submitReview,
  getMyReviews,
  updateMyReview,
  deleteMyReview,
  voteReview,
  reportReview
} = require('../controllers/productReview.controller');

// Import middleware
const { authMiddleware } = require('../middleware/auth.middleware');

// Import validation
const {
  validateSubmitReview,
  validateUpdateReview,
  validateVoteReview,
  validateReportReview,
  validateReviewId,
  validateReviewQuery
} = require('../middleware/reviewValidation');

// Apply user authentication to all routes
router.use(authMiddleware);

/**
 * @route   POST /api/v1/user/reviews
 * @desc    Submit a product review
 * @access  User only
 */
router.post('/', validateSubmitReview, submitReview);

/**
 * @route   GET /api/v1/user/reviews/my
 * @desc    Get user's own reviews
 * @access  User only
 */
router.get('/my', validateReviewQuery, getMyReviews);

/**
 * @route   PATCH /api/v1/user/reviews/:reviewId
 * @desc    Update user's own review
 * @access  User only
 */
router.patch('/:reviewId', validateUpdateReview, updateMyReview);

/**
 * @route   DELETE /api/v1/user/reviews/:reviewId
 * @desc    Delete user's own review (soft delete)
 * @access  User only
 */
router.delete('/:reviewId', validateReviewId, deleteMyReview);

/**
 * @route   POST /api/v1/user/reviews/:reviewId/vote
 * @desc    Vote on a review (helpful/unhelpful)
 * @access  User only
 */
router.post('/:reviewId/vote', validateVoteReview, voteReview);

/**
 * @route   POST /api/v1/user/reviews/:reviewId/report
 * @desc    Report a review
 * @access  User only
 */
router.post('/:reviewId/report', validateReportReview, reportReview);

module.exports = router;
