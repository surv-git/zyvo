/**
 * Platform Fee Routes
 * Defines RESTful API endpoints for platform fee management
 * All endpoints require admin authentication
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');
const {
  createPlatformFee,
  getAllPlatformFees,
  getPlatformFeeById,
  updatePlatformFee,
  deletePlatformFee
} = require('../controllers/platformFee.controller');

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuthMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     PlatformFee:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the platform fee
 *         platform_id:
 *           type: string
 *           description: Reference to the platform
 *         fee_type:
 *           type: string
 *           enum: [Commission Percentage, Fixed Listing Fee, Payment Gateway Fee, Shipping Fee, Storage Fee, Other]
 *           description: Type of fee
 *         description:
 *           type: string
 *           description: Detailed description of the fee
 *         value:
 *           type: number
 *           minimum: 0
 *           description: Fee value (percentage or fixed amount)
 *         is_percentage:
 *           type: boolean
 *           description: Whether the value is a percentage
 *         effective_date:
 *           type: string
 *           format: date-time
 *           description: When the fee becomes effective
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: When the fee expires (optional)
 *         is_active:
 *           type: boolean
 *           description: Whether the fee is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - platform_id
 *         - fee_type
 *         - value
 */

/**
 * @swagger
 * /api/v1/platform-fees:
 *   post:
 *     summary: Create a new platform fee
 *     tags: [Platform Fees]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform_id
 *               - fee_type
 *               - value
 *             properties:
 *               platform_id:
 *                 type: string
 *                 description: ID of the platform
 *               fee_type:
 *                 type: string
 *                 enum: [Commission Percentage, Fixed Listing Fee, Payment Gateway Fee, Shipping Fee, Storage Fee, Other]
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               value:
 *                 type: number
 *                 minimum: 0
 *                 description: Fee value
 *               is_percentage:
 *                 type: boolean
 *                 default: false
 *               effective_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Platform fee created successfully
 *       400:
 *         description: Validation error or invalid platform ID
 *       401:
 *         description: Unauthorized - admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/', [
  body('platform_id')
    .notEmpty()
    .withMessage('Platform ID is required')
    .isMongoId()
    .withMessage('Platform ID must be a valid MongoDB ObjectId'),
  body('fee_type')
    .notEmpty()
    .withMessage('Fee type is required')
    .isIn(['Commission Percentage', 'Fixed Listing Fee', 'Payment Gateway Fee', 'Shipping Fee', 'Storage Fee', 'Other'])
    .withMessage('Fee type must be one of: Commission Percentage, Fixed Listing Fee, Payment Gateway Fee, Shipping Fee, Storage Fee, Other'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  body('value')
    .notEmpty()
    .withMessage('Fee value is required')
    .isFloat({ min: 0 })
    .withMessage('Fee value must be a positive number'),
  body('is_percentage')
    .optional()
    .isBoolean()
    .withMessage('is_percentage must be a boolean value'),
  body('effective_date')
    .optional()
    .isISO8601()
    .withMessage('Effective date must be a valid ISO 8601 date'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
], createPlatformFee);

/**
 * @swagger
 * /api/v1/platform-fees:
 *   get:
 *     summary: Get all platform fees with pagination and filtering
 *     tags: [Platform Fees]
 *     security:
 *       - adminAuth: []
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
 *         name: platform_id
 *         schema:
 *           type: string
 *         description: Filter by platform ID
 *       - in: query
 *         name: fee_type
 *         schema:
 *           type: string
 *           enum: [Commission Percentage, Fixed Listing Fee, Payment Gateway Fee, Shipping Fee, Storage Fee, Other]
 *         description: Filter by fee type
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: is_currently_active
 *         schema:
 *           type: boolean
 *         description: Filter by current activity (within date range)
 *       - in: query
 *         name: effective_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter fees effective from this date
 *       - in: query
 *         name: effective_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter fees effective until this date
 *       - in: query
 *         name: end_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter fees ending from this date
 *       - in: query
 *         name: end_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter fees ending until this date
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, effective_date, value, fee_type]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Platform fees retrieved successfully
 *       401:
 *         description: Unauthorized - admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('platform_id')
    .optional()
    .isMongoId()
    .withMessage('Platform ID must be a valid MongoDB ObjectId'),
  query('fee_type')
    .optional()
    .isIn(['Commission Percentage', 'Fixed Listing Fee', 'Payment Gateway Fee', 'Shipping Fee', 'Storage Fee', 'Other'])
    .withMessage('Invalid fee type'),
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
  query('is_currently_active')
    .optional()
    .isBoolean()
    .withMessage('is_currently_active must be a boolean value'),
  query('effective_date_from')
    .optional()
    .isISO8601()
    .withMessage('effective_date_from must be a valid ISO 8601 date'),
  query('effective_date_to')
    .optional()
    .isISO8601()
    .withMessage('effective_date_to must be a valid ISO 8601 date'),
  query('end_date_from')
    .optional()
    .isISO8601()
    .withMessage('end_date_from must be a valid ISO 8601 date'),
  query('end_date_to')
    .optional()
    .isISO8601()
    .withMessage('end_date_to must be a valid ISO 8601 date'),
  query('sort_by')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'effective_date', 'value', 'fee_type'])
    .withMessage('Invalid sort field'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
], getAllPlatformFees);

/**
 * @swagger
 * /api/v1/platform-fees/{id}:
 *   get:
 *     summary: Get platform fee by ID
 *     tags: [Platform Fees]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Platform fee ID
 *     responses:
 *       200:
 *         description: Platform fee retrieved successfully
 *       400:
 *         description: Invalid platform fee ID
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Platform fee not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Platform fee ID must be a valid MongoDB ObjectId')
], getPlatformFeeById);

/**
 * @swagger
 * /api/v1/platform-fees/{id}:
 *   patch:
 *     summary: Update platform fee
 *     tags: [Platform Fees]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Platform fee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform_id:
 *                 type: string
 *               fee_type:
 *                 type: string
 *                 enum: [Commission Percentage, Fixed Listing Fee, Payment Gateway Fee, Shipping Fee, Storage Fee, Other]
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               value:
 *                 type: number
 *                 minimum: 0
 *               is_percentage:
 *                 type: boolean
 *               effective_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Platform fee updated successfully
 *       400:
 *         description: Validation error or invalid platform fee ID
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Platform fee not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Platform fee ID must be a valid MongoDB ObjectId'),
  body('platform_id')
    .optional()
    .isMongoId()
    .withMessage('Platform ID must be a valid MongoDB ObjectId'),
  body('fee_type')
    .optional()
    .isIn(['Commission Percentage', 'Fixed Listing Fee', 'Payment Gateway Fee', 'Shipping Fee', 'Storage Fee', 'Other'])
    .withMessage('Fee type must be one of: Commission Percentage, Fixed Listing Fee, Payment Gateway Fee, Shipping Fee, Storage Fee, Other'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  body('value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fee value must be a positive number'),
  body('is_percentage')
    .optional()
    .isBoolean()
    .withMessage('is_percentage must be a boolean value'),
  body('effective_date')
    .optional()
    .isISO8601()
    .withMessage('Effective date must be a valid ISO 8601 date'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
], updatePlatformFee);

/**
 * @swagger
 * /api/v1/platform-fees/{id}:
 *   delete:
 *     summary: Delete platform fee (soft delete)
 *     tags: [Platform Fees]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Platform fee ID
 *     responses:
 *       204:
 *         description: Platform fee deleted successfully
 *       400:
 *         description: Invalid platform fee ID
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Platform fee not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Platform fee ID must be a valid MongoDB ObjectId')
], deletePlatformFee);

module.exports = router;
