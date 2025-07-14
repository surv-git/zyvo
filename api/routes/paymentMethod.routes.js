const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

// Import controllers
const {
  addPaymentMethod,
  getAllPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
  setAsDefaultPaymentMethod,
  getDefaultPaymentMethod
} = require('../controllers/paymentMethod.controller');

// Import middleware (assuming these exist)
const userAuthMiddleware = require('../middleware/userAuth.middleware');

/**
 * Payment Method Routes
 * All routes require user authentication
 * Base path: /api/v1/user/payment-methods
 */

// Apply user authentication to all routes
router.use(userAuthMiddleware);

// Validation middleware for payment method creation
const validateAddPaymentMethod = [
  body('method_type')
    .isIn(['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'NETBANKING', 'OTHER'])
    .withMessage('Invalid method type'),
  
  body('alias')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Alias must not exceed 50 characters')
    .trim(),
  
  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean'),
  
  body('details')
    .notEmpty()
    .withMessage('Details object is required')
    .isObject()
    .withMessage('Details must be an object'),

  // Conditional validation based on method_type
  body('details.card_brand')
    .if(body('method_type').isIn(['CREDIT_CARD', 'DEBIT_CARD']))
    .isIn(['Visa', 'MasterCard', 'RuPay', 'Amex', 'Discover', 'Other'])
    .withMessage('Invalid card brand'),
  
  body('details.last4_digits')
    .if(body('method_type').isIn(['CREDIT_CARD', 'DEBIT_CARD']))
    .matches(/^\d{4}$/)
    .withMessage('Last 4 digits must be exactly 4 digits'),
  
  body('details.expiry_month')
    .if(body('method_type').isIn(['CREDIT_CARD', 'DEBIT_CARD']))
    .matches(/^(0[1-9]|1[0-2])$/)
    .withMessage('Expiry month must be in MM format (01-12)'),
  
  body('details.expiry_year')
    .if(body('method_type').isIn(['CREDIT_CARD', 'DEBIT_CARD']))
    .matches(/^\d{4}$/)
    .withMessage('Expiry year must be in YYYY format')
    .custom((value) => {
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      if (year < currentYear || year > currentYear + 20) {
        throw new Error('Expiry year must be valid and not expired');
      }
      return true;
    }),
  
  body('details.card_holder_name')
    .if(body('method_type').isIn(['CREDIT_CARD', 'DEBIT_CARD']))
    .notEmpty()
    .withMessage('Card holder name is required')
    .isLength({ max: 100 })
    .withMessage('Card holder name must not exceed 100 characters')
    .trim(),
  
  body('details.token')
    .if(body('method_type').isIn(['CREDIT_CARD', 'DEBIT_CARD']))
    .notEmpty()
    .withMessage('Payment gateway token is required'),

  // UPI validations
  body('details.upi_id')
    .if(body('method_type').equals('UPI'))
    .notEmpty()
    .withMessage('UPI ID is required')
    .matches(/^[\w.-]+@[\w.-]+$/)
    .withMessage('Invalid UPI ID format')
    .isLength({ max: 100 })
    .withMessage('UPI ID must not exceed 100 characters'),
  
  body('details.account_holder_name')
    .if(body('method_type').isIn(['UPI', 'NETBANKING']))
    .notEmpty()
    .withMessage('Account holder name is required')
    .isLength({ max: 100 })
    .withMessage('Account holder name must not exceed 100 characters')
    .trim(),

  // Wallet validations
  body('details.wallet_provider')
    .if(body('method_type').equals('WALLET'))
    .isIn(['Paytm', 'PhonePe', 'GooglePay', 'Mobikwik', 'JioMoney', 'Other'])
    .withMessage('Invalid wallet provider'),
  
  body('details.linked_account_identifier')
    .if(body('method_type').equals('WALLET'))
    .optional()
    .isLength({ max: 100 })
    .withMessage('Linked account identifier must not exceed 100 characters')
    .trim(),

  // Net Banking validations
  body('details.bank_name')
    .if(body('method_type').equals('NETBANKING'))
    .notEmpty()
    .withMessage('Bank name is required')
    .isLength({ max: 100 })
    .withMessage('Bank name must not exceed 100 characters')
    .trim(),
  
  body('details.token')
    .if(body('method_type').equals('NETBANKING'))
    .optional()
];

// Validation middleware for payment method updates
const validateUpdatePaymentMethod = [
  param('id')
    .isMongoId()
    .withMessage('Invalid payment method ID'),
  
  body('alias')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Alias must not exceed 50 characters')
    .trim(),
  
  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean'),
  
  body('details')
    .optional()
    .isObject()
    .withMessage('Details must be an object'),
  
  // Only allow non-sensitive updates
  body('details.card_holder_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Card holder name must not exceed 100 characters')
    .trim(),
  
  body('details.account_holder_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Account holder name must not exceed 100 characters')
    .trim(),
  
  body('details.bank_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Bank name must not exceed 100 characters')
    .trim(),
  
  body('details.wallet_provider')
    .optional()
    .isIn(['Paytm', 'PhonePe', 'GooglePay', 'Mobikwik', 'JioMoney', 'Other'])
    .withMessage('Invalid wallet provider'),
  
  body('details.linked_account_identifier')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Linked account identifier must not exceed 100 characters')
    .trim(),

  // Reject sensitive field updates
  body('details.last4_digits')
    .not()
    .exists()
    .withMessage('Cannot update card digits. Please add a new payment method.'),
  
  body('details.token')
    .not()
    .exists()
    .withMessage('Cannot update payment tokens. Please add a new payment method.'),
  
  body('details.upi_id')
    .not()
    .exists()
    .withMessage('Cannot update UPI ID. Please add a new payment method.'),
  
  body('details.expiry_month')
    .not()
    .exists()
    .withMessage('Cannot update card expiry. Please add a new payment method.'),
  
  body('details.expiry_year')
    .not()
    .exists()
    .withMessage('Cannot update card expiry. Please add a new payment method.')
];

// Validation middleware for MongoDB ObjectId parameters
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid payment method ID')
];

// Validation middleware for query parameters
const validateQueryParams = [
  query('include_inactive')
    .optional()
    .isBoolean()
    .withMessage('include_inactive must be a boolean'),
  
  query('hard_delete')
    .optional()
    .isBoolean()
    .withMessage('hard_delete must be a boolean')
];

/**
 * @route   POST /api/v1/user/payment-methods
 * @desc    Add a new payment method
 * @access  Private (User)
 * @body    { method_type, alias?, is_default?, details }
 */
router.post('/', validateAddPaymentMethod, addPaymentMethod);

/**
 * @route   GET /api/v1/user/payment-methods
 * @desc    Get all payment methods for authenticated user
 * @access  Private (User)
 * @query   include_inactive? (boolean)
 */
router.get('/', validateQueryParams, getAllPaymentMethods);

/**
 * @route   GET /api/v1/user/payment-methods/default
 * @desc    Get user's default payment method
 * @access  Private (User)
 */
router.get('/default', getDefaultPaymentMethod);

/**
 * @route   GET /api/v1/user/payment-methods/:id
 * @desc    Get a specific payment method by ID
 * @access  Private (User)
 * @param   id - Payment method ObjectId
 */
router.get('/:id', validateObjectId, getPaymentMethodById);

/**
 * @route   PATCH /api/v1/user/payment-methods/:id
 * @desc    Update payment method (non-sensitive fields only)
 * @access  Private (User)
 * @param   id - Payment method ObjectId
 * @body    { alias?, is_default?, details? }
 */
router.patch('/:id', validateUpdatePaymentMethod, updatePaymentMethod);

/**
 * @route   PATCH /api/v1/user/payment-methods/:id/default
 * @desc    Set payment method as default
 * @access  Private (User)
 * @param   id - Payment method ObjectId
 */
router.patch('/:id/default', validateObjectId, setAsDefaultPaymentMethod);

/**
 * @route   DELETE /api/v1/user/payment-methods/:id
 * @desc    Delete payment method (soft delete by default)
 * @access  Private (User)
 * @param   id - Payment method ObjectId
 * @query   hard_delete? (boolean)
 */
router.delete('/:id', [...validateObjectId, ...validateQueryParams], deletePaymentMethod);

module.exports = router;
