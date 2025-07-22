/**
 * Review Helper Utilities
 * Common functions for review and rating management
 */

const mongoose = require('mongoose');
const ProductReview = require('../models/ProductReview');
const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Check if user is a verified buyer for a product variant
 * @param {string} userId - User ID
 * @param {string} productVariantId - Product variant ID
 * @returns {Promise<boolean>} - True if user has purchased the product
 */
const checkVerifiedBuyer = async (userId, productVariantId) => {
  try {
    // Check if user has completed orders containing this product variant
    const order = await Order.findOne({
      user_id: userId,
      status: 'DELIVERED', // Only delivered orders count
      'items.product_variant_id': productVariantId
    });

    return !!order;
  } catch (error) {
    console.error('Error checking verified buyer status:', error);
    return false;
  }
};

/**
 * Calculate and save product variant ratings
 * @param {string} productVariantId - Product variant ID
 * @returns {Promise<Object>} - Updated rating statistics
 */
const calculateAndSaveProductVariantRatings = async (productVariantId) => {
  try {
    // Get rating statistics from approved reviews
    const stats = await ProductReview.getRatingStats(productVariantId);

    // Update the product variant with new statistics
    const updatedVariant = await ProductVariant.findByIdAndUpdate(
      productVariantId,
      {
        average_rating: stats.averageRating,
        reviews_count: stats.totalReviews,
        rating_distribution: stats.ratingDistribution
      },
      { new: true }
    );

    if (!updatedVariant) {
      throw new Error('Product variant not found');
    }

    // Also update the parent product if needed
    await updateProductRatings(updatedVariant.product_id);

    return stats;
  } catch (error) {
    console.error('Error calculating product variant ratings:', error);
    throw error;
  }
};

/**
 * Update product ratings based on all its variants
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} - Updated product rating statistics
 */
const updateProductRatings = async (productId) => {
  try {
    // Get all variants for this product
    const variants = await ProductVariant.find({ 
      product_id: productId,
      is_active: true 
    });

    if (variants.length === 0) {
      return { averageRating: 0, totalReviews: 0, ratingDistribution: {} };
    }

    // Calculate aggregate statistics across all variants
    let totalRating = 0;
    let totalReviews = 0;
    const aggregateDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

    variants.forEach(variant => {
      if (variant.reviews_count > 0) {
        totalRating += variant.average_rating * variant.reviews_count;
        totalReviews += variant.reviews_count;

        // Aggregate rating distribution
        Object.keys(aggregateDistribution).forEach(rating => {
          aggregateDistribution[rating] += variant.rating_distribution[rating] || 0;
        });
      }
    });

    const averageRating = totalReviews > 0 ? Math.round((totalRating / totalReviews) * 10) / 10 : 0;

    // Update the product
    await Product.findByIdAndUpdate(
      productId,
      {
        average_rating: averageRating,
        reviews_count: totalReviews,
        rating_distribution: aggregateDistribution
      },
      { new: true }
    );

    return {
      averageRating,
      totalReviews,
      ratingDistribution: aggregateDistribution
    };
  } catch (error) {
    console.error('Error updating product ratings:', error);
    throw error;
  }
};

/**
 * Validate review content for inappropriate content
 * @param {string} content - Review content to validate
 * @returns {Object} - Validation result
 */
const validateReviewContent = (content) => {
  if (!content || typeof content !== 'string') {
    return { isValid: true, issues: [] };
  }

  const issues = [];
  const lowerContent = content.toLowerCase();

  // Basic profanity filter (extend as needed)
  const profanityWords = [
    'spam', 'fake', 'scam', 'terrible', 'awful', 'horrible'
    // Add more words as needed
  ];

  const foundProfanity = profanityWords.filter(word => 
    lowerContent.includes(word)
  );

  if (foundProfanity.length > 0) {
    issues.push({
      type: 'POTENTIAL_INAPPROPRIATE_LANGUAGE',
      words: foundProfanity
    });
  }

  // Check for excessive capitalization
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) {
    issues.push({
      type: 'EXCESSIVE_CAPITALIZATION',
      ratio: capsRatio
    });
  }

  // Check for repeated characters (potential spam)
  const repeatedChars = content.match(/(.)\1{4,}/g);
  if (repeatedChars) {
    issues.push({
      type: 'REPEATED_CHARACTERS',
      patterns: repeatedChars
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    riskScore: issues.length
  };
};

/**
 * Generate review summary for admin dashboard
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Review summary statistics
 */
const getReviewSummary = async (options = {}) => {
  try {
    const { startDate, endDate } = options;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const summary = await ProductReview.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          statusBreakdown: {
            $push: '$status'
          },
          ratingBreakdown: {
            $push: '$rating'
          },
          totalReported: {
            $sum: {
              $cond: [{ $gt: ['$reported_count', 0] }, 1, 0]
            }
          },
          totalFlagged: {
            $sum: {
              $cond: [{ $eq: ['$status', 'FLAGGED'] }, 1, 0]
            }
          }
        }
      }
    ]);

    if (summary.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        statusBreakdown: {},
        ratingBreakdown: {},
        totalReported: 0,
        totalFlagged: 0
      };
    }

    const result = summary[0];

    // Process status breakdown
    const statusBreakdown = {};
    result.statusBreakdown.forEach(status => {
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    // Process rating breakdown
    const ratingBreakdown = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    result.ratingBreakdown.forEach(rating => {
      ratingBreakdown[rating.toString()] = (ratingBreakdown[rating.toString()] || 0) + 1;
    });

    return {
      totalReviews: result.totalReviews,
      averageRating: Math.round(result.averageRating * 10) / 10,
      statusBreakdown,
      ratingBreakdown,
      totalReported: result.totalReported,
      totalFlagged: result.totalFlagged
    };
  } catch (error) {
    console.error('Error generating review summary:', error);
    throw error;
  }
};

/**
 * Build search query for reviews
 * @param {Object} filters - Filter parameters
 * @returns {Object} - MongoDB query object
 */
const buildReviewSearchQuery = (filters = {}) => {
  const query = {};

  // Status filter
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query.status = { $in: filters.status };
    } else {
      query.status = filters.status;
    }
  }

  // Product variant filter
  if (filters.product_variant_id) {
    query.product_variant_id = filters.product_variant_id;
  }

  // User filter
  if (filters.user_id) {
    query.user_id = filters.user_id;
  }

  // Rating range filter
  if (filters.min_rating || filters.max_rating) {
    query.rating = {};
    if (filters.min_rating) query.rating.$gte = parseInt(filters.min_rating);
    if (filters.max_rating) query.rating.$lte = parseInt(filters.max_rating);
  }

  // Verified buyer filter
  if (filters.verified_only === 'true') {
    query.is_verified_buyer = true;
  }

  // Reported reviews filter
  if (filters.reported_only === 'true') {
    query.reported_count = { $gt: 0 };
  }

  // Date range filter
  if (filters.start_date || filters.end_date) {
    query.createdAt = {};
    if (filters.start_date) query.createdAt.$gte = new Date(filters.start_date);
    if (filters.end_date) query.createdAt.$lte = new Date(filters.end_date);
  }

  // Text search in title and review text
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [
      { title: searchRegex },
      { review_text: searchRegex }
    ];
  }

  return query;
};

/**
 * Build sort options for reviews
 * @param {string} sortBy - Sort field
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {Object} - MongoDB sort object
 */
const buildReviewSortOptions = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const validSortFields = [
    'createdAt', 'updatedAt', 'rating', 'helpful_votes', 'reported_count'
  ];

  const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = sortOrder.toLowerCase() === 'asc' ? 1 : -1;

  return { [field]: order };
};

/**
 * Sanitize review data for public display
 * @param {Object} review - Review object
 * @returns {Object} - Sanitized review data
 */
const sanitizeReviewForPublic = (review) => {
  const sanitized = review.toObject ? review.toObject() : { ...review };

  // Remove sensitive fields
  delete sanitized.reported_count;
  delete sanitized.moderated_by;
  delete sanitized.moderated_at;

  // Limit user information
  if (sanitized.user_id && typeof sanitized.user_id === 'object') {
    sanitized.user_id = {
      _id: sanitized.user_id._id,
      name: sanitized.user_id.name || 'Anonymous'
    };
  }

  return sanitized;
};

module.exports = {
  checkVerifiedBuyer,
  calculateAndSaveProductVariantRatings,
  updateProductRatings,
  validateReviewContent,
  getReviewSummary,
  buildReviewSearchQuery,
  buildReviewSortOptions,
  sanitizeReviewForPublic
};
