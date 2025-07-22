/**
 * Inventory Routes
 * Defines RESTful API endpoints for inventory management with pack logic
 * All endpoints require admin authentication
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');
const {
  createInventory,
  getAllInventory,
  getInventoryByProductVariantId,
  getInventoryById,
  updateInventory,
  deleteInventory
} = require('../controllers/inventory.controller');

const router = express.Router();

/**
 * API documentation for inventory management routes
 * 
 * These routes handle inventory operations including:
 * - Getting available stock for products
 * - Updating stock levels manually (admin only)
 * - Setting stock alerts/thresholds
 * - Managing pack-based inventory
 */

// Apply authentication middleware first, then admin check
router.use(authMiddleware);
router.use(adminAuthMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Inventory:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the inventory record
 *         product_variant_id:
 *           type: string
 *           description: Reference to the base unit product variant
 *         stock_quantity:
 *           type: number
 *           minimum: 0
 *           description: Physical stock quantity for base unit
 *         last_restock_date:
 *           type: string
 *           format: date-time
 *           description: Last restock timestamp
 *         last_sold_date:
 *           type: string
 *           format: date-time
 *           description: Last sale timestamp
 *         min_stock_level:
 *           type: number
 *           minimum: 0
 *           description: Minimum stock threshold
 *         location:
 *           type: string
 *           description: Physical storage location
 *         notes:
 *           type: string
 *           description: Internal inventory notes
 *         is_active:
 *           type: boolean
 *           description: Whether inventory record is active
 *         computed_stock_quantity:
 *           type: number
 *           description: Computed stock for pack variants
 *         stock_status:
 *           type: string
 *           enum: [Out of Stock, Low Stock, Medium Stock, High Stock]
 *           description: Current stock status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - product_variant_id
 *         - stock_quantity
 */

/**
 * @swagger
 * /api/v1/inventory:
 *   post:
 *     summary: Create a new inventory record
 *     tags: [Inventory]
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
 *             properties:
 *               product_variant_id:
 *                 type: string
 *                 description: ID of the base unit product variant
 *               stock_quantity:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 description: Initial stock quantity
 *               min_stock_level:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 description: Minimum stock threshold
 *               location:
 *                 type: string
 *                 maxLength: 200
 *                 description: Physical storage location
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Internal notes
 *     responses:
 *       201:
 *         description: Inventory record created successfully
 *       400:
 *         description: Validation error or pack variant provided
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
  body('stock_quantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Stock quantity must be a non-negative number'),
  body('min_stock_level')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative number'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters')
    .trim(),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
    .trim()
], createInventory);

/**
 * @swagger
 * /api/v1/inventory:
 *   get:
 *     summary: Get all inventory records with pagination and filtering
 *     tags: [Inventory]
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
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: stock_status
 *         schema:
 *           type: string
 *           enum: [out_of_stock, low_stock, in_stock]
 *         description: Filter by stock status
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (partial match)
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search across SKU, location, and notes
 *       - in: query
 *         name: include_computed_packs
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include computed stock for pack variants
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, stock_quantity, min_stock_level, last_restock_date]
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
 *         description: Inventory records retrieved successfully
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
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
  query('stock_status')
    .optional()
    .isIn(['out_of_stock', 'low_stock', 'in_stock'])
    .withMessage('Invalid stock status'),
  query('location')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Location must be between 1 and 200 characters'),
  query('product_id')
    .optional()
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('include_computed_packs')
    .optional()
    .isBoolean()
    .withMessage('include_computed_packs must be a boolean value'),
  query('sort_by')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'stock_quantity', 'min_stock_level', 'last_restock_date'])
    .withMessage('Invalid sort field'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
], getAllInventory);

/**
 * @swagger
 * /api/v1/inventory/variant/{productVariantId}:
 *   get:
 *     summary: Get inventory by product variant ID (computed stock)
 *     tags: [Inventory]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: productVariantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product variant ID (base unit or pack)
 *     responses:
 *       200:
 *         description: Inventory record retrieved successfully with computed stock
 *       400:
 *         description: Invalid product variant ID
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Inventory record not found
 *       500:
 *         description: Internal server error
 */
router.get('/variant/:productVariantId', [
  param('productVariantId')
    .isMongoId()
    .withMessage('Product variant ID must be a valid MongoDB ObjectId')
], getInventoryByProductVariantId);

/**
 * @swagger
 * /api/v1/inventory/{id}:
 *   get:
 *     summary: Get inventory record by ID
 *     tags: [Inventory]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory record ID
 *     responses:
 *       200:
 *         description: Inventory record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Inventory record retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Inventory'
 *       400:
 *         description: Invalid inventory ID format
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Inventory record not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Inventory ID must be a valid MongoDB ObjectId')
], getInventoryById);

/**
 * @swagger
 * /api/v1/inventory/{id}:
 *   patch:
 *     summary: Update inventory record
 *     tags: [Inventory]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stock_quantity:
 *                 type: number
 *                 minimum: 0
 *                 description: Updated stock quantity
 *               min_stock_level:
 *                 type: number
 *                 minimum: 0
 *                 description: Updated minimum stock level
 *               location:
 *                 type: string
 *                 maxLength: 200
 *                 description: Updated storage location
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Updated notes
 *               is_active:
 *                 type: boolean
 *                 description: Updated active status
 *     responses:
 *       200:
 *         description: Inventory record updated successfully
 *       400:
 *         description: Validation error or invalid inventory ID
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Inventory record not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Inventory ID must be a valid MongoDB ObjectId'),
  body('stock_quantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Stock quantity must be a non-negative number'),
  body('min_stock_level')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative number'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters')
    .trim(),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
    .trim(),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
], updateInventory);

/**
 * @swagger
 * /api/v1/inventory/{id}:
 *   delete:
 *     summary: Delete inventory record (soft delete)
 *     tags: [Inventory]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory record ID
 *     responses:
 *       204:
 *         description: Inventory record deleted successfully
 *       400:
 *         description: Invalid inventory ID
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Inventory record not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Inventory ID must be a valid MongoDB ObjectId')
], deleteInventory);

module.exports = router;
