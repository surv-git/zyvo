/**
 * Admin Order Routes
 * API endpoints for order management by administrators
 * Base path: /api/v1/admin/orders
 */

const express = require('express');
const { param, query } = require('express-validator');
const { 
  getAllOrders,
  getAdminOrderDetail,
  updateOrderStatus,
  processRefund,
  updateOrder
} = require('../controllers/order.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');
const validationErrorHandler = require('../middleware/validationErrorHandler');

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authMiddleware);
router.use(authorize('admin'));

/**
 * @route   GET /api/v1/admin/orders
 * @desc    Get all orders (Admin)
 * @access  Private (Admin)
 */
router.get('/', [
  query('user_id')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  
  query('order_status')
    .optional()
    .isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'])
    .withMessage('Order status must be one of: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED'),
  
  query('payment_status')
    .optional()
    .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
    .withMessage('Payment status must be one of: PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED'),
  
  query('order_number')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Order number must be between 1 and 50 characters')
    .trim(),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  validationErrorHandler
], getAllOrders);

/**
 * @route   GET /api/v1/admin/orders/:orderId
 * @desc    Get order details (Admin)
 * @access  Private (Admin)
 */
router.get('/:orderId', [
  param('orderId')
    .isMongoId()
    .withMessage('Order ID must be a valid MongoDB ObjectId'),
  
  validationErrorHandler
], getAdminOrderDetail);

/**
 * @route   PATCH /api/v1/admin/orders/:orderId
 * @desc    Update order details (Admin)
 * @access  Private (Admin)
 */
router.patch('/:orderId', [
  param('orderId')
    .isMongoId()
    .withMessage('Order ID must be a valid MongoDB ObjectId'),
  
  validationErrorHandler
], updateOrder);

/**
 * @route   PATCH /api/v1/admin/orders/:orderId/status
 * @desc    Update order status (Admin)
 * @access  Private (Admin)
 */
router.patch('/:orderId/status', [
  param('orderId')
    .isMongoId()
    .withMessage('Order ID must be a valid MongoDB ObjectId'),
  
  query('order_status')
    .notEmpty()
    .withMessage('Order status is required')
    .isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'])
    .withMessage('Order status must be one of: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED'),
  
  query('payment_status')
    .optional()
    .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
    .withMessage('Payment status must be one of: PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED'),
  
  query('tracking_number')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Tracking number must be between 1 and 100 characters')
    .trim(),
  
  query('shipping_carrier')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Shipping carrier must be between 1 and 100 characters')
    .trim(),
  
  query('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
    .trim(),
  
  validationErrorHandler
], updateOrderStatus);

/**
 * @route   POST /api/v1/admin/orders/:orderId/refund
 * @desc    Process order refund (Admin)
 * @access  Private (Admin)
 */
router.post('/:orderId/refund', [
  param('orderId')
    .isMongoId()
    .withMessage('Order ID must be a valid MongoDB ObjectId'),
  
  query('refund_amount')
    .notEmpty()
    .withMessage('Refund amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0')
    .toFloat(),
  
  query('reason')
    .notEmpty()
    .withMessage('Refund reason is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Refund reason must be between 1 and 1000 characters')
    .trim(),
  
  query('refund_shipping')
    .optional()
    .isBoolean()
    .withMessage('Refund shipping must be a boolean value')
    .toBoolean(),
  
  query('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
    .trim(),
  
  validationErrorHandler
], processRefund);

module.exports = router;
