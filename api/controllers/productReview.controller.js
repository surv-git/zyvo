/**
 * ProductReview Controller
 * Handles all product review operations for user, public, and admin APIs
 */

const mongoose = require('mongoose');
const ProductReview = require('../models/ProductReview');
const ReviewReport = require('../models/ReviewReport');
const ProductVariant = require('../models/ProductVariant');
const userActivityLogger = require('../loggers/userActivity.logger');
const adminAuditLogger = require('../loggers/adminAudit.logger');
const { validationResult } = require('express-validator');
const {
  checkVerifiedBuyer,
  calculateAndSaveProductVariantRatings,
  validateReviewContent,
  getReviewSummary,
  buildReviewSearchQuery,
  buildReviewSortOptions,
  sanitizeReviewForPublic
} = require('../utils/reviewHelpers');

/**
 * USER CONTROLLERS
 */

/**
 * Submit a product review
 * @route POST /api/v1/user/reviews
 * @access User only
 */
const submitReview = async (req, res, next) => {
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

    const {
      product_variant_id,
      rating,
      title,
      review_text,
      reviewer_display_name,
      reviewer_location,
      image_urls = [],
      video_url
    } = req.body;

    const userId = req.user.id;

    // Check if user has already reviewed this product variant
    const existingReview = await ProductReview.findOne({
      user_id: userId,
      product_variant_id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product variant'
      });
    }

    // Verify product variant exists
    const productVariant = await ProductVariant.findById(product_variant_id);
    if (!productVariant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // Check if user is a verified buyer
    const isVerifiedBuyer = await checkVerifiedBuyer(userId, product_variant_id);

    // Validate review content
    const contentValidation = validateReviewContent(review_text);
    
    // Create review
    const review = new ProductReview({
      user_id: userId,
      product_variant_id,
      rating,
      title,
      review_text,
      is_verified_buyer: isVerifiedBuyer,
      reviewer_display_name,
      reviewer_location,
      image_urls,
      video_url,
      status: contentValidation.riskScore > 2 ? 'PENDING_APPROVAL' : 'APPROVED'
    });

    const savedReview = await review.save();

    // Update product variant ratings if review is approved
    if (savedReview.status === 'APPROVED') {
      await calculateAndSaveProductVariantRatings(product_variant_id);
    }

    // Populate references for response
    await savedReview.populate([
      { path: 'user_id', select: 'name' },
      { path: 'product_variant_id', select: 'name' }
    ]);

    // Log user activity
    userActivityLogger.info('Review submitted', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'SUBMIT_REVIEW',
      resource_type: 'ProductReview',
      resource_id: savedReview._id,
      details: {
        product_variant_id,
        rating,
        is_verified_buyer: isVerifiedBuyer,
        status: savedReview.status
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: sanitizeReviewForPublic(savedReview)
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product variant'
      });
    }
    next(error);
  }
};

/**
 * Get user's own reviews
 * @route GET /api/v1/user/reviews/my
 * @access User only
 */
const getMyReviews = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    const userId = req.user.id;
    const query = { user_id: userId };
    
    if (status) {
      query.status = status;
    }

    const sortOptions = buildReviewSortOptions(sort_by, sort_order);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [reviews, total] = await Promise.all([
      ProductReview.find(query)
        .populate('product_variant_id', 'name images')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      ProductReview.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: total,
        items_per_page: limitNum,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update user's own review
 * @route PATCH /api/v1/user/reviews/:reviewId
 * @access User only
 */
const updateMyReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { reviewId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const review = await ProductReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (!review.canBeEditedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews that are pending or approved'
      });
    }

    // Store original values for audit log
    const originalValues = {
      rating: review.rating,
      title: review.title,
      review_text: review.review_text,
      status: review.status
    };

    // Validate content if being updated
    if (updates.review_text) {
      const contentValidation = validateReviewContent(updates.review_text);
      if (contentValidation.riskScore > 2) {
        updates.status = 'PENDING_APPROVAL';
      }
    }

    // Update the review
    Object.assign(review, updates);
    const updatedReview = await review.save();

    // Update product variant ratings if status changed
    if (originalValues.status !== updatedReview.status) {
      await calculateAndSaveProductVariantRatings(review.product_variant_id);
    }

    // Prepare changes for audit log
    const changes = {};
    Object.keys(updates).forEach(key => {
      if (originalValues[key] !== undefined && originalValues[key] !== updates[key]) {
        changes[key] = {
          from: originalValues[key],
          to: updates[key]
        };
      }
    });

    // Log user activity
    userActivityLogger.info('Review updated', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'UPDATE_REVIEW',
      resource_type: 'ProductReview',
      resource_id: updatedReview._id,
      changes
    });

    await updatedReview.populate([
      { path: 'user_id', select: 'name' },
      { path: 'product_variant_id', select: 'name' }
    ]);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: sanitizeReviewForPublic(updatedReview)
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete user's own review
 * @route DELETE /api/v1/user/reviews/:reviewId
 * @access User only
 */
const deleteMyReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await ProductReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (!review.canBeDeletedBy(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    const productVariantId = review.product_variant_id;
    const wasApproved = review.status === 'APPROVED';

    // Delete the review
    await ProductReview.findByIdAndDelete(reviewId);

    // Delete associated reports
    await ReviewReport.deleteMany({ review_id: reviewId });

    // Update product variant ratings if review was approved
    if (wasApproved) {
      await calculateAndSaveProductVariantRatings(productVariantId);
    }

    // Log user activity
    userActivityLogger.info('Review deleted', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'DELETE_REVIEW',
      resource_type: 'ProductReview',
      resource_id: reviewId,
      details: {
        product_variant_id: productVariantId,
        was_approved: wasApproved
      }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Vote on a review (helpful/unhelpful)
 * @route POST /api/v1/user/reviews/:reviewId/vote
 * @access User only
 */
const voteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { vote_type } = req.body; // 'helpful' or 'unhelpful'
    const userId = req.user.id;

    if (!['helpful', 'unhelpful'].includes(vote_type)) {
      return res.status(400).json({
        success: false,
        message: 'Vote type must be "helpful" or "unhelpful"'
      });
    }

    const review = await ProductReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.user_id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own review'
      });
    }

    // Update vote count
    const updatedReview = await ProductReview.updateVotes(reviewId, vote_type, true);

    // Log user activity
    userActivityLogger.info('Review voted', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'VOTE_REVIEW',
      resource_type: 'ProductReview',
      resource_id: reviewId,
      details: {
        vote_type,
        helpful_votes: updatedReview.helpful_votes,
        unhelpful_votes: updatedReview.unhelpful_votes
      }
    });

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        helpful_votes: updatedReview.helpful_votes,
        unhelpful_votes: updatedReview.unhelpful_votes,
        helpful_percentage: updatedReview.getHelpfulPercentage()
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Report a review
 * @route POST /api/v1/user/reviews/:reviewId/report
 * @access User only
 */
const reportReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { reviewId } = req.params;
    const { reason, custom_reason } = req.body;
    const userId = req.user.id;

    const review = await ProductReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.user_id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report your own review'
      });
    }

    // Check if user has already reported this review
    const hasReported = await ReviewReport.hasUserReported(reviewId, userId);
    if (hasReported) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }

    // Create report
    const report = new ReviewReport({
      review_id: reviewId,
      reporter_user_id: userId,
      reason,
      custom_reason: reason === 'OTHER' ? custom_reason : null
    });

    await report.save();

    // Log user activity
    userActivityLogger.info('Review reported', {
      user_id: userId,
      user_email: req.user.email,
      action_type: 'REPORT_REVIEW',
      resource_type: 'ProductReview',
      resource_id: reviewId,
      details: {
        reason,
        custom_reason: reason === 'OTHER' ? custom_reason : null,
        report_id: report._id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review reported successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * PUBLIC CONTROLLERS
 */

/**
 * Get reviews for a product variant
 * @route GET /api/v1/products/:productVariantId/reviews
 * @access Public
 */
const getVariantReviews = async (req, res, next) => {
  try {
    const { productVariantId } = req.params;
    const {
      page = 1,
      limit = 10,
      sort_by = 'helpful_votes',
      sort_order = 'desc',
      min_rating,
      max_rating,
      verified_only = false
    } = req.query;

    // Verify product variant exists
    const productVariant = await ProductVariant.findById(productVariantId);
    if (!productVariant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: sort_by,
      sortOrder: sort_order,
      minRating: min_rating ? parseInt(min_rating) : undefined,
      maxRating: max_rating ? parseInt(max_rating) : undefined,
      verified_only: verified_only === 'true',
      status: 'APPROVED'
    };

    const [reviews, total] = await Promise.all([
      ProductReview.getVariantReviews(productVariantId, options),
      ProductReview.countDocuments({
        product_variant_id: productVariantId,
        status: 'APPROVED',
        ...(options.minRating && { rating: { $gte: options.minRating } }),
        ...(options.maxRating && { rating: { $lte: options.maxRating } }),
        ...(options.verified_only && { is_verified_buyer: true })
      })
    ]);

    const totalPages = Math.ceil(total / options.limit);

    // Sanitize reviews for public display
    const sanitizedReviews = reviews.map(review => sanitizeReviewForPublic(review));

    res.json({
      success: true,
      data: sanitizedReviews,
      pagination: {
        current_page: options.page,
        total_pages: totalPages,
        total_items: total,
        items_per_page: options.limit,
        has_next_page: options.page < totalPages,
        has_prev_page: options.page > 1
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get aggregated rating summary for a product
 * @route GET /api/v1/products/:productId/reviews/summary
 * @access Public
 */
const getProductRatingSummary = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Get all variants for this product
    const variants = await ProductVariant.find({ 
      product_id: productId,
      is_active: true 
    });

    if (variants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or has no active variants'
      });
    }

    const variantIds = variants.map(v => v._id);

    // Get aggregated statistics
    const stats = await ProductReview.aggregate([
      {
        $match: {
          product_variant_id: { $in: variantIds },
          status: 'APPROVED'
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          },
          verifiedReviews: {
            $sum: {
              $cond: [{ $eq: ['$is_verified_buyer', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          verifiedReviews: 0,
          ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
        }
      });
    }

    const result = stats[0];
    const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    
    result.ratingDistribution.forEach(rating => {
      distribution[rating.toString()]++;
    });

    res.json({
      success: true,
      data: {
        averageRating: Math.round(result.averageRating * 10) / 10,
        totalReviews: result.totalReviews,
        verifiedReviews: result.verifiedReviews,
        ratingDistribution: distribution
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN CONTROLLERS
 */

/**
 * Get all reviews (Admin view) with filters and pagination
 * @route GET /api/v1/admin/reviews
 * @access Admin only
 */
const getAllReviewsAdmin = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      status,
      product_variant_id,
      user_id,
      reported_only,
      verified_only,
      sort_by = 'createdAt',
      sort_order = 'desc',
      search
    } = req.query;

    // Map status to correct format if needed
    let mappedStatus = status;
    if (status) {
      const statusMap = {
        'pending': 'PENDING_APPROVAL',
        'pending_approval': 'PENDING_APPROVAL',
        'approved': 'APPROVED',
        'rejected': 'REJECTED',
        'flagged': 'FLAGGED'
      };
      
      // Use mapping if available, otherwise keep original (already validated)
      mappedStatus = statusMap[status.toLowerCase()] || status.toUpperCase();
    }

    const query = buildReviewSearchQuery({
      status: mappedStatus,
      product_variant_id,
      user_id,
      reported_only,
      verified_only,
      search
    });

    const sortOptions = buildReviewSortOptions(sort_by, sort_order);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [reviews, total] = await Promise.all([
      ProductReview.find(query)
        .populate('user_id', 'name email')
        .populate('product_variant_id', 'sku_code price')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      ProductReview.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: total,
        items_per_page: limitNum,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single review (Admin view)
 * @route GET /api/v1/admin/reviews/:reviewId
 * @access Admin only
 */
const getReviewAdmin = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const [review, reports] = await Promise.all([
      ProductReview.findById(reviewId)
        .populate('user_id', 'name email')
        .populate('product_variant_id', 'name')
        .populate('moderated_by', 'name email'),
      ReviewReport.getReportsForReview(reviewId)
    ]);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: {
        review,
        reports
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update review status
 * @route PATCH /api/v1/admin/reviews/:reviewId/status
 * @access Admin only
 */
const updateReviewStatus = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    if (!['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'FLAGGED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const review = await ProductReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const originalStatus = review.status;
    review.status = status;
    review.moderated_by = adminId;
    review.moderated_at = new Date();

    await review.save();

    // Update product variant ratings if status changed to/from APPROVED
    if (originalStatus !== status && (originalStatus === 'APPROVED' || status === 'APPROVED')) {
      await calculateAndSaveProductVariantRatings(review.product_variant_id);
    }

    // Log admin action
    adminAuditLogger.info('Review status updated', {
      admin_id: adminId,
      admin_email: req.user.email,
      action_type: 'UPDATE_REVIEW_STATUS',
      resource_type: 'ProductReview',
      resource_id: reviewId,
      changes: {
        status: {
          from: originalStatus,
          to: status
        }
      }
    });

    res.json({
      success: true,
      message: 'Review status updated successfully',
      data: {
        id: review._id,
        status: review.status,
        moderated_at: review.moderated_at,
        moderated_by: review.moderated_by
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update any review (Admin)
 * @route PATCH /api/v1/admin/reviews/:reviewId
 * @access Admin only
 */
const updateAnyReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { reviewId } = req.params;
    const updates = req.body;
    const adminId = req.user.id;

    const review = await ProductReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Store original values for audit log
    const originalValues = {};
    Object.keys(updates).forEach(key => {
      originalValues[key] = review[key];
    });

    // Update the review
    Object.assign(review, updates);
    review.moderated_by = adminId;
    review.moderated_at = new Date();

    const updatedReview = await review.save();

    // Update product variant ratings if status changed
    if (originalValues.status !== updatedReview.status) {
      await calculateAndSaveProductVariantRatings(review.product_variant_id);
    }

    // Prepare changes for audit log
    const changes = {};
    Object.keys(updates).forEach(key => {
      if (originalValues[key] !== updates[key]) {
        changes[key] = {
          from: originalValues[key],
          to: updates[key]
        };
      }
    });

    // Log admin action
    adminAuditLogger.info('Review updated by admin', {
      admin_id: adminId,
      admin_email: req.user.email,
      action_type: 'UPDATE_REVIEW',
      resource_type: 'ProductReview',
      resource_id: reviewId,
      changes
    });

    await updatedReview.populate([
      { path: 'user_id', select: 'name email' },
      { path: 'product_variant_id', select: 'name' },
      { path: 'moderated_by', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete review (Admin)
 * @route DELETE /api/v1/admin/reviews/:reviewId
 * @access Admin only
 */
const deleteReviewAdmin = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { hard_delete = false } = req.query;
    const adminId = req.user.id;

    const review = await ProductReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const productVariantId = review.product_variant_id;
    const wasApproved = review.status === 'APPROVED';

    if (hard_delete === 'true') {
      // Hard delete - remove completely
      await ProductReview.findByIdAndDelete(reviewId);
      await ReviewReport.deleteMany({ review_id: reviewId });
    } else {
      // Soft delete - mark as rejected
      review.status = 'REJECTED';
      review.moderated_by = adminId;
      review.moderated_at = new Date();
      await review.save();
    }

    // Update product variant ratings if review was approved
    if (wasApproved) {
      await calculateAndSaveProductVariantRatings(productVariantId);
    }

    // Log admin action
    adminAuditLogger.info('Review deleted by admin', {
      admin_id: adminId,
      admin_email: req.user.email,
      action_type: 'DELETE_REVIEW',
      resource_type: 'ProductReview',
      resource_id: reviewId,
      details: {
        hard_delete: hard_delete === 'true',
        was_approved: wasApproved,
        product_variant_id: productVariantId
      }
    });

    res.json({
      success: true,
      message: `Review ${hard_delete === 'true' ? 'permanently deleted' : 'rejected'} successfully`
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get review summary statistics
 * @route GET /api/v1/admin/reviews/summary
 * @access Admin only
 */
const getReviewSummaryAdmin = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    const summary = await getReviewSummary({
      startDate: start_date,
      endDate: end_date
    });

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  // User controllers
  submitReview,
  getMyReviews,
  updateMyReview,
  deleteMyReview,
  voteReview,
  reportReview,

  // Public controllers
  getVariantReviews,
  getProductRatingSummary,

  // Admin controllers
  getAllReviewsAdmin,
  getReviewAdmin,
  updateReviewStatus,
  updateAnyReview,
  deleteReviewAdmin,
  getReviewSummaryAdmin
};
