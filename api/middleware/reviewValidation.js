/**
 * Review Validation Middleware
 * Express-validator rules for review and report operations
 */

const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation for submitting a review
 */
const validateSubmitReview = [
  body('product_variant_id')
    .notEmpty()
    .withMessage('Product variant ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product variant ID format');
      }
      return true;
    }),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Title must not exceed 100 characters')
    .trim(),

  body('review_text')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Review text must not exceed 2000 characters')
    .trim(),

  body('reviewer_display_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Display name must not exceed 50 characters')
    .trim(),

  body('reviewer_location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters')
    .trim(),

  body('image_urls')
    .optional()
    .isArray()
    .withMessage('Image URLs must be an array')
    .custom((urls) => {
      if (urls.length > 10) {
        throw new Error('Maximum 10 images allowed');
      }
      for (const url of urls) {
        if (typeof url !== 'string' || !url.match(/^https?:\/\/.+/)) {
          throw new Error('All image URLs must be valid HTTP/HTTPS URLs');
        }
      }
      return true;
    }),

  body('video_url')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL')
];

/**
 * Validation for updating a review
 */
const validateUpdateReview = [
  param('reviewId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid review ID format');
      }
      return true;
    }),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Title must not exceed 100 characters')
    .trim(),

  body('review_text')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Review text must not exceed 2000 characters')
    .trim(),

  body('reviewer_display_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Display name must not exceed 50 characters')
    .trim(),

  body('reviewer_location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters')
    .trim(),

  body('image_urls')
    .optional()
    .isArray()
    .withMessage('Image URLs must be an array')
    .custom((urls) => {
      if (urls.length > 10) {
        throw new Error('Maximum 10 images allowed');
      }
      for (const url of urls) {
        if (typeof url !== 'string' || !url.match(/^https?:\/\/.+/)) {
          throw new Error('All image URLs must be valid HTTP/HTTPS URLs');
        }
      }
      return true;
    }),

  body('video_url')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL')
];

/**
 * Validation for voting on a review
 */
const validateVoteReview = [
  param('reviewId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid review ID format');
      }
      return true;
    }),

  body('vote_type')
    .notEmpty()
    .withMessage('Vote type is required')
    .isIn(['helpful', 'unhelpful'])
    .withMessage('Vote type must be "helpful" or "unhelpful"')
];

/**
 * Validation for reporting a review
 */
const validateReportReview = [
  param('reviewId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid review ID format');
      }
      return true;
    }),

  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isIn([
      'SPAM',
      'ABUSIVE_LANGUAGE',
      'OFFENSIVE_CONTENT',
      'FAKE_REVIEW',
      'INAPPROPRIATE_CONTENT',
      'HARASSMENT',
      'MISLEADING_INFORMATION',
      'COPYRIGHT_VIOLATION',
      'OTHER'
    ])
    .withMessage('Invalid reason'),

  body('custom_reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Custom reason must not exceed 500 characters')
    .trim()
    .custom((value, { req }) => {
      if (req.body.reason === 'OTHER' && (!value || value.trim().length === 0)) {
        throw new Error('Custom reason is required when reason is OTHER');
      }
      return true;
    })
];

/**
 * Validation for review ID parameter
 */
const validateReviewId = [
  param('reviewId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid review ID format');
      }
      return true;
    })
];

/**
 * Validation for product variant ID parameter
 */
const validateProductVariantId = [
  param('productVariantId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product variant ID format');
      }
      return true;
    })
];

/**
 * Validation for product ID parameter
 */
const validateProductId = [
  param('productId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product ID format');
      }
      return true;
    })
];

/**
 * Validation for review query parameters
 */
const validateReviewQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sort_by')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'rating', 'helpful_votes', 'reported_count'])
    .withMessage('Invalid sort field'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('status')
    .optional()
    .custom((value) => {
      const validStatuses = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'FLAGGED'];
      const statusMap = {
        'pending': 'PENDING_APPROVAL',
        'pending_approval': 'PENDING_APPROVAL', 
        'approved': 'APPROVED',
        'rejected': 'REJECTED',
        'flagged': 'FLAGGED'
      };
      
      // Check if it's already in the correct format
      if (validStatuses.includes(value.toUpperCase())) {
        return true;
      }
      
      // Check if it can be mapped from lowercase
      if (statusMap[value.toLowerCase()]) {
        return true;
      }
      
      throw new Error('Invalid status. Valid values: pending, approved, rejected, flagged');
    })
    .withMessage('Invalid status'),

  query('min_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),

  query('max_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Maximum rating must be between 1 and 5'),

  query('verified_only')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('verified_only must be true or false'),

  query('reported_only')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('reported_only must be true or false'),

  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim(),

  query('product_variant_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product variant ID format');
      }
      return true;
    }),

  query('user_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
      }
      return true;
    })
];

/**
 * Validation for updating review status
 */
const validateUpdateReviewStatus = [
  param('reviewId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid review ID format');
      }
      return true;
    }),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'FLAGGED'])
    .withMessage('Invalid status value')
];

/**
 * Validation for admin review update
 */
const validateAdminUpdateReview = [
  param('reviewId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid review ID format');
      }
      return true;
    }),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Title must not exceed 100 characters')
    .trim(),

  body('review_text')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Review text must not exceed 2000 characters')
    .trim(),

  body('status')
    .optional()
    .isIn(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'FLAGGED'])
    .withMessage('Invalid status value'),

  body('is_verified_buyer')
    .optional()
    .isBoolean()
    .withMessage('is_verified_buyer must be a boolean')
];

/**
 * Validation for report ID parameter
 */
const validateReportId = [
  param('reportId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid report ID format');
      }
      return true;
    })
];

/**
 * Validation for updating report status
 */
const validateUpdateReportStatus = [
  param('reportId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid report ID format');
      }
      return true;
    }),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['RESOLVED', 'REJECTED_REPORT'])
    .withMessage('Status must be RESOLVED or REJECTED_REPORT'),

  body('resolution_notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Resolution notes must not exceed 1000 characters')
    .trim()
];

/**
 * Validation for bulk update report status
 */
const validateBulkUpdateReportStatus = [
  body('report_ids')
    .notEmpty()
    .withMessage('Report IDs are required')
    .isArray({ min: 1 })
    .withMessage('Report IDs must be a non-empty array')
    .custom((ids) => {
      for (const id of ids) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('All report IDs must be valid ObjectId format');
        }
      }
      return true;
    }),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['RESOLVED', 'REJECTED_REPORT'])
    .withMessage('Status must be RESOLVED or REJECTED_REPORT'),

  body('resolution_notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Resolution notes must not exceed 1000 characters')
    .trim()
];

/**
 * Validation for report query parameters
 */
const validateReportQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['PENDING', 'RESOLVED', 'REJECTED_REPORT'])
    .withMessage('Invalid status'),

  query('sort_by')
    .optional()
    .isIn(['createdAt', 'resolved_at', 'status'])
    .withMessage('Invalid sort field'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('review_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid review ID format');
      }
      return true;
    }),

  query('reporter_user_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid reporter user ID format');
      }
      return true;
    })
];

module.exports = {
  validateSubmitReview,
  validateUpdateReview,
  validateVoteReview,
  validateReportReview,
  validateReviewId,
  validateProductVariantId,
  validateProductId,
  validateReviewQuery,
  validateUpdateReviewStatus,
  validateAdminUpdateReview,
  validateReportId,
  validateUpdateReportStatus,
  validateBulkUpdateReportStatus,
  validateReportQuery
};
