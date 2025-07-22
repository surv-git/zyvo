/**
 * Public Dynamic Content Routes
 * Public routes for fetching active content for frontend display
 * No authentication required
 */

const express = require('express');
const { param, query } = require('express-validator');
const {
  getActiveContent,
  getAvailableContentLocations
} = require('../controllers/dynamicContent.controller');

const router = express.Router();

// Validation middleware
const validateGetActiveContent = [
  param('locationKey')
    .notEmpty()
    .withMessage('Location key is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Location key must be between 1 and 100 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Location key must contain only uppercase letters, numbers, and underscores'),
    
  param('type')
    .notEmpty()
    .withMessage('Content type is required')
    .isIn(['CAROUSEL', 'MARQUEE', 'ADVERTISEMENT', 'OFFER', 'PROMO', 'carousel', 'marquee', 'advertisement', 'offer', 'promo'])
    .withMessage('Invalid content type'),
    
  query('audience')
    .optional()
    .isString()
    .withMessage('Audience must be a string of comma-separated tags')
];

/**
 * @route   GET /api/v1/content/locations
 * @desc    Get all available content locations and types
 * @access  Public
 */
router.get('/locations', getAvailableContentLocations);

/**
 * @route   GET /api/v1/content/:locationKey/:type
 * @desc    Get active content by location and type
 * @access  Public
 * @example GET /api/v1/content/HOME_HERO_SLIDER/CAROUSEL
 * @example GET /api/v1/content/MARQUEE_TOP/MARQUEE?audience=new_user,premium_member
 */
router.get('/:locationKey/:type', validateGetActiveContent, getActiveContent);

module.exports = router;
