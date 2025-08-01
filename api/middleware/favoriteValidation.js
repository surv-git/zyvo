/**
 * Favorite Validation Middleware
 * Express-validator rules for favorite operations
 */

const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation for adding a favorite
 */
const validateAddFavorite = [
  // Custom validation to ensure either product_variant_id or product_id is provided
  body().custom((body) => {
    if (!body.product_variant_id && !body.product_id) {
      throw new Error('Either product_variant_id or product_id is required');
    }
    return true;
  }),
  
  body('product_variant_id')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product variant ID format');
      }
      return true;
    }),
    
  body('product_id')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product ID format');
      }
      return true;
    }),

  body('user_notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('User notes must not exceed 500 characters')
    .trim()
];

/**
 * Validation for updating favorite notes
 */
const validateUpdateFavoriteNotes = [
  param('productVariantId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product variant ID format');
      }
      return true;
    }),

  body('user_notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('User notes must not exceed 500 characters')
    .trim()
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
 * Validation for generic ID parameter (product_id or product_variant_id)
 * Used in DELETE endpoint that accepts both types
 */
const validateGenericId = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid ID format');
      }
      return true;
    }),
    
  query('type')
    .optional()
    .isIn(['product', 'variant'])
    .withMessage('Type must be either "product" or "variant"')
];

/**
 * Validation for favorites query parameters
 */
const validateFavoritesQuery = [
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
    .isIn(['added_at', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('include_inactive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('include_inactive must be true or false')
];

/**
 * Validation for bulk add favorites
 */
const validateBulkAddFavorites = [
  body('product_variant_ids')
    .notEmpty()
    .withMessage('Product variant IDs are required')
    .isArray({ min: 1, max: 50 })
    .withMessage('Product variant IDs must be an array with 1-50 items')
    .custom((ids) => {
      for (const id of ids) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('All product variant IDs must be valid ObjectId format');
        }
      }
      return true;
    }),

  body('user_notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('User notes must not exceed 500 characters')
    .trim()
];

/**
 * Validation for popular favorites query
 */
const validatePopularQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

/**
 * Validation for admin favorites query
 */
const validateAdminFavoritesQuery = [
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
    .isIn(['added_at', 'updated_at', 'user_id', 'product_variant_id'])
    .withMessage('Sort by must be one of: added_at, updated_at, user_id, product_variant_id'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),

  query('user_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
      }
      return true;
    }),

  query('product_variant_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product variant ID format');
      }
      return true;
    }),

  query('include_inactive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Include inactive must be true or false'),

  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date'),

  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date')
];

/**
 * Validation for favorites stats query
 */
const validateFavoritesStatsQuery = [
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date'),

  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date')
];

/**
 * Validation for user ID parameter
 */
const validateUserIdParam = [
  param('userId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
      }
      return true;
    })
];

module.exports = {
  validateAddFavorite,
  validateUpdateFavoriteNotes,
  validateProductVariantId,
  validateGenericId,
  validateFavoritesQuery,
  validateBulkAddFavorites,
  validatePopularQuery,
  // Admin validations
  validateAdminFavoritesQuery,
  validateFavoritesStatsQuery,
  validateUserIdParam
};
