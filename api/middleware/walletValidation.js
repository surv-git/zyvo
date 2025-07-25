/**
 * Wallet Validation Middleware
 * Express-validator rules for wallet operations
 */

const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation for wallet top-up initiation
 */
const validateInitiateTopup = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be at least 0.01')
    .custom((value) => {
      const amount = parseFloat(value);
      if (amount > 100000) {
        throw new Error('Amount cannot exceed 100,000');
      }
      return true;
    }),

  body('payment_method')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET'])
    .withMessage('Invalid payment method')
];

/**
 * Validation for admin wallet balance adjustment
 */
const validateAdjustBalance = [
  param('userId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
      }
      return true;
    }),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be at least 0.01')
    .custom((value) => {
      const amount = parseFloat(value);
      if (amount > 500000) {
        throw new Error('Adjustment amount cannot exceed 500,000');
      }
      return true;
    }),

  body('type')
    .notEmpty()
    .withMessage('Adjustment type is required')
    .isIn(['CREDIT', 'DEBIT'])
    .withMessage('Type must be CREDIT or DEBIT'),

  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 5, max: 250 })
    .withMessage('Description must be between 5 and 250 characters')
    .trim()
];

/**
 * Validation for wallet status update
 */
const validateUpdateWalletStatus = [
  param('userId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
      }
      return true;
    }),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['ACTIVE', 'BLOCKED', 'INACTIVE'])
    .withMessage('Status must be ACTIVE, BLOCKED, or INACTIVE')
];

/**
 * Validation for user ID parameter
 */
const validateUserId = [
  param('userId')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
      }
      return true;
    })
];

/**
 * Validation for wallet transaction query parameters
 */
const validateTransactionQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('transaction_type')
    .optional()
    .isIn(['CREDIT', 'DEBIT'])
    .withMessage('Transaction type must be CREDIT or DEBIT'),

  query('status')
    .optional()
    .isIn(['PENDING', 'COMPLETED', 'FAILED', 'ROLLED_BACK'])
    .withMessage('Invalid status'),

  query('reference_type')
    .optional()
    .isIn(['ORDER', 'REFUND', 'PAYMENT_GATEWAY', 'ADMIN_ADJUSTMENT', 'WITHDRAWAL'])
    .withMessage('Invalid reference type'),

  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.start_date && new Date(value) < new Date(req.query.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  query('sort_by')
    .optional()
    .isIn(['createdAt', 'amount', 'status', 'transaction_type'])
    .withMessage('Invalid sort field'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation for admin transaction query parameters
 */
const validateAdminTransactionQuery = [
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
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
      }
      return true;
    }),

  query('wallet_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid wallet ID format');
      }
      return true;
    }),

  query('transaction_type')
    .optional()
    .isIn(['CREDIT', 'DEBIT'])
    .withMessage('Transaction type must be CREDIT or DEBIT'),

  query('status')
    .optional()
    .isIn(['PENDING', 'COMPLETED', 'FAILED', 'ROLLED_BACK'])
    .withMessage('Invalid status'),

  query('reference_type')
    .optional()
    .isIn(['ORDER', 'REFUND', 'PAYMENT_GATEWAY', 'ADMIN_ADJUSTMENT', 'WITHDRAWAL'])
    .withMessage('Invalid reference type'),

  query('initiated_by_actor')
    .optional()
    .isIn(['USER', 'ADMIN', 'SYSTEM'])
    .withMessage('Invalid initiated by actor'),

  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.start_date && new Date(value) < new Date(req.query.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  query('sort_by')
    .optional()
    .isIn(['createdAt', 'amount', 'status', 'transaction_type', 'user_id'])
    .withMessage('Invalid sort field'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation for payment gateway callback
 */
const validatePaymentCallback = [
  body('gateway_transaction_id')
    .notEmpty()
    .withMessage('Gateway transaction ID is required')
    .isLength({ min: 10, max: 100 })
    .withMessage('Invalid gateway transaction ID format'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['SUCCESS', 'FAILED', 'PENDING', 'CANCELLED', 'COMPLETED'])
    .withMessage('Invalid payment status'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be at least 0.01'),

  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'])
    .withMessage('Invalid currency'),

  body('failure_reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Failure reason cannot exceed 500 characters')
    .trim()
];

/**
 * Validation for wallet summary query
 */
const validateSummaryQuery = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

/**
 * Validation for admin get all wallets query parameters
 */
const validateGetAllWalletsAdmin = [
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
    .isIn(['created_at', 'updated_at', 'balance', 'last_transaction_at'])
    .withMessage('Invalid sort field'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('status')
    .optional()
    .isIn(['ACTIVE', 'BLOCKED', 'INACTIVE'])
    .withMessage('Status must be ACTIVE, BLOCKED, or INACTIVE'),

  query('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'])
    .withMessage('Invalid currency'),

  query('user_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID format');
      }
      return true;
    }),

  query('min_balance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum balance must be non-negative'),

  query('max_balance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum balance must be non-negative'),

  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date'),

  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date'),

  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .trim()
];

// Validate wallet ID parameter
const validateWalletId = [
  param('walletId')
    .exists()
    .withMessage('Wallet ID is required')
    .isMongoId()
    .withMessage('Invalid wallet ID format'),
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
  validateInitiateTopup,
  validateAdjustBalance,
  validateUpdateWalletStatus,
  validateUserId,
  validateTransactionQuery,
  validateAdminTransactionQuery,
  validatePaymentCallback,
  validateSummaryQuery,
  validateGetAllWalletsAdmin,
  validateWalletId
};
