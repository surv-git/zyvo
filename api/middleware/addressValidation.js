/**
 * Address Validation Middleware
 * Express-validator rules for address operations
 */

const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation for creating/updating address
 */
const validateAddress = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Title must be between 1 and 50 characters')
    .trim(),

  body('type')
    .optional()
    .isIn(['HOME', 'OFFICE', 'OTHER', 'BILLING', 'SHIPPING'])
    .withMessage('Type must be HOME, OFFICE, OTHER, BILLING, or SHIPPING'),

  body('full_name')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\.'-]+$/)
    .withMessage('Full name can only contain letters, spaces, dots, hyphens, and apostrophes')
    .trim(),

  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Invalid phone number format')
    .trim(),

  body('address_line_1')
    .notEmpty()
    .withMessage('Address line 1 is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be between 5 and 200 characters')
    .trim(),

  body('address_line_2')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address line 2 must not exceed 200 characters')
    .trim(),

  body('landmark')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Landmark must not exceed 100 characters')
    .trim(),

  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\.-]+$/)
    .withMessage('City can only contain letters, spaces, dots, and hyphens')
    .trim(),

  body('state')
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\.-]+$/)
    .withMessage('State can only contain letters, spaces, dots, and hyphens')
    .trim(),

  body('postal_code')
    .notEmpty()
    .withMessage('Postal code is required')
    .matches(/^[A-Za-z0-9\s\-]{3,10}$/)
    .withMessage('Invalid postal code format')
    .trim(),

  body('country')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\.-]+$/)
    .withMessage('Country can only contain letters, spaces, dots, and hyphens')
    .trim(),

  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),

  body('delivery_instructions')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Delivery instructions must not exceed 500 characters')
    .trim(),

  body('is_verified')
    .optional()
    .isBoolean()
    .withMessage('is_verified must be a boolean'),

  body('verification_source')
    .optional()
    .isIn(['MANUAL', 'GOOGLE_MAPS', 'USER_CONFIRMED'])
    .withMessage('Verification source must be MANUAL, GOOGLE_MAPS, or USER_CONFIRMED'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validation for updating address (all fields optional)
 */
const validateAddressUpdate = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Title must be between 1 and 50 characters')
    .trim(),

  body('type')
    .optional()
    .isIn(['HOME', 'OFFICE', 'OTHER', 'BILLING', 'SHIPPING'])
    .withMessage('Type must be HOME, OFFICE, OTHER, BILLING, or SHIPPING'),

  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\.'-]+$/)
    .withMessage('Full name can only contain letters, spaces, dots, hyphens, and apostrophes')
    .trim(),

  body('phone')
    .optional()
    .matches(/^[+]?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Invalid phone number format')
    .trim(),

  body('address_line_1')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be between 5 and 200 characters')
    .trim(),

  body('address_line_2')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address line 2 must not exceed 200 characters')
    .trim(),

  body('landmark')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Landmark must not exceed 100 characters')
    .trim(),

  body('city')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\.-]+$/)
    .withMessage('City can only contain letters, spaces, dots, and hyphens')
    .trim(),

  body('state')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\.-]+$/)
    .withMessage('State can only contain letters, spaces, dots, and hyphens')
    .trim(),

  body('postal_code')
    .optional()
    .matches(/^[A-Za-z0-9\s\-]{3,10}$/)
    .withMessage('Invalid postal code format')
    .trim(),

  body('country')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\.-]+$/)
    .withMessage('Country can only contain letters, spaces, dots, and hyphens')
    .trim(),

  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),

  body('delivery_instructions')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Delivery instructions must not exceed 500 characters')
    .trim(),

  body('is_verified')
    .optional()
    .isBoolean()
    .withMessage('is_verified must be a boolean'),

  body('verification_source')
    .optional()
    .isIn(['MANUAL', 'GOOGLE_MAPS', 'USER_CONFIRMED'])
    .withMessage('Verification source must be MANUAL, GOOGLE_MAPS, or USER_CONFIRMED'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validate address ID parameter
 */
const validateAddressId = [
  param('addressId')
    .exists()
    .withMessage('Address ID is required')
    .isMongoId()
    .withMessage('Invalid address ID format'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validate user ID parameter
 */
const validateUserId = [
  param('userId')
    .exists()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validate query parameters for getting addresses
 */
const validateGetAddressesQuery = [
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
    .isIn(['createdAt', 'updatedAt', 'title', 'city', 'last_used_at'])
    .withMessage('Invalid sort field'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('type')
    .optional()
    .isIn(['HOME', 'OFFICE', 'OTHER', 'BILLING', 'SHIPPING'])
    .withMessage('Type must be HOME, OFFICE, OTHER, BILLING, or SHIPPING'),

  query('is_active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_active must be true or false'),

  query('is_default')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_default must be true or false'),

  query('include_inactive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('include_inactive must be true or false'),

  query('user_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),

  query('city')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('City must be between 1 and 50 characters'),

  query('state')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('State must be between 1 and 50 characters'),

  query('country')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Country must be between 1 and 50 characters'),

  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateAddress,
  validateAddressUpdate,
  validateAddressId,
  validateUserId,
  validateGetAddressesQuery
};
