/**
 * Product Routes
 * Defines RESTful API routes for product management
 * Base path: /api/v1/products
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Import controllers
const {
  createProduct,
  getAllProducts,
  getProductByIdOrSlug,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/product.controller');

// Import middleware
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');

// Validation middleware
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Product description must be between 1 and 2000 characters'),
  body('short_description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Short description cannot exceed 500 characters'),
  body('category_id')
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ObjectId'),
  body('brand_id')
    .optional()
    .isMongoId()
    .withMessage('Brand ID must be a valid MongoDB ObjectId'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  body('score')
    .optional()
    .isNumeric()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Score must be a number between 0 and 5'),
  body('seo_details.meta_title')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),
  body('seo_details.meta_description')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
  body('seo_details.meta_keywords')
    .optional()
    .isArray()
    .withMessage('Meta keywords must be an array'),
  body('seo_details.meta_keywords.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each meta keyword must be between 1 and 50 characters')
];

const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Product description must be between 1 and 2000 characters'),
  body('short_description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Short description cannot exceed 500 characters'),
  body('category_id')
    .optional()
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ObjectId'),
  body('brand_id')
    .optional()
    .isMongoId()
    .withMessage('Brand ID must be a valid MongoDB ObjectId'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  body('score')
    .optional()
    .isNumeric()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Score must be a number between 0 and 5'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  body('seo_details.meta_title')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),
  body('seo_details.meta_description')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
  body('seo_details.meta_keywords')
    .optional()
    .isArray()
    .withMessage('Meta keywords must be an array'),
  body('seo_details.meta_keywords.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each meta keyword must be between 1 and 50 characters')
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category_id')
    .optional()
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ObjectId'),
  query('brand_id')
    .optional()
    .isMongoId()
    .withMessage('Brand ID must be a valid MongoDB ObjectId'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('sort')
    .optional()
    .isIn(['name', 'createdAt', 'score', 'updatedAt'])
    .withMessage('Sort field must be one of: name, createdAt, score, updatedAt'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either asc or desc'),
  query('include_inactive')
    .optional()
    .isBoolean()
    .withMessage('include_inactive must be a boolean')
];

const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  param('identifier')
    .custom((value) => {
      // Allow either MongoDB ObjectId or slug format
      if (value.match(/^[0-9a-fA-F]{24}$/)) {
        return true; // Valid ObjectId
      }
      if (value.match(/^[a-z0-9-]+$/)) {
        return true; // Valid slug format
      }
      throw new Error('Identifier must be a valid MongoDB ObjectId or slug');
    })
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - category_id
 *       properties:
 *         _id:
 *           type: string
 *           description: Product ID
 *         name:
 *           type: string
 *           description: Product name
 *           minLength: 2
 *           maxLength: 200
 *         slug:
 *           type: string
 *           description: Product slug (auto-generated from name)
 *         description:
 *           type: string
 *           description: Detailed product description
 *           maxLength: 2000
 *         short_description:
 *           type: string
 *           description: Brief product summary
 *           maxLength: 500
 *         category_id:
 *           type: string
 *           description: Category reference ID
 *         brand_id:
 *           type: string
 *           description: Brand reference ID
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           description: Product score/rating
 *         seo_details:
 *           type: object
 *           properties:
 *             meta_title:
 *               type: string
 *               maxLength: 60
 *             meta_description:
 *               type: string
 *               maxLength: 160
 *             meta_keywords:
 *               type: array
 *               items:
 *                 type: string
 *         is_active:
 *           type: boolean
 *           description: Product active status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProductCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - category_id
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *         short_description:
 *           type: string
 *           maxLength: 500
 *         category_id:
 *           type: string
 *         brand_id:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         seo_details:
 *           type: object
 *           properties:
 *             meta_title:
 *               type: string
 *               maxLength: 60
 *             meta_description:
 *               type: string
 *               maxLength: 160
 *             meta_keywords:
 *               type: array
 *               items:
 *                 type: string
 *     ProductUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *         short_description:
 *           type: string
 *           maxLength: 500
 *         category_id:
 *           type: string
 *         brand_id:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         is_active:
 *           type: boolean
 *         seo_details:
 *           type: object
 *           properties:
 *             meta_title:
 *               type: string
 *               maxLength: 60
 *             meta_description:
 *               type: string
 *               maxLength: 160
 *             meta_keywords:
 *               type: array
 *               items:
 *                 type: string
 *     ProductStats:
 *       type: object
 *       properties:
 *         totalProducts:
 *           type: number
 *         activeProducts:
 *           type: number
 *         inactiveProducts:
 *           type: number
 *     PaginatedProducts:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
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
 */

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateRequest'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error or duplicate product
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', adminAuthMiddleware, validateProduct, createProduct);

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products with pagination and filtering
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: brand_id
 *         schema:
 *           type: string
 *         description: Filter by brand ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name and description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, createdAt, score, updatedAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive products (admin only)
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedProducts'
 */
router.get('/', validatePagination, getAllProducts);

/**
 * @swagger
 * /api/v1/products/stats:
 *   get:
 *     summary: Get product statistics
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductStats'
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/stats', adminAuthMiddleware, getProductStats);

/**
 * @swagger
 * /api/v1/products/{identifier}:
 *   get:
 *     summary: Get a product by ID or slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID or slug
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:identifier', validateObjectId, getProductByIdOrSlug);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   patch:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdateRequest'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error or duplicate product
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 */
router.patch('/:id', adminAuthMiddleware, validateObjectId, validateProductUpdate, updateProduct);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Soft delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 */
router.delete('/:id', adminAuthMiddleware, validateObjectId, deleteProduct);

module.exports = router;
