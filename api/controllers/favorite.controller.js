/**
 * Favorite Controller
 * Handles all favorite management operations for users
 */

const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');
const ProductVariant = require('../models/ProductVariant');
const userActivityLogger = require('../loggers/userActivity.logger');
const { validationResult } = require('express-validator');

/**
 * Add Product Variant to Favorites
 * @route POST /api/v1/user/favorites
 * @access User only
 */
const addFavorite = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { product_variant_id, user_notes } = req.body;
    const userId = req.user.id;

    // Verify product variant exists and is active
    const productVariant = await ProductVariant.findById(product_variant_id);
    if (!productVariant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    if (!productVariant.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Product variant is not available for favorites'
      });
    }

    // Add or update favorite using static method
    const result = await Favorite.addOrUpdateFavorite(userId, product_variant_id, user_notes);
    const { favorite, action } = result;

    // Populate the favorite for response
    await favorite.populate({
      path: 'product_variant_id',
      select: 'sku_code price images name option_values is_active discount_details average_rating reviews_count',
      populate: {
        path: 'product_id',
        select: 'name description category_id brand_id'
      }
    });

    // Determine response status and message
    let statusCode = 200;
    let message = 'Product variant added to favorites successfully';

    switch (action) {
      case 'created':
        statusCode = 201;
        message = 'Product variant added to favorites successfully';
        break;
      case 'reactivated':
        message = 'Product variant re-added to favorites successfully';
        break;
      case 'updated':
        message = 'Favorite notes updated successfully';
        break;
      case 'already_exists':
        message = 'Product variant is already in your favorites';
        break;
    }

    // Log user activity
    userActivityLogger.info('Favorite added/updated', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'ADD_FAVORITE',
      resource_type: 'Favorite',
      resource_id: favorite._id,
      details: {
        product_variant_id,
        action,
        has_notes: !!user_notes
      }
    });

    res.status(statusCode).json({
      success: true,
      message,
      data: {
        favorite,
        action
      }
    });

  } catch (error) {
    console.error('Error adding favorite:', error);
    next(error);
  }
};

/**
 * Get User's Favorite Product Variants
 * @route GET /api/v1/user/favorites
 * @access User only
 */
const getFavorites = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort_by = 'added_at',
      sort_order = 'desc',
      include_inactive = false
    } = req.query;

    const userId = req.user.id;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Cap at 100

    // Get favorites with pagination
    const [favorites, totalCount] = await Promise.all([
      Favorite.findUserFavorites(userId, {
        page: pageNum,
        limit: limitNum,
        sortBy: sort_by,
        sortOrder: sort_order,
        includeInactive: include_inactive === 'true'
      }),
      Favorite.countUserFavorites(userId, include_inactive === 'true')
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);

    // Filter out favorites with inactive product variants
    const activeFavorites = favorites.filter(favorite => 
      favorite.product_variant_id && favorite.product_variant_id.is_active
    );

    res.json({
      success: true,
      data: activeFavorites,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_items: totalCount,
        items_per_page: limitNum,
        has_next_page: pageNum < totalPages,
        has_prev_page: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    next(error);
  }
};

/**
 * Remove Product Variant from Favorites (Unfavorite)
 * @route DELETE /api/v1/user/favorites/:productVariantId
 * @access User only
 */
const removeFavorite = async (req, res, next) => {
  try {
    const { productVariantId } = req.params;
    const userId = req.user.id;

    // Validate product variant ID
    if (!mongoose.Types.ObjectId.isValid(productVariantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product variant ID format'
      });
    }

    // Remove favorite using static method
    const removedFavorite = await Favorite.removeUserFavorite(userId, productVariantId);

    if (!removedFavorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found or already removed'
      });
    }

    // Log user activity
    userActivityLogger.info('Favorite removed', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'REMOVE_FAVORITE',
      resource_type: 'Favorite',
      resource_id: removedFavorite._id,
      details: {
        product_variant_id: productVariantId
      }
    });

    res.status(204).send(); // No Content

  } catch (error) {
    console.error('Error removing favorite:', error);
    next(error);
  }
};

/**
 * Update Favorite Notes
 * @route PATCH /api/v1/user/favorites/:productVariantId/notes
 * @access User only
 */
const updateFavoriteNotes = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { productVariantId } = req.params;
    const { user_notes } = req.body;
    const userId = req.user.id;

    // Validate product variant ID
    if (!mongoose.Types.ObjectId.isValid(productVariantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product variant ID format'
      });
    }

    // Find active favorite
    const favorite = await Favorite.findOne({
      user_id: userId,
      product_variant_id: productVariantId,
      is_active: true
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Update notes
    await favorite.updateNotes(user_notes);

    // Populate for response
    await favorite.populate({
      path: 'product_variant_id',
      select: 'sku_code price images name option_values'
    });

    // Log user activity
    userActivityLogger.info('Favorite notes updated', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'UPDATE_FAVORITE_NOTES',
      resource_type: 'Favorite',
      resource_id: favorite._id,
      details: {
        product_variant_id: productVariantId,
        has_notes: !!user_notes
      }
    });

    res.json({
      success: true,
      message: 'Favorite notes updated successfully',
      data: favorite
    });

  } catch (error) {
    console.error('Error updating favorite notes:', error);
    next(error);
  }
};

/**
 * Check if Product Variant is Favorited
 * @route GET /api/v1/user/favorites/:productVariantId/check
 * @access User only
 */
const checkFavorite = async (req, res, next) => {
  try {
    const { productVariantId } = req.params;
    const userId = req.user.id;

    // Validate product variant ID
    if (!mongoose.Types.ObjectId.isValid(productVariantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product variant ID format'
      });
    }

    // Check if favorited
    const isFavorited = await Favorite.isUserFavorite(userId, productVariantId);

    res.json({
      success: true,
      data: {
        product_variant_id: productVariantId,
        is_favorited: isFavorited
      }
    });

  } catch (error) {
    console.error('Error checking favorite:', error);
    next(error);
  }
};

/**
 * Get User's Favorite Statistics
 * @route GET /api/v1/user/favorites/stats
 * @access User only
 */
const getFavoriteStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's favorite statistics
    const stats = await Favorite.getUserFavoriteStats(userId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching favorite stats:', error);
    next(error);
  }
};

/**
 * Bulk Add Favorites
 * @route POST /api/v1/user/favorites/bulk
 * @access User only
 */
const bulkAddFavorites = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { product_variant_ids, user_notes } = req.body;
    const userId = req.user.id;

    // Validate product variant IDs
    const invalidIds = product_variant_ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product variant ID format',
        invalid_ids: invalidIds
      });
    }

    // Verify all product variants exist and are active
    const productVariants = await ProductVariant.find({
      _id: { $in: product_variant_ids },
      is_active: true
    });

    const foundIds = productVariants.map(pv => pv._id.toString());
    const notFoundIds = product_variant_ids.filter(id => !foundIds.includes(id));

    if (notFoundIds.length > 0) {
      return res.status(404).json({
        success: false,
        message: 'Some product variants not found or inactive',
        not_found_ids: notFoundIds
      });
    }

    // Bulk add favorites
    const results = await Favorite.bulkAddFavorites(userId, product_variant_ids, user_notes);

    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Log user activity
    userActivityLogger.info('Bulk favorites added', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'BULK_ADD_FAVORITES',
      resource_type: 'Favorite',
      details: {
        total_items: product_variant_ids.length,
        successful,
        failed,
        has_notes: !!user_notes
      }
    });

    res.status(201).json({
      success: true,
      message: `Bulk operation completed: ${successful} successful, ${failed} failed`,
      data: {
        total: product_variant_ids.length,
        successful,
        failed,
        results
      }
    });

  } catch (error) {
    console.error('Error bulk adding favorites:', error);
    next(error);
  }
};

/**
 * Get Most Favorited Product Variants (Public endpoint for analytics)
 * @route GET /api/v1/favorites/popular
 * @access Public (no authentication required)
 */
const getMostFavorited = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Cap at 50

    const mostFavorited = await Favorite.getMostFavorited({ limit: limitNum });

    res.json({
      success: true,
      data: mostFavorited
    });

  } catch (error) {
    console.error('Error fetching most favorited:', error);
    next(error);
  }
};

module.exports = {
  addFavorite,
  getFavorites,
  removeFavorite,
  updateFavoriteNotes,
  checkFavorite,
  getFavoriteStats,
  bulkAddFavorites,
  getMostFavorited
};
