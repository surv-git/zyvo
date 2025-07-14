/**
 * Product Variant Routes
 * RESTful API routes for product variant management
 * Handles unique SKUs and purchasable versions of products
 * Base path: /api/v1/product-variants
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');

// Import controller functions
const {
  createProductVariant,
  getAllProductVariants,
  getProductVariantByIdOrSKU,
  updateProductVariant,
  deleteProductVariant,
  getProductVariantStats
} = require('../controllers/productVariant.controller');

// Import middleware
const { protect, restrictTo } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     DiscountDetails:
 *       type: object
 *       properties:
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Discounted price
 *         percentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Discount percentage
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: Discount end date
 *         is_on_sale:
 *           type: boolean
 *           description: Whether variant is currently on sale
 *
 *     Dimensions:
 *       type: object
 *       properties:
 *         length:
 *           type: number
 *           minimum: 0
 *         width:
 *           type: number
 *           minimum: 0
 *         height:
 *           type: number
 *           minimum: 0
 *         unit:
 *           type: string
 *           enum: [cm, in]
 *           default: cm
 *
 *     Weight:
 *       type: object
 *       properties:
 *         value:
 *           type: number
 *           minimum: 0
 *         unit:
 *           type: string
 *           enum: [g, kg, lb, oz]
 *           default: g
 *
 *     ProductVariant:
 *       type: object
 *       required:
 *         - product_id
 *         - sku_code
 *         - price
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the variant
 *         product_id:
 *           type: string
 *           description: Reference to the main Product
 *         option_values:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of Option IDs defining this variant
 *         sku_code:
 *           type: string
 *           description: Unique SKU code for inventory tracking
 *           example: "TSH-RED-L"
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Regular price of the variant
 *         discount_details:
 *           $ref: '#/components/schemas/DiscountDetails'
 *         slug:
 *           type: string
 *           description: URL-friendly identifier
 *         dimensions:
 *           $ref: '#/components/schemas/Dimensions'
 *         weight:
 *           $ref: '#/components/schemas/Weight'
 *         packaging_cost:
 *           type: number
 *           minimum: 0
 *           default: 0
 *         shipping_cost:
 *           type: number
 *           minimum: 0
 *           default: 0
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs for this variant
 *         is_active:
 *           type: boolean
 *           default: true
 *         sort_order:
 *           type: number
 *           default: 0
 *         effective_price:
 *           type: number
 *           description: Price after discount (virtual field)
 *         savings:
 *           type: number
 *           description: Amount saved if on sale (virtual field)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: "60d0fe4f5311236168a109cb"
 *         product_id: "60d0fe4f5311236168a109ca"
 *         option_values: ["60d0fe4f5311236168a109cc", "60d0fe4f5311236168a109cd"]
 *         sku_code: "TSH-RED-L"
 *         price: 29.99
 *         discount_details:
 *           price: 24.99
 *           percentage: 17
 *           is_on_sale: true
 *         slug: "basic-tshirt-red-large"
 *         dimensions:
 *           length: 70
 *           width: 50
 *           height: 2
 *           unit: "cm"
 *         weight:
 *           value: 200
 *           unit: "g"
 *         packaging_cost: 1.50
 *         shipping_cost: 5.00
 *         images: ["https://example.com/tshirt-red-front.jpg"]
 *         is_active: true
 *         sort_order: 1
 *
 *     ProductVariantResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/ProductVariant'
 *
 *     ProductVariantsListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariant'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: number
 *             totalPages:
 *               type: number
 *             totalItems:
 *               type: number
 *             itemsPerPage:
 *               type: number
 *             hasNextPage:
 *               type: boolean
 *             hasPrevPage:
 *               type: boolean
 *
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Validation schemas
const createProductVariantValidation = [
  body('product_id')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  
  body('option_values')
    .optional()
    .isArray()
    .withMessage('Option values must be an array')
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      return value.every(id => /^[0-9a-fA-F]{24}$/.test(id));
    })
    .withMessage('All option values must be valid MongoDB ObjectIds'),
  
  body('sku_code')
    .trim()
    .notEmpty()
    .withMessage('SKU code is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU code must be between 3 and 50 characters')
    .matches(/^[A-Z0-9\-_]+$/i)
    .withMessage('SKU code can only contain letters, numbers, hyphens, and underscores'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
    .toFloat(),
  
  body('discount_details.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number')
    .toFloat(),
  
  body('discount_details.percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100')
    .toFloat(),
  
  body('discount_details.end_date')
    .optional()
    .isISO8601()
    .withMessage('Discount end date must be a valid ISO 8601 date')
    .toDate(),
  
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Slug must be between 3 and 100 characters')
    .matches(/^[a-z0-9\-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  
  body('dimensions.length')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Length must be a positive number')
    .toFloat(),
  
  body('dimensions.width')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Width must be a positive number')
    .toFloat(),
  
  body('dimensions.height')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Height must be a positive number')
    .toFloat(),
  
  body('dimensions.unit')
    .optional()
    .isIn(['cm', 'in'])
    .withMessage('Dimension unit must be cm or in'),
  
  body('weight.value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight value must be a positive number')
    .toFloat(),
  
  body('weight.unit')
    .optional()
    .isIn(['g', 'kg', 'lb', 'oz'])
    .withMessage('Weight unit must be g, kg, lb, or oz'),
  
  body('packaging_cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Packaging cost must be a positive number')
    .toFloat(),
  
  body('shipping_cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping cost must be a positive number')
    .toFloat(),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
    .toBoolean(),
  
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
    .toInt()
];

const updateProductVariantValidation = [
  body('product_id')
    .optional()
    .isMongoId()
    .withMessage('Valid product ID is required'),
  
  body('option_values')
    .optional()
    .isArray()
    .withMessage('Option values must be an array')
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      return value.every(id => /^[0-9a-fA-F]{24}$/.test(id));
    })
    .withMessage('All option values must be valid MongoDB ObjectIds'),
  
  body('sku_code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('SKU code cannot be empty')
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU code must be between 3 and 50 characters')
    .matches(/^[A-Z0-9\-_]+$/i)
    .withMessage('SKU code can only contain letters, numbers, hyphens, and underscores'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
    .toFloat(),
  
  // Same validation rules as create for other fields...
  body('discount_details.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number')
    .toFloat(),
  
  body('discount_details.percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100')
    .toFloat(),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
    .toBoolean(),
  
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
    .toInt()
];

const getAllProductVariantsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('product_id')
    .optional()
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),
  
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active filter must be a boolean')
    .toBoolean(),
  
  query('is_on_sale')
    .optional()
    .isBoolean()
    .withMessage('is_on_sale filter must be a boolean')
    .toBoolean(),
  
  query('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number')
    .toFloat(),
  
  query('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number')
    .toFloat(),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('sort')
    .optional()
    .isIn(['price', 'sku_code', 'createdAt', 'sort_order'])
    .withMessage('Sort field must be one of: price, sku_code, createdAt, sort_order'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either asc or desc'),
  
  query('include_inactive')
    .optional()
    .isBoolean()
    .withMessage('include_inactive must be a boolean')
    .toBoolean()
];

const getProductVariantByIdOrSKUValidation = [
  param('identifier')
    .notEmpty()
    .withMessage('Variant identifier (ID or SKU) is required')
    .trim()
];

/**
 * @swagger
 * tags:
 *   name: Product Variants
 *   description: Product variant management endpoints (SKUs and purchasable versions)
 */

/**
 * @swagger
 * /api/v1/product-variants:
 *   post:
 *     summary: Create a new product variant
 *     tags: [Product Variants]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - sku_code
 *               - price
 *             properties:
 *               product_id:
 *                 type: string
 *                 example: "60d0fe4f5311236168a109ca"
 *               option_values:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d0fe4f5311236168a109cc", "60d0fe4f5311236168a109cd"]
 *               sku_code:
 *                 type: string
 *                 example: "TSH-RED-L"
 *               price:
 *                 type: number
 *                 example: 29.99
 *               discount_details:
 *                 $ref: '#/components/schemas/DiscountDetails'
 *               dimensions:
 *                 $ref: '#/components/schemas/Dimensions'
 *               weight:
 *                 $ref: '#/components/schemas/Weight'
 *               packaging_cost:
 *                 type: number
 *                 example: 1.50
 *               shipping_cost:
 *                 type: number
 *                 example: 5.00
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/image.jpg"]
 *     responses:
 *       201:
 *         description: Product variant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariantResponse'
 *       400:
 *         description: Validation error or duplicate SKU
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/',
  protect,
  restrictTo('admin'),
  createProductVariantValidation,
  createProductVariant
);

/**
 * @swagger
 * /api/v1/product-variants:
 *   get:
 *     summary: Get all product variants with filtering and pagination
 *     tags: [Product Variants]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status (admin only)
 *       - in: query
 *         name: is_on_sale
 *         schema:
 *           type: boolean
 *         description: Filter variants on sale
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in SKU codes
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price, sku_code, createdAt, sort_order]
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *         description: Include inactive variants (admin only)
 *     responses:
 *       200:
 *         description: List of product variants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariantsListResponse'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/',
  getAllProductVariantsValidation,
  getAllProductVariants
);

/**
 * @swagger
 * /api/v1/product-variants/stats:
 *   get:
 *     summary: Get product variant statistics
 *     tags: [Product Variants]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Product variant statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalVariants:
 *                       type: number
 *                     activeVariants:
 *                       type: number
 *                     inactiveVariants:
 *                       type: number
 *                     onSaleVariants:
 *                       type: number
 *                     priceStatistics:
 *                       type: object
 *                       properties:
 *                         avgPrice:
 *                           type: number
 *                         minPrice:
 *                           type: number
 *                         maxPrice:
 *                           type: number
 *                     topProductsByVariants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product_id:
 *                             type: string
 *                           product_name:
 *                             type: string
 *                           variant_count:
 *                             type: number
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/stats',
  protect,
  restrictTo('admin'),
  getProductVariantStats
);

/**
 * @swagger
 * /api/v1/product-variants/{identifier}:
 *   get:
 *     summary: Get a single product variant by ID or SKU code
 *     tags: [Product Variants]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant ID or SKU code
 *     responses:
 *       200:
 *         description: Product variant retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariantResponse'
 *       404:
 *         description: Product variant not found
 *       500:
 *         description: Internal server error
 */
router.get('/:identifier',
  getProductVariantByIdOrSKUValidation,
  getProductVariantByIdOrSKU
);

/**
 * @swagger
 * /api/v1/product-variants/{id}:
 *   patch:
 *     summary: Update a product variant
 *     tags: [Product Variants]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sku_code:
 *                 type: string
 *               price:
 *                 type: number
 *               discount_details:
 *                 $ref: '#/components/schemas/DiscountDetails'
 *               dimensions:
 *                 $ref: '#/components/schemas/Dimensions'
 *               weight:
 *                 $ref: '#/components/schemas/Weight'
 *               packaging_cost:
 *                 type: number
 *               shipping_cost:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_active:
 *                 type: boolean
 *               sort_order:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product variant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariantResponse'
 *       400:
 *         description: Validation error or duplicate SKU
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Product variant not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id',
  protect,
  restrictTo('admin'),
  param('id').isMongoId().withMessage('Invalid variant ID format'),
  updateProductVariantValidation,
  updateProductVariant
);

/**
 * @swagger
 * /api/v1/product-variants/{id}:
 *   delete:
 *     summary: Soft delete a product variant
 *     tags: [Product Variants]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant ID
 *     responses:
 *       204:
 *         description: Product variant deleted successfully
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Product variant not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
  protect,
  restrictTo('admin'),
  param('id').isMongoId().withMessage('Invalid variant ID format'),
  deleteProductVariant
);

module.exports = router;
