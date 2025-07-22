/**
 * ReviewReport Model
 * Mongoose schema for tracking individual reports submitted against reviews
 */

const mongoose = require('mongoose');

const reviewReportSchema = new mongoose.Schema({
  // Core identification
  review_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductReview',
    required: true,
    index: true
  },

  reporter_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Report details
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
    enum: [
      'SPAM',
      'ABUSIVE_LANGUAGE',
      'OFFENSIVE_CONTENT',
      'FAKE_REVIEW',
      'INAPPROPRIATE_CONTENT',
      'HARASSMENT',
      'MISLEADING_INFORMATION',
      'COPYRIGHT_VIOLATION',
      'OTHER'
    ]
  },

  custom_reason: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null
  },

  // Report status and resolution
  status: {
    type: String,
    enum: ['PENDING', 'RESOLVED', 'REJECTED_REPORT'],
    default: 'PENDING',
    index: true
  },

  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  resolved_at: {
    type: Date,
    default: null
  },

  resolution_notes: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes for efficient queries
reviewReportSchema.index({ review_id: 1, reporter_user_id: 1 }, { unique: true });
reviewReportSchema.index({ status: 1, createdAt: -1 });
reviewReportSchema.index({ resolved_by: 1, resolved_at: -1 });

/**
 * Pre-save middleware
 */
reviewReportSchema.pre('save', function(next) {
  // Set resolution timestamp when status changes to resolved
  if (this.isModified('status') && this.status !== 'PENDING' && !this.resolved_at) {
    this.resolved_at = new Date();
  }

  next();
});

/**
 * Post-save middleware to update ProductReview reported_count
 */
reviewReportSchema.post('save', async function(doc) {
  try {
    const ProductReview = mongoose.model('ProductReview');
    
    // If this is a new report (status is PENDING), increment reported_count
    if (doc.isNew && doc.status === 'PENDING') {
      await ProductReview.updateReportedCount(doc.review_id, true);
    }
  } catch (error) {
    console.error('Error updating reported_count after report save:', error);
  }
});

/**
 * Post-remove middleware to update ProductReview reported_count
 */
reviewReportSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.status === 'PENDING') {
    try {
      const ProductReview = mongoose.model('ProductReview');
      await ProductReview.updateReportedCount(doc.review_id, false);
    } catch (error) {
      console.error('Error updating reported_count after report deletion:', error);
    }
  }
});

/**
 * Instance methods
 */

// Check if report can be resolved
reviewReportSchema.methods.canBeResolved = function() {
  return this.status === 'PENDING';
};

// Resolve the report
reviewReportSchema.methods.resolve = async function(resolvedBy, resolutionNotes = null) {
  if (!this.canBeResolved()) {
    throw new Error('Report cannot be resolved in current status');
  }

  const wasResolved = this.status === 'PENDING';
  
  this.status = 'RESOLVED';
  this.resolved_by = resolvedBy;
  this.resolved_at = new Date();
  if (resolutionNotes) {
    this.resolution_notes = resolutionNotes;
  }

  await this.save();

  // Decrement reported_count if this was a pending report
  if (wasResolved) {
    const ProductReview = mongoose.model('ProductReview');
    await ProductReview.updateReportedCount(this.review_id, false);
  }

  return this;
};

// Reject the report
reviewReportSchema.methods.reject = async function(resolvedBy, resolutionNotes = null) {
  if (!this.canBeResolved()) {
    throw new Error('Report cannot be rejected in current status');
  }

  const wasRejected = this.status === 'PENDING';
  
  this.status = 'REJECTED_REPORT';
  this.resolved_by = resolvedBy;
  this.resolved_at = new Date();
  if (resolutionNotes) {
    this.resolution_notes = resolutionNotes;
  }

  await this.save();

  // Decrement reported_count if this was a pending report
  if (wasRejected) {
    const ProductReview = mongoose.model('ProductReview');
    await ProductReview.updateReportedCount(this.review_id, false);
  }

  return this;
};

/**
 * Static methods
 */

// Get pending reports with pagination
reviewReportSchema.statics.getPendingReports = function(options = {}) {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  return this.find({ status: 'PENDING' })
    .populate('review_id', 'rating title review_text product_variant_id user_id')
    .populate('reporter_user_id', 'name email')
    .populate({
      path: 'review_id',
      populate: [
        { path: 'product_variant_id', select: 'name' },
        { path: 'user_id', select: 'name' }
      ]
    })
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Get reports for a specific review
reviewReportSchema.statics.getReportsForReview = function(reviewId) {
  return this.find({ review_id: reviewId })
    .populate('reporter_user_id', 'name email')
    .populate('resolved_by', 'name email')
    .sort({ createdAt: -1 });
};

// Get report statistics
reviewReportSchema.statics.getReportStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    PENDING: 0,
    RESOLVED: 0,
    REJECTED_REPORT: 0,
    total: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

// Get most reported reasons
reviewReportSchema.statics.getReportReasons = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$reason',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $project: {
        reason: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
};

// Check if user has already reported a review
reviewReportSchema.statics.hasUserReported = async function(reviewId, userId) {
  const report = await this.findOne({
    review_id: reviewId,
    reporter_user_id: userId,
    status: 'PENDING'
  });
  return !!report;
};

// Bulk resolve reports
reviewReportSchema.statics.bulkResolve = async function(reportIds, resolvedBy, resolutionNotes = null) {
  const reports = await this.find({
    _id: { $in: reportIds },
    status: 'PENDING'
  });

  const results = [];
  for (const report of reports) {
    try {
      await report.resolve(resolvedBy, resolutionNotes);
      results.push({ reportId: report._id, success: true });
    } catch (error) {
      results.push({ reportId: report._id, success: false, error: error.message });
    }
  }

  return results;
};

/**
 * Virtual fields
 */
reviewReportSchema.virtual('isPending').get(function() {
  return this.status === 'PENDING';
});

reviewReportSchema.virtual('isResolved').get(function() {
  return this.status === 'RESOLVED';
});

reviewReportSchema.virtual('isRejected').get(function() {
  return this.status === 'REJECTED_REPORT';
});

reviewReportSchema.virtual('daysSinceReported').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
reviewReportSchema.set('toJSON', { virtuals: true });
reviewReportSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ReviewReport', reviewReportSchema);
