/**
 * Admin Email Template Routes
 * Routes for email template management in admin dashboard
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const adminEmailTemplateController = require('../controllers/adminEmailTemplateController');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');
const validationErrorHandler = require('../middleware/validationErrorHandler');

// Apply authentication and admin authorization to all routes
router.use(authMiddleware);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/v1/admin/email-templates:
 *   get:
 *     summary: Get all email templates with filtering and pagination
 *     tags: [Admin - Email Templates]
 *     security:
 *       - BearerAuth: []
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
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [PROMOTIONAL, TRANSACTIONAL, NEWSLETTER, WELCOME, ABANDONED_CART, ORDER_CONFIRMATION, SHIPPING_UPDATE, SYSTEM_NOTIFICATION, SURVEY, ANNOUNCEMENT, REMINDER, FEEDBACK_REQUEST, CUSTOM]
 *         description: Filter by template category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, ARCHIVED]
 *         description: Filter by template status
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [PUBLIC, PRIVATE, SHARED]
 *         description: Filter by template visibility
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in template name, description, or tags
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, name, category, usage_stats.total_uses]
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
 *         description: Email templates retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['PROMOTIONAL', 'TRANSACTIONAL', 'NEWSLETTER', 'WELCOME', 'ABANDONED_CART', 'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'SYSTEM_NOTIFICATION', 'SURVEY', 'ANNOUNCEMENT', 'REMINDER', 'FEEDBACK_REQUEST', 'CUSTOM']).withMessage('Invalid category'),
  query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'ARCHIVED']).withMessage('Invalid status'),
  query('visibility').optional().isIn(['PUBLIC', 'PRIVATE', 'SHARED']).withMessage('Invalid visibility'),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('sort_by').optional().isIn(['created_at', 'updated_at', 'name', 'category', 'usage_stats.total_uses']).withMessage('Invalid sort field'),
  query('sort_order').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
  validationErrorHandler
], adminEmailTemplateController.getAllTemplates);

/**
 * @swagger
 * /api/v1/admin/email-templates:
 *   post:
 *     summary: Create new email template
 *     tags: [Admin - Email Templates]
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
 *               - subject_template
 *               - html_template
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Unique template name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Template description
 *               subject_template:
 *                 type: string
 *                 maxLength: 200
 *                 description: Email subject template with variables
 *               html_template:
 *                 type: string
 *                 description: HTML template content with variables
 *               text_template:
 *                 type: string
 *                 description: Plain text template (optional, auto-generated if not provided)
 *               category:
 *                 type: string
 *                 enum: [PROMOTIONAL, TRANSACTIONAL, NEWSLETTER, WELCOME, ABANDONED_CART, ORDER_CONFIRMATION, SHIPPING_UPDATE, SYSTEM_NOTIFICATION, SURVEY, ANNOUNCEMENT, REMINDER, FEEDBACK_REQUEST, CUSTOM]
 *                 description: Template category
 *               variables:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Variable name (used as {{name}} in templates)
 *                     description:
 *                       type: string
 *                       description: Variable description
 *                     type:
 *                       type: string
 *                       enum: [string, number, boolean, date, object, array]
 *                       default: string
 *                     required:
 *                       type: boolean
 *                       default: false
 *                     default_value:
 *                       description: Default value for the variable
 *                 description: Template variables/placeholders
 *               design:
 *                 type: object
 *                 properties:
 *                   layout:
 *                     type: string
 *                     enum: [SINGLE_COLUMN, TWO_COLUMN, THREE_COLUMN, CUSTOM]
 *                     default: SINGLE_COLUMN
 *                   theme:
 *                     type: object
 *                     properties:
 *                       primary_color:
 *                         type: string
 *                         default: "#007bff"
 *                       secondary_color:
 *                         type: string
 *                         default: "#6c757d"
 *                       background_color:
 *                         type: string
 *                         default: "#ffffff"
 *                 description: Template design settings
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE, SHARED]
 *                 default: PRIVATE
 *                 description: Template visibility
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Template tags for organization
 *             example:
 *               name: "Welcome Email Template"
 *               description: "Template for welcoming new users"
 *               subject_template: "Welcome to {{company_name}}, {{user_name}}!"
 *               html_template: "<h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{company_name}}.</p>"
 *               category: "WELCOME"
 *               variables:
 *                 - name: "user_name"
 *                   description: "User's full name"
 *                   type: "string"
 *                   required: true
 *                 - name: "company_name"
 *                   description: "Company name"
 *                   type: "string"
 *                   default_value: "Our Company"
 *               tags: ["welcome", "onboarding"]
 *     responses:
 *       201:
 *         description: Email template created successfully
 *       400:
 *         description: Invalid input data or template name already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/', [
  body('name').notEmpty().isLength({ max: 100 }).withMessage('Name is required and must be max 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
  body('subject_template').notEmpty().isLength({ max: 200 }).withMessage('Subject template is required and must be max 200 characters'),
  body('html_template').notEmpty().withMessage('HTML template is required'),
  body('text_template').optional().isString().withMessage('Text template must be a string'),
  body('category').isIn(['PROMOTIONAL', 'TRANSACTIONAL', 'NEWSLETTER', 'WELCOME', 'ABANDONED_CART', 'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'SYSTEM_NOTIFICATION', 'SURVEY', 'ANNOUNCEMENT', 'REMINDER', 'FEEDBACK_REQUEST', 'CUSTOM']).withMessage('Invalid category'),
  body('variables').optional().isArray().withMessage('Variables must be an array'),
  body('variables.*.name').optional().notEmpty().withMessage('Variable name is required'),
  body('variables.*.type').optional().isIn(['string', 'number', 'boolean', 'date', 'object', 'array']).withMessage('Invalid variable type'),
  body('visibility').optional().isIn(['PUBLIC', 'PRIVATE', 'SHARED']).withMessage('Invalid visibility'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  validationErrorHandler
], adminEmailTemplateController.createTemplate);

/**
 * @swagger
 * /api/v1/admin/email-templates/analytics:
 *   get:
 *     summary: Get email template analytics
 *     tags: [Admin - Email Templates]
 *     security:
 *       - BearerAuth: []
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
 *         description: Template analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/analytics', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  validationErrorHandler
], adminEmailTemplateController.getTemplateAnalytics);

/**
 * @swagger
 * /api/v1/admin/email-templates/{id}:
 *   get:
 *     summary: Get email template by ID
 *     tags: [Admin - Email Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Email template retrieved successfully
 *       400:
 *         description: Invalid template ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Email template not found
 *       500:
 *         description: Server error
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid template ID format'),
  validationErrorHandler
], adminEmailTemplateController.getTemplateById);

/**
 * @swagger
 * /api/v1/admin/email-templates/{id}:
 *   put:
 *     summary: Update email template
 *     tags: [Admin - Email Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
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
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               subject_template:
 *                 type: string
 *                 maxLength: 200
 *               html_template:
 *                 type: string
 *               text_template:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [PROMOTIONAL, TRANSACTIONAL, NEWSLETTER, WELCOME, ABANDONED_CART, ORDER_CONFIRMATION, SHIPPING_UPDATE, SYSTEM_NOTIFICATION, SURVEY, ANNOUNCEMENT, REMINDER, FEEDBACK_REQUEST, CUSTOM]
 *               variables:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [string, number, boolean, date, object, array]
 *                     required:
 *                       type: boolean
 *                     default_value: {}
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, ARCHIVED]
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE, SHARED]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Email template updated successfully
 *       400:
 *         description: Invalid input data or template name already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required or insufficient permissions
 *       404:
 *         description: Email template not found
 *       500:
 *         description: Server error
 */
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid template ID format'),
  body('name').optional().isLength({ max: 100 }).withMessage('Name must be max 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
  body('subject_template').optional().isLength({ max: 200 }).withMessage('Subject template must be max 200 characters'),
  body('html_template').optional().isString().withMessage('HTML template must be a string'),
  body('text_template').optional().isString().withMessage('Text template must be a string'),
  body('category').optional().isIn(['PROMOTIONAL', 'TRANSACTIONAL', 'NEWSLETTER', 'WELCOME', 'ABANDONED_CART', 'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'SYSTEM_NOTIFICATION', 'SURVEY', 'ANNOUNCEMENT', 'REMINDER', 'FEEDBACK_REQUEST', 'CUSTOM']).withMessage('Invalid category'),
  body('variables').optional().isArray().withMessage('Variables must be an array'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'ARCHIVED']).withMessage('Invalid status'),
  body('visibility').optional().isIn(['PUBLIC', 'PRIVATE', 'SHARED']).withMessage('Invalid visibility'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  validationErrorHandler
], adminEmailTemplateController.updateTemplate);

/**
 * @swagger
 * /api/v1/admin/email-templates/{id}:
 *   delete:
 *     summary: Delete email template
 *     tags: [Admin - Email Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *       - in: query
 *         name: permanent
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to permanently delete (true) or archive (false)
 *     responses:
 *       200:
 *         description: Email template deleted successfully
 *       400:
 *         description: Invalid template ID format or template in use
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required or insufficient permissions
 *       404:
 *         description: Email template not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid template ID format'),
  query('permanent').optional().isBoolean().withMessage('Permanent must be a boolean'),
  validationErrorHandler
], adminEmailTemplateController.deleteTemplate);

/**
 * @swagger
 * /api/v1/admin/email-templates/{id}/preview:
 *   post:
 *     summary: Preview email template with variables
 *     tags: [Admin - Email Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variables:
 *                 type: object
 *                 description: Variable values to use for preview
 *             example:
 *               variables:
 *                 user_name: "John Doe"
 *                 company_name: "Example Corp"
 *                 order_number: "12345"
 *     responses:
 *       200:
 *         description: Template preview generated successfully
 *       400:
 *         description: Invalid template ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required or insufficient permissions
 *       404:
 *         description: Email template not found
 *       500:
 *         description: Server error
 */
router.post('/:id/preview', [
  param('id').isMongoId().withMessage('Invalid template ID format'),
  body('variables').optional().isObject().withMessage('Variables must be an object'),
  validationErrorHandler
], adminEmailTemplateController.previewTemplate);

/**
 * @swagger
 * /api/v1/admin/email-templates/{id}/clone:
 *   post:
 *     summary: Clone email template
 *     tags: [Admin - Email Templates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID to clone
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name for the cloned template (optional, auto-generated if not provided)
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Description for the cloned template
 *             example:
 *               name: "Welcome Email Template (Copy)"
 *               description: "Cloned from original welcome template"
 *     responses:
 *       201:
 *         description: Email template cloned successfully
 *       400:
 *         description: Invalid template ID format or clone name already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required or insufficient permissions
 *       404:
 *         description: Email template not found
 *       500:
 *         description: Server error
 */
router.post('/:id/clone', [
  param('id').isMongoId().withMessage('Invalid template ID format'),
  body('name').optional().isLength({ max: 100 }).withMessage('Name must be max 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
  validationErrorHandler
], adminEmailTemplateController.cloneTemplate);

module.exports = router;
