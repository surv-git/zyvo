/**
 * ProductReview Model
 * Mongoose schema for product variant reviews with comprehensive moderation
 */

const mongoose = require('mongoose');

const productReviewSchema = new mongoose.Schema({
  // Core identification
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  product_variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: true,
    index: true
  },

  // Review content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(v) {
        return Number.isInteger(v);
      },
      message: 'Rating must be an integer between 1 and 5'
    }
  },

  title: {
    type: String,
    trim: true,
    maxlength: 100,
    default: null
  },

  review_text: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: null
  },

  // Verification and moderation
  is_verified_buyer: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'FLAGGED'],
    default: 'PENDING_APPROVAL',
    index: true
  },

  // Engagement metrics
  helpful_votes: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },

  unhelpful_votes: {
    type: Number,
    default: 0,
    min: 0
  },

  reported_count: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },

  // Reviewer information
  reviewer_display_name: {
    type: String,
    trim: true,
    default: null
  },

  reviewer_location: {
    type: String,
    trim: true,
    default: null
  },

  // Media attachments
  image_urls: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length <= 10; // Limit to 10 images
      },
      message: 'Maximum 10 images allowed per review'
    }
  },

  video_url: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true;
        // Basic URL validation
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Video URL must be a valid HTTP/HTTPS URL'
    }
  },

  // Moderation tracking
  moderated_at: {
    type: Date,
    default: null
  },

  moderated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient queries
productReviewSchema.index({ user_id: 1, product_variant_id: 1 }, { unique: true });
productReviewSchema.index({ product_variant_id: 1, status: 1 });
productReviewSchema.index({ status: 1, createdAt: -1 });
productReviewSchema.index({ reported_count: 1, status: 1 });
productReviewSchema.index({ helpful_votes: -1, status: 1 });

/**
 * Pre-save middleware
 */
productReviewSchema.pre('save', function(next) {
  // Update moderation timestamp when status changes
  if (this.isModified('status') && this.status !== 'PENDING_APPROVAL') {
    this.moderated_at = new Date();
  }

  // Update updatedAt timestamp
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }

  next();
});

/**
 * Instance methods
 */

// Check if review can be edited by user
productReviewSchema.methods.canBeEditedBy = function(userId) {
  return this.user_id.toString() === userId.toString() && 
         ['PENDING_APPROVAL', 'APPROVED'].includes(this.status);
};

// Check if review can be deleted by user
productReviewSchema.methods.canBeDeletedBy = function(userId) {
  return this.user_id.toString() === userId.toString();
};

// Get helpful vote percentage
productReviewSchema.methods.getHelpfulPercentage = function() {
  const totalVotes = this.helpful_votes + this.unhelpful_votes;
  if (totalVotes === 0) return 0;
  return Math.round((this.helpful_votes / totalVotes) * 100);
};

// Check if review should be flagged based on reports
productReviewSchema.methods.shouldBeFlagged = function(threshold = 3) {
  return this.reported_count >= threshold;
};

/**
 * Static methods
 */

// Get reviews for a product variant with filtering
productReviewSchema.statics.getVariantReviews = function(productVariantId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    minRating,
    maxRating,
    verified_only = false,
    status = 'APPROVED'
  } = options;

  const query = {
    product_variant_id: productVariantId,
    status
  };

  if (minRating) query.rating = { ...query.rating, $gte: minRating };
  if (maxRating) query.rating = { ...query.rating, $lte: maxRating };
  if (verified_only) query.is_verified_buyer = true;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  return this.find(query)
    .populate('user_id', 'name')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Get rating statistics for a product variant
productReviewSchema.statics.getRatingStats = async function(productVariantId) {
  const stats = await this.aggregate([
    {
      $match: {
        product_variant_id: new mongoose.Types.ObjectId(productVariantId),
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
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    };
  }

  const result = stats[0];
  const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  
  result.ratingDistribution.forEach(rating => {
    distribution[rating.toString()]++;
  });

  return {
    averageRating: Math.round(result.averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: result.totalReviews,
    ratingDistribution: distribution
  };
};

// Find flagged reviews
productReviewSchema.statics.findFlaggedReviews = function(options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find({
    $or: [
      { status: 'FLAGGED' },
      { reported_count: { $gte: 3 } }
    ]
  })
    .populate('user_id', 'name email')
    .populate('product_variant_id', 'name')
    .sort({ reported_count: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Update helpful votes atomically
productReviewSchema.statics.updateVotes = async function(reviewId, voteType, increment = true) {
  const updateField = voteType === 'helpful' ? 'helpful_votes' : 'unhelpful_votes';
  const updateValue = increment ? 1 : -1;

  return this.findByIdAndUpdate(
    reviewId,
    { $inc: { [updateField]: updateValue } },
    { new: true }
  );
};

// Update reported count atomically
productReviewSchema.statics.updateReportedCount = async function(reviewId, increment = true) {
  const updateValue = increment ? 1 : -1;
  
  const review = await this.findByIdAndUpdate(
    reviewId,
    { $inc: { reported_count: updateValue } },
    { new: true }
  );

  // Auto-flag if reported count reaches threshold
  if (review && review.reported_count >= 3 && review.status === 'APPROVED') {
    review.status = 'FLAGGED';
    await review.save();
  }

  // Auto-unflag if reported count drops below threshold
  if (review && review.reported_count < 3 && review.status === 'FLAGGED') {
    review.status = 'APPROVED';
    await review.save();
  }

  return review;
};

/**
 * Virtual fields
 */
productReviewSchema.virtual('totalVotes').get(function() {
  return this.helpful_votes + this.unhelpful_votes;
});

productReviewSchema.virtual('helpfulPercentage').get(function() {
  return this.getHelpfulPercentage();
});

productReviewSchema.virtual('isReported').get(function() {
  return this.reported_count > 0;
});

productReviewSchema.virtual('isFlagged').get(function() {
  return this.status === 'FLAGGED' || this.shouldBeFlagged();
});

// Ensure virtual fields are serialized
productReviewSchema.set('toJSON', { virtuals: true });
productReviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ProductReview', productReviewSchema);
