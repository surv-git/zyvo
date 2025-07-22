/**
 * Cart Routes
 * API endpoints for cart management with validation
 * Base path: /api/v1/user/cart
 */

const express = require('express');
const { body, param } = require('express-validator');
const { 
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  applyCouponToCart,
  removeCouponFromCart,
  clearCart
} = require('../controllers/cart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const validationErrorHandler = require('../middleware/validationErrorHandler');

const router = express.Router();

// Apply user authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/user/cart
 * @desc    Get user's cart with all items
 * @access  Private (User)
 */
router.get('/', getCart);

/**
 * @route   POST /api/v1/user/cart/items
 * @desc    Add item to cart
 * @access  Private (User)
 */
router.post('/items', [
  body('product_variant_id')
    .notEmpty()
    .withMessage('Product variant ID is required')
    .isMongoId()
    .withMessage('Product variant ID must be a valid MongoDB ObjectId'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 999 })
    .withMessage('Quantity must be an integer between 1 and 999')
    .toInt()
], addItemToCart);

/**
 * @route   PATCH /api/v1/user/cart/items/:productVariantId
 * @desc    Update cart item quantity
 * @access  Private (User)
 */
router.patch('/items/:productVariantId', [
  param('productVariantId')
    .isMongoId()
    .withMessage('Product variant ID must be a valid MongoDB ObjectId'),
  
  body('quantity')
    .isInt({ min: 0, max: 999 })
    .withMessage('Quantity must be an integer between 0 and 999 (0 to remove)')
    .toInt(),
    
  validationErrorHandler
], updateCartItemQuantity);

/**
 * @route   DELETE /api/v1/user/cart/items/:productVariantId
 * @desc    Remove item from cart
 * @access  Private (User)
 */
router.delete('/items/:productVariantId', [
  param('productVariantId')
    .isMongoId()
    .withMessage('Product variant ID must be a valid MongoDB ObjectId'),
    
  validationErrorHandler
], removeItemFromCart);

/**
 * @route   POST /api/v1/user/cart/apply-coupon
 * @desc    Apply coupon to cart
 * @access  Private (User)
 */
router.post('/apply-coupon', [
  body('coupon_code')
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Coupon code can only contain letters, numbers, hyphens, and underscores')
    .trim()
    .toUpperCase(),
    
  validationErrorHandler
], applyCouponToCart);

/**
 * @route   DELETE /api/v1/user/cart/remove-coupon
 * @desc    Remove coupon from cart
 * @access  Private (User)
 */
router.delete('/remove-coupon', removeCouponFromCart);

/**
 * @route   DELETE /api/v1/user/cart
 * @desc    Clear entire cart
 * @access  Private (User)
 */
router.delete('/', clearCart);

module.exports = router;
