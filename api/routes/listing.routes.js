/**
 * Listing Routes
 * Defines RESTful API endpoints for product variant listing management
 * All endpoints require admin authentication
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');
const {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing
} = require('../controllers/listing.controller');

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuthMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Listing:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the listing
 *         product_variant_id:
 *           type: string
 *           description: Reference to the product variant
 *         platform_id:
 *           type: string
 *           description: Reference to the platform
 *         platform_sku:
 *           type: string
 *           description: Platform-specific SKU
 *         platform_product_id:
 *           type: string
 *           description: Platform-specific product ID
 *         listing_status:
 *           type: string
 *           enum: [Draft, Pending Review, Live, Rejected, Deactivated]
 *           description: Current status of the listing
 *         platform_price:
 *           type: number
 *           minimum: 0
 *           description: Price on the platform
 *         platform_commission_percentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Commission percentage for this variant
 *         platform_fixed_fee:
 *           type: number
 *           minimum: 0
 *           description: Fixed fee per sale
 *         platform_shipping_fee:
 *           type: number
 *           minimum: 0
 *           description: Shipping fee charged by platform
 *         last_synced_at:
 *           type: string
 *           format: date-time
 *           description: Last synchronization timestamp
 *         platform_specific_data:
 *           type: object
 *           description: Platform-specific attributes
 *         is_active_on_platform:
 *           type: boolean
 *           description: Whether listing is active on platform
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - product_variant_id
 *         - platform_id
 */

/**
 * @swagger
 * /api/v1/listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_variant_id
 *               - platform_id
 *             properties:
 *               product_variant_id:
 *                 type: string
 *                 description: ID of the product variant
 *               platform_id:
 *                 type: string
 *                 description: ID of the platform
 *               platform_sku:
 *                 type: string
 *                 maxLength: 100
 *               platform_product_id:
 *                 type: string
 *                 maxLength: 150
 *               listing_status:
 *                 type: string
 *                 enum: [Draft, Pending Review, Live, Rejected, Deactivated]
 *                 default: Draft
 *               platform_price:
 *                 type: number
 *                 minimum: 0
 *               platform_commission_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               platform_fixed_fee:
 *                 type: number
 *                 minimum: 0
 *               platform_shipping_fee:
 *                 type: number
 *                 minimum: 0
 *               platform_specific_data:
 *                 type: object
 *               is_active_on_platform:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Listing created successfully
 *       400:
 *         description: Validation error or duplicate variant-platform combination
 *       401:
 *         description: Unauthorized - admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/', [
  body('product_variant_id')
    .notEmpty()
    .withMessage('Product variant ID is required')
    .isMongoId()
    .withMessage('Product variant ID must be a valid MongoDB ObjectId'),
  body('platform_id')
    .notEmpty()
    .withMessage('Platform ID is required')
    .isMongoId()
    .withMessage('Platform ID must be a valid MongoDB ObjectId'),
  body('platform_sku')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Platform SKU cannot exceed 100 characters')
    .trim(),
  body('platform_product_id')
    .optional()
    .isLength({ max: 150 })
    .withMessage('Platform product ID cannot exceed 150 characters')
    .trim(),
  body('listing_status')
    .optional()
    .isIn(['Draft', 'Pending Review', 'Live', 'Rejected', 'Deactivated'])
    .withMessage('Listing status must be one of: Draft, Pending Review, Live, Rejected, Deactivated'),
  body('platform_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Platform price must be a positive number'),
  body('platform_commission_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission percentage must be between 0 and 100'),
  body('platform_fixed_fee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fixed fee must be a positive number'),
  body('platform_shipping_fee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping fee must be a positive number'),
  body('platform_specific_data')
    .optional()
    .isObject()
    .withMessage('Platform specific data must be an object'),
  body('is_active_on_platform')
    .optional()
    .isBoolean()
    .withMessage('is_active_on_platform must be a boolean value')
], createListing);

/**
 * @swagger
 * /api/v1/listings:
 *   get:
 *     summary: Get all listings with pagination and filtering
 *     tags: [Listings]
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
 *         name: product_variant_id
 *         schema:
 *           type: string
 *         description: Filter by product variant ID
 *       - in: query
 *         name: listing_status
 *         schema:
 *           type: string
 *           enum: [Draft, Pending Review, Live, Rejected, Deactivated]
 *         description: Filter by listing status
 *       - in: query
 *         name: is_active_on_platform
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: platform_sku
 *         schema:
 *           type: string
 *         description: Filter by platform SKU (partial match)
 *       - in: query
 *         name: platform_product_id
 *         schema:
 *           type: string
 *         description: Filter by platform product ID (partial match)
 *       - in: query
 *         name: needs_sync
 *         schema:
 *           type: boolean
 *         description: Filter listings that need synchronization
 *       - in: query
 *         name: has_price
 *         schema:
 *           type: boolean
 *         description: Filter listings with valid platform price
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search across platform SKU and product ID
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, platform_price, listing_status, last_synced_at]
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
 *         description: Listings retrieved successfully
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
  query('product_variant_id')
    .optional()
    .isMongoId()
    .withMessage('Product variant ID must be a valid MongoDB ObjectId'),
  query('listing_status')
    .optional()
    .isIn(['Draft', 'Pending Review', 'Live', 'Rejected', 'Deactivated'])
    .withMessage('Invalid listing status'),
  query('is_active_on_platform')
    .optional()
    .isBoolean()
    .withMessage('is_active_on_platform must be a boolean value'),
  query('platform_sku')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Platform SKU must be between 1 and 100 characters'),
  query('platform_product_id')
    .optional()
    .isLength({ min: 1, max: 150 })
    .withMessage('Platform product ID must be between 1 and 150 characters'),
  query('needs_sync')
    .optional()
    .isBoolean()
    .withMessage('needs_sync must be a boolean value'),
  query('has_price')
    .optional()
    .isBoolean()
    .withMessage('has_price must be a boolean value'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('sort_by')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'platform_price', 'listing_status', 'last_synced_at'])
    .withMessage('Invalid sort field'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
], getAllListings);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   get:
 *     summary: Get listing by ID
 *     tags: [Listings]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: Listing retrieved successfully
 *       400:
 *         description: Invalid listing ID
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Listing ID must be a valid MongoDB ObjectId')
], getListingById);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   patch:
 *     summary: Update listing
 *     tags: [Listings]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform_sku:
 *                 type: string
 *                 maxLength: 100
 *               platform_product_id:
 *                 type: string
 *                 maxLength: 150
 *               listing_status:
 *                 type: string
 *                 enum: [Draft, Pending Review, Live, Rejected, Deactivated]
 *               platform_price:
 *                 type: number
 *                 minimum: 0
 *               platform_commission_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               platform_fixed_fee:
 *                 type: number
 *                 minimum: 0
 *               platform_shipping_fee:
 *                 type: number
 *                 minimum: 0
 *               platform_specific_data:
 *                 type: object
 *               is_active_on_platform:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *       400:
 *         description: Validation error or invalid listing ID
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Listing ID must be a valid MongoDB ObjectId'),
  body('platform_sku')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Platform SKU cannot exceed 100 characters')
    .trim(),
  body('platform_product_id')
    .optional()
    .isLength({ max: 150 })
    .withMessage('Platform product ID cannot exceed 150 characters')
    .trim(),
  body('listing_status')
    .optional()
    .isIn(['Draft', 'Pending Review', 'Live', 'Rejected', 'Deactivated'])
    .withMessage('Listing status must be one of: Draft, Pending Review, Live, Rejected, Deactivated'),
  body('platform_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Platform price must be a positive number'),
  body('platform_commission_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission percentage must be between 0 and 100'),
  body('platform_fixed_fee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fixed fee must be a positive number'),
  body('platform_shipping_fee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping fee must be a positive number'),
  body('platform_specific_data')
    .optional()
    .isObject()
    .withMessage('Platform specific data must be an object'),
  body('is_active_on_platform')
    .optional()
    .isBoolean()
    .withMessage('is_active_on_platform must be a boolean value')
], updateListing);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   delete:
 *     summary: Delete listing (soft delete)
 *     tags: [Listings]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     responses:
 *       204:
 *         description: Listing deleted successfully
 *       400:
 *         description: Invalid listing ID
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Listing ID must be a valid MongoDB ObjectId')
], deleteListing);

module.exports = router;
