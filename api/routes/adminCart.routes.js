/**
 * Admin Cart Routes
 * API endpoints for cart management by administrators
 * Base path: /api/v1/admin/carts
 */

const express = require('express');
const { param, query } = require('express-validator');
const { 
  getAllCartsAdmin,
  getCartsStatsAdmin,
  getUserCartAdmin
} = require('../controllers/cart.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');
const validationErrorHandler = require('../middleware/validationErrorHandler');

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authMiddleware);
router.use(authorize('admin'));

/**
 * @route   GET /api/v1/admin/carts
 * @desc    Get all carts across the system with filtering and pagination
 * @access  Private (Admin)
 * @query   page: Page number (default: 1)
 * @query   limit: Items per page (default: 20, max: 100)
 * @query   sort_by: Sort field (default: updated_at)
 * @query   sort_order: Sort order - asc/desc (default: desc)
 * @query   user_id: Filter by specific user ID
 * @query   has_items: Filter carts with/without items - true/false
 * @query   has_coupon: Filter carts with/without coupons - true/false
 * @query   min_total: Minimum cart total amount
 * @query   max_total: Maximum cart total amount
 * @query   date_from: Filter carts updated from this date (ISO format)
 * @query   date_to: Filter carts updated until this date (ISO format)
 */
router.get('/', [
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
    .isIn(['created_at', 'updated_at', 'cart_total_amount', 'user_id'])
    .withMessage('Invalid sort field'),
  
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('user_id')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  
  query('has_items')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('has_items must be true or false'),
  
  query('has_coupon')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('has_coupon must be true or false'),
  
  query('min_total')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('min_total must be a non-negative number'),
  
  query('max_total')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('max_total must be a non-negative number'),
  
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('date_from must be a valid ISO 8601 date'),
  
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('date_to must be a valid ISO 8601 date'),
  
  validationErrorHandler
], getAllCartsAdmin);

/**
 * @route   GET /api/v1/admin/carts/stats
 * @desc    Get comprehensive cart statistics for admin dashboard
 * @access  Private (Admin)
 * @query   date_from: Get stats from this date (ISO format)
 * @query   date_to: Get stats until this date (ISO format)
 */
router.get('/stats', [
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('date_from must be a valid ISO 8601 date'),
  
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('date_to must be a valid ISO 8601 date'),
  
  validationErrorHandler
], getCartsStatsAdmin);

/**
 * @route   GET /api/v1/admin/carts/user/:userId
 * @desc    Get specific user's cart details
 * @access  Private (Admin)
 */
router.get('/user/:userId', [
  param('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  
  validationErrorHandler
], getUserCartAdmin);

module.exports = router;
