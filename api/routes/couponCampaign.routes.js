/**
 * Coupon Campaign Routes
 * Admin-only routes for managing coupon campaigns
 * Base path: /api/v1/admin/coupon-campaigns
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const couponCampaignController = require('../controllers/couponCampaign.controller');
const adminAuthMiddleware = require('../middleware/adminAuth.middleware');

// Apply admin authentication to all routes
router.use(adminAuthMiddleware);

/**
 * Validation middleware for creating coupon campaigns
 */
const createCouponCampaignValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&!()]+$/)
    .withMessage('Name contains invalid characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('code_prefix')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Code prefix cannot exceed 20 characters')
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Code prefix can only contain uppercase letters, numbers, and hyphens'),
  
  body('discount_type')
    .isIn(['PERCENTAGE', 'AMOUNT', 'FREE_SHIPPING'])
    .withMessage('Discount type must be PERCENTAGE, AMOUNT, or FREE_SHIPPING'),
  
  body('discount_value')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number')
    .custom((value, { req }) => {
      if (req.body.discount_type === 'PERCENTAGE' && (value <= 0 || value > 100)) {
        throw new Error('Percentage discount must be between 0 and 100');
      }
      return true;
    }),
  
  body('min_purchase_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum purchase amount must be non-negative'),
  
  body('max_coupon_discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum coupon discount must be positive'),
  
  body('valid_from')
    .isISO8601()
    .withMessage('Valid from must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      if (date < new Date()) {
        throw new Error('Valid from date cannot be in the past');
      }
      return true;
    }),
  
  body('valid_until')
    .isISO8601()
    .withMessage('Valid until must be a valid date')
    .custom((value, { req }) => {
      const validFrom = new Date(req.body.valid_from);
      const validUntil = new Date(value);
      if (validUntil <= validFrom) {
        throw new Error('Valid until date must be after valid from date');
      }
      return true;
    }),
  
  body('max_global_usage')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum global usage must be a positive integer'),
  
  body('max_usage_per_user')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Maximum usage per user must be between 1 and 10'),
  
  body('is_unique_per_user')
    .optional()
    .isBoolean()
    .withMessage('is_unique_per_user must be a boolean'),
  
  body('eligibility_criteria')
    .optional()
    .isArray()
    .withMessage('Eligibility criteria must be an array')
    .custom((criteria) => {
      const validCriteria = ['NEW_USER', 'REFERRAL', 'FIRST_ORDER', 'SPECIFIC_USER_GROUP', 'NONE'];
      const invalidCriteria = criteria.filter(c => !validCriteria.includes(c));
      if (invalidCriteria.length > 0) {
        throw new Error(`Invalid eligibility criteria: ${invalidCriteria.join(', ')}`);
      }
      return true;
    }),
  
  body('applicable_category_ids')
    .optional()
    .isArray()
    .withMessage('Applicable category IDs must be an array')
    .custom((ids) => {
      const mongoose = require('mongoose');
      const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        throw new Error('All category IDs must be valid ObjectIds');
      }
      return true;
    }),
  
  body('applicable_product_variant_ids')
    .optional()
    .isArray()
    .withMessage('Applicable product variant IDs must be an array')
    .custom((ids) => {
      const mongoose = require('mongoose');
      const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        throw new Error('All product variant IDs must be valid ObjectIds');
      }
      return true;
    }),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

/**
 * Validation middleware for updating coupon campaigns
 */
const updateCouponCampaignValidation = [
  param('id')
    .isMongoId()
    .withMessage('Campaign ID must be a valid ObjectId'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&!()]+$/)
    .withMessage('Name contains invalid characters'),
  
  // ... (similar validations as create, but all optional)
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('discount_type')
    .optional()
    .isIn(['PERCENTAGE', 'AMOUNT', 'FREE_SHIPPING'])
    .withMessage('Discount type must be PERCENTAGE, AMOUNT, or FREE_SHIPPING'),
  
  body('discount_value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),
  
  body('min_purchase_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum purchase amount must be non-negative'),
  
  body('max_coupon_discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum coupon discount must be positive'),
  
  body('valid_from')
    .optional()
    .isISO8601()
    .withMessage('Valid from must be a valid date'),
  
  body('valid_until')
    .optional()
    .isISO8601()
    .withMessage('Valid until must be a valid date'),
  
  body('max_global_usage')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum global usage must be a positive integer'),
  
  body('max_usage_per_user')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Maximum usage per user must be between 1 and 10'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

/**
 * Validation middleware for generating user coupons
 */
const generateUserCouponsValidation = [
  param('id')
    .isMongoId()
    .withMessage('Campaign ID must be a valid ObjectId'),
  
  body('user_ids')
    .isArray({ min: 1 })
    .withMessage('user_ids must be a non-empty array')
    .custom((userIds) => {
      const mongoose = require('mongoose');
      const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        throw new Error('All user IDs must be valid ObjectIds');
      }
      return true;
    }),
  
  body('number_of_codes')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Number of codes must be between 1 and 10')
];

/**
 * Validation middleware for query parameters
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
  
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  
  query('discount_type')
    .optional()
    .isIn(['PERCENTAGE', 'AMOUNT', 'FREE_SHIPPING'])
    .withMessage('Invalid discount type'),
  
  query('valid_from_start')
    .optional()
    .isISO8601()
    .withMessage('valid_from_start must be a valid date'),
  
  query('valid_from_end')
    .optional()
    .isISO8601()
    .withMessage('valid_from_end must be a valid date'),
  
  query('valid_until_start')
    .optional()
    .isISO8601()
    .withMessage('valid_until_start must be a valid date'),
  
  query('valid_until_end')
    .optional()
    .isISO8601()
    .withMessage('valid_until_end must be a valid date'),
  
  query('sort_by')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt', 'valid_from', 'valid_until', 'discount_value'])
    .withMessage('Invalid sort field'),
  
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Route definitions
 */

// Create Coupon Campaign
// POST /api/v1/admin/coupon-campaigns
router.post('/', createCouponCampaignValidation, couponCampaignController.createCouponCampaign);

// Get All Coupon Campaigns (with filtering and pagination)
// GET /api/v1/admin/coupon-campaigns
router.get('/', queryValidation, couponCampaignController.getAllCouponCampaigns);

// Get Coupon Campaign by ID or Slug
// GET /api/v1/admin/coupon-campaigns/:identifier
router.get('/:identifier', 
  param('identifier').notEmpty().withMessage('Identifier is required'),
  couponCampaignController.getCouponCampaignById
);

// Update Coupon Campaign
// PATCH /api/v1/admin/coupon-campaigns/:id
router.patch('/:id', updateCouponCampaignValidation, couponCampaignController.updateCouponCampaign);

// Delete Coupon Campaign (Soft Delete)
// DELETE /api/v1/admin/coupon-campaigns/:id
router.delete('/:id',
  param('id').isMongoId().withMessage('Campaign ID must be a valid ObjectId'),
  couponCampaignController.deleteCouponCampaign
);

// Generate User-Specific Codes
// POST /api/v1/admin/coupon-campaigns/:id/generate-codes
router.post('/:id/generate-codes', 
  generateUserCouponsValidation, 
  couponCampaignController.generateUserCoupons
);

module.exports = router;
