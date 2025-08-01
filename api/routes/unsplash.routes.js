/**
 * Unsplash Routes
 * API endpoints for managing Unsplash image integration
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminAuthMiddleware } = require('../middleware/admin.middleware');
const unsplashService = require('../services/unsplash.service');
const ImagePopulator = require('../utils/populateImages');

/**
 * @swagger
 * /api/v1/unsplash/search:
 *   get:
 *     tags: [Unsplash]
 *     summary: Search for images on Unsplash
 *     description: Search for images using Unsplash API (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - name: count
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *           default: 10
 *         description: Number of images to return
 *       - name: orientation
 *         in: query
 *         schema:
 *           type: string
 *           enum: [landscape, portrait, squarish]
 *           default: landscape
 *         description: Image orientation
 *     responses:
 *       200:
 *         description: Images found successfully
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
 *                       id:
 *                         type: string
 *                       url:
 *                         type: string
 *                       thumb:
 *                         type: string
 *                       alt_description:
 *                         type: string
 *                       photographer:
 *                         type: string
 */
router.get('/search', [
  authMiddleware,
  adminAuthMiddleware,
  query('query').notEmpty().withMessage('Search query is required'),
  query('count').optional().isInt({ min: 1, max: 30 }).toInt(),
  query('orientation').optional().isIn(['landscape', 'portrait', 'squarish'])
], async (req, res, next) => {
  try {
    const { query, count = 10, orientation = 'landscape' } = req.query;

    if (!unsplashService.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Unsplash service not configured'
      });
    }

    const images = await unsplashService.searchImages(query, count, orientation);

    res.json({
      success: true,
      data: images,
      count: images.length
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/unsplash/product/{productId}/suggestions:
 *   get:
 *     tags: [Unsplash]
 *     summary: Get image suggestions for a product
 *     description: Get Unsplash image suggestions for a specific product (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - name: count
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Number of suggestions
 *     responses:
 *       200:
 *         description: Image suggestions retrieved successfully
 */
router.get('/product/:productId/suggestions', [
  authMiddleware,
  adminAuthMiddleware,
  param('productId').isMongoId().withMessage('Invalid product ID'),
  query('count').optional().isInt({ min: 1, max: 20 }).toInt()
], async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { count = 5 } = req.query;

    if (!unsplashService.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Unsplash service not configured'
      });
    }

    const populator = new ImagePopulator();
    const suggestions = await populator.getProductImageSuggestions(productId, count);

    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/unsplash/category/{categoryId}/suggestions:
 *   get:
 *     tags: [Unsplash]
 *     summary: Get image suggestions for a category
 *     description: Get Unsplash image suggestions for a specific category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *       - name: count
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Number of suggestions
 *     responses:
 *       200:
 *         description: Image suggestions retrieved successfully
 */
router.get('/category/:categoryId/suggestions', [
  authMiddleware,
  adminAuthMiddleware,
  param('categoryId').isMongoId().withMessage('Invalid category ID'),
  query('count').optional().isInt({ min: 1, max: 20 }).toInt()
], async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { count = 5 } = req.query;

    if (!unsplashService.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Unsplash service not configured'
      });
    }

    const populator = new ImagePopulator();
    const suggestions = await populator.getCategoryImageSuggestions(categoryId, count);

    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/unsplash/populate:
 *   post:
 *     tags: [Unsplash]
 *     summary: Populate images for products and categories
 *     description: Automatically populate images for products and categories using Unsplash (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               overwrite:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to overwrite existing images
 *               skipProducts:
 *                 type: boolean
 *                 default: false
 *                 description: Skip product image population
 *               skipCategories:
 *                 type: boolean
 *                 default: false
 *                 description: Skip category image population
 *               productLimit:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 description: Limit number of products to process (0 = no limit)
 *               categoryLimit:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 description: Limit number of categories to process (0 = no limit)
 *     responses:
 *       200:
 *         description: Image population completed successfully
 */
router.post('/populate', [
  authMiddleware,
  adminAuthMiddleware,
  body('overwrite').optional().isBoolean(),
  body('skipProducts').optional().isBoolean(),
  body('skipCategories').optional().isBoolean(),
  body('productLimit').optional().isInt({ min: 0 }).toInt(),
  body('categoryLimit').optional().isInt({ min: 0 }).toInt()
], async (req, res, next) => {
  try {
    const {
      overwrite = false,
      skipProducts = false,
      skipCategories = false,
      productLimit = 0,
      categoryLimit = 0
    } = req.body;

    if (!unsplashService.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Unsplash service not configured'
      });
    }

    // Start population in background
    const populator = new ImagePopulator();
    
    // Don't await this - let it run in background
    populator.populateAllImages({
      overwrite,
      skipProducts,
      skipCategories,
      productLimit,
      categoryLimit
    }).catch(error => {
      console.error('Background image population error:', error);
    });

    res.json({
      success: true,
      message: 'Image population started in background',
      options: {
        overwrite,
        skipProducts,
        skipCategories,
        productLimit,
        categoryLimit
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/unsplash/status:
 *   get:
 *     tags: [Unsplash]
 *     summary: Get Unsplash service status
 *     description: Check if Unsplash service is properly configured (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service status retrieved successfully
 */
router.get('/status', [authMiddleware, adminAuthMiddleware], async (req, res, next) => {
  try {
    const isConfigured = unsplashService.isReady();
    
    res.json({
      success: true,
      data: {
        configured: isConfigured,
        message: isConfigured 
          ? 'Unsplash service is ready' 
          : 'Unsplash service not configured. Set UNSPLASH_ACCESS_KEY in environment variables.'
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
