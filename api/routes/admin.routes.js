/**
 * Admin Routes
 * 
 * Administrative routes for system management
 * Demonstrates admin audit logging integration
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Middleware to simulate admin authentication (for demo purposes)
const mockAdminAuthMiddleware = (req, res, next) => {
  // In a real app, this would validate JWT tokens and check admin role
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    req.user = {
      id: 'admin123',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin'
    };
  } else {
    return res.status(401).json({
      success: false,
      message: 'Admin authentication required'
    });
  }
  next();
};

// Apply admin auth middleware to all routes
router.use(mockAdminAuthMiddleware);

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard data
 *     description: Retrieve administrative dashboard statistics and data
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         description: Admin authentication required
 */
router.get('/dashboard', adminController.getDashboardData);

/**
 * @swagger
 * /api/v1/admin/products:
 *   post:
 *     summary: Create new product
 *     description: Create a new product in the system
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *               price:
 *                 type: number
 *                 description: Product price
 *               category:
 *                 type: string
 *                 description: Product category
 *               description:
 *                 type: string
 *                 description: Product description
 *               stock:
 *                 type: integer
 *                 description: Initial stock quantity
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Admin authentication required
 */
router.post('/products', adminController.createProduct);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   put:
 *     summary: Update product
 *     description: Update an existing product
 *     tags:
 *       - Admin
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Admin authentication required
 */
router.put('/products/:id', adminController.updateProduct);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   delete:
 *     summary: Delete product
 *     description: Delete a product from the system
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: permanent
 *         schema:
 *           type: boolean
 *         description: Whether to permanently delete the product
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Admin authentication required
 */
router.delete('/products/:id', adminController.deleteProduct);

/**
 * @swagger
 * /api/v1/admin/users/{userId}/manage:
 *   post:
 *     summary: Manage user account
 *     description: Perform administrative actions on user accounts
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [activate, deactivate, suspend, delete]
 *                 description: Action to perform
 *               reason:
 *                 type: string
 *                 description: Reason for the action
 *     responses:
 *       200:
 *         description: User account managed successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Admin authentication required
 */
router.post('/users/:userId/manage', adminController.manageUserAccount);

/**
 * @swagger
 * /api/v1/admin/settings:
 *   put:
 *     summary: Update system settings
 *     description: Update global system configuration
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: object
 *                 description: System settings to update
 *     responses:
 *       200:
 *         description: System settings updated successfully
 *       401:
 *         description: Admin authentication required
 */
router.put('/settings', adminController.updateSystemSettings);

/**
 * @swagger
 * /api/v1/admin/reports/sales:
 *   get:
 *     summary: Export sales data
 *     description: Export sales data for reporting purposes
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx, json]
 *         description: Export format
 *     responses:
 *       200:
 *         description: Sales data exported successfully
 *       401:
 *         description: Admin authentication required
 */
router.get('/reports/sales', adminController.exportSalesData);

module.exports = router;
