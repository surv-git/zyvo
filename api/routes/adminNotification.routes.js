/**
 * Admin Notification Routes
 * Handles routing for admin notification management
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Import controller
const adminNotificationController = require('../controllers/adminNotificationController');

// Import middleware
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

// Apply authentication and admin authorization middleware to all routes
router.use(authMiddleware);
router.use(authorize('admin'));

// Validation rules
const validateCreateNotification = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters')
    .trim(),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
    .trim(),
  
  body('type')
    .isIn([
      'INFO', 'SUCCESS', 'WARNING', 'ERROR',
      'ORDER_UPDATE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
      'SHIPPING_UPDATE', 'DELIVERY_CONFIRMATION',
      'PROMOTION', 'SYSTEM_MAINTENANCE', 'SECURITY_ALERT',
      'ADMIN_ALERT', 'USER_ACTIVITY', 'INVENTORY_ALERT'
    ])
    .withMessage('Invalid notification type'),
  
  body('target_type')
    .isIn(['USER', 'ADMIN', 'BOTH'])
    .withMessage('Target type must be USER, ADMIN, or BOTH'),
  
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority level'),
  
  body('recipient.user_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('recipient.admin_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid admin ID'),
  
  body('recipient.is_broadcast')
    .optional()
    .isBoolean()
    .withMessage('is_broadcast must be a boolean'),
  
  body('recipient.target_roles')
    .optional()
    .isArray()
    .withMessage('target_roles must be an array'),
  
  body('recipient.target_roles.*')
    .optional()
    .isIn(['user', 'admin', 'superadmin'])
    .withMessage('Invalid target role'),
  
  body('action.type')
    .optional()
    .isIn(['NONE', 'NAVIGATE', 'EXTERNAL_LINK', 'MODAL', 'API_CALL'])
    .withMessage('Invalid action type'),
  
  body('action.url')
    .optional()
    .isURL()
    .withMessage('Invalid action URL'),
  
  body('schedule.send_at')
    .optional()
    .isISO8601()
    .withMessage('Invalid send_at date format'),
  
  body('schedule.expires_at')
    .optional()
    .isISO8601()
    .withMessage('Invalid expires_at date format')
];

const validateUpdateNotification = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification ID'),
  
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters')
    .trim(),
  
  body('message')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
    .trim(),
  
  body('type')
    .optional()
    .isIn([
      'INFO', 'SUCCESS', 'WARNING', 'ERROR',
      'ORDER_UPDATE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
      'SHIPPING_UPDATE', 'DELIVERY_CONFIRMATION',
      'PROMOTION', 'SYSTEM_MAINTENANCE', 'SECURITY_ALERT',
      'ADMIN_ALERT', 'USER_ACTIVITY', 'INVENTORY_ALERT'
    ])
    .withMessage('Invalid notification type'),
  
  body('status')
    .optional()
    .isIn(['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'])
    .withMessage('Invalid notification status'),
  
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority level'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

const validateBroadcastNotification = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters')
    .trim(),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
    .trim(),
  
  body('type')
    .isIn([
      'INFO', 'SUCCESS', 'WARNING', 'ERROR',
      'ORDER_UPDATE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
      'SHIPPING_UPDATE', 'DELIVERY_CONFIRMATION',
      'PROMOTION', 'SYSTEM_MAINTENANCE', 'SECURITY_ALERT',
      'ADMIN_ALERT', 'USER_ACTIVITY', 'INVENTORY_ALERT'
    ])
    .withMessage('Invalid notification type'),
  
  body('target_roles')
    .isArray({ min: 1 })
    .withMessage('target_roles must be a non-empty array'),
  
  body('target_roles.*')
    .isIn(['user', 'admin', 'superadmin'])
    .withMessage('Invalid target role'),
  
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority level')
];

const validateGetAllQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('target_type')
    .optional()
    .isIn(['USER', 'ADMIN', 'BOTH'])
    .withMessage('Invalid target type'),
  
  query('type')
    .optional()
    .isIn([
      'INFO', 'SUCCESS', 'WARNING', 'ERROR',
      'ORDER_UPDATE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
      'SHIPPING_UPDATE', 'DELIVERY_CONFIRMATION',
      'PROMOTION', 'SYSTEM_MAINTENANCE', 'SECURITY_ALERT',
      'ADMIN_ALERT', 'USER_ACTIVITY', 'INVENTORY_ALERT'
    ])
    .withMessage('Invalid notification type'),
  
  query('status')
    .optional()
    .isIn(['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'])
    .withMessage('Invalid notification status'),
  
  query('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority level'),
  
  query('is_read')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_read must be true or false'),
  
  query('is_active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_active must be true or false'),
  
  query('user_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  query('is_broadcast')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_broadcast must be true or false'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters')
    .trim(),
  
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  
  query('sort_by')
    .optional()
    .isIn(['created_at', 'updated_at', 'title', 'type', 'status', 'priority', 'is_read'])
    .withMessage('Invalid sort field'),
  
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const validateAnalyticsQuery = [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be one of: 7d, 30d, 90d, 1y')
];

const validateNotificationId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification ID')
];

const validateDeleteQuery = [
  query('permanent')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Permanent must be true or false')
];

/**
 * @swagger
 * /api/v1/admin/notifications:
 *   get:
 *     summary: Get all notifications (Admin)
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
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
 *         name: target_type
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN, BOTH]
 *         description: Filter by target type
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INFO, SUCCESS, WARNING, ERROR, ORDER_UPDATE, PAYMENT_SUCCESS, PAYMENT_FAILED, SHIPPING_UPDATE, DELIVERY_CONFIRMATION, PROMOTION, SYSTEM_MAINTENANCE, SECURITY_ALERT, ADMIN_ALERT, USER_ACTIVITY, INVENTORY_ALERT]
 *         description: Filter by notification type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SENT, DELIVERED, READ, FAILED]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: Filter by priority
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: is_broadcast
 *         schema:
 *           type: boolean
 *         description: Filter by broadcast status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title or message
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
 *           enum: [created_at, updated_at, title, type, status, priority, is_read]
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
 *         description: Notifications retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/', validateGetAllQuery, adminNotificationController.getAllNotifications);

/**
 * @swagger
 * /api/v1/admin/notifications/analytics:
 *   get:
 *     summary: Get notifications analytics (Admin)
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
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
 *         description: Analytics retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', validateAnalyticsQuery, adminNotificationController.getNotificationsAnalytics);

/**
 * @swagger
 * /api/v1/admin/notifications/broadcast:
 *   post:
 *     summary: Create broadcast notification (Admin)
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - type
 *               - target_roles
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Notification message
 *               type:
 *                 type: string
 *                 enum: [INFO, SUCCESS, WARNING, ERROR, ORDER_UPDATE, PAYMENT_SUCCESS, PAYMENT_FAILED, SHIPPING_UPDATE, DELIVERY_CONFIRMATION, PROMOTION, SYSTEM_MAINTENANCE, SECURITY_ALERT, ADMIN_ALERT, USER_ACTIVITY, INVENTORY_ALERT]
 *                 description: Notification type
 *               target_roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [user, admin, superadmin]
 *                 description: Target roles for broadcast
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *                 description: Priority level
 *               action:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [NONE, NAVIGATE, EXTERNAL_LINK, MODAL, API_CALL]
 *                   url:
 *                     type: string
 *                   params:
 *                     type: object
 *             example:
 *               title: "System Maintenance Notice"
 *               message: "Our system will be under maintenance from 2 AM to 4 AM UTC."
 *               type: "SYSTEM_MAINTENANCE"
 *               target_roles: ["user", "admin"]
 *               priority: "HIGH"
 *     responses:
 *       201:
 *         description: Broadcast notification created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/broadcast', validateBroadcastNotification, adminNotificationController.createBroadcastNotification);

/**
 * @swagger
 * /api/v1/admin/notifications/{id}:
 *   get:
 *     summary: Get notification by ID (Admin)
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification retrieved successfully
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', validateNotificationId, adminNotificationController.getNotificationById);

/**
 * @swagger
 * /api/v1/admin/notifications:
 *   post:
 *     summary: Create new notification (Admin)
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - type
 *               - target_type
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Notification message
 *               type:
 *                 type: string
 *                 enum: [INFO, SUCCESS, WARNING, ERROR, ORDER_UPDATE, PAYMENT_SUCCESS, PAYMENT_FAILED, SHIPPING_UPDATE, DELIVERY_CONFIRMATION, PROMOTION, SYSTEM_MAINTENANCE, SECURITY_ALERT, ADMIN_ALERT, USER_ACTIVITY, INVENTORY_ALERT]
 *                 description: Notification type
 *               target_type:
 *                 type: string
 *                 enum: [USER, ADMIN, BOTH]
 *                 description: Target audience type
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *                 description: Priority level
 *               recipient:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: string
 *                     description: Specific user ID (for targeted notifications)
 *                   admin_id:
 *                     type: string
 *                     description: Specific admin ID (for targeted notifications)
 *                   is_broadcast:
 *                     type: boolean
 *                     description: Whether this is a broadcast notification
 *                   target_roles:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [user, admin, superadmin]
 *                     description: Target roles for broadcast
 *               action:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [NONE, NAVIGATE, EXTERNAL_LINK, MODAL, API_CALL]
 *                   url:
 *                     type: string
 *                   params:
 *                     type: object
 *             example:
 *               title: "Order Status Update"
 *               message: "Your order #12345 has been shipped and is on its way!"
 *               type: "ORDER_UPDATE"
 *               target_type: "USER"
 *               priority: "HIGH"
 *               recipient:
 *                 user_id: "60d5ecb74b5b8a001f8b4567"
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/', validateCreateNotification, adminNotificationController.createNotification);

/**
 * @swagger
 * /api/v1/admin/notifications/{id}:
 *   put:
 *     summary: Update notification (Admin)
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Notification message
 *               type:
 *                 type: string
 *                 enum: [INFO, SUCCESS, WARNING, ERROR, ORDER_UPDATE, PAYMENT_SUCCESS, PAYMENT_FAILED, SHIPPING_UPDATE, DELIVERY_CONFIRMATION, PROMOTION, SYSTEM_MAINTENANCE, SECURITY_ALERT, ADMIN_ALERT, USER_ACTIVITY, INVENTORY_ALERT]
 *                 description: Notification type
 *               status:
 *                 type: string
 *                 enum: [PENDING, SENT, DELIVERED, READ, FAILED]
 *                 description: Notification status
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 description: Priority level
 *               is_active:
 *                 type: boolean
 *                 description: Whether the notification is active
 *             example:
 *               title: "Updated Order Status"
 *               priority: "URGENT"
 *               is_active: true
 *     responses:
 *       200:
 *         description: Notification updated successfully
 *       400:
 *         description: Validation error or invalid notification ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', validateUpdateNotification, adminNotificationController.updateNotification);

/**
 * @swagger
 * /api/v1/admin/notifications/{id}:
 *   delete:
 *     summary: Delete notification (Admin)
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *       - in: query
 *         name: permanent
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to permanently delete (true) or soft delete (false)
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', validateNotificationId, validateDeleteQuery, adminNotificationController.deleteNotification);

module.exports = router;
