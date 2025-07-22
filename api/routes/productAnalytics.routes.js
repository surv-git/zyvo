/**
 * Product Analytics Routes
 * Comprehensive analytics endpoints for product performance and insights
 * All endpoints require admin authentication
 */

const express = require('express');
const { query } = require('express-validator');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');
const {
  getProductAnalyticsOverview,
  getProductPerformance,
  getProductTrends,
  getLowPerformingProducts,
  getCatalogHealthReport,
  getCategoryComparison,
  getContentOptimization
} = require('../controllers/product.controller');

const router = express.Router();

// Apply authentication middleware first, then admin check
router.use(authMiddleware);
router.use(adminAuthMiddleware);

/**
 * @swagger
 * /api/v1/analytics/products/overview:
 *   get:
 *     summary: Get comprehensive product analytics overview
 *     tags: [Product Analytics]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Product analytics overview retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                     category_distribution:
 *                       type: array
 *                     score_distribution:
 *                       type: array
 *       401:
 *         description: Unauthorized - admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/overview', getProductAnalyticsOverview);

/**
 * @swagger
 * /api/v1/analytics/products/performance:
 *   get:
 *     summary: Get product performance metrics
 *     tags: [Product Analytics]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: 30d
 *         description: Time period for analysis (e.g., 30d, 60d, 90d)
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [views, conversions, score]
 *           default: views
 *         description: Metric to analyze
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of top performers to return
 *     responses:
 *       200:
 *         description: Product performance metrics retrieved successfully
 *       401:
 *         description: Unauthorized - admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/performance', [
  query('period')
    .optional()
    .matches(/^\d+d$/)
    .withMessage('Period must be in format: 30d, 60d, etc.'),
  query('metric')
    .optional()
    .isIn(['views', 'conversions', 'score'])
    .withMessage('Invalid metric type'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], getProductPerformance);

/**
 * @swagger
 * /api/v1/analytics/products/trends:
 *   get:
 *     summary: Get product creation and activity trends
 *     tags: [Product Analytics]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: monthly
 *         description: Grouping period for trends
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Filter by specific category ID
 *     responses:
 *       200:
 *         description: Product trends retrieved successfully
 *       401:
 *         description: Unauthorized - admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/trends', [
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Period must be daily, weekly, or monthly'),
  query('category_id')
    .optional()
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ObjectId')
], getProductTrends);

/**
 * @swagger
 * /api/v1/analytics/products/low-performers:
 *   get:
 *     summary: Get analysis of low-performing products
 *     tags: [Product Analytics]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: min_score
 *         schema:
 *           type: number
 *           default: 3
 *           minimum: 0
 *           maximum: 10
 *         description: Minimum score threshold for low performers
 *       - in: query
 *         name: days_old
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *         description: Minimum age in days to consider
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of low performers to return
 *     responses:
 *       200:
 *         description: Low-performing products analysis completed
 *       401:
 *         description: Unauthorized - admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/low-performers', [
  query('min_score')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Min score must be between 0 and 10'),
  query('days_old')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Days old must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], getLowPerformingProducts);

/**
 * @swagger
 * /api/v1/analytics/products/catalog-health:
 *   get:
 *     summary: Get comprehensive catalog health report
 *     tags: [Product Analytics]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Catalog health report generated successfully
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
 *                   type: object
 *                   properties:
 *                     health_score:
 *                       type: number
 *                     health_grade:
 *                       type: string
 *                     content_completeness:
 *                       type: object
 *                     quality_metrics:
 *                       type: object
 *                     recommendations:
 *                       type: array
 *       401:
 *         description: Unauthorized - admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/catalog-health', getCatalogHealthReport);

/**
 * @swagger
 * /api/v1/analytics/products/category-comparison:
 *   get:
 *     summary: Get category performance comparison analytics
 *     tags: [Product Analytics]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Category comparison analytics retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     category_comparison:
 *                       type: array
 *                     insights:
 *                       type: object
 *       401:
 *         description: Unauthorized - admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/category-comparison', getCategoryComparison);

/**
 * @swagger
 * /api/v1/analytics/products/content-optimization:
 *   get:
 *     summary: Get content optimization opportunities
 *     tags: [Product Analytics]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [all, critical, high, medium, low]
 *           default: all
 *         description: Priority level filter for optimization opportunities
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 200
 *         description: Maximum number of products to return
 *     responses:
 *       200:
 *         description: Content optimization opportunities identified successfully
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
 *                   type: object
 *                   properties:
 *                     optimization_opportunities:
 *                       type: array
 *                     summary:
 *                       type: object
 *       401:
 *         description: Unauthorized - admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/content-optimization', [
  query('priority')
    .optional()
    .isIn(['all', 'critical', 'high', 'medium', 'low'])
    .withMessage('Priority must be one of: all, critical, high, medium, low'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be between 1 and 200')
], getContentOptimization);

module.exports = router;
