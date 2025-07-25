/**
 * Admin Payment Methods Routes
 * Handles routing for admin payment methods management
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Import controller
const adminPaymentMethodController = require('../controllers/adminPaymentMethodController');

// Import middleware
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);
router.use(adminAuthMiddleware);

// Validation rules
const validatePaymentMethodUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid payment method ID'),
  
  body('alias')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Alias must be between 1 and 100 characters')
    .trim(),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
  
  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean value')
];

const validateGetAllQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('method_type')
    .optional()
    .isIn(['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'NETBANKING'])
    .withMessage('Invalid method type'),
  
  query('is_active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_active must be true or false'),
  
  query('is_default')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_default must be true or false'),
  
  query('user_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters')
    .trim(),
  
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  
  query('sort_by')
    .optional()
    .isIn(['created_at', 'updated_at', 'alias', 'method_type', 'is_active', 'is_default'])
    .withMessage('Invalid sort field'),
  
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const validateAnalyticsQuery = [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be one of: 7d, 30d, 90d, 1y')
];

const validatePaymentMethodId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid payment method ID')
];

const validateDeleteQuery = [
  query('permanent')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Permanent must be true or false')
];

/**
 * @swagger
 * /api/v1/admin/payment-methods:
 *   get:
 *     summary: Get all payment methods (Admin)
 *     tags: [Admin - Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: method_type
 *         schema:
 *           type: string
 *           enum: [CREDIT_CARD, DEBIT_CARD, UPI, WALLET, NETBANKING]
 *         description: Filter by payment method type
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: is_default
 *         schema:
 *           type: boolean
 *         description: Filter by default status
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in payment method alias
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date (start)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date (end)
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, alias, method_type, is_active, is_default]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/', validateGetAllQuery, adminPaymentMethodController.getAllPaymentMethods);

/**
 * @swagger
 * /api/v1/admin/payment-methods/analytics:
 *   get:
 *     summary: Get payment methods analytics (Admin)
 *     tags: [Admin - Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', validateAnalyticsQuery, adminPaymentMethodController.getPaymentMethodsAnalytics);

/**
 * @swagger
 * /api/v1/admin/payment-methods/{id}:
 *   get:
 *     summary: Get payment method by ID (Admin)
 *     tags: [Admin - Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method retrieved successfully
 *       400:
 *         description: Invalid payment method ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', validatePaymentMethodId, adminPaymentMethodController.getPaymentMethodById);

/**
 * @swagger
 * /api/v1/admin/payment-methods/{id}:
 *   put:
 *     summary: Update payment method (Admin)
 *     tags: [Admin - Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alias:
 *                 type: string
 *                 description: Payment method alias
 *                 maxLength: 100
 *               is_active:
 *                 type: boolean
 *                 description: Whether the payment method is active
 *               is_default:
 *                 type: boolean
 *                 description: Whether this is the default payment method
 *             example:
 *               alias: "Updated Credit Card"
 *               is_active: true
 *               is_default: false
 *     responses:
 *       200:
 *         description: Payment method updated successfully
 *       400:
 *         description: Validation error or invalid payment method ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', validatePaymentMethodUpdate, adminPaymentMethodController.updatePaymentMethod);

/**
 * @swagger
 * /api/v1/admin/payment-methods/{id}:
 *   delete:
 *     summary: Delete payment method (Admin)
 *     tags: [Admin - Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID
 *       - in: query
 *         name: permanent
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to permanently delete (true) or soft delete (false)
 *     responses:
 *       200:
 *         description: Payment method deleted successfully
 *       400:
 *         description: Invalid payment method ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', validatePaymentMethodId, validateDeleteQuery, adminPaymentMethodController.deletePaymentMethod);

module.exports = router;
