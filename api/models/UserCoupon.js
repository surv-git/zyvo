/**
 * UserCoupon Model
 * Defines individual coupon codes assigned to specific users
 * Links users to coupon campaigns and tracks usage
 */

const mongoose = require('mongoose');

const userCouponSchema = new mongoose.Schema({
  // Campaign Reference
  coupon_campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CouponCampaign',
    required: [true, 'Coupon campaign ID is required']
  },
  
  // User Reference
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  // Unique Coupon Code
  coupon_code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [4, 'Coupon code must be at least 4 characters'],
    maxlength: [50, 'Coupon code cannot exceed 50 characters'],
    match: [/^[A-Z0-9\-]+$/, 'Coupon code can only contain uppercase letters, numbers, and hyphens']
  },
  
  // Usage Tracking
  current_usage_count: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  
  // Expiration
  expires_at: {
    type: Date,
    required: [true, 'Expiration date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Expiration date must be in the future'
    }
  },
  
  // Redemption Status
  is_redeemed: {
    type: Boolean,
    default: false
  },
  
  redeemed_at: {
    type: Date,
    default: null
  },
  
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
userCouponSchema.index({ coupon_campaign_id: 1 });
userCouponSchema.index({ user_id: 1 });
userCouponSchema.index({ coupon_code: 1 }, { unique: true });
userCouponSchema.index({ expires_at: 1 });
userCouponSchema.index({ is_redeemed: 1 });
userCouponSchema.index({ is_active: 1 });
userCouponSchema.index({ createdAt: -1 });

// Compound indexes for common queries
userCouponSchema.index({ user_id: 1, is_active: 1, expires_at: 1 });
userCouponSchema.index({ user_id: 1, coupon_campaign_id: 1 });
userCouponSchema.index({ coupon_code: 1, user_id: 1 });
userCouponSchema.index({ is_active: 1, expires_at: 1, is_redeemed: 1 });

// Pre-save hook to update timestamps and validate redemption status
userCouponSchema.pre('save', async function(next) {
  try {
    // Update timestamp
    this.updatedAt = new Date();
    
    // If this is a new document, validate against campaign rules
    if (this.isNew) {
      const CouponCampaign = mongoose.model('CouponCampaign');
      const campaign = await CouponCampaign.findById(this.coupon_campaign_id);
      
      if (!campaign) {
        throw new Error('Associated coupon campaign not found');
      }
      
      // Check if campaign allows unique per user and user already has a coupon
      if (campaign.is_unique_per_user) {
        const existingCoupon = await this.constructor.findOne({
          coupon_campaign_id: this.coupon_campaign_id,
          user_id: this.user_id,
          _id: { $ne: this._id } // Exclude current document
        });
        
        if (existingCoupon) {
          throw new Error('User already has a coupon for this campaign');
        }
      }
      
      // Set expiration from campaign if not explicitly set
      if (!this.expires_at) {
        this.expires_at = campaign.valid_until;
      }
    }
    
    // Auto-set redemption status based on usage count
    if (this.isModified('current_usage_count')) {
      const CouponCampaign = mongoose.model('CouponCampaign');
      const campaign = await CouponCampaign.findById(this.coupon_campaign_id);
      
      if (campaign && this.current_usage_count >= campaign.max_usage_per_user) {
        this.is_redeemed = true;
        if (!this.redeemed_at) {
          this.redeemed_at = new Date();
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userCouponSchema.methods.isValid = function() {
  const now = new Date();
  return this.is_active && 
         !this.is_redeemed && 
         now <= this.expires_at &&
         now >= this.createdAt;
};

userCouponSchema.methods.canBeUsed = async function() {
  if (!this.isValid()) {
    return { valid: false, reason: 'Coupon is not valid or has expired' };
  }
  
  // Check campaign validity
  const CouponCampaign = mongoose.model('CouponCampaign');
  const campaign = await CouponCampaign.findById(this.coupon_campaign_id);
  
  if (!campaign || !campaign.isValid()) {
    return { valid: false, reason: 'Associated campaign is not valid or active' };
  }
  
  // Check usage limits
  if (this.current_usage_count >= campaign.max_usage_per_user) {
    return { valid: false, reason: 'Maximum usage limit reached for this user' };
  }
  
  // Check global usage limits
  if (campaign.max_global_usage && campaign.current_global_usage >= campaign.max_global_usage) {
    return { valid: false, reason: 'Campaign has reached maximum global usage limit' };
  }
  
  return { valid: true, campaign };
};

userCouponSchema.methods.incrementUsage = async function() {
  this.current_usage_count += 1;
  
  // Update campaign global usage
  const CouponCampaign = mongoose.model('CouponCampaign');
  await CouponCampaign.findByIdAndUpdate(
    this.coupon_campaign_id,
    { $inc: { current_global_usage: 1 } }
  );
  
  return this.save();
};

userCouponSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  
  // Add computed fields
  obj.is_expired = new Date() > this.expires_at;
  obj.is_currently_valid = this.isValid();
  obj.days_until_expiry = Math.ceil((this.expires_at - new Date()) / (1000 * 60 * 60 * 24));
  
  return obj;
};

// Static methods
userCouponSchema.statics.findValidForUser = function(userId) {
  const now = new Date();
  return this.find({
    user_id: userId,
    is_active: true,
    is_redeemed: false,
    expires_at: { $gte: now }
  }).populate('coupon_campaign_id');
};

userCouponSchema.statics.findByCodeAndUser = function(couponCode, userId) {
  return this.findOne({
    coupon_code: couponCode,
    user_id: userId
  }).populate('coupon_campaign_id');
};

userCouponSchema.statics.findExpiredCoupons = function() {
  const now = new Date();
  return this.find({
    expires_at: { $lt: now },
    is_active: true
  });
};

userCouponSchema.statics.getUsageStatistics = async function(campaignId) {
  const stats = await this.aggregate([
    { $match: { coupon_campaign_id: campaignId } },
    {
      $group: {
        _id: null,
        total_coupons: { $sum: 1 },
        redeemed_coupons: {
          $sum: { $cond: ['$is_redeemed', 1, 0] }
        },
        active_coupons: {
          $sum: { $cond: ['$is_active', 1, 0] }
        },
        expired_coupons: {
          $sum: {
            $cond: [
              { $lt: ['$expires_at', new Date()] },
              1,
              0
            ]
          }
        },
        total_usage: { $sum: '$current_usage_count' }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    total_coupons: 0,
    redeemed_coupons: 0,
    active_coupons: 0,
    expired_coupons: 0,
    total_usage: 0
  };
};

// Virtual for status display
userCouponSchema.virtual('status').get(function() {
  if (!this.is_active) return 'INACTIVE';
  if (this.is_redeemed) return 'REDEEMED';
  if (new Date() > this.expires_at) return 'EXPIRED';
  return 'ACTIVE';
});

// Virtual for remaining usage
userCouponSchema.virtual('remaining_usage').get(function() {
  if (!this.coupon_campaign_id || !this.coupon_campaign_id.max_usage_per_user) {
    return null;
  }
  return Math.max(0, this.coupon_campaign_id.max_usage_per_user - this.current_usage_count);
});

// Ensure virtuals are included in JSON output
userCouponSchema.set('toJSON', { virtuals: true });
userCouponSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserCoupon', userCouponSchema);
