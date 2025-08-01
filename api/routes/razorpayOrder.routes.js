/**
 * Razorpay Order Routes
 * Handles Razorpay payment integration routes
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth.middleware');
const validationErrorHandler = require('../middleware/validationErrorHandler');
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handlePaymentFailure
} = require('../controllers/razorpayOrder.controller');

// Address validation schema
const addressValidation = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('address_line1')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be between 5 and 200 characters'),
  body('address_line2')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address line 2 cannot exceed 200 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('state')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  body('pincode')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be exactly 6 digits'),
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  body('phone_number')
    .trim()
    .matches(/^[+]?[\d\s-()]{10,15}$/)
    .withMessage('Please provide a valid phone number')
];

/**
 * @route   POST /api/v1/user/orders/razorpay/create
 * @desc    Create Razorpay order for payment
 * @access  Private (User)
 */
router.post('/create',
  authMiddleware,
  [
    // Shipping address validation
    body('shipping_address.full_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Shipping address: Full name must be between 2 and 100 characters'),
    body('shipping_address.address_line1')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Shipping address: Address line 1 must be between 5 and 200 characters'),
    body('shipping_address.address_line2')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Shipping address: Address line 2 cannot exceed 200 characters'),
    body('shipping_address.city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Shipping address: City must be between 2 and 100 characters'),
    body('shipping_address.state')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Shipping address: State must be between 2 and 100 characters'),
    body('shipping_address.pincode')
      .trim()
      .matches(/^\d{6}$/)
      .withMessage('Shipping address: Pincode must be exactly 6 digits'),
    body('shipping_address.country')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Shipping address: Country must be between 2 and 100 characters'),
    body('shipping_address.phone_number')
      .trim()
      .matches(/^[+]?[\d\s-()]{10,15}$/)
      .withMessage('Shipping address: Please provide a valid phone number'),

    // Billing address validation
    body('billing_address.full_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Billing address: Full name must be between 2 and 100 characters'),
    body('billing_address.address_line1')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Billing address: Address line 1 must be between 5 and 200 characters'),
    body('billing_address.address_line2')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Billing address: Address line 2 cannot exceed 200 characters'),
    body('billing_address.city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Billing address: City must be between 2 and 100 characters'),
    body('billing_address.state')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Billing address: State must be between 2 and 100 characters'),
    body('billing_address.pincode')
      .trim()
      .matches(/^\d{6}$/)
      .withMessage('Billing address: Pincode must be exactly 6 digits'),
    body('billing_address.country')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Billing address: Country must be between 2 and 100 characters'),
    body('billing_address.phone_number')
      .trim()
      .matches(/^[+]?[\d\s-()]{10,15}$/)
      .withMessage('Billing address: Please provide a valid phone number'),

    // Payment method validation (optional)
    body('payment_method_id')
      .optional()
      .isMongoId()
      .withMessage('Payment method ID must be a valid MongoDB ObjectId')
  ],
  validationErrorHandler,
  createRazorpayOrder
);

/**
 * @route   POST /api/v1/user/orders/razorpay/verify
 * @desc    Verify Razorpay payment and complete order
 * @access  Private (User)
 */
router.post('/verify',
  authMiddleware,
  [
    // Razorpay payment verification fields
    body('razorpay_order_id')
      .trim()
      .notEmpty()
      .withMessage('Razorpay order ID is required'),
    body('razorpay_payment_id')
      .trim()
      .notEmpty()
      .withMessage('Razorpay payment ID is required'),
    body('razorpay_signature')
      .trim()
      .notEmpty()
      .withMessage('Razorpay signature is required'),

    // Shipping address validation
    body('shipping_address.full_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Shipping address: Full name must be between 2 and 100 characters'),
    body('shipping_address.address_line1')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Shipping address: Address line 1 must be between 5 and 200 characters'),
    body('shipping_address.address_line2')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Shipping address: Address line 2 cannot exceed 200 characters'),
    body('shipping_address.city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Shipping address: City must be between 2 and 100 characters'),
    body('shipping_address.state')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Shipping address: State must be between 2 and 100 characters'),
    body('shipping_address.pincode')
      .trim()
      .matches(/^\d{6}$/)
      .withMessage('Shipping address: Pincode must be exactly 6 digits'),
    body('shipping_address.country')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Shipping address: Country must be between 2 and 100 characters'),
    body('shipping_address.phone_number')
      .trim()
      .matches(/^[+]?[\d\s-()]{10,15}$/)
      .withMessage('Shipping address: Please provide a valid phone number'),

    // Billing address validation
    body('billing_address.full_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Billing address: Full name must be between 2 and 100 characters'),
    body('billing_address.address_line1')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Billing address: Address line 1 must be between 5 and 200 characters'),
    body('billing_address.address_line2')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Billing address: Address line 2 cannot exceed 200 characters'),
    body('billing_address.city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Billing address: City must be between 2 and 100 characters'),
    body('billing_address.state')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Billing address: State must be between 2 and 100 characters'),
    body('billing_address.pincode')
      .trim()
      .matches(/^\d{6}$/)
      .withMessage('Billing address: Pincode must be exactly 6 digits'),
    body('billing_address.country')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Billing address: Country must be between 2 and 100 characters'),
    body('billing_address.phone_number')
      .trim()
      .matches(/^[+]?[\d\s-()]{10,15}$/)
      .withMessage('Billing address: Please provide a valid phone number'),

    // Payment method validation (optional)
    body('payment_method_id')
      .optional()
      .isMongoId()
      .withMessage('Payment method ID must be a valid MongoDB ObjectId')
  ],
  validationErrorHandler,
  verifyRazorpayPayment
);

/**
 * @route   POST /api/v1/user/orders/razorpay/failure
 * @desc    Handle Razorpay payment failure
 * @access  Private (User)
 */
router.post('/failure',
  authMiddleware,
  [
    body('razorpay_order_id')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Razorpay order ID cannot be empty if provided'),
    body('razorpay_payment_id')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Razorpay payment ID cannot be empty if provided'),
    body('error.code')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Error code cannot be empty if provided'),
    body('error.description')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Error description cannot be empty if provided')
  ],
  validationErrorHandler,
  handlePaymentFailure
);

module.exports = router;
