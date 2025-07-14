/**
 * Admin User Coupon Routes
 * Admin routes for managing user coupons
 * Base path: /api/v1/admin/user-coupons
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const userCouponController = require('../controllers/userCoupon.controller');
const adminAuthMiddleware = require('../middleware/adminAuth.middleware');

// Apply admin authentication to all routes
router.use(adminAuthMiddleware);

/**
 * Validation middleware for admin user coupon updates
 */
const updateUserCouponValidation = [
  param('id')
    .isMongoId()
    .withMessage('User coupon ID must be a valid ObjectId'),
  
  body('current_usage_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current usage count must be non-negative'),
  
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Expires at must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    }),
  
  body('is_redeemed')
    .optional()
    .isBoolean()
    .withMessage('is_redeemed must be a boolean'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

/**
 * Admin query validation
 */
const adminQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('user_id')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid ObjectId'),
  
  query('coupon_campaign_id')
    .optional()
    .isMongoId()
    .withMessage('Coupon campaign ID must be a valid ObjectId'),
  
  query('is_redeemed')
    .optional()
    .isBoolean()
    .withMessage('is_redeemed must be a boolean'),
  
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  
  query('sort_by')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'expires_at', 'current_usage_count'])
    .withMessage('Invalid sort field'),
  
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Get All User Coupons (Admin)
 * GET /api/v1/admin/user-coupons
 */
router.get('/',
  adminQueryValidation,
  userCouponController.getAllUserCoupons
);

/**
 * Update User Coupon (Admin)
 * PATCH /api/v1/admin/user-coupons/:id
 */
router.patch('/:id',
  updateUserCouponValidation,
  userCouponController.updateUserCoupon
);

/**
 * Delete User Coupon (Admin - Soft Delete)
 * DELETE /api/v1/admin/user-coupons/:id
 */
router.delete('/:id',
  param('id').isMongoId().withMessage('User coupon ID must be a valid ObjectId'),
  userCouponController.deleteUserCoupon
);

module.exports = router;
