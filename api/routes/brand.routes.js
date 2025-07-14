/**
 * Brand Routes
 * RESTful API routes for brand management
 * Handles brand creation, retrieval, updating, and deletion
 * Base path: /api/v1/brands
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');

// Import controller functions
const {
  createBrand,
  getAllBrands,
  getBrandByIdOrSlug,
  updateBrand,
  deleteBrand,
  getBrandStats
} = require('../controllers/brand.controller');

// Import middleware
const { protect, restrictTo } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Brand:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the brand
 *         name:
 *           type: string
 *           description: The official name of the brand
 *           maxLength: 100
 *           minLength: 2
 *         slug:
 *           type: string
 *           description: Auto-generated URL-friendly identifier
 *         description:
 *           type: string
 *           description: A brief description of the brand
 *           maxLength: 1000
 *         logo_url:
 *           type: string
 *           description: URL to the brand's logo image
 *           format: uri
 *         website:
 *           type: string
 *           description: Official website URL of the brand
 *           format: uri
 *         contact_email:
 *           type: string
 *           description: General contact email for the brand
 *           format: email
 *         is_active:
 *           type: boolean
 *           description: Whether the brand is currently active
 *           default: true
 *         display_name:
 *           type: string
 *           description: Virtual field returning the brand name
 *         logo_image:
 *           type: string
 *           description: Virtual field returning the logo URL or null
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: 60d0fe4f5311236168a109ca
 *         name: Nike
 *         slug: nike
 *         description: "Leading athletic footwear and apparel brand"
 *         logo_url: "https://example.com/nike-logo.png"
 *         website: "https://www.nike.com"
 *         contact_email: "info@nike.com"
 *         is_active: true
 *         display_name: "Nike"
 *         logo_image: "https://example.com/nike-logo.png"
 *         createdAt: "2023-06-22T09:30:00.000Z"
 *         updatedAt: "2023-06-22T09:30:00.000Z"
 * 
 *     BrandResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Brand'
 *     
 *     BrandsListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Brand'
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
 *   tags:
 *     name: Brands
 *     description: Brand management endpoints
 */

// Validation middleware for brand creation
const createBrandValidation = [
  body('name')
    .notEmpty()
    .withMessage('Brand name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand name must be between 2 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
    .trim(),
  body('logo_url')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Logo URL must be a valid URL')
    .matches(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
    .withMessage('Logo URL must point to an image file (jpg, jpeg, png, gif, webp, svg)'),
  body('website')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Website must be a valid URL starting with http:// or https://'),
  body('contact_email')
    .optional()
    .isEmail()
    .withMessage('Contact email must be a valid email address')
    .normalizeEmail()
];

// Validation middleware for brand updates
const updateBrandValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand name must be between 2 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
    .trim(),
  body('logo_url')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Logo URL must be a valid URL')
    .matches(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
    .withMessage('Logo URL must point to an image file (jpg, jpeg, png, gif, webp, svg)'),
  body('website')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Website must be a valid URL starting with http:// or https://'),
  body('contact_email')
    .optional()
    .isEmail()
    .withMessage('Contact email must be a valid email address')
    .normalizeEmail(),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
];

// Validation middleware for getting all brands
const getAllBrandsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt'])
    .withMessage('Sort field must be name, createdAt, or updatedAt'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active filter must be a boolean'),
  query('include_inactive')
    .optional()
    .isBoolean()
    .withMessage('include_inactive must be a boolean'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .trim()
];

// Validation middleware for getting brand by ID or slug
const getBrandByIdOrSlugValidation = [
  param('identifier')
    .notEmpty()
    .withMessage('Brand identifier is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Identifier must be between 1 and 100 characters')
];

// Validation middleware for brand ID parameter
const brandIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid brand ID format')
];

/**
 * @swagger
 * /api/v1/brands:
 *   post:
 *     summary: Create a new brand
 *     tags: [Brands]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Nike"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Leading athletic footwear and apparel brand"
 *               logo_url:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/nike-logo.png"
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.nike.com"
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 example: "info@nike.com"
 *     responses:
 *       201:
 *         description: Brand created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BrandResponse'
 *       400:
 *         description: Validation error or duplicate brand name
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/',
  protect,
  restrictTo('admin'),
  createBrandValidation,
  createBrand
);

/**
 * @swagger
 * /api/v1/brands:
 *   get:
 *     summary: Get all brands with filtering and pagination
 *     tags: [Brands]
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
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in brand name and description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *           default: name
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status (admin only)
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive brands (admin only)
 *     responses:
 *       200:
 *         description: List of brands retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BrandsListResponse'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/',
  getAllBrandsValidation,
  getAllBrands
);

/**
 * @swagger
 * /api/v1/brands/stats:
 *   get:
 *     summary: Get brand statistics
 *     tags: [Brands]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Brand statistics retrieved successfully
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
 *                     totalBrands:
 *                       type: number
 *                     activeBrands:
 *                       type: number
 *                     inactiveBrands:
 *                       type: number
 *                     brandsWithLogos:
 *                       type: number
 *                     brandsWithWebsites:
 *                       type: number
 *                     logoPercentage:
 *                       type: string
 *                     websitePercentage:
 *                       type: string
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/stats',
  protect,
  restrictTo('admin'),
  getBrandStats
);

/**
 * @swagger
 * /api/v1/brands/{identifier}:
 *   get:
 *     summary: Get a single brand by ID or slug
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand ID or slug
 *         example: "nike"
 *     responses:
 *       200:
 *         description: Brand retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BrandResponse'
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Internal server error
 */
router.get('/:identifier',
  getBrandByIdOrSlugValidation,
  getBrandByIdOrSlug
);

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   patch:
 *     summary: Update a brand
 *     tags: [Brands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               logo_url:
 *                 type: string
 *                 format: uri
 *               website:
 *                 type: string
 *                 format: uri
 *               contact_email:
 *                 type: string
 *                 format: email
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BrandResponse'
 *       400:
 *         description: Validation error or duplicate brand name
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id',
  protect,
  restrictTo('admin'),
  brandIdValidation,
  updateBrandValidation,
  updateBrand
);

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   delete:
 *     summary: Soft delete a brand
 *     tags: [Brands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand ID
 *     responses:
 *       204:
 *         description: Brand deleted successfully
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
  protect,
  restrictTo('admin'),
  brandIdValidation,
  deleteBrand
);

module.exports = router;
