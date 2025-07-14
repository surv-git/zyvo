/**
 * Category Routes
 * RESTful routes for category management with proper authentication and validation
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Import controller methods
const {
  createCategory,
  getAllCategories,
  getCategoryByIdOrSlug,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getCategoryStats
} = require('../controllers/category.controller');

// Import middleware
const { protect, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve a paginated list of categories with optional filtering
 *     tags: [Categories]
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
 *         description: Search term for category name or description
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: string
 *         description: Filter by parent category ID (use 'null' for root categories)
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *           default: name
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive categories (admin only)
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                   example: Categories retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *       400:
 *         $ref: '#/components/responses/400'
 *       500:
 *         $ref: '#/components/responses/500'
 *   post:
 *     summary: Create a new category
 *     description: Create a new category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
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
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Electronic devices and accessories
 *               parent_category:
 *                 type: string
 *                 description: MongoDB ObjectID of parent category
 *                 example: 64a1b2c3d4e5f6789abcdef1
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/electronics.jpg
 *     responses:
 *       201:
 *         description: Category created successfully
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
 *                   example: Category created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/400'
 *       401:
 *         $ref: '#/components/responses/401'
 *       403:
 *         $ref: '#/components/responses/403'
 *       500:
 *         $ref: '#/components/responses/500'
 */

/**
 * @swagger
 * /api/v1/categories/tree:
 *   get:
 *     summary: Get category tree
 *     description: Retrieve hierarchical category tree structure
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive categories (admin only)
 *     responses:
 *       200:
 *         description: Category tree retrieved successfully
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
 *                   example: Category tree retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryTree'
 *       500:
 *         $ref: '#/components/responses/500'
 */

/**
 * @swagger
 * /api/v1/categories/admin/stats:
 *   get:
 *     summary: Get category statistics
 *     description: Retrieve category statistics for admin dashboard
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category statistics retrieved successfully
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
 *                   example: Category statistics retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/CategoryStats'
 *       401:
 *         $ref: '#/components/responses/401'
 *       403:
 *         $ref: '#/components/responses/403'
 *       500:
 *         $ref: '#/components/responses/500'
 */

/**
 * @swagger
 * /api/v1/categories/{identifier}:
 *   get:
 *     summary: Get category by ID or slug
 *     description: Retrieve a specific category by its ID or slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID or slug
 *         example: electronics
 *     responses:
 *       200:
 *         description: Category retrieved successfully
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
 *                   example: Category retrieved successfully
 *                 data:
 *                   type: object
 *                   allOf:
 *                     - $ref: '#/components/schemas/Category'
 *                     - type: object
 *                       properties:
 *                         categoryPath:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               slug:
 *                                 type: string
 *                           description: Breadcrumb path to category
 *                         subcategories:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Category'
 *                           description: Direct child categories
 *       404:
 *         $ref: '#/components/responses/404'
 *       500:
 *         $ref: '#/components/responses/500'
 *   put:
 *     summary: Update category
 *     description: Update an existing category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *         example: 64a1b2c3d4e5f6789abcdef2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Updated Electronics
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Updated description for electronic devices
 *               parent_category:
 *                 type: string
 *                 description: MongoDB ObjectID of parent category
 *                 example: 64a1b2c3d4e5f6789abcdef1
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/updated-electronics.jpg
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Category updated successfully
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
 *                   example: Category updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/400'
 *       401:
 *         $ref: '#/components/responses/401'
 *       403:
 *         $ref: '#/components/responses/403'
 *       404:
 *         $ref: '#/components/responses/404'
 *       500:
 *         $ref: '#/components/responses/500'
 *   delete:
 *     summary: Delete category
 *     description: Delete a category (admin only). Soft delete by default, hard delete optional.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *         example: 64a1b2c3d4e5f6789abcdef2
 *       - in: query
 *         name: hard_delete
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Perform hard delete (permanent removal)
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       400:
 *         $ref: '#/components/responses/400'
 *       401:
 *         $ref: '#/components/responses/401'
 *       403:
 *         $ref: '#/components/responses/403'
 *       404:
 *         $ref: '#/components/responses/404'
 *       500:
 *         $ref: '#/components/responses/500'
 */

// Validation middleware
const validateCategoryCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&'.,()]+$/)
    .withMessage('Category name contains invalid characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('parent_category')
    .optional()
    .isMongoId()
    .withMessage('Parent category must be a valid MongoDB ID'),
  
  body('image_url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image URL must be a valid URL')
];

const validateCategoryUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&'.,()]+$/)
    .withMessage('Category name contains invalid characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('parent_category')
    .optional()
    .custom(value => {
      if (value === null || value === '') return true;
      return /^[0-9a-fA-F]{24}$/.test(value);
    })
    .withMessage('Parent category must be a valid MongoDB ID or null'),
  
  body('image_url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
];

const validateCategoryQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('parent_id')
    .optional()
    .custom(value => {
      if (value === 'null' || value === 'root') return true;
      return /^[0-9a-fA-F]{24}$/.test(value);
    })
    .withMessage('Parent ID must be a valid MongoDB ID, "null", or "root"'),
  
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('sort_by')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt'])
    .withMessage('sort_by must be one of: name, createdAt, updatedAt'),
  
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sort_order must be either asc or desc'),
  
  query('include_inactive')
    .optional()
    .isBoolean()
    .withMessage('include_inactive must be a boolean value')
];

const validateCategoryIdentifier = [
  param('identifier')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Category identifier is required')
    .custom(value => {
      // Allow MongoDB ObjectId or slug format
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(value);
      const isSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
      return isObjectId || isSlug;
    })
    .withMessage('Category identifier must be a valid MongoDB ID or slug')
];

const validateCategoryId = [
  param('id')
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ID')
];

const validateTreeQuery = [
  query('include_inactive')
    .optional()
    .isBoolean()
    .withMessage('include_inactive must be a boolean value')
];

// Public routes (no authentication required)

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories with pagination and filtering
 * @access  Public (active categories) / Admin (all categories)
 * @params  Query parameters: page, limit, parent_id, is_active, search, sort_by, sort_order, include_inactive
 */
router.get('/', validateCategoryQuery, getAllCategories);

/**
 * @route   GET /api/v1/categories/tree
 * @desc    Get category tree (hierarchical view)
 * @access  Public (active categories) / Admin (all categories)
 * @params  Query parameter: include_inactive (admin only)
 */
router.get('/tree', validateTreeQuery, getCategoryTree);

/**
 * @route   GET /api/v1/categories/:identifier
 * @desc    Get category by ID or slug
 * @access  Public (active categories) / Admin (all categories)
 * @params  Path parameter: identifier (MongoDB ID or slug)
 */
router.get('/:identifier', validateCategoryIdentifier, getCategoryByIdOrSlug);

// Protected routes (authentication required)

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Admin only
 * @body    { name, description?, parent_category?, image_url? }
 */
router.post('/', protect, authorize('admin'), validateCategoryCreation, createCategory);

/**
 * @route   PATCH /api/v1/categories/:id
 * @desc    Update category
 * @access  Admin only
 * @params  Path parameter: id (MongoDB ID)
 * @body    { name?, description?, parent_category?, image_url?, is_active? }
 */
router.patch('/:id', protect, authorize('admin'), validateCategoryUpdate, updateCategory);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category (soft delete by default, hard delete optional)
 * @access  Admin only
 * @params  Path parameter: id (MongoDB ID)
 * @params  Query parameter: hard_delete (boolean, optional)
 */
router.delete('/:id', protect, authorize('admin'), validateCategoryId, deleteCategory);

/**
 * @route   GET /api/v1/categories/admin/stats
 * @desc    Get category statistics
 * @access  Admin only
 */
router.get('/admin/stats', protect, authorize('admin'), getCategoryStats);

// Export router
module.exports = router;
