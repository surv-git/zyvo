/**
 * Option Routes
 * RESTful API routes for option management
 * Handles product option types and values (Color, Size, Weight, etc.)
 * Base path: /api/v1/options
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');

// Import controller functions
const {
  createOption,
  getAllOptions,
  getOptionById,
  updateOption,
  deleteOption,
  getOptionTypes,
  getOptionStats
} = require('../controllers/option.controller');

// Import middleware (assuming these exist based on product routes)
const { protect, restrictTo } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Option:
 *       type: object
 *       required:
 *         - option_type
 *         - option_value
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the option
 *         option_type:
 *           type: string
 *           description: The type of option (e.g., Color, Size, Weight)
 *           maxLength: 50
 *         option_value:
 *           type: string
 *           description: The value of the option (e.g., Red, Large, 500g)
 *           maxLength: 100
 *         name:
 *           type: string
 *           description: Display name for the option (defaults to option_value)
 *           maxLength: 100
 *         slug:
 *           type: string
 *           description: Auto-generated URL-friendly identifier
 *         is_active:
 *           type: boolean
 *           description: Whether the option is currently active
 *           default: true
 *         sort_order:
 *           type: number
 *           description: Sort order for displaying options
 *           default: 0
 *         full_name:
 *           type: string
 *           description: Virtual field combining option_type and name
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: "60d0fe4f5311236168a109ca"
 *         option_type: "Color"
 *         option_value: "Red"
 *         name: "Bright Red"
 *         slug: "color-red"
 *         is_active: true
 *         sort_order: 1
 *         full_name: "Color: Bright Red"
 *         createdAt: "2023-06-22T09:30:00.000Z"
 *         updatedAt: "2023-06-22T09:30:00.000Z"
 *
 *     OptionType:
 *       type: object
 *       properties:
 *         option_type:
 *           type: string
 *           description: The type of option
 *         values:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               option_value:
 *                 type: string
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               sort_order:
 *                 type: number
 *       example:
 *         option_type: "Color"
 *         values:
 *           - _id: "60d0fe4f5311236168a109ca"
 *             option_value: "Red"
 *             name: "Bright Red"
 *             slug: "color-red"
 *             sort_order: 1
 *
 *     OptionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Option'
 *
 *     OptionsListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Option'
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
const createOptionValidation = [
  body('option_type')
    .trim()
    .notEmpty()
    .withMessage('Option type is required')
    .isLength({ max: 50 })
    .withMessage('Option type must be at most 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Option type can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('option_value')
    .trim()
    .notEmpty()
    .withMessage('Option value is required')
    .isLength({ max: 100 })
    .withMessage('Option value must be at most 100 characters'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
    .toInt()
];

const updateOptionValidation = [
  body('option_type')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Option type cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Option type must be at most 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Option type can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('option_value')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Option value cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Option value must be at most 100 characters'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  
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

const getAllOptionsValidation = [
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
  
  query('option_type')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Option type filter must be at most 50 characters'),
  
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active filter must be a boolean')
    .toBoolean(),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('sort')
    .optional()
    .isIn(['option_type', 'name', 'sort_order'])
    .withMessage('Sort field must be one of: option_type, name, sort_order'),
  
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

const getOptionByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid option ID format')
];

const getOptionTypesValidation = [
  query('include_inactive')
    .optional()
    .isBoolean()
    .withMessage('include_inactive must be a boolean')
    .toBoolean()
];

/**
 * @swagger
 * tags:
 *   name: Options
 *   description: Product option management endpoints (Color, Size, Weight, etc.)
 */

/**
 * @swagger
 * /api/v1/options:
 *   post:
 *     summary: Create a new option
 *     tags: [Options]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - option_type
 *               - option_value
 *             properties:
 *               option_type:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Color"
 *               option_value:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Red"
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Bright Red"
 *               sort_order:
 *                 type: number
 *                 minimum: 0
 *                 example: 1
 *     responses:
 *       201:
 *         description: Option created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OptionResponse'
 *       400:
 *         description: Validation error or duplicate option
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/',
  protect,
  restrictTo('admin'),
  createOptionValidation,
  createOption
);

/**
 * @swagger
 * /api/v1/options:
 *   get:
 *     summary: Get all options with filtering and pagination
 *     tags: [Options]
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
 *         name: option_type
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter by option type (case-insensitive)
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status (admin only)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in name, option_value, and option_type
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [option_type, name, sort_order]
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
 *         description: Include inactive options (admin only)
 *     responses:
 *       200:
 *         description: List of options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OptionsListResponse'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/',
  getAllOptionsValidation,
  getAllOptions
);

/**
 * @swagger
 * /api/v1/options/types:
 *   get:
 *     summary: Get all option types with their values
 *     tags: [Options]
 *     parameters:
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *         description: Include inactive options (admin only)
 *     responses:
 *       200:
 *         description: Option types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OptionType'
 *       500:
 *         description: Internal server error
 */
router.get('/types',
  getOptionTypesValidation,
  getOptionTypes
);

/**
 * @swagger
 * /api/v1/options/stats:
 *   get:
 *     summary: Get option statistics
 *     tags: [Options]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Option statistics retrieved successfully
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
 *                     totalOptions:
 *                       type: number
 *                     activeOptions:
 *                       type: number
 *                     inactiveOptions:
 *                       type: number
 *                     totalOptionTypes:
 *                       type: number
 *                     topOptionTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           option_type:
 *                             type: string
 *                           count:
 *                             type: number
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/stats',
  protect,
 restrictTo('admin'),
  getOptionStats
);

/**
 * @swagger
 * /api/v1/options/{id}:
 *   get:
 *     summary: Get a single option by ID
 *     tags: [Options]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Option ID
 *     responses:
 *       200:
 *         description: Option retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OptionResponse'
 *       400:
 *         description: Invalid option ID format
 *       404:
 *         description: Option not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id',
  getOptionByIdValidation,
  getOptionById
);

/**
 * @swagger
 * /api/v1/options/{id}:
 *   patch:
 *     summary: Update an option
 *     tags: [Options]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Option ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               option_type:
 *                 type: string
 *                 maxLength: 50
 *               option_value:
 *                 type: string
 *                 maxLength: 100
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               is_active:
 *                 type: boolean
 *               sort_order:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Option updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OptionResponse'
 *       400:
 *         description: Validation error or duplicate option
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Option not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id',
  protect,
  restrictTo('admin'),
  getOptionByIdValidation,
  updateOptionValidation,
  updateOption
);

/**
 * @swagger
 * /api/v1/options/{id}:
 *   delete:
 *     summary: Soft delete an option
 *     tags: [Options]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Option ID
 *     responses:
 *       204:
 *         description: Option deleted successfully
 *       400:
 *         description: Invalid option ID format
 *       401:
 *         description: Unauthorized - Admin access required
 *       404:
 *         description: Option not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
  protect,
  restrictTo('admin'),
  getOptionByIdValidation,
  deleteOption
);

module.exports = router;
