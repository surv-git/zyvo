/**
 * Order Routes
 * API endpoints for order management with validation
 * Separate user and admin routes with appropriate authentication
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const { 
  placeOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  getAllOrders,
  getAdminOrderDetail,
  updateOrderStatus,
  processRefund
} = require('../controllers/order.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');
const validationErrorHandler = require('../middleware/validationErrorHandler');

const router = express.Router();

// ===========================
// USER ROUTES
// ===========================

/**
 * @route   POST /api/v1/user/orders
 * @desc    Place order from cart
 * @access  Private (User)
 */
router.post('/', [
  authMiddleware,
  
  // Shipping address validation
  body('shipping_address.full_name')
    .notEmpty()
    .withMessage('Shipping address full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Shipping address full name must be between 2 and 100 characters')
    .trim(),
  
  body('shipping_address.address_line1')
    .notEmpty()
    .withMessage('Shipping address line 1 is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Shipping address line 1 must be between 5 and 200 characters')
    .trim(),
  
  body('shipping_address.city')
    .notEmpty()
    .withMessage('Shipping city is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Shipping city must be between 2 and 100 characters')
    .trim(),
  
  body('shipping_address.state')
    .notEmpty()
    .withMessage('Shipping state is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Shipping state must be between 2 and 100 characters')
    .trim(),
  
  body('shipping_address.pincode')
    .notEmpty()
    .withMessage('Shipping pincode is required')
    .matches(/^\d{6}$/)
    .withMessage('Shipping pincode must be 6 digits')
    .trim(),
  
  body('shipping_address.phone_number')
    .notEmpty()
    .withMessage('Shipping phone number is required')
    .matches(/^[+]?[\d\s-()]{10,15}$/)
    .withMessage('Please provide a valid shipping phone number')
    .trim(),
  
  // Billing address validation
  body('billing_address.full_name')
    .notEmpty()
    .withMessage('Billing address full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Billing address full name must be between 2 and 100 characters')
    .trim(),
  
  body('billing_address.address_line1')
    .notEmpty()
    .withMessage('Billing address line 1 is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Billing address line 1 must be between 5 and 200 characters')
    .trim(),
  
  body('billing_address.city')
    .notEmpty()
    .withMessage('Billing city is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Billing city must be between 2 and 100 characters')
    .trim(),
  
  body('billing_address.state')
    .notEmpty()
    .withMessage('Billing state is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Billing state must be between 2 and 100 characters')
    .trim(),
  
  body('billing_address.pincode')
    .notEmpty()
    .withMessage('Billing pincode is required')
    .matches(/^\d{6}$/)
    .withMessage('Billing pincode must be 6 digits')
    .trim(),
  
  body('billing_address.phone_number')
    .notEmpty()
    .withMessage('Billing phone number is required')
    .matches(/^[+]?[\d\s-()]{10,15}$/)
    .withMessage('Please provide a valid billing phone number')
    .trim(),
  
  body('payment_method_id')
    .optional()
    .isMongoId()
    .withMessage('Payment method ID must be a valid MongoDB ObjectId'),
  
  body('is_cod')
    .optional()
    .isBoolean()
    .withMessage('is_cod must be a boolean value')
    .toBoolean(),
    
  validationErrorHandler
], placeOrder);

/**
 * @route   GET /api/v1/user/orders
 * @desc    Get user's orders
 * @access  Private (User)
 */
router.get('/', [
  authMiddleware,
  
  query('status')
    .optional()
    .isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'])
    .withMessage('Status must be one of: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED'),
  
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
    .withMessage('Start date must be a valid ISO 8601 date')
    .toDate(),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .toDate(),
    
  validationErrorHandler
], getMyOrders);

/**
 * @route   GET /api/v1/user/orders/:orderId
 * @desc    Get single order details
 * @access  Private (User)
 */
router.get('/:orderId', [
  authMiddleware,
  
  param('orderId')
    .isMongoId()
    .withMessage('Order ID must be a valid MongoDB ObjectId'),
    
  validationErrorHandler
], getOrderDetail);

/**
 * @route   PATCH /api/v1/user/orders/:orderId/cancel
 * @desc    Cancel order
 * @access  Private (User)
 */
router.patch('/:orderId/cancel', [
  authMiddleware,
  
  param('orderId')
    .isMongoId()
    .withMessage('Order ID must be a valid MongoDB ObjectId'),
  
  body('reason')
    .optional()
    .isLength({ min: 3, max: 500 })
    .withMessage('Reason must be between 3 and 500 characters')
    .trim(),
    
  validationErrorHandler
], cancelOrder);

module.exports = router;
