/**
 * Admin Dynamic Content Routes
 * Protected routes for managing dynamic content items
 * Requires admin authentication
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createDynamicContent,
  getAllDynamicContentAdmin,
  getDynamicContentAdmin,
  updateDynamicContent,
  deleteDynamicContent,
  getContentStats
} = require('../controllers/dynamicContent.controller');

const router = express.Router();

// Validation middleware
const validateContentCreation = [
  body('name')
    .notEmpty()
    .withMessage('Content name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Content name must be between 3 and 200 characters')
    .trim(),
    
  body('type')
    .notEmpty()
    .withMessage('Content type is required')
    .isIn(['CAROUSEL', 'MARQUEE', 'ADVERTISEMENT', 'OFFER', 'PROMO'])
    .withMessage('Invalid content type'),
    
  body('location_key')
    .notEmpty()
    .withMessage('Location key is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Location key must be between 3 and 100 characters')
    .trim(),
    
  body('content_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Content order must be a non-negative integer'),
    
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
    
  body('display_start_date')
    .optional()
    .isISO8601()
    .withMessage('Display start date must be a valid date'),
    
  body('display_end_date')
    .optional()
    .isISO8601()
    .withMessage('Display end date must be a valid date'),
    
  body('primary_image_url')
    .optional()
    .isURL()
    .withMessage('Primary image URL must be a valid URL'),
    
  body('mobile_image_url')
    .optional()
    .isURL()
    .withMessage('Mobile image URL must be a valid URL'),
    
  body('alt_text')
    .optional()
    .isLength({ max: 250 })
    .withMessage('Alt text cannot exceed 250 characters')
    .trim(),
    
  body('caption')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Caption cannot exceed 500 characters')
    .trim(),
    
  body('main_text_content')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Main text content cannot exceed 1000 characters')
    .trim(),
    
  body('link_url')
    .optional()
    .isURL()
    .withMessage('Link URL must be a valid URL'),
    
  body('call_to_action_text')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Call to action text cannot exceed 50 characters')
    .trim(),
    
  body('target_audience_tags')
    .optional()
    .isArray()
    .withMessage('Target audience tags must be an array'),
    
  body('target_audience_tags.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each target audience tag cannot exceed 50 characters'),
    
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const validateContentUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid content ID'),
    
  body('name')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Content name must be between 3 and 200 characters')
    .trim(),
    
  body('type')
    .optional()
    .isIn(['CAROUSEL', 'MARQUEE', 'ADVERTISEMENT', 'OFFER', 'PROMO'])
    .withMessage('Invalid content type'),
    
  body('location_key')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Location key must be between 3 and 100 characters')
    .trim(),
    
  body('content_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Content order must be a non-negative integer'),
    
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
    
  body('display_start_date')
    .optional()
    .isISO8601()
    .withMessage('Display start date must be a valid date'),
    
  body('display_end_date')
    .optional()
    .isISO8601()
    .withMessage('Display end date must be a valid date'),
    
  body('primary_image_url')
    .optional()
    .isURL()
    .withMessage('Primary image URL must be a valid URL'),
    
  body('mobile_image_url')
    .optional()
    .isURL()
    .withMessage('Mobile image URL must be a valid URL'),
    
  body('alt_text')
    .optional()
    .isLength({ max: 250 })
    .withMessage('Alt text cannot exceed 250 characters')
    .trim(),
    
  body('caption')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Caption cannot exceed 500 characters')
    .trim(),
    
  body('main_text_content')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Main text content cannot exceed 1000 characters')
    .trim(),
    
  body('link_url')
    .optional()
    .isURL()
    .withMessage('Link URL must be a valid URL'),
    
  body('call_to_action_text')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Call to action text cannot exceed 50 characters')
    .trim(),
    
  body('target_audience_tags')
    .optional()
    .isArray()
    .withMessage('Target audience tags must be an array'),
    
  body('target_audience_tags.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each target audience tag cannot exceed 50 characters'),
    
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const validateGetAll = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('type')
    .optional()
    .isIn(['CAROUSEL', 'MARQUEE', 'ADVERTISEMENT', 'OFFER', 'PROMO'])
    .withMessage('Invalid content type'),
    
  query('is_active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_active must be true or false'),
    
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
    
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
    
  query('sort_by')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'content_order', 'type'])
    .withMessage('Invalid sort field'),
    
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid content ID')
];

/**
 * @route   POST /api/v1/admin/dynamic-content
 * @desc    Create new dynamic content item
 * @access  Admin
 */
router.post('/', validateContentCreation, createDynamicContent);

/**
 * @route   GET /api/v1/admin/dynamic-content
 * @desc    Get all dynamic content items with filtering and pagination
 * @access  Admin
 */
router.get('/', validateGetAll, getAllDynamicContentAdmin);

/**
 * @route   GET /api/v1/admin/dynamic-content/stats
 * @desc    Get content statistics
 * @access  Admin
 */
router.get('/stats', getContentStats);

/**
 * @route   GET /api/v1/admin/dynamic-content/:id
 * @desc    Get single dynamic content item
 * @access  Admin
 */
router.get('/:id', validateId, getDynamicContentAdmin);

/**
 * @route   PATCH /api/v1/admin/dynamic-content/:id
 * @desc    Update dynamic content item
 * @access  Admin
 */
router.patch('/:id', validateContentUpdate, updateDynamicContent);

/**
 * @route   DELETE /api/v1/admin/dynamic-content/:id
 * @desc    Delete dynamic content item (soft delete)
 * @access  Admin
 */
router.delete('/:id', validateId, deleteDynamicContent);

module.exports = router;
