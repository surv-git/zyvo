/**
 * User Coupon Routes
 * User-facing routes for coupon management
 * Base path: /api/v1/user/coupons
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const userCouponController = require('../controllers/userCoupon.controller');
const userAuthMiddleware = require('../middleware/userAuth.middleware');

// Apply user authentication to all routes
router.use(userAuthMiddleware);

/**
 * Validation middleware for applying coupons
 */
const applyCouponValidation = [
  body('coupon_code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 4, max: 50 })
    .withMessage('Coupon code must be between 4 and 50 characters')
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Coupon code can only contain uppercase letters, numbers, and hyphens'),
  
  body('cart_total_amount')
    .isFloat({ min: 0 })
    .withMessage('Cart total amount must be a positive number'),
  
  body('cart_item_details')
    .isArray({ min: 1 })
    .withMessage('Cart item details must be a non-empty array'),
  
  body('cart_item_details.*.product_variant_id')
    .isMongoId()
    .withMessage('Product variant ID must be a valid ObjectId'),
  
  body('cart_item_details.*.category_id')
    .isMongoId()
    .withMessage('Category ID must be a valid ObjectId'),
  
  body('cart_item_details.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('cart_item_details.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
];

/**
 * Query validation for user coupons
 */
const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('is_redeemed')
    .optional()
    .isBoolean()
    .withMessage('is_redeemed must be a boolean'),
  
  query('status')
    .optional()
    .isIn(['active', 'expired', 'redeemed', 'all'])
    .withMessage('Status must be active, expired, redeemed, or all')
];

/**
 * Get My Coupons
 * GET /api/v1/user/coupons
 */
router.get('/', 
  queryValidation, 
  userCouponController.getMyCoupons
);

/**
 * Get Specific Coupon by Code
 * GET /api/v1/user/coupons/:code
 */
router.get('/:code',
  param('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Invalid coupon code format'),
  userCouponController.getCouponByCode
);

/**
 * Apply Coupon to Cart/Order
 * POST /api/v1/user/coupons/apply
 */
router.post('/apply',
  applyCouponValidation,
  userCouponController.applyCoupon
);

module.exports = router;
