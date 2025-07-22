/**
 * Platform Routes
 * Defines all API endpoints for e-commerce platform management
 * Base path: /api/v1/platforms
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');
const platformController = require('../controllers/platform.controller');

// Input validation rules
const platformValidationRules = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Platform name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Platform name must be between 1 and 100 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
      .trim(),
    body('base_url')
      .optional()
      .isURL()
      .withMessage('Base URL must be a valid URL')
      .isLength({ max: 200 })
      .withMessage('Base URL cannot exceed 200 characters')
      .trim(),
    body('logo_url')
      .optional()
      .isURL()
      .withMessage('Logo URL must be a valid URL')
      .isLength({ max: 300 })
      .withMessage('Logo URL cannot exceed 300 characters')
      .trim(),
    body('api_credentials_placeholder')
      .optional()
      .isLength({ max: 200 })
      .withMessage('API credentials placeholder cannot exceed 200 characters')
      .trim()
  ],
  update: [
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Platform name must be between 1 and 100 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
      .trim(),
    body('base_url')
      .optional()
      .isURL()
      .withMessage('Base URL must be a valid URL')
      .isLength({ max: 200 })
      .withMessage('Base URL cannot exceed 200 characters')
      .trim(),
    body('logo_url')
      .optional()
      .isURL()
      .withMessage('Logo URL must be a valid URL')
      .isLength({ max: 300 })
      .withMessage('Logo URL cannot exceed 300 characters')
      .trim(),
    body('api_credentials_placeholder')
      .optional()
      .isLength({ max: 200 })
      .withMessage('API credentials placeholder cannot exceed 200 characters')
      .trim(),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be a boolean value')
  ],
  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
      .toInt(),
    query('is_active')
      .optional()
      .custom((value) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (typeof value === 'boolean') return value;
        throw new Error('is_active must be "true", "false", or a boolean');
      })
      .withMessage('is_active must be a boolean value'),
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
      .trim(),
    query('sort')
      .optional()
      .isIn(['name', 'createdAt', 'updatedAt'])
      .withMessage('Sort field must be one of: name, createdAt, updatedAt'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be either asc or desc')
  ],
  objectId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid platform ID format')
  ]
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Platform:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique platform identifier
 *         name:
 *           type: string
 *           description: Platform name (e.g., 'Amazon India', 'Flipkart')
 *           maxLength: 100
 *         slug:
 *           type: string
 *           description: URL-friendly platform identifier (auto-generated)
 *         description:
 *           type: string
 *           description: Brief description of the platform
 *           maxLength: 500
 *         base_url:
 *           type: string
 *           format: uri
 *           description: Main URL of the platform
 *           maxLength: 200
 *         logo_url:
 *           type: string
 *           format: uri
 *           description: URL to the platform's logo
 *           maxLength: 300
 *         api_credentials_placeholder:
 *           type: string
 *           description: Placeholder for API credentials (sensitive data should be stored securely)
 *           maxLength: 200
 *         is_active:
 *           type: boolean
 *           description: Whether the platform is active
 *           default: true
 *         has_api_credentials:
 *           type: boolean
 *           description: Virtual field indicating if API credentials are configured
 *         display_name:
 *           type: string
 *           description: Virtual field for formatted display name
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Platform creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Platform last update timestamp
 *       example:
 *         _id: "64a7b8c9d0e1f2a3b4c5d6e7"
 *         name: "Amazon India"
 *         slug: "amazon-india"
 *         description: "India's largest e-commerce marketplace"
 *         base_url: "https://www.amazon.in"
 *         logo_url: "https://example.com/amazon-logo.png"
 *         api_credentials_placeholder: "API credentials configured"
 *         is_active: true
 *         has_api_credentials: true
 *         display_name: "Amazon India"
 *         createdAt: "2024-07-14T10:30:00.000Z"
 *         updatedAt: "2024-07-14T10:30:00.000Z"
 *
 *     PlatformList:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Platform'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             totalCount:
 *               type: integer
 *             limit:
 *               type: integer
 *             hasNextPage:
 *               type: boolean
 *             hasPrevPage:
 *               type: boolean
 *         filters:
 *           type: object
 *           properties:
 *             is_active:
 *               type: boolean
 *             search:
 *               type: string
 */

/**
 * @swagger
 * /api/v1/platforms:
 *   post:
 *     summary: Create a new platform
 *     description: |
 *       Creates a new e-commerce platform in the system. Requires admin authentication.
 *       The slug is automatically generated from the platform name.
 *     tags:
 *       - Platforms
 *     security:
 *       - AdminAuth: []
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
 *                 description: Platform name
 *                 maxLength: 100
 *                 example: "Amazon India"
 *               description:
 *                 type: string
 *                 description: Brief description of the platform
 *                 maxLength: 500
 *                 example: "India's largest e-commerce marketplace"
 *               base_url:
 *                 type: string
 *                 format: uri
 *                 description: Main URL of the platform
 *                 maxLength: 200
 *                 example: "https://www.amazon.in"
 *               logo_url:
 *                 type: string
 *                 format: uri
 *                 description: URL to the platform's logo
 *                 maxLength: 300
 *                 example: "https://example.com/amazon-logo.png"
 *               api_credentials_placeholder:
 *                 type: string
 *                 description: Placeholder for API credentials
 *                 maxLength: 200
 *                 example: "API credentials configured"
 *     responses:
 *       201:
 *         description: Platform created successfully
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
 *                   example: "Platform created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Platform'
 *       400:
 *         description: Bad request - validation errors or duplicate name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Platform with this name already exists"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  authMiddleware,
  adminAuthMiddleware, 
  platformValidationRules.create, 
  platformController.createPlatform
);

/**
 * @swagger
 * /api/v1/platforms:
 *   get:
 *     summary: Get all platforms
 *     description: |
 *       Retrieves a paginated list of platforms with optional filtering and searching.
 *       Supports filtering by active status and searching by name or description.
 *     tags:
 *       - Platforms
 *     security:
 *       - AdminAuth: []
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
 *           maximum: 50
 *           default: 10
 *         description: Number of platforms per page
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search term for name or description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Platforms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlatformList'
 *       400:
 *         description: Bad request - invalid query parameters
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/', 
  authMiddleware,
  adminAuthMiddleware, 
  platformValidationRules.list, 
  platformController.getAllPlatforms
);

/**
 * @swagger
 * /api/v1/platforms/{identifier}:
 *   get:
 *     summary: Get platform by ID or slug
 *     description: |
 *       Retrieves a single platform by its MongoDB ObjectId or slug.
 *       First attempts to find by ID, then falls back to slug if not found.
 *     tags:
 *       - Platforms
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Platform ID (ObjectId) or slug
 *         example: "64a7b8c9d0e1f2a3b4c5d6e7"
 *     responses:
 *       200:
 *         description: Platform retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Platform'
 *       400:
 *         description: Bad request - identifier is required
 *       404:
 *         description: Platform not found
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/:identifier', 
  authMiddleware,
  adminAuthMiddleware, 
  platformController.getPlatformByIdOrSlug
);

/**
 * @swagger
 * /api/v1/platforms/{id}:
 *   patch:
 *     summary: Update a platform
 *     description: |
 *       Updates an existing platform. Only provided fields will be updated.
 *       If the name is changed, the slug will be automatically regenerated.
 *     tags:
 *       - Platforms
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Platform ID (ObjectId)
 *         example: "64a7b8c9d0e1f2a3b4c5d6e7"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Amazon India Updated"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Updated description"
 *               base_url:
 *                 type: string
 *                 format: uri
 *                 maxLength: 200
 *                 example: "https://www.amazon.in"
 *               logo_url:
 *                 type: string
 *                 format: uri
 *                 maxLength: 300
 *                 example: "https://example.com/new-logo.png"
 *               api_credentials_placeholder:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Updated API credentials"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Platform updated successfully
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
 *                   example: "Platform updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Platform'
 *       400:
 *         description: Bad request - validation errors or invalid ID
 *       404:
 *         description: Platform not found
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', 
  authMiddleware,
  adminAuthMiddleware, 
  platformValidationRules.objectId,
  platformValidationRules.update, 
  platformController.updatePlatform
);

/**
 * @swagger
 * /api/v1/platforms/{id}:
 *   delete:
 *     summary: Delete a platform (soft delete)
 *     description: |
 *       Soft deletes a platform by setting is_active to false.
 *       The platform record is not physically removed from the database.
 *     tags:
 *       - Platforms
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Platform ID (ObjectId)
 *         example: "64a7b8c9d0e1f2a3b4c5d6e7"
 *     responses:
 *       204:
 *         description: Platform deleted successfully (no content)
 *       400:
 *         description: Bad request - invalid platform ID format
 *       404:
 *         description: Platform not found
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', 
  authMiddleware,
  adminAuthMiddleware, 
  platformValidationRules.objectId,
  platformController.deletePlatform
);

module.exports = router;
