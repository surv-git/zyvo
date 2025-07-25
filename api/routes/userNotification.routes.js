/**
 * User Notification Routes
 * Handles routing for user notification operations
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Import controller
const userNotificationController = require('../controllers/userNotificationController');

// Import middleware
const { authMiddleware } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Validation rules
const validateMarkMultipleAsRead = [
  body('notification_ids')
    .isArray({ min: 1 })
    .withMessage('notification_ids must be a non-empty array'),
  
  body('notification_ids.*')
    .isMongoId()
    .withMessage('Each notification ID must be a valid MongoDB ObjectId')
];

const validateGetNotificationsQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('unread_only')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('unread_only must be true or false'),
  
  query('type')
    .optional()
    .isIn([
      'INFO', 'SUCCESS', 'WARNING', 'ERROR',
      'ORDER_UPDATE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
      'SHIPPING_UPDATE', 'DELIVERY_CONFIRMATION',
      'PROMOTION', 'SYSTEM_MAINTENANCE', 'SECURITY_ALERT'
    ])
    .withMessage('Invalid notification type'),
  
  query('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority level'),
  
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
];

const validateNotificationId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification ID')
];

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [User Notifications]
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
 *         name: unread_only
 *         schema:
 *           type: boolean
 *         description: Show only unread notifications
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INFO, SUCCESS, WARNING, ERROR, ORDER_UPDATE, PAYMENT_SUCCESS, PAYMENT_FAILED, SHIPPING_UPDATE, DELIVERY_CONFIRMATION, PROMOTION, SYSTEM_MAINTENANCE, SECURITY_ALERT]
 *         description: Filter by notification type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: Filter by priority level
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
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', validateGetNotificationsQuery, userNotificationController.getUserNotifications);

/**
 * @swagger
 * /api/v1/notifications/summary:
 *   get:
 *     summary: Get notification summary and counts
 *     tags: [User Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/summary', userNotificationController.getNotificationSummary);

/**
 * @swagger
 * /api/v1/notifications/mark-read:
 *   put:
 *     summary: Mark multiple notifications as read
 *     tags: [User Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notification_ids
 *             properties:
 *               notification_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of notification IDs to mark as read
 *             example:
 *               notification_ids: ["60d5ecb74b5b8a001f8b4567", "60d5ecb74b5b8a001f8b4568"]
 *     responses:
 *       200:
 *         description: Notifications marked as read successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/mark-read', validateMarkMultipleAsRead, userNotificationController.markMultipleAsRead);

/**
 * @swagger
 * /api/v1/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [User Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/mark-all-read', userNotificationController.markAllAsRead);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [User Notifications]
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
 *         description: Access denied
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', validateNotificationId, userNotificationController.getNotificationById);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [User Notifications]
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
 *         description: Notification marked as read successfully
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/read', validateNotificationId, userNotificationController.markAsRead);

module.exports = router;
