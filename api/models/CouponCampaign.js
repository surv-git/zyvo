/**
 * CouponCampaign Model
 * Defines the template and rules for different types of coupons
 * Supports percentage, fixed amount, and free shipping discounts
 */

const mongoose = require('mongoose');

const couponCampaignSchema = new mongoose.Schema({
  // Basic Campaign Information
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Campaign name cannot exceed 100 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(value) {
        // Slug should always exist after pre-save hook
        return value && value.length > 0;
      },
      message: 'Slug is required and cannot be empty'
    }
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: null
  },
  
  code_prefix: {
    type: String,
    trim: true,
    maxlength: [20, 'Code prefix cannot exceed 20 characters'],
    uppercase: true,
    default: null
  },
  
  // Discount Configuration
  discount_type: {
    type: String,
    required: [true, 'Discount type is required'],
    enum: {
      values: ['PERCENTAGE', 'AMOUNT', 'FREE_SHIPPING'],
      message: 'Discount type must be PERCENTAGE, AMOUNT, or FREE_SHIPPING'
    }
  },
  
  discount_value: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative'],
    validate: {
      validator: function(value) {
        // For percentage discounts, ensure value is between 0-100
        if (this.discount_type === 'PERCENTAGE') {
          return value > 0 && value <= 100;
        }
        // For amount and free shipping, just ensure it's positive
        return value >= 0;
      },
      message: 'Invalid discount value for the selected discount type'
    }
  },
  
  min_purchase_amount: {
    type: Number,
    min: [0, 'Minimum purchase amount cannot be negative'],
    default: 0
  },
  
  max_coupon_discount: {
    type: Number,
    min: [0, 'Maximum coupon discount cannot be negative'],
    default: null,
    validate: {
      validator: function(value) {
        // Only validate if it's a percentage discount and value is provided
        if (this.discount_type === 'PERCENTAGE' && value !== null) {
          return value > 0;
        }
        return true;
      },
      message: 'Maximum coupon discount must be positive for percentage discounts'
    }
  },
  
  // Validity Period
  valid_from: {
    type: Date,
    required: [true, 'Valid from date is required']
  },
  
  valid_until: {
    type: Date,
    required: [true, 'Valid until date is required'],
    validate: {
      validator: function(value) {
        return value > this.valid_from;
      },
      message: 'Valid until date must be after valid from date'
    }
  },
  
  // Usage Limits
  max_global_usage: {
    type: Number,
    min: [0, 'Maximum global usage cannot be negative'],
    default: null // null means unlimited
  },
  
  current_global_usage: {
    type: Number,
    default: 0,
    min: [0, 'Current global usage cannot be negative']
  },
  
  max_usage_per_user: {
    type: Number,
    min: [1, 'Maximum usage per user must be at least 1'],
    default: 1
  },
  
  is_unique_per_user: {
    type: Boolean,
    default: true
  },
  
  // Eligibility and Targeting
  eligibility_criteria: [{
    type: String,
    enum: {
      values: ['NEW_USER', 'REFERRAL', 'FIRST_ORDER', 'SPECIFIC_USER_GROUP', 'ALL_USERS', 'NONE'],
      message: 'Invalid eligibility criteria'
    }
  }],
  
  applicable_category_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  applicable_product_variant_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant'
  }],
  
  // Status
  is_active: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for optimal query performance
couponCampaignSchema.index({ name: 1 });
couponCampaignSchema.index({ slug: 1 });
couponCampaignSchema.index({ valid_from: 1, valid_until: 1 });
couponCampaignSchema.index({ is_active: 1 });
couponCampaignSchema.index({ eligibility_criteria: 1 });
couponCampaignSchema.index({ discount_type: 1 });
couponCampaignSchema.index({ createdAt: -1 });

// Compound indexes for common queries
couponCampaignSchema.index({ is_active: 1, valid_from: 1, valid_until: 1 });
couponCampaignSchema.index({ is_active: 1, discount_type: 1 });

// Pre-save hook to auto-generate slug and update timestamps
couponCampaignSchema.pre('save', async function(next) {
  try {
    // Update timestamp
    this.updatedAt = new Date();
    
    // Generate slug if it's a new document or name has changed
    if (this.isNew || this.isModified('name')) {
      const baseSlug = this.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure slug uniqueness
      while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      this.slug = slug;
    }
    
    // Set default eligibility criteria if empty
    if (!this.eligibility_criteria || this.eligibility_criteria.length === 0) {
      this.eligibility_criteria = ['NONE'];
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
couponCampaignSchema.methods.isValid = function() {
  const now = new Date();
  return this.is_active && 
         now >= this.valid_from && 
         now <= this.valid_until &&
         (this.max_global_usage === null || this.current_global_usage < this.max_global_usage);
};

couponCampaignSchema.methods.canGenerateMoreCodes = function() {
  return this.max_global_usage === null || this.current_global_usage < this.max_global_usage;
};

couponCampaignSchema.methods.calculateDiscount = function(cartTotal) {
  if (cartTotal < this.min_purchase_amount) {
    return 0;
  }
  
  let discount = 0;
  
  switch (this.discount_type) {
    case 'PERCENTAGE':
      discount = (cartTotal * this.discount_value) / 100;
      if (this.max_coupon_discount && discount > this.max_coupon_discount) {
        discount = this.max_coupon_discount;
      }
      break;
    case 'AMOUNT':
      discount = this.discount_value;
      if (discount > cartTotal) {
        discount = cartTotal;
      }
      break;
    case 'FREE_SHIPPING':
      discount = this.discount_value; // This would be the shipping cost
      break;
  }
  
  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

// Static methods
couponCampaignSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    is_active: true,
    valid_from: { $lte: now },
    valid_until: { $gte: now }
  });
};

couponCampaignSchema.statics.findBySlugOrId = function(identifier) {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  const query = isObjectId ? { _id: identifier } : { slug: identifier };
  return this.findOne(query);
};

// Virtual for formatted validity period
couponCampaignSchema.virtual('validity_period').get(function() {
  return {
    from: this.valid_from,
    until: this.valid_until,
    is_currently_valid: this.isValid()
  };
});

// Virtual for usage statistics
couponCampaignSchema.virtual('usage_stats').get(function() {
  const usagePercentage = this.max_global_usage 
    ? Math.round((this.current_global_usage / this.max_global_usage) * 100)
    : 0;
  
  return {
    current_usage: this.current_global_usage,
    max_usage: this.max_global_usage,
    usage_percentage: usagePercentage,
    remaining_usage: this.max_global_usage ? this.max_global_usage - this.current_global_usage : null
  };
});

// Ensure virtuals are included in JSON output
couponCampaignSchema.set('toJSON', { virtuals: true });
couponCampaignSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CouponCampaign', couponCampaignSchema);
