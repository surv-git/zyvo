/**
 * User Routes
 * All routes for user management including CRUD operations, search, filtering
 * and admin dashboard analytics
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Import authentication middleware
// TODO: Create these middleware files
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 * 
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         name:
 *           type: string
 *           description: User full name
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           format: password
 *           description: User password (hashed)
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User role
 *         phone:
 *           type: string
 *           description: User phone number
 *         address:
 *           type: string
 *           description: User address
 *         isActive:
 *           type: boolean
 *           description: User active status
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         loginCount:
 *           type: number
 *           description: Total login count
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           description: Soft delete timestamp
 * 
 *     UserCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         role:
 *           type: string
 *           enum: [user, admin]
 *         phone:
 *           type: string
 *         address:
 *           type: string
 * 
 *     UserUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: Only admin can update role
 *         isActive:
 *           type: boolean
 *           description: Only admin can update active status
 */

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user (Registration)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreateRequest'
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: User already exists or validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', userController.createUser);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users with advanced search, filtering, and pagination
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term (name, email, phone, address)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *         description: Filter by role
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status (admin only for inactive)
 *       - in: query
 *         name: min_createdAt
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Minimum creation date
 *       - in: query
 *         name: max_createdAt
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Maximum creation date
 *       - in: query
 *         name: min_lastLoginAt
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Minimum last login date
 *       - in: query
 *         name: max_lastLoginAt
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Maximum last login date
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/', authMiddleware, userController.getAllUsers);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authMiddleware, userController.getUserById);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', authMiddleware, userController.updateUser);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user (soft delete by default, hard delete option for admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: hard_delete
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Perform hard delete (admin only)
 *     responses:
 *       204:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authMiddleware, userController.deleteUser);

// Admin-only routes for dashboard analytics
/**
 * @swagger
 * /api/v1/admin/users/trends/registrations:
 *   get:
 *     summary: Get user registration trends (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: daily
 *         description: Time period for grouping
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analysis
 *     responses:
 *       200:
 *         description: Registration trends retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */
router.get('/users/trends/registrations', authMiddleware, adminAuthMiddleware, userController.getUserRegistrationTrends);

/**
 * @swagger
 * /api/v1/admin/users/trends/active:
 *   get:
 *     summary: Get active users count (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lastActivityDays
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to consider for activity
 *     responses:
 *       200:
 *         description: Active users count retrieved successfully
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
 *                     activeUsers:
 *                       type: integer
 *                     period:
 *                       type: string
 *                     thresholdDate:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */
router.get('/users/trends/active', authMiddleware, adminAuthMiddleware, userController.getActiveUsersCount);

/**
 * @swagger
 * /api/v1/admin/users/trends/top-activity:
 *   get:
 *     summary: Get top users by activity (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [logins, orders, reviews]
 *           default: logins
 *         description: Type of activity to analyze
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top users to return
 *     responses:
 *       200:
 *         description: Top users by activity retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       lastLogin:
 *                         type: string
 *                         format: date-time
 *                       loginCount:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */
router.get('/users/trends/top-activity', authMiddleware, adminAuthMiddleware, userController.getTopUsersByActivity);

/**
 * @swagger
 * /api/v1/admin/users/trends/roles:
 *   get:
 *     summary: Get user role distribution (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role distribution retrieved successfully
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
 *                     user:
 *                       type: integer
 *                     admin:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */
router.get('/users/trends/roles', authMiddleware, adminAuthMiddleware, userController.getUserRoleDistribution);

module.exports = router;
