/**
 * Platform Fee Model
 * Mongoose schema and model for platform fee management
 * Handles general fee structures for e-commerce platforms
 */

const mongoose = require('mongoose');

const platformFeeSchema = new mongoose.Schema({
  // Platform Reference
  platform_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Platform',
    required: [true, 'Platform ID is required'],
    index: true
  },

  // Fee Configuration
  fee_type: {
    type: String,
    required: [true, 'Fee type is required'],
    trim: true,
    enum: {
      values: ['Commission Percentage', 'Fixed Listing Fee', 'Payment Gateway Fee', 'Shipping Fee', 'Storage Fee', 'Other'],
      message: 'Fee type must be one of: Commission Percentage, Fixed Listing Fee, Payment Gateway Fee, Shipping Fee, Storage Fee, Other'
    },
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: null
  },
  value: {
    type: Number,
    required: [true, 'Fee value is required'],
    min: [0, 'Fee value cannot be negative'],
    validate: {
      validator: function(value) {
        // If it's a percentage, value should not exceed 100
        if (this.is_percentage && value > 100) {
          return false;
        }
        return true;
      },
      message: 'Percentage value cannot exceed 100'
    }
  },
  is_percentage: {
    type: Boolean,
    default: false
  },

  // Date Management
  effective_date: {
    type: Date,
    default: Date.now,
    index: true,
    validate: {
      validator: function(value) {
        // Effective date cannot be in the past for new records
        if (this.isNew && value < new Date()) {
          return false;
        }
        return true;
      },
      message: 'Effective date cannot be in the past'
    }
  },
  end_date: {
    type: Date,
    default: null,
    validate: {
      validator: function(value) {
        // End date must be after effective date if provided
        if (value && this.effective_date && value <= this.effective_date) {
          return false;
        }
        return true;
      },
      message: 'End date must be after effective date'
    }
  },

  // Status Management
  is_active: {
    type: Boolean,
    default: true,
    index: true
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
}, {
  timestamps: false, // We manage timestamps manually
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
platformFeeSchema.index({ platform_id: 1, fee_type: 1 });
platformFeeSchema.index({ platform_id: 1, is_active: 1 });
platformFeeSchema.index({ fee_type: 1, is_active: 1 });
platformFeeSchema.index({ effective_date: 1, end_date: 1 });
platformFeeSchema.index({ is_active: 1, effective_date: -1 });
platformFeeSchema.index({ platform_id: 1, fee_type: 1, is_active: 1, effective_date: -1 });

// Virtual for formatted fee display
platformFeeSchema.virtual('formatted_value').get(function() {
  if (this.is_percentage) {
    return `${this.value}%`;
  }
  return `$${this.value.toFixed(2)}`;
});

// Virtual for checking if fee is currently active (within date range)
platformFeeSchema.virtual('is_currently_active').get(function() {
  if (!this.is_active) return false;
  
  const now = new Date();
  const effectiveDate = new Date(this.effective_date);
  
  // Check if current date is after effective date
  if (now < effectiveDate) return false;
  
  // Check if current date is before end date (if end date exists)
  if (this.end_date) {
    const endDate = new Date(this.end_date);
    if (now >= endDate) return false;
  }
  
  return true;
});

// Virtual for fee summary
platformFeeSchema.virtual('fee_summary').get(function() {
  const typeDisplay = this.fee_type || 'Unknown';
  const valueDisplay = this.formatted_value;
  return `${typeDisplay}: ${valueDisplay}`;
});

// Pre-save middleware to update timestamps and validate dates
platformFeeSchema.pre('save', function(next) {
  try {
    // Update timestamp
    this.updatedAt = new Date();
    
    // Additional validation: ensure end_date is after effective_date
    if (this.end_date && this.effective_date && this.end_date <= this.effective_date) {
      const error = new Error('End date must be after effective date');
      error.name = 'ValidationError';
      return next(error);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to find active fees
platformFeeSchema.statics.findActive = function() {
  return this.find({ is_active: true });
};

// Static method to find fees by platform
platformFeeSchema.statics.findByPlatform = function(platformId) {
  return this.find({ platform_id: platformId });
};

// Static method to find current active fees (within date range)
platformFeeSchema.statics.findCurrentlyActive = function() {
  const now = new Date();
  return this.find({
    is_active: true,
    effective_date: { $lte: now },
    $or: [
      { end_date: null },
      { end_date: { $gt: now } }
    ]
  });
};

// Static method to find fees by type
platformFeeSchema.statics.findByFeeType = function(feeType) {
  return this.find({ fee_type: feeType });
};

// Instance method to soft delete fee
platformFeeSchema.methods.softDelete = function() {
  this.is_active = false;
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to activate fee
platformFeeSchema.methods.activate = function() {
  this.is_active = true;
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to check if fee is expired
platformFeeSchema.methods.isExpired = function() {
  if (!this.end_date) return false;
  return new Date() >= new Date(this.end_date);
};

// Query helpers for common operations
platformFeeSchema.query.active = function() {
  return this.where({ is_active: true });
};

platformFeeSchema.query.inactive = function() {
  return this.where({ is_active: false });
};

platformFeeSchema.query.byPlatform = function(platformId) {
  return this.where({ platform_id: platformId });
};

platformFeeSchema.query.byFeeType = function(feeType) {
  return this.where({ fee_type: feeType });
};

platformFeeSchema.query.currentlyActive = function() {
  const now = new Date();
  return this.where({
    is_active: true,
    effective_date: { $lte: now },
    $or: [
      { end_date: null },
      { end_date: { $gt: now } }
    ]
  });
};

platformFeeSchema.query.withinDateRange = function(startDate, endDate) {
  const query = {};
  
  if (startDate) {
    query.effective_date = { $gte: new Date(startDate) };
  }
  
  if (endDate) {
    query.$or = [
      { end_date: null },
      { end_date: { $lte: new Date(endDate) } }
    ];
  }
  
  return this.where(query);
};

// Export the model
module.exports = mongoose.model('PlatformFee', platformFeeSchema);
