/**
 * Admin Email Routes
 * Routes for email sending and management in admin dashboard
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const adminEmailController = require('../controllers/adminEmailController');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');
const validationErrorHandler = require('../middleware/validationErrorHandler');

// Apply authentication and admin authorization to all routes
router.use(authMiddleware);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/v1/admin/emails:
 *   get:
 *     summary: Get all emails with filtering and pagination
 *     tags: [Admin - Emails]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SCHEDULED, SENDING, SENT, FAILED, CANCELLED, PAUSED]
 *         description: Filter by email status
 *       - in: query
 *         name: email_type
 *         schema:
 *           type: string
 *           enum: [PROMOTIONAL, TRANSACTIONAL, NEWSLETTER, WELCOME, ABANDONED_CART, ORDER_CONFIRMATION, SHIPPING_UPDATE, SYSTEM_NOTIFICATION, SURVEY, ANNOUNCEMENT, REMINDER, FEEDBACK_REQUEST, CUSTOM]
 *         description: Filter by email type
 *       - in: query
 *         name: recipients_type
 *         schema:
 *           type: string
 *           enum: [INDIVIDUAL, BROADCAST, SEGMENT]
 *         description: Filter by recipients type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: Filter by priority level
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in subject, content, or sender name
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date (start)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date (end)
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, subject, email_type, status, priority]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: admin_id
 *         schema:
 *           type: string
 *         description: Filter by admin ID
 *     responses:
 *       200:
 *         description: Emails retrieved successfully
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
  query('status').optional().isIn(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED', 'PAUSED']).withMessage('Invalid status'),
  query('email_type').optional().isIn(['PROMOTIONAL', 'TRANSACTIONAL', 'NEWSLETTER', 'WELCOME', 'ABANDONED_CART', 'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'SYSTEM_NOTIFICATION', 'SURVEY', 'ANNOUNCEMENT', 'REMINDER', 'FEEDBACK_REQUEST', 'CUSTOM']).withMessage('Invalid email type'),
  query('recipients_type').optional().isIn(['INDIVIDUAL', 'BROADCAST', 'SEGMENT']).withMessage('Invalid recipients type'),
  query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('start_date').optional().isISO8601().withMessage('Invalid start date format'),
  query('end_date').optional().isISO8601().withMessage('Invalid end date format'),
  query('sort_by').optional().isIn(['created_at', 'updated_at', 'subject', 'email_type', 'status', 'priority']).withMessage('Invalid sort field'),
  query('sort_order').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
  validationErrorHandler
], adminEmailController.getAllEmails);

/**
 * @swagger
 * /api/v1/admin/emails:
 *   post:
 *     summary: Create new email
 *     tags: [Admin - Emails]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - content
 *               - email_type
 *               - recipients
 *             properties:
 *               subject:
 *                 type: string
 *                 maxLength: 200
 *                 description: Email subject line
 *               content:
 *                 type: object
 *                 required:
 *                   - html
 *                 properties:
 *                   html:
 *                     type: string
 *                     description: HTML content of the email
 *                   text:
 *                     type: string
 *                     description: Plain text content (optional, auto-generated if not provided)
 *               email_type:
 *                 type: string
 *                 enum: [PROMOTIONAL, TRANSACTIONAL, NEWSLETTER, WELCOME, ABANDONED_CART, ORDER_CONFIRMATION, SHIPPING_UPDATE, SYSTEM_NOTIFICATION, SURVEY, ANNOUNCEMENT, REMINDER, FEEDBACK_REQUEST, CUSTOM]
 *                 description: Type of email
 *               recipients:
 *                 type: object
 *                 required:
 *                   - type
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [INDIVIDUAL, BROADCAST, SEGMENT]
 *                   emails:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                           format: email
 *                         name:
 *                           type: string
 *                         user_id:
 *                           type: string
 *                     description: Required for INDIVIDUAL type
 *                   broadcast_criteria:
 *                     type: object
 *                     description: Required for BROADCAST type
 *                   estimated_count:
 *                     type: integer
 *                     description: Estimated recipient count for broadcast
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *               template:
 *                 type: object
 *                 properties:
 *                   template_id:
 *                     type: string
 *                   variables:
 *                     type: object
 *               scheduling:
 *                 type: object
 *                 properties:
 *                   send_type:
 *                     type: string
 *                     enum: [IMMEDIATE, SCHEDULED, RECURRING]
 *                     default: IMMEDIATE
 *                   scheduled_at:
 *                     type: string
 *                     format: date-time
 *                   timezone:
 *                     type: string
 *                     default: UTC
 *     responses:
 *       201:
 *         description: Email created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/', [
  body('subject').notEmpty().isLength({ max: 200 }).withMessage('Subject is required and must be max 200 characters'),
  body('content.html').notEmpty().withMessage('HTML content is required'),
  body('content.text').optional().isString().withMessage('Text content must be a string'),
  body('email_type').isIn(['PROMOTIONAL', 'TRANSACTIONAL', 'NEWSLETTER', 'WELCOME', 'ABANDONED_CART', 'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'SYSTEM_NOTIFICATION', 'SURVEY', 'ANNOUNCEMENT', 'REMINDER', 'FEEDBACK_REQUEST', 'CUSTOM']).withMessage('Invalid email type'),
  body('recipients.type').isIn(['INDIVIDUAL', 'BROADCAST', 'SEGMENT']).withMessage('Invalid recipients type'),
  body('recipients.emails').optional().isArray().withMessage('Recipients emails must be an array'),
  body('recipients.emails.*.email').optional().isEmail().withMessage('Invalid email format'),
  body('recipients.emails.*.name').optional().isString().withMessage('Recipient name must be a string'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('template.template_id').optional().isMongoId().withMessage('Invalid template ID'),
  body('scheduling.send_type').optional().isIn(['IMMEDIATE', 'SCHEDULED', 'RECURRING']).withMessage('Invalid send type'),
  body('scheduling.scheduled_at').optional().isISO8601().withMessage('Invalid scheduled date format'),
  validationErrorHandler
], adminEmailController.createEmail);

/**
 * @swagger
 * /api/v1/admin/emails/analytics:
 *   get:
 *     summary: Get email analytics
 *     tags: [Admin - Emails]
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
 *       - in: query
 *         name: admin_id
 *         schema:
 *           type: string
 *         description: Filter by admin ID
 *       - in: query
 *         name: email_type
 *         schema:
 *           type: string
 *           enum: [PROMOTIONAL, TRANSACTIONAL, NEWSLETTER, WELCOME, ABANDONED_CART, ORDER_CONFIRMATION, SHIPPING_UPDATE, SYSTEM_NOTIFICATION, SURVEY, ANNOUNCEMENT, REMINDER, FEEDBACK_REQUEST, CUSTOM]
 *         description: Filter by email type
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/analytics', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('admin_id').optional().isMongoId().withMessage('Invalid admin ID'),
  query('email_type').optional().isIn(['PROMOTIONAL', 'TRANSACTIONAL', 'NEWSLETTER', 'WELCOME', 'ABANDONED_CART', 'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'SYSTEM_NOTIFICATION', 'SURVEY', 'ANNOUNCEMENT', 'REMINDER', 'FEEDBACK_REQUEST', 'CUSTOM']).withMessage('Invalid email type'),
  validationErrorHandler
], adminEmailController.getEmailAnalytics);

/**
 * @swagger
 * /api/v1/admin/emails/broadcast:
 *   post:
 *     summary: Create broadcast email
 *     tags: [Admin - Emails]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - content
 *               - email_type
 *               - broadcast_criteria
 *             properties:
 *               subject:
 *                 type: string
 *                 maxLength: 200
 *               content:
 *                 type: object
 *                 required:
 *                   - html
 *                 properties:
 *                   html:
 *                     type: string
 *                   text:
 *                     type: string
 *               email_type:
 *                 type: string
 *                 enum: [PROMOTIONAL, TRANSACTIONAL, NEWSLETTER, WELCOME, ABANDONED_CART, ORDER_CONFIRMATION, SHIPPING_UPDATE, SYSTEM_NOTIFICATION, SURVEY, ANNOUNCEMENT, REMINDER, FEEDBACK_REQUEST, CUSTOM]
 *               broadcast_criteria:
 *                 type: object
 *                 properties:
 *                   user_roles:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [user, admin, superadmin]
 *                   user_status:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [active, inactive, suspended, pending]
 *                   registration_date_range:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         format: date
 *                       end:
 *                         type: string
 *                         format: date
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *     responses:
 *       201:
 *         description: Broadcast email created successfully
 *       400:
 *         description: Invalid input data or no recipients match criteria
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/broadcast', [
  body('subject').notEmpty().isLength({ max: 200 }).withMessage('Subject is required and must be max 200 characters'),
  body('content.html').notEmpty().withMessage('HTML content is required'),
  body('email_type').isIn(['PROMOTIONAL', 'TRANSACTIONAL', 'NEWSLETTER', 'WELCOME', 'ABANDONED_CART', 'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'SYSTEM_NOTIFICATION', 'SURVEY', 'ANNOUNCEMENT', 'REMINDER', 'FEEDBACK_REQUEST', 'CUSTOM']).withMessage('Invalid email type'),
  body('broadcast_criteria').isObject().withMessage('Broadcast criteria is required'),
  body('broadcast_criteria.user_roles').optional().isArray().withMessage('User roles must be an array'),
  body('broadcast_criteria.user_status').optional().isArray().withMessage('User status must be an array'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  validationErrorHandler
], adminEmailController.createBroadcastEmail);

/**
 * @swagger
 * /api/v1/admin/emails/{id}:
 *   get:
 *     summary: Get email by ID
 *     tags: [Admin - Emails]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Email ID
 *     responses:
 *       200:
 *         description: Email retrieved successfully
 *       400:
 *         description: Invalid email ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Email not found
 *       500:
 *         description: Server error
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid email ID format'),
  validationErrorHandler
], adminEmailController.getEmailById);

/**
 * @swagger
 * /api/v1/admin/emails/{id}:
 *   put:
 *     summary: Update email
 *     tags: [Admin - Emails]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Email ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 maxLength: 200
 *               content:
 *                 type: object
 *                 properties:
 *                   html:
 *                     type: string
 *                   text:
 *                     type: string
 *               email_type:
 *                 type: string
 *                 enum: [PROMOTIONAL, TRANSACTIONAL, NEWSLETTER, WELCOME, ABANDONED_CART, ORDER_CONFIRMATION, SHIPPING_UPDATE, SYSTEM_NOTIFICATION, SURVEY, ANNOUNCEMENT, REMINDER, FEEDBACK_REQUEST, CUSTOM]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       400:
 *         description: Invalid input data or email cannot be edited
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Email not found
 *       500:
 *         description: Server error
 */
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid email ID format'),
  body('subject').optional().isLength({ max: 200 }).withMessage('Subject must be max 200 characters'),
  body('content.html').optional().isString().withMessage('HTML content must be a string'),
  body('email_type').optional().isIn(['PROMOTIONAL', 'TRANSACTIONAL', 'NEWSLETTER', 'WELCOME', 'ABANDONED_CART', 'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', 'SYSTEM_NOTIFICATION', 'SURVEY', 'ANNOUNCEMENT', 'REMINDER', 'FEEDBACK_REQUEST', 'CUSTOM']).withMessage('Invalid email type'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  validationErrorHandler
], adminEmailController.updateEmail);

/**
 * @swagger
 * /api/v1/admin/emails/{id}:
 *   delete:
 *     summary: Delete email
 *     tags: [Admin - Emails]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Email ID
 *       - in: query
 *         name: permanent
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to permanently delete (true) or soft delete (false)
 *     responses:
 *       200:
 *         description: Email deleted successfully
 *       400:
 *         description: Invalid email ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Email not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid email ID format'),
  query('permanent').optional().isBoolean().withMessage('Permanent must be a boolean'),
  validationErrorHandler
], adminEmailController.deleteEmail);

/**
 * @swagger
 * /api/v1/admin/emails/{id}/send:
 *   post:
 *     summary: Send email
 *     tags: [Admin - Emails]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Email ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               send_immediately:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to send immediately regardless of scheduling
 *     responses:
 *       200:
 *         description: Email is being sent or scheduled
 *       400:
 *         description: Invalid email ID or email cannot be sent
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Email not found
 *       500:
 *         description: Server error
 */
router.post('/:id/send', [
  param('id').isMongoId().withMessage('Invalid email ID format'),
  body('send_immediately').optional().isBoolean().withMessage('Send immediately must be a boolean'),
  validationErrorHandler
], adminEmailController.sendEmail);

module.exports = router;
